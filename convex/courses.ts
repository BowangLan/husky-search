import { v } from "convex/values";
import { query } from "./_generated/server";
import { FunctionReturnType } from "convex/server";
import { api } from "./_generated/api";
import { isStudentHelper } from "./auth";

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