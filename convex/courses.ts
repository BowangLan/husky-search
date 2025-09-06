import { v } from "convex/values";
import { query } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
import { isStudent } from "./auth";

export const getByCourseCode = query({
  args: {
    courseCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userIsStudent = await isStudent(ctx);

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