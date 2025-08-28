import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery, mutation, MutationCtx, query, QueryCtx } from "./_generated/server";
import { MyplanCourse, myplanCourseFullFields, myplanCourseInfoObj, MyplanCourseTermData } from "./schema";
import { api, internal } from "./_generated/api";
import { getLatestEnrollCount, mergeTermData, processCourseDetail } from "./myplanUtils";
import { Id } from "./_generated/dataModel";

export const list = query({
  args: {
    cursor: v.optional(v.string()),
    select: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db.query("myplanCourses")
      .paginate({
        numItems: args.limit ?? 100,
        cursor: args.cursor ?? null,
      })

    const selectedFields = args.select ?? Object.keys(myplanCourseFullFields);
    if (selectedFields) {
      const selectedData = data.page.map((item) => {
        return Object.fromEntries(Object.entries(item).filter(([key]) => selectedFields.includes(key)));
      })

      return {
        ...data,
        page: selectedData,
      }
    }

    return data;
  }
})

export const getLatestDataPointByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.query("myplanDataPoints")
      .withIndex("by_course_code_timestamp", (q) => q.eq("courseCode", args.courseCode))
      .order("desc")
      .first();

    return c;
  }
})

export const fillCourseCodeToKvStore = mutation({
  args: {},
  handler: async (ctx, args) => {
    // should work when there are 10000+ courses
    const allCourses = await ctx.db.query("myplanCourses").collect();
    const courseCodes = allCourses.map((course) => course.courseCode);

    const kvStoreCourseCodes = await ctx.db.query("kvStore").withIndex("by_key", (q) => q.eq("key", "myplan_course_codes")).first();

    if (kvStoreCourseCodes) {
      await ctx.db.patch(kvStoreCourseCodes._id, {
        value: courseCodes,
      });
    } else {
      await ctx.db.insert("kvStore", {
        key: "myplan_course_codes",
        value: courseCodes,
      });
    }

    return {
      success: true,
    };
  }
})


export const updateCourseStats = internalMutation({
  args: {
    data: v.array(v.object({
      courseId: v.id("myplanCourses"),
      statsEnrollPercent: v.number(),
      statsEnrollMax: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.data.map(async (course) => {
      await ctx.db.patch(course.courseId, {
        statsEnrollPercent: course.statsEnrollPercent,
        statsEnrollMax: course.statsEnrollMax,
      });
    }));

    return {
      success: true,
    };
  }
})

export const syncStats = internalAction({
  args: {},
  handler: async (ctx, args) => {
    const batchSize = 100;
    let page = 1;
    let count = 0;

    let paginatedResults = await ctx.runQuery(api.myplan.list, {
      select: ["_id", "currentTermData", "courseCode"],
      limit: batchSize,
    })

    const processCourses = async (courses: (typeof paginatedResults)["page"]) => {
      const updateData: { courseId: Id<"myplanCourses">, statsEnrollPercent: number, statsEnrollMax: number }[] = [];

      for (const course of courses) {
        if (!course.currentTermData) {
          continue;
        }

        const enrollData: { term: string, percent: number, enrollMax: number }[] = course.currentTermData.map((term: MyplanCourseTermData) => {
          const enCount = term.enrollCount;
          const cap = term.enrollMax;
          const percent = cap === 0 ? 0 : enCount / cap;
          return {
            term: term.termId,
            percent,
            enrollMax: cap,
          }
        })

        const maxPercent = enrollData.reduce((max, data) => Math.max(max, data.percent), 0);
        const maxEnrollMax = enrollData.reduce((max, data) => Math.max(max, data.enrollMax), 0);

        updateData.push({
          courseId: course._id,
          statsEnrollPercent: maxPercent,
          statsEnrollMax: maxEnrollMax,
        });
      }

      await ctx.runMutation(internal.myplan.updateCourseStats, {
        data: updateData,
      });
    }

    await processCourses(paginatedResults.page);

    while (!paginatedResults.isDone) {
      console.log(`Fetching page ${page}`);
      paginatedResults = await ctx.runQuery(api.myplan.list, {
        select: ["_id", "currentTermData", "courseCode"],
        limit: batchSize,
        cursor: paginatedResults.continueCursor,
      })

      count += paginatedResults.page.length;
      page++;

      await processCourses(paginatedResults.page);
    }

    return {
      success: true,
    };
  }
})

export const getKVStoreCourseCodes = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore").withIndex("by_key", (q) => q.eq("key", "myplan_course_codes")).first();
    return (kvStoreCourseCodes?.value || []) as string[];
  }
})

export const courseExistsKVStore = internalQuery({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore").withIndex("by_key", (q) => q.eq("key", "myplan_course_codes")).first();
    const kvStoreCourseCodeSet = new Set(kvStoreCourseCodes?.value || []);

    return kvStoreCourseCodeSet.has(args.courseCode);
  }
})

export const addCourseCodesToKVStore = internalMutation({
  args: {
    courseCodes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const kvStoreCourseCodes = await ctx.db.query("kvStore").withIndex("by_key", (q) => q.eq("key", "myplan_course_codes")).first();
    const kvStoreCourseCodeSet = new Set(kvStoreCourseCodes?.value || []);
    args.courseCodes.forEach((courseCode) => {
      if (!kvStoreCourseCodeSet.has(courseCode)) {
        kvStoreCourseCodeSet.add(courseCode);
      }
    });

    if (kvStoreCourseCodes) {
      await ctx.db.patch(kvStoreCourseCodes._id, {
        value: Array.from(kvStoreCourseCodeSet),
      });
    } else {
      await ctx.db.insert("kvStore", {
        key: "myplan_course_codes",
        value: Array.from(kvStoreCourseCodeSet),
      });
    }

    return {
      success: true,
    };
  }
})

export const upsertCourseInfo = internalMutation({
  args: myplanCourseInfoObj,
  handler: async (ctx, args) => {
    const existingCourse = await ctx.db.query("myplanCourses").withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode)).first();
    if (existingCourse) {
      await ctx.db.patch(existingCourse._id, {
        ...existingCourse,
        ...args,
      });
    } else {
      await ctx.db.insert("myplanCourses", {
        ...args,
        statsEnrollPercent: 0,
        statsEnrollMax: 0,
        updateIntervalSeconds: 6 * 60 * 60, // 6h
      });
    }
  }
})

export const upsertCourseDetail = internalMutation({
  args: {
    courseCode: v.string(),
    detailData: v.any(),
  },
  handler: async (ctx, args) => {
    const existingCourse = await ctx.db.query("myplanCourses")
      .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
      .first();

    const processedCourseDetail = processCourseDetail(args.detailData)
    const latestTermsData: MyplanCourseTermData[] = mergeTermData(processedCourseDetail, existingCourse?.currentTermData)

    if (!existingCourse) {
      await ctx.db.insert("myplanCourses", {
        courseCode: `${processedCourseDetail.subjectArea} ${processedCourseDetail.courseNumber}`,
        courseId: processedCourseDetail.courseId,
        description: processedCourseDetail.description,
        title: processedCourseDetail.title,
        credit: processedCourseDetail.credit,
        campus: processedCourseDetail.campus,
        subjectArea: processedCourseDetail.subjectArea,
        courseNumber: processedCourseDetail.courseNumber,
        prereqs: processedCourseDetail.prereqs,
        currentTermData: latestTermsData,
        statsEnrollPercent: 0,
        statsEnrollMax: 0,
        updateIntervalSeconds: 6 * 60 * 60, // 6h
      });
    } else {
      await ctx.db.patch(existingCourse._id, {
        ...existingCourse,
        detailData: args.detailData,
        currentTermData: latestTermsData,
      });
    }
  }
})

export const upsertCourseSearch = internalMutation({
  args: {
    courseCode: v.string(),
    searchData: v.any(),
  },
  handler: async (ctx, args) => {
    const existingCourse = await ctx.db.query("myplanCourses").withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode)).first();
    if (existingCourse) {
      await ctx.db.patch(existingCourse._id, {
        ...existingCourse,
        searchData: args.searchData,
      });
    }
  }
});

export const check = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const courseCodes = await ctx.db.query("myplanCourses").collect();
    const kvStoreCourseCodes = await ctx.db.query("kvStore").withIndex("by_key", (q) => q.eq("key", "myplan_course_codes")).first();
    const kvStoreCourseCodeSet = new Set(kvStoreCourseCodes?.value || []);

    return {
      myplanCourseCodes: courseCodes.length,
      kvStoreCourseCodes: kvStoreCourseCodes?.value?.length || 0,
      kvStoreCourseCodesSet: kvStoreCourseCodeSet.size,
    }
  }
})

export const getCoursesByUpdateInterval = internalQuery({
  args: {
    updateIntervalSeconds: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("myplanCourses")
      .withIndex("by_update_interval_seconds", (q) => q.eq("updateIntervalSeconds", args.updateIntervalSeconds))
      .collect();
  }
})

export const updateCourses = internalMutation({
  args: {
    courses: v.array(v.object({
      id: v.id("myplanCourses"),
      data: v.object({
        updateIntervalSeconds: v.optional(v.number()),
        detailData: v.optional(v.any()),
        searchData: v.optional(v.any()),
      })
    }))
  },
  handler: async (ctx, args) => {
    await Promise.all(args.courses.map(async (course) => {
      const nonNullFields = Object.fromEntries(Object.entries(course.data).filter(([_, value]) => value !== undefined));
      await ctx.db.patch(course.id, {
        ...nonNullFields,
      });
    }));

    return {
      success: true,
    };
  }
})

export const updateCourseDetailScrapeIntervals = internalAction({
  args: {},
  handler: async (ctx, args) => {
    // fetch all courses with null update interval
    const courses = await ctx.runQuery(internal.myplan.getCoursesByUpdateInterval, {
      updateIntervalSeconds: undefined,
    });

    const batchSize = 100;
    for (let i = 0; i < courses.length; i += batchSize) {
      console.log(`Updating batch ${i / batchSize + 1} of ${Math.ceil(courses.length / batchSize)}`);
      const batch = courses.slice(i, i + batchSize);
      await ctx.runMutation(internal.myplan.updateCourses, {
        courses: batch.map((course) => ({
          id: course._id,
          data: {
            updateIntervalSeconds: 6 * 60 * 60, // 6h
          }
        })),
      });
    }

    console.log(`Updated ${courses.length} courses to 6h`);


    // deal with enrollments over 80%
    // const coursesOver80 = await ctx.runQuery(api.myplan.getLatestDataPointByCourseCode, {
    //   courseCode: "CS101",
    // });
    // console.log(coursesOver80);

    return {
      success: true,
    };
  }
})


export const statsQuick = internalQuery({
  args: {},
  handler: async (ctx, args) => {
    const coursesWithoutTermData = await ctx.db.query("myplanCourses")
      .withIndex("by_current_term_data", (q) => q.eq("currentTermData", undefined))
      .collect();


    return {
      coursesWithoutTermData: coursesWithoutTermData.length,
    }
  }
})

export const stats = internalAction({
  args: {},
  handler: async (ctx, args) => {
    let over80Count = 0;
    let over60Count = 0;
    let over40Count = 0;
    let over20Count = 0;
    let over0Count = 0;
    let enrollMaxOver500Count = 0;
    let enrollMaxOver200Count = 0;
    let enrollMaxOver100Count = 0;
    let enrollMaxOver50Count = 0;
    let enrollMaxOver20Count = 0;
    let enrollMax0To20Count = 0;

    const over80Over200Set = new Set<Id<"myplanCourses">>();
    const over40Over50Set = new Set<Id<"myplanCourses">>();

    let count = 0;
    let page = 1;
    let emptyCurrentTermData: any[] = [];
    let zeroEnrollCount: any[] = [];
    // console.log(`Fetching page`);
    let paginatedResults = await ctx.runQuery(api.myplan.list, {
      select: ["_id", "currentTermData", "courseCode"],
      limit: 500,
    })

    count += paginatedResults.page.length;
    page++;
    let coursesWithoutTermData: any[] = paginatedResults.page.filter((course) => !course.currentTermData);

    while (!paginatedResults.isDone) {
      console.log(`Fetching page ${page}`);
      paginatedResults = await ctx.runQuery(api.myplan.list, {
        select: ["_id", "currentTermData", "courseCode"],
        cursor: paginatedResults.continueCursor,
        limit: 500,
      })

      count += paginatedResults.page.length;
      page++;

      for (const course of paginatedResults.page) {
        if (!course.currentTermData) {
          coursesWithoutTermData.push(course);
          continue;
        }

        if (course.currentTermData.length === 0) {
          emptyCurrentTermData.push(course);
          continue;
        }

        if (course.currentTermData.every((term: MyplanCourseTermData) => term.enrollMax === 0)) {
          zeroEnrollCount.push(course);
          continue;
        }

        const enrollData: { term: string, percent: number, enrollMax: number }[] = course.currentTermData.map((term: MyplanCourseTermData) => {
          const enCount = term.enrollCount;
          const cap = term.enrollMax;
          const percent = cap === 0 ? 0 : enCount / cap;
          return {
            term: term.termId,
            percent,
            enrollMax: cap,
          }
        })

        const maxPercent = enrollData.reduce((max, data) => Math.max(max, data.percent), 0);
        const maxEnrollMax = enrollData.reduce((max, data) => Math.max(max, data.enrollMax), 0);

        if (maxPercent > 0.8) {
          over80Count++;
        } else if (maxPercent > 0.6) {
          over60Count++;
        } else if (maxPercent > 0.4) {
          over40Count++;
        } else if (maxPercent > 0.2) {
          over20Count++;
        } else {
          over0Count++;
        }

        if (maxEnrollMax > 500) {
          enrollMaxOver500Count++;
        } else if (maxEnrollMax > 200) {
          enrollMaxOver200Count++;
        } else if (maxEnrollMax > 100) {
          enrollMaxOver100Count++;
        } else if (maxEnrollMax > 50) {
          enrollMaxOver50Count++;
        } else if (maxEnrollMax > 20) {
          enrollMaxOver20Count++;
        } else {
          enrollMax0To20Count++;
        }

        if (maxPercent > 0.8 && maxEnrollMax > 200) {
          over80Over200Set.add(course._id);
        } else if (maxPercent > 0.4 && maxEnrollMax > 50) {
          over40Over50Set.add(course._id);
        }
      }
    }

    await ctx.runMutation(internal.myplan.updateCourses, {
      courses: Array.from(over80Over200Set).map((id) => ({
        id,
        data: {
          updateIntervalSeconds: 10 * 60, // 10m
        }
      })),
    });

    console.log(`Updated ${over80Over200Set.size} courses (80%+ enroll, 200+ enroll max) to 10m`);

    await ctx.runMutation(internal.myplan.updateCourses, {
      courses: Array.from(over40Over50Set).map((id) => ({
        id,
        data: {
          updateIntervalSeconds: 2 * 60 * 60, // 2h
        }
      })),
    });

    console.log(`Updated ${over40Over50Set.size} courses (40%+ enroll, 50+ enroll max) to 2h`);

    return {
      count,
      coursesWithoutTermDataCount: coursesWithoutTermData.length,
      distribution: [
        ["80%-100%", over80Count],
        ["60%-80%", over60Count],
        ["40%-60%", over40Count],
        ["20%-40%", over20Count],
        ["0%-20%", over0Count],
      ],
      enrollMaxDistribution: [
        ["500+", enrollMaxOver500Count],
        ["200-500", enrollMaxOver200Count],
        ["100-200", enrollMaxOver100Count],
        ["50-100", enrollMaxOver50Count],
        ["20-50", enrollMaxOver20Count],
        ["0-50", enrollMax0To20Count],
      ],
      over80Over200Set: over80Over200Set.size,
      emptyCurrentTermData: emptyCurrentTermData.length,
      zeroEnrollCount: zeroEnrollCount.length,
    }
  }
})

