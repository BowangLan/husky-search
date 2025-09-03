import { v } from "convex/values";
import { query } from "./_generated/server";

export const getByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const myplanCourse = await ctx.db.query("myplanCourses")
      .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
      .first();

    const dawgpathCourse = await ctx.db.query("dawgpathCourses")
      .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
      .first();

    const cecCourse = await ctx.db.query("cecCourses")
      .withIndex("by_course_code", (q) => q.eq("courseCode", args.courseCode))
      .first();

    return {
      myplanCourse,
      dawgpathCourse,
      cecCourse,
    };
  }
})