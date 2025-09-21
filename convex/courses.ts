import { v } from "convex/values";
import { internalAction, mutation, query } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
import { isStudentHelper } from "./auth";
import OpenAI from "openai";
import { createEmbedding } from "./embedding";
import { KV_STORE_KEYS } from "./kvStore";

export const getByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    // const userIsStudent = await isStudentHelper(ctx);

    // if (!userIsStudent) {
    //   const myplanCourse = await ctx.db.query("myplanCourses")
    //     .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
    //     .first();

    //   return {
    //     myplanCourse,
    //     dp: null,
    //     cecCourse: [],
    //   };
    // }

    const [myplanCourse, dp, cecCourse] = await Promise.all([
      ctx.db.query("myplanCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .first(),
      ctx.db.query("dawgpathCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .first(),
      ctx.db.query("cecCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .collect(),
    ]);

    return {
      myplanCourse,
      dp: dp?.detailData,
      cecCourse,
    };
  }
})

export const getByCourseCodeDev = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userIsStudent = true;

    if (!userIsStudent) {
      const myplanCourse = await ctx.db.query("myplanCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .first();

      return {
        myplanCourse,
        dp: null,
        cecCourse: [],
      };
    }

    const [myplanCourse, dp, cecCourse] = await Promise.all([
      ctx.db.query("myplanCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .first(),
      ctx.db.query("dawgpathCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .first(),
      ctx.db.query("cecCourses")
        .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
        .collect(),
    ]);

    return {
      myplanCourse,
      dp: dp?.detailData,
      cecCourse,
    };
  }
})


export const listOverviewBySubjectArea = query({
  args: {
    subjectArea: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("myplanCourses")
      .withIndex("by_subject_area", (q) => q.eq("subjectArea", args.subjectArea))
      .collect();

    const sorted = results.toSorted(
      (a, b) => (b.statsEnrollMax ?? 0) - (a.statsEnrollMax ?? 0)
    );
    const limited = sorted.slice(0, args.limit ?? 200);

    return limited.map((c) => ({
      courseCode: c.courseCode,
      title: c.title,
      description: c.description,
      credit: c.credit,
      subjectArea: c.subjectArea,
      courseNumber: c.courseNumber,
      genEdReqs: c.genEdReqs,
      enroll: (c.currentTermData ?? []).map((t) => ({
        termId: t.termId,
        enrollMax: t.enrollMax,
        enrollCount: t.enrollCount,
        stateKey: t.sessions?.[0]?.stateKey,
        enrollStatus: t.sessions?.[0]?.enrollStatus,
        openSessionCount: t.sessions?.filter((s) => s.stateKey === "active" && s.enrollCount < s.enrollMaximum).length,
      })),
    }));
  },
})


export const listOverviewByCredit = query({
  args: {
    credit: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("myplanCourses")
      .withIndex("by_credit", (q) => q.eq("credit", args.credit))
      .paginate({
        numItems: args.limit ?? 200,
        cursor: args.cursor ?? null,
      });

    // const sorted = results.page.toSorted(
    //   (a, b) => (b.statsEnrollMax ?? 0) - (a.statsEnrollMax ?? 0)
    // );
    // const limited = sorted.slice(0, args.limit ?? 200);

    const mapped = results.page.map((c) => ({
      courseCode: c.courseCode,
      title: c.title,
      description: c.description,
      credit: c.credit,
      subjectArea: c.subjectArea,
      courseNumber: c.courseNumber,
      genEdReqs: c.genEdReqs,
      enroll: (c.currentTermData ?? []).map((t) => ({
        termId: t.termId,
        enrollMax: t.enrollMax,
        enrollCount: t.enrollCount,
        stateKey: t.sessions?.[0]?.stateKey,
        enrollStatus: t.sessions?.[0]?.enrollStatus,
        openSessionCount: t.sessions?.filter((s) => s.stateKey === "active" && s.enrollCount < s.enrollMaximum).length,
      })),
    }));

    return {
      data: mapped,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
})


export type CourseDetail = NonNullable<FunctionReturnType<typeof api.courses.getByCourseCode>>
export type CourseCecItem = Omit<NonNullable<CourseDetail["cecCourse"]>[number], 'data'> & {
  data: {
    caption: {
      enrolled: string
      surveyed: string
      text: string
    }
    h1: string
    h2: string
    headers: Array<string>
    table_data_list_of_dicts: Array<{
      Excellent: string
      Fair: string
      Good: string
      Median: string
      Poor: string
      Question: string
      "Very Good": string
      "Very Poor": string
    }>
    table_data_list_of_lists: Array<Array<string>>
  }
}

export const vectorSearch = internalAction({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = (await createEmbedding(args.query))[0];

    const results = await ctx.vectorSearch("myplanCourses", "by_embedding", {
      vector: embedding.embedding,
      limit: 10,
    });

    const courses = await ctx.runQuery(api.myplan.listFullCoursesWithIds, {
      ids: results.map((result) => result._id),
    });

    // return {
    //   data: courses,
    // }
  }
})

export const search = mutation({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("myplanCourses")
      .withSearchIndex("by_course_code_search", (q) => q.search("courseCode", args.query))
      .collect();

    const mappedResults = results.map((result) => ({
      _id: result._id,
      courseCode: result.courseCode,
      title: result.title,
      description: result.description,
      credit: result.credit,
      number: result.courseNumber,
      prereqs: result.prereqs,
    }));

    return {
      data: mappedResults,
    };
  }
})

export const getAllCourseCodes = query({
  args: {},
  handler: async (ctx) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore")
      .withIndex("by_key", (q) => q.eq("key", KV_STORE_KEYS.MYPLAN_COURSE_CODES)).first();

    return (kvStoreCourseCodes?.value || []) as string[];
  }
})

export const getAllSubjectAreas = query({
  args: {},
  handler: async (ctx) => {
    const subjects = await ctx.db.query("myplanSubjects").collect();
    return subjects.map(subject => subject.code).sort();
  }
})

export const getAllSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("myplanSubjects").collect();
  }
})