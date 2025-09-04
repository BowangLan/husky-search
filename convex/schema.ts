import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { dawgpathCourseFields } from "./dawgpath";

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

export const myplanCourseTermDataObj = v.object({
  termId: v.string(),
  enrollCount: v.number(),
  enrollMax: v.number(),
  enrollData: v.array(v.object({
    t: v.number(), // timestamp
    c: v.number(), // enroll count
    m: v.number(), // enroll max
  })),
  sessions: v.array(v.object({
    id: v.string(),
    code: v.string(),
    enrollMaximum: v.string(),
    enrollCount: v.string(),
    registrationCode: v.string(),
    newThisYear: v.boolean(),
    stateKey: v.string(),
    type: v.string(),
    addCodeRequired: v.optional(v.boolean()),
    // meetingDetailsList: v.array(v.object({
    //   building: v.string(),
    //   campus: v.string(),
    //   days: v.string(),
    //   room: v.string(),
    //   time: v.string()
    // })),
    meetingDetailsList: v.array(v.any()),
    instructor: v.optional(v.any()),
  })),
})
export type MyplanCourseTermData = Infer<typeof myplanCourseTermDataObj>
export type MyplanCourseTermSession = Infer<typeof myplanCourseTermDataObj>['sessions'][number]

export const myplanCourseInfoFields = {
  courseCode: v.string(),
  courseId: v.string(),
  description: v.string(),
  title: v.string(),
  credit: v.string(),
  campus: v.string(),
  subjectArea: v.string(),
  courseNumber: v.string(),
  prereqs: v.optional(v.union(
    v.array(v.string()),
    v.string(),
  )),
  currentTermData: v.optional(v.array(myplanCourseTermDataObj)),
}

export const myplanCourseFullFields = {
  ...myplanCourseInfoFields,
  statsEnrollPercent: v.number(),
  statsEnrollMax: v.number(),
  updateIntervalSeconds: v.optional(v.number()),
  pastTermData: v.optional(v.array(myplanCourseTermDataObj)),
  detailData: v.optional(v.any()),
  searchData: v.optional(v.any()),
}

export const myplanCourseInfoObj = v.object(myplanCourseInfoFields)
export const myplanCourseObj = v.object(myplanCourseFullFields)

export type MyplanCourseInfo = Infer<typeof myplanCourseInfoObj>
export type MyplanCourse = Infer<typeof myplanCourseObj>

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

  myplanDataPoints: defineTable({
    courseCode: v.string(),
    courseId: v.string(),
    timestamp: v.string(),
    enrollCount: v.number(),
    enrollMax: v.number(),
  }).index("by_course_code", ["courseCode"])
    .index("by_course_code_timestamp", ["courseCode", "timestamp"])
    .index("by_course_id", ["courseId"])
    .index("by_timestamp", ["timestamp"]),

  myplanCourses: defineTable({
    ...myplanCourseFullFields,
  })
    .index("by_course_code", ["courseCode"])
    .searchIndex("by_course_code_search", {
      searchField: "courseCode",
    })
    .index("by_course_id", ["courseId"])
    .index("by_subject_area", ["subjectArea"])
    .index("by_update_interval_seconds", ["updateIntervalSeconds"])
    .index("by_detail_data", ["detailData"])
    .index("by_current_term_data", ["currentTermData"])
    .index("by_stats_enroll_percent", ["statsEnrollPercent"])
    .index("by_stats_enroll_max", ["statsEnrollMax"]),

  dawgpathCourses: defineTable({
    ...dawgpathCourseFields,
  })
    .index("by_course_code", ["courseCode"])
    .index("by_detail_data", ["detailData"]),
  dawgpathSubjects: defineTable({
    subjectCode: v.string(),
    name: v.string(),
  })
    .index("by_subject_code", ["subjectCode"])
    .searchIndex("by_name", {
      searchField: "name",
    }),

  kvStore: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),
});