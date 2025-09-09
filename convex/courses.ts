import { v } from "convex/values";
import { internalAction, mutation, query } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
import { isStudentHelper } from "./auth";
import OpenAI from "openai";
import { createEmbedding } from "./embedding";

export const getByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userIsStudent = await isStudentHelper(ctx);

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