import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const fetchCourse = action(({
  args: { courseId: v.string() },
  returns: {
    course: v.optional(v.any()),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const params = new URLSearchParams({
      // include: ["public_description", "sections", "syllabus_body"].join(","),
    })

    const response = await fetch(`https://canvas.uw.edu/api/v1/courses/${args.courseId}?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch course: ${response.statusText}`
      }
    }

    const data = await response.json();
    return {
      success: true,
      course: data,
    };
  }
}))

export const saveCourse = mutation({
  args: {
    courseId: v.string(),
    courseCode: v.string(),
    name: v.string(),
    createdAt: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("canvasCourses", {
      courseId: args.courseId,
      courseCode: args.courseCode,
      name: args.name,
      createdAt: args.createdAt,
      data: args.data,
    });
  }
})

export const getCourseByCourseId = query({
  args: {
    courseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("canvasCourses").withIndex("by_course_id", q => q.eq("courseId", args.courseId)).first();
  }
})

export const isCourseIdInNullCanvasCourses = query({
  args: {
    courseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.query("nullCanvasCourses").withIndex("by_course_id", q => q.eq("courseId", args.courseId)).first();
  }
})

export const addNullCanvasCourse = mutation({
  args: {
    courseId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("nullCanvasCourses", {
      courseId: args.courseId,
    });
  }
})

export const pingAndSaveCourse = action({
  args: {
    courseId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingCourse = await ctx.runQuery(api.canvas.getCourseByCourseId, {
      courseId: args.courseId,
    });

    if (existingCourse) {
      return {
        success: true,
        created: false,
        inNullCanvasCourses: false,
      }
    }

    const isInNullCanvasCourses = await ctx.runQuery(api.canvas.isCourseIdInNullCanvasCourses, {
      courseId: args.courseId,
    });

    if (isInNullCanvasCourses) {
      return {
        success: true,
        created: false,
        inNullCanvasCourses: true,
      }
    }

    const data = await ctx.runAction(api.canvas.fetchCourse, {
      courseId: args.courseId,
    });

    if (!data.course) {
      await ctx.runMutation(api.canvas.addNullCanvasCourse, {
        courseId: args.courseId,
      });

      return {
        success: false,
        error: "Course not found",
      };
    }

    await ctx.runMutation(api.canvas.saveCourse, {
      courseId: args.courseId,
      courseCode: data.course.course_code,
      name: data.course.name,
      createdAt: data.course.created_at,
      data: data.course,
    });

    return {
      success: true,
      created: true,
    };
  }
})

export const scrapeCourses = action({
  args: {
    startCourseId: v.optional(v.number()),
    endCourseId: v.optional(v.number()),
    itemsPerPeriod: v.optional(v.number()),
    periodLengthMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const startCourseId = args.startCourseId || 1800000
    const endCourseId = args.endCourseId || 1800000 + 100

    const itemsPerPeriod = args.itemsPerPeriod || 100
    const periodLengthMs = args.periodLengthMs || 1000

    // const existingCanvasCourseIds = await ctx.runQuery(api.canvas.getAllCanvasCourseIds);
    // const existingNullCanvasCourseIds = await ctx.runQuery(api.canvas.getAllNullCanvasCourseIds);
    // const existingCourseIdSet = new Set([...existingCanvasCourseIds, ...existingNullCanvasCourseIds]);

    console.log(`Scraping courses from ${startCourseId} to ${endCourseId} in chunks of ${itemsPerPeriod} with period length of ${periodLengthMs}ms`);

    const allCourseIds = Array.from({ length: endCourseId - startCourseId + 1 }, (_, i) => startCourseId + i);
    // const filteredCourseIds = allCourseIds.filter(courseId => !existingCourseIdSet.has(courseId.toString()));
    const filteredCourseIds = allCourseIds;

    console.log(`Found ${filteredCourseIds.length} courses to scrape`);

    // split into chunks of per_minute
    const chunks: number[][] = [];
    for (let i = 0; i < filteredCourseIds.length; i += itemsPerPeriod) {
      chunks.push(filteredCourseIds.slice(i, i + itemsPerPeriod));
    }

    const estimatedTime = chunks.length * periodLengthMs / 1000;
    console.log(`Estimated time to complete: ${estimatedTime} seconds`);

    let i = 0;
    for (const chunk of chunks) {
      await Promise.all(chunk.map(courseId => ctx.scheduler.runAfter(periodLengthMs * i, api.canvas.pingAndSaveCourse, {
        courseId: courseId.toString(),
      })));
      i++;
    }

    return {
      success: true,
    };
  }
})