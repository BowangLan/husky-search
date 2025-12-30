import { v } from "convex/values";
import { internalAction, mutation, query, QueryCtx } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
import { isStudentHelper } from "./auth";
import OpenAI from "openai";
import { createEmbedding } from "./embedding";
import { KV_STORE_KEYS } from "./kvStore";
import { Doc } from "./_generated/dataModel";
import { ConvexCourseDetail, ConvexCourseOverview } from "@/types/convex-courses";
import { MyplanCourseTermData, MyplanCourseTermSession } from "./schema";
import { DawgpathCourseDetail } from "./dawgpath";

export const getByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userIsStudent = await isStudentHelper(ctx);

    if (!userIsStudent) {
      return {
        myplanCourse: null,
        dp: null,
        cecCourse: [],
      };
    }

    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);

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

    if (!myplanCourse) {
      return {
        myplanCourse: null,
        dp: null,
        cecCourse: [],
      };
    }

    const currentTermData: MyplanCourseTermData[] = (await Promise.all(currentTerms.map(async (term: string) => {
      const termData = await ctx.db.query("myplanCourseTermData")
        .withIndex("by_course_code_and_term_id", (q) => q.eq("courseCode", args.courseCode).eq("termId", term))
        .first();

      if (!termData) {
        return null;
      }

      const sessions = await ctx.db.query("myplanCourseSessions")
        .withIndex("by_course_code_and_term_id", (q) => q.eq("courseCode", args.courseCode).eq("termId", term))
        .collect();

      const sessionDataList = sessions.map((session) => session.sessionData);

      // Compute enrollCount from sessions if the stored value is 0 or missing
      let enrollCount = termData.enrollCount;
      let enrollMax = termData.enrollMax;

      if (enrollCount === 0 && sessionDataList.length > 0) {
        enrollCount = sessionDataList.reduce((sum, s) => {
          const count = parseInt(s.enrollCount, 10);
          return sum + (isNaN(count) ? 0 : count);
        }, 0);
      }

      if (enrollMax === 0 && sessionDataList.length > 0) {
        enrollMax = sessionDataList.reduce((sum, s) => {
          const max = parseInt(s.enrollMaximum, 10);
          return sum + (isNaN(max) ? 0 : max);
        }, 0);
      }

      return {
        termId: termData.termId,
        enrollCount,
        enrollMax,
        sessions: sessionDataList,
      };
    })))
      .filter((item): item is MyplanCourseTermData => item !== null)

    return {
      myplanCourse: {
        ...myplanCourse,
        currentTermData,
      },
      dp: dp?.detailData,
      cecCourse,
    } satisfies ConvexCourseDetail;
  }
})


export const getByCourseCodeBrief = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const myplanCourse = await ctx.db.query("myplanCourses")
      .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
      .first();

    return myplanCourse;
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


const fetchCurrentTermData = async (
  ctx: QueryCtx,
  courseCode: string,
  currentTerms: string[]
): Promise<MyplanCourseTermData[]> => {
  const currentTermData: MyplanCourseTermData[] = (await Promise.all(currentTerms.map(async (term: string) => {
    const termData = await ctx.db.query("myplanCourseTermData")
      .withIndex("by_course_code_and_term_id", (q) => q.eq("courseCode", courseCode).eq("termId", term))
      .first();

    if (!termData) {
      return null;
    }

    const sessions = await ctx.db.query("myplanCourseSessions")
      .withIndex("by_course_code_and_term_id", (q) => q.eq("courseCode", courseCode).eq("termId", term))
      .collect();

    if (sessions.length === 0) {
      return null;
    }

    const sessionDataList: MyplanCourseTermSession[] = sessions.map((session) => session.sessionData);

    // Compute enrollCount from sessions if the stored value is 0 or missing
    // Sessions store enrollCount as strings, so we need to parse them
    let enrollCount = termData.enrollCount;
    let enrollMax = termData.enrollMax;

    if (enrollCount === 0 && sessionDataList.length > 0) {
      enrollCount = sessionDataList.reduce((sum, s) => {
        const count = parseInt(s.enrollCount, 10);
        return sum + (isNaN(count) ? 0 : count);
      }, 0);
    }

    if (enrollMax === 0 && sessionDataList.length > 0) {
      enrollMax = sessionDataList.reduce((sum, s) => {
        const max = parseInt(s.enrollMaximum, 10);
        return sum + (isNaN(max) ? 0 : max);
      }, 0);
    }

    // if (courseCode === "AFRAM 214") {
    //   console.log("--------------------------------");
    //   console.log("\nCourse code: ", courseCode);
    //   console.log("Term ID: ", termData.termId);
    //   console.log("Enroll count: ", enrollCount);
    //   console.log("Enroll max: ", enrollMax);
    //   console.log("Sessions: ", sessionDataList);
    //   console.log("--------------------------------");
    // }

    return {
      termId: termData.termId,
      enrollCount,
      enrollMax,
      sessions: sessionDataList,
    };
  })))
    .filter((item): item is MyplanCourseTermData => item !== null);

  return currentTermData;
}

const convertCourseToOverview = (c: Doc<"myplanCourses"> & { currentTermData?: MyplanCourseTermData[] }, dawgpathData?: DawgpathCourseDetail): ConvexCourseOverview => ({
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
    totalSessionCount: t.sessions?.length ?? 0,
    sessions: t.sessions,
  })),
  prereqs: c.prereqs,
  lastUpdated: c.lastUpdated,
  prereqMap: dawgpathData?.prereq_graph?.x ? {
    edges: dawgpathData.prereq_graph.x.edges,
    nodes: dawgpathData.prereq_graph.x.nodes,
  } : undefined,
})

export const listOverviewBySubjectArea = query({
  args: {
    subjectArea: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);

    const results = await ctx.db
      .query("myplanCourses")
      .withIndex("by_subject_area", (q) => q.eq("subjectArea", args.subjectArea))
      .collect();

    // Fetch currentTermData and dawgpathData for all courses
    const coursesWithTermData: Array<ConvexCourseOverview> = await Promise.all(
      results.map(async (course) => {
        const [currentTermData, dawgpathCourse] = await Promise.all([
          fetchCurrentTermData(ctx, course.courseCode, currentTerms),
          ctx.db.query("dawgpathCourses")
            .withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode))
            .first(),
        ]);
        // console.log("dawgpathCourse", dawgpathCourse)
        return convertCourseToOverview({
          ...course,
          currentTermData,
        }, dawgpathCourse?.detailData);
      })
    );

    return coursesWithTermData
  },
})

export const listOverviewByGenEd = query({
  args: {
    genEdCode: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);
    const limit = args.limit ?? 50;
    const offset = args.offset ?? 0;

    // Query the gen ed requirements table to find all course IDs (lightweight)
    const allGenEdCourses = await ctx.db
      .query("myplan_course_gen_ed_reqs")
      .withIndex("by_gen_ed_req", (q) => q.eq("genEduReq", args.genEdCode))
      .collect();

    const totalCount = allGenEdCourses.length;

    // Paginate the course IDs
    const paginatedGenEdCourses = allGenEdCourses.slice(offset, offset + limit);

    // Fetch the actual course documents for the current page only
    const results = await Promise.all(
      paginatedGenEdCourses.map(async (genEdCourse) => {
        return await ctx.db.get(genEdCourse.courseId);
      })
    );

    const validResults = results.filter((c): c is NonNullable<typeof c> => c !== null);

    // Fetch currentTermData and dawgpathData for paginated courses only
    const coursesWithTermData: Array<ConvexCourseOverview> = await Promise.all(
      validResults.map(async (course) => {
        const [currentTermData, dawgpathCourse] = await Promise.all([
          fetchCurrentTermData(ctx, course.courseCode, currentTerms),
          ctx.db.query("dawgpathCourses")
            .withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode))
            .first(),
        ]);
        return convertCourseToOverview({
          ...course,
          currentTermData,
        }, dawgpathCourse?.detailData);
      })
    );

    return {
      data: coursesWithTermData,
      totalCount,
      hasMore: offset + limit < totalCount,
    };
  },
})

export const listOverviewByCourseCodes = query({
  args: {
    courseCodes: v.array(v.string()),
    prereqLevel: v.optional(v.number()), // default to 1
  },
  handler: async (ctx, args) => {
    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);

    let prereqLevel: number = args.prereqLevel ?? 1;
    if (prereqLevel < 1) {
      prereqLevel = 1;
    }

    const primaryCourseCodes: Set<string> = new Set();
    args.courseCodes.forEach((courseCode) => {
      primaryCourseCodes.add(courseCode);
    });

    const courses = await Promise.all(args.courseCodes.map(async (courseCode) => {
      const [myplanCourse, currentTermData, dawgpathCourse] = await Promise.all([
        ctx.db.query("myplanCourses")
          .withIndex("by_course_code", (q) => q.eq("courseCode", courseCode))
          .first(),
        fetchCurrentTermData(ctx, courseCode, currentTerms),
        ctx.db.query("dawgpathCourses")
          .withIndex("by_course_code", (q) => q.eq("courseCode", courseCode))
          .first(),
      ]);

      if (!myplanCourse) {
        return null;
      }

      return convertCourseToOverview({
        ...myplanCourse,
        currentTermData,
      }, dawgpathCourse?.detailData);
    }));

    const filtered: Array<ConvexCourseOverview> = courses.filter(c => c !== null);
    const mapped: Record<string, ConvexCourseOverview> = Object.fromEntries(filtered.map((c) => [c.courseCode, c]))

    const secondaryCourseCodes: Set<string> = new Set();
    courses.forEach((c) => {
      if (!c?.prereqMap) {
        return;
      }

      Object.entries(c.prereqMap.nodes.department_abbrev).forEach(([nodeId, departmentAbbrev]) => {
        const courseNumber = c?.prereqMap?.nodes.course_number[nodeId];
        if (!courseNumber) {
          return;
        }
        const courseCode = `${departmentAbbrev} ${courseNumber}`;
        if (primaryCourseCodes.has(courseCode)) {
          return;
        }

        secondaryCourseCodes.add(courseCode);
      });
    });

    await Promise.all(Array.from(secondaryCourseCodes).map(async (courseCode) => {
      const [myplanCourse, currentTermData, dawgpathCourse] = await Promise.all([
        ctx.db.query("myplanCourses")
          .withIndex("by_course_code", (q) => q.eq("courseCode", courseCode))
          .first(),
        fetchCurrentTermData(ctx, courseCode, currentTerms),
        ctx.db.query("dawgpathCourses")
          .withIndex("by_course_code", (q) => q.eq("courseCode", courseCode))
          .first(),
      ]);

      if (!myplanCourse) {
        return;
      }

      mapped[courseCode] = convertCourseToOverview({
        ...myplanCourse,
        currentTermData,
      }, dawgpathCourse?.detailData);
    }));

    return mapped;

  }
})


export const listOverviewByCourseCodesMutation = mutation({
  args: {
    courseCodes: v.array(v.string()),
    prereqLevel: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const mapped: Record<string, ConvexCourseOverview> = await ctx.runQuery(api.courses.listOverviewByCourseCodes, {
      courseCodes: args.courseCodes,
      prereqLevel: args.prereqLevel,
    });

    return mapped;
  }
})


export const listOverviewByCredit = query({
  args: {
    credit: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);

    const results = await ctx.db
      .query("myplanCourses")
      .withIndex("by_credit", (q) => q.eq("credit", args.credit))
      .paginate({
        numItems: args.limit ?? 200,
        cursor: args.cursor ?? null,
      });

    // Fetch currentTermData and dawgpathData for all courses
    const coursesWithTermData: Array<Doc<"myplanCourses"> & { currentTermData: MyplanCourseTermData[]; dawgpathData?: DawgpathCourseDetail }> = await Promise.all(
      results.page.map(async (course) => {
        const [currentTermData, dawgpathCourse] = await Promise.all([
          fetchCurrentTermData(ctx, course.courseCode, currentTerms),
          ctx.db.query("dawgpathCourses")
            .withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode))
            .first(),
        ]);
        return {
          ...course,
          currentTermData,
          dawgpathData: dawgpathCourse?.detailData,
        };
      })
    );

    const mapped = coursesWithTermData.map((course) => convertCourseToOverview(course, course.dawgpathData));

    return {
      data: mapped,
      continueCursor: results.continueCursor,
      isDone: results.isDone,
    };
  },
})


// TODO: replace this with ConvexCourseDetail from types/convex-courses.ts
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
    cursor: v.optional(v.string()),
    hasPrereqs: v.optional(v.boolean()),
    // majors: v.optional(v.array(v.string())),
    sortBy: v.union(v.literal("popular"), v.literal("code")),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("myplanCourses")
      .withSearchIndex("by_course_code_search", (q) => q.search("courseCode", args.query))
      // .order("desc")
      .paginate({
        numItems: 20,
        cursor: args.cursor ?? null,
      });

    const mappedResults = results.page.map((result) => ({
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
      continueCursor: results.continueCursor,
      isDone: results.isDone,
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

export const getAllSubjects = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("myplanSubjects").collect();
  }
})

export const getSessionsByIds = query({
  args: {
    sessionIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const sessions = await Promise.all(
      args.sessionIds.map(async (sessionId) => {
        const session = await ctx.db
          .query("myplanCourseSessions")
          .withIndex("by_session_id", (q) => q.eq("sessionId", sessionId))
          .first();

        return session ? session.sessionData : null;
      })
    );

    // Filter out nulls and return only found sessions
    return sessions.filter((s) => s !== null);
  }
})

export const getCoursesWithSessions = query({
  args: {
    courseCodes: v.array(v.string()),
  },
  handler: async (ctx, args): Promise<Array<{
    courseCode: string
    courseTitle?: string
    courseCredit?: string | number
    sessions: any[]
  }>> => {
    const currentTerms: string[] = await ctx.runQuery(api.kvStore.getCurrentTerms);

    const courses: Array<{
      courseCode: string
      courseTitle?: string
      courseCredit?: string | number
      sessions: any[]
    } | null> = await Promise.all(
      args.courseCodes.map(async (courseCode: string): Promise<{
        courseCode: string
        courseTitle?: string
        courseCredit?: string | number
        sessions: any[]
      } | null> => {
        const myplanCourse = await ctx.db
          .query("myplanCourses")
          .withIndex("by_course_code", (q) => q.eq("courseCode", courseCode))
          .first();

        if (!myplanCourse) {
          return null;
        }

        // Get sessions for current terms
        const sessionsByTerm: Array<{
          termId: string
          sessions: any[]
        }> = await Promise.all(
          currentTerms.map(async (termId: string): Promise<{
            termId: string
            sessions: any[]
          }> => {
            const sessions = await ctx.db
              .query("myplanCourseSessions")
              .withIndex("by_course_code_and_term_id", (q) =>
                q.eq("courseCode", courseCode).eq("termId", termId)
              )
              .collect();

            return {
              termId,
              sessions: sessions.map((s) => s.sessionData),
            };
          })
        );

        // Flatten all sessions across terms
        const allSessions: any[] = sessionsByTerm.flatMap((term: { termId: string; sessions: any[] }) => term.sessions);

        return {
          courseCode: myplanCourse.courseCode,
          courseTitle: myplanCourse.title,
          courseCredit: myplanCourse.credit,
          sessions: allSessions,
        };
      })
    );

    // Filter out nulls
    return courses.filter((c): c is {
      courseCode: string
      courseTitle?: string
      courseCredit?: string | number
      sessions: any[]
    } => c !== null);
  },
})

export const listOverviewByStatsEnrollMax = query({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()),
    subjectArea: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentTerms = await ctx.runQuery(api.kvStore.getCurrentTerms);
    const subjectArea = args.subjectArea;

    if (subjectArea) {
      const courses = await ctx.db.query("myplanCourses")
        .withIndex("search_idx_by_subject_area", (q) => q.eq("subjectArea", subjectArea))
        .order("desc")
        .paginate({
          numItems: args.limit,
          cursor: args.cursor ?? null,
        });

      // Fetch currentTermData and dawgpathData for all courses
      const coursesWithTermData: Array<Doc<"myplanCourses"> & { currentTermData: MyplanCourseTermData[]; dawgpathData?: DawgpathCourseDetail }> = await Promise.all(
        courses.page.map(async (course) => {
          const [currentTermData, dawgpathCourse] = await Promise.all([
            fetchCurrentTermData(ctx, course.courseCode, currentTerms),
            ctx.db.query("dawgpathCourses")
              .withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode))
              .first(),
          ]);
          return {
            ...course,
            currentTermData,
            dawgpathData: dawgpathCourse?.detailData,
          };
        })
      );

      // Filter to only include courses with at least one active term data
      const filtered = coursesWithTermData.filter((course) => course.currentTermData && course.currentTermData.length > 0);

      return {
        data: filtered.map((course) => convertCourseToOverview(course, course.dawgpathData)),
        continueCursor: courses.continueCursor,
        isDone: courses.isDone,
      };
    }

    const courses = await ctx.db
      .query("myplanCourses")
      // .withIndex("by_stats_enroll_max", (q) => q.gte("statsEnrollMax", 0))
      .withIndex("by_stats_enroll_max", (q) => q.gte("statsEnrollMax", 0))
      .order("desc")
      .paginate({
        numItems: args.limit,
        cursor: args.cursor ?? null,
      });

    // Fetch currentTermData and dawgpathData for all courses
    const coursesWithTermData: Array<Doc<"myplanCourses"> & { currentTermData: MyplanCourseTermData[]; dawgpathData?: DawgpathCourseDetail }> = await Promise.all(
      courses.page.map(async (course) => {
        const [currentTermData, dawgpathCourse] = await Promise.all([
          fetchCurrentTermData(ctx, course.courseCode, currentTerms),
          ctx.db.query("dawgpathCourses")
            .withIndex("by_course_code", (q) => q.eq("courseCode", course.courseCode))
            .first(),
        ]);
        return {
          ...course,
          currentTermData,
          dawgpathData: dawgpathCourse?.detailData,
        };
      })
    );

    // Filter to only include courses with at least one active term data
    const filtered = coursesWithTermData.filter((course) => course.currentTermData && course.currentTermData.length > 0);

    return {
      data: filtered.map((course) => convertCourseToOverview(course, course.dawgpathData)),
      continueCursor: courses.continueCursor,
      isDone: courses.isDone,
    };
  },
})
