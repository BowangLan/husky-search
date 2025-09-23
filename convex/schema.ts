import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { dawgpathCourseFields } from "./dawgpath";
import { myplanDataPointFields, myplanDataPointObj } from "./myplanDataPoints";

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
  enrollData: v.optional(v.array(v.object({
    t: v.number(), // timestamp
    c: v.number(), // enroll count
    m: v.number(), // enroll max
  }))),
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
    enrollStatus: v.optional(v.string()),
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
  genEdReqs: v.array(v.string()),
  termsOffered: v.array(v.string()),
  prereqs: v.optional(v.union(
    v.array(v.string()),
  )),
  currentTermData: v.optional(v.array(myplanCourseTermDataObj)),
  uwCourseCode: v.optional(v.string()),
  url: v.optional(v.string()),
}

export const myplanCourseFullFields = {
  ...myplanCourseInfoFields,
  statsEnrollPercent: v.number(),
  statsEnrollMax: v.number(),
  updateIntervalSeconds: v.optional(v.number()),
  pastTermData: v.optional(v.array(myplanCourseTermDataObj)),
  detailData: v.optional(v.any()),
  searchData: v.optional(v.any()),
  embedding: v.optional(v.array(v.float64())),
  lastUpdated: v.optional(v.number()),
}

export const myplanCourseInfoObj = v.object(myplanCourseInfoFields)
export const myplanCourseObj = v.object(myplanCourseFullFields)

export type MyplanCourseInfo = Infer<typeof myplanCourseInfoObj>
export type MyplanCourse = Infer<typeof myplanCourseObj>

export const myplanSubjectFields = {
  code: v.string(),
  title: v.string(),
  campus: v.string(),
  collegeCode: v.string(),
  collegeTitle: v.string(),
  departmentCode: v.string(),
  departmentTitle: v.string(),
  codeNoSpaces: v.string(),
  quotedCode: v.string(),
  seatCountRank: v.optional(v.number()),
}

export const myplanSubjectObj = v.object(myplanSubjectFields)
export type MyplanSubject = Infer<typeof myplanSubjectObj>

export const userFields = {
  clerkId: v.string(),
  email: v.string(),
  firstName: v.string(),
  lastName: v.string(),
  imageUrl: v.string(),
}

export const userObj = v.object(userFields)
export type User = Infer<typeof userObj>

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
    ...myplanDataPointFields,
  })
    .index("by_course_code_term_id", ["courseCode", "termId"])
  ,

  myplanCourses: defineTable({
    ...myplanCourseFullFields,
  })
    .index("by_course_code", ["courseCode"])
    .searchIndex("by_course_code_search", {
      searchField: "courseCode",
    })
    .index("by_course_id", ["courseId"])
    .index("by_url", ["url"])
    .index("by_subject_area", ["subjectArea"])
    .index("by_update_interval_seconds", ["updateIntervalSeconds"])
    .index("by_detail_data", ["detailData"])
    .index("by_credit", ["credit"])
    .index("by_current_term_data", ["currentTermData"])
    .index("by_stats_enroll_percent", ["statsEnrollPercent"])
    .index("by_stats_enroll_max", ["statsEnrollMax"])
    // .index("search_idx", ["statsEnrollMax"])
    .index("search_idx_by_subject_area", ["subjectArea", "statsEnrollMax"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
    })
  ,

  myplanSubjects: defineTable({
    ...myplanSubjectFields,
  })
    .index("by_code", ["code"])
    .searchIndex("by_title_search", {
      searchField: "title",
    })
    .index("by_campus", ["campus"])
    .index("by_college_code", ["collegeCode"])
    .index("by_department_code", ["departmentCode"])
    .index("by_seat_count_rank", ["seatCountRank"])
  ,

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

  users: defineTable(userFields)
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
  ,
});