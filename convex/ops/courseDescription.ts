import { internalAction } from "../_generated/server";
import { api, internal } from "../_generated/api";
import { v } from "convex/values";


export const cleanCourseDescriptions = internalAction({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let page = 1;
    let count = 0;

    console.log(`Fetching all course codes`);
    let courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
      limit: 100,
    });
    await ctx.scheduler.runAfter(0, internal.myplan.updateCourses, {
      courses: courseQuery.page.map((course) => ({
        id: course._id,
        data: {
          // description: course.detailData?.courseSummaryDetails?.courseDescription.replace("&quot;", "\"") ?? "",
          // genEdReqs: course.detailData?.courseSummaryDetails?.abbrGenEdRequirements ?? [],
          termsOffered: course.detailData?.courseSummaryDetails?.termsOffered ?? [],
        }
      })),
    });
    count += courseQuery.page.length;
    page++;


    while (!courseQuery.isDone) {
      console.log(`Fetching page ${page}`);
      courseQuery = await ctx.runQuery(api.myplan.listFullCourses, {
        limit: 100,
        cursor: courseQuery.continueCursor,
      });
      await ctx.scheduler.runAfter(page * 2000, internal.myplan.updateCourses, {
        courses: courseQuery.page.map((course) => ({
          id: course._id,
          data: {
            // description: course.detailData?.courseSummaryDetails?.courseDescription.replace("&quot;", "\"") ?? "",
            // genEdReqs: course.detailData?.courseSummaryDetails?.abbrGenEdRequirements ?? [],
            termsOffered: course.detailData?.courseSummaryDetails?.termsOffered ?? [],
          }
        })),
      });
      count += courseQuery.page.length;
      page++;
    }

    console.log(`Spinned up updates for ${count} courses (should be done in ${page * 2000} seconds)`);

    return {
      success: true,
    };
  }
})

export const checkCourseDescriptions = internalAction({
  args: {

  },
  handler: async (ctx, args) => {
    let page = 1;
    let count = 0;
    let emptyDescriptions = 0;

    console.log(`Fetching all course codes`);
    let courseQuery = await ctx.runQuery(api.myplan.listCourseCodesWithDescription, {
      limit: 100,
    });

    for (const course of courseQuery.page) {
      if (!course.description) {
        emptyDescriptions++;
      }
    }

    count += courseQuery.page.length;
    page++;


    while (!courseQuery.isDone) {
      console.log(`Fetching page ${page}`);
      courseQuery = await ctx.runQuery(api.myplan.listCourseCodesWithDescription, {
        limit: 100,
        cursor: courseQuery.continueCursor,
      });
      for (const course of courseQuery.page) {
        if (!course.description) {
          emptyDescriptions++;
        }
      }
      count += courseQuery.page.length;
      page++;
    }

    console.log(`Found ${emptyDescriptions} empty descriptions out of ${count} courses`);

    return {
      success: true,
    };
  }
})
