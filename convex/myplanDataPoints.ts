import { Infer, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const myplanDataPointFields = {
  courseCode: v.string(),
  termId: v.string(),
  timestamp: v.number(),
  enrollCount: v.number(),
  enrollMax: v.number(),
}

export const myplanDataPointObj = v.object({
  ...myplanDataPointFields,
})

export type MyplanDataPoint = Infer<typeof myplanDataPointObj>

export const getLatestDataPointByCourseCode = query({
  args: {
    courseCode: v.string(),
    termId: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.query("myplanDataPoints")
      .withIndex("by_course_code_term_id", (q) => q.eq("courseCode", args.courseCode).eq("termId", args.termId))
      .order("desc")
      .first();

    return c;
  }
})

export const insertDataPoints = internalMutation({
  args: {
    dataPoints: v.array(myplanDataPointObj),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.dataPoints.map(async (dataPoint) => {
      await ctx.db.insert("myplanDataPoints", dataPoint);
    }));

    return {
      success: true,
    };
  }
})