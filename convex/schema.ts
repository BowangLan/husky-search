import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const cecCourseFields = {
  url: v.string(),
  letter: v.string(),
  data: v.any(),
  courseCode: v.optional(v.string()),
  sessionCode: v.optional(v.string()),
  professor: v.optional(v.string()),
  role: v.optional(v.string()),
  term: v.optional(v.string()),
}

export const cecCourseObj = v.object(cecCourseFields)

export type CecCourse = Infer<typeof cecCourseObj>;

export default defineSchema({
  canvasCourses: defineTable({
    courseId: v.string(),
    courseCode: v.string(),
    name: v.string(),
    createdAt: v.string(),
    data: v.any(),
  }).index("by_course_code", ["courseCode"]).index("by_course_id", ["courseId"]),
  nullCanvasCourses: defineTable({
    courseId: v.string(),
  }).index("by_course_id", ["courseId"]),
  cecCourses: defineTable(cecCourseFields)
    .index("by_url", ["url"])
    .index("by_letter", ["letter"])
    .index("by_data", ["data"])
    .index("by_course_code", ["courseCode"]),

  myplanDetailCronJobs: defineTable({
    courseCode: v.string(),
    intervalSeconds: v.number(),
  }).index("by_course_code", ["courseCode"]).index("by_interval_seconds", ["intervalSeconds"]),
});