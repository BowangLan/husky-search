import { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { MyPlanCourse, MyPlanCourseDetail } from "@/types/myplan"

export const CoursesTable = pgTable(
  "uw_courses",
  {
    id: serial("id").primaryKey(),
    code: text("code").unique().notNull(),
    myplanCode: text("myplanCode"),
    title: text("title").notNull(),
    description: text("description").notNull(),
    credit: text("credit").notNull(),
    subject: text("subject").notNull(),
    number: text("number").notNull(),
    quarters: text("quarters").notNull(),
    genEdReqs: text("genEdReqs").array(),
    programCode: text("programCode").references(() => ProgramsTable.code, {
      onDelete: "set null",
    }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (users) => [uniqueIndex("uw_courses_unique_code_idx").on(users.code)]
)

export const MyPlanSubjectAreasTable = pgTable(
  "myplan_subject_areas",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    title: text("title").notNull(),
    campus: text("campus").notNull(),
    collegeCode: text("collegeCode").notNull(),
    collegeTitle: text("collegeTitle").notNull(),
    departmentCode: text("departmentCode").notNull(),
    departmentTitle: text("departmentTitle").notNull(),
    codeNoSpaces: text("codeNoSpaces").notNull(),
    quotedCode: text("quotedCode").notNull(),
    courseDuplicate: boolean("courseDuplicate").notNull().default(false),
    programId: integer("programId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (myplanSubjectAreas) => [
    uniqueIndex("myplan_subject_areas_unique_code_idx").on(
      myplanSubjectAreas.code
    ),
  ]
)

export const MyPlanQuarterCoursesTable = pgTable(
  "myplan_quarter_courses",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(),
    number: text("number").notNull(),
    quarter: text("quarter").notNull(),
    data: jsonb("data").$type<MyPlanCourse>().notNull(),
    myplanId: text("myplanId").notNull().unique(),
    detail: jsonb("detail").$type<MyPlanCourseDetail>(),
    subjectAreaCode: text("subjectAreaCode")
      .references(() => MyPlanSubjectAreasTable.code)
      .notNull(),
    hasDuplicate: boolean("hasDuplicate").notNull().default(false),
    enrollMax: integer("enrollMax").notNull().default(0),
    enrollCount: integer("enrollCount").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (myplanCourses) => [
    uniqueIndex("myplan_quarter_courses_unique_code_idx").on(
      myplanCourses.code,
      myplanCourses.quarter
    ),
  ]
)

export const ProgramsTable = pgTable(
  "uw_programs",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").unique().notNull(),
    myplanSubjectAreaId: integer("myplanSubjectAreaId"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (programs) => [uniqueIndex("uw_programs_unique_code_idx").on(programs.code)]
)

export const MyPlanCourseDetailTable = pgTable("myplan_course_details", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  number: text("number").notNull(),
  data: jsonb("data").$type<MyPlanCourseDetail>().notNull(),
  hash: text("hash").notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const CourseCECDataTable = pgTable("course_cec_data", {
  id: serial("id").primaryKey(),
  courseUrl: text("courseUrl").notNull().unique(),
  data: jsonb("data").$type<any>().notNull(),
  professor: text("professor").notNull(),
  role: text("role").notNull(),
  term: text("term").notNull(),
  quarter: text("quarter").notNull(),
  enrolledCount: integer("enrolledCount").notNull().default(0),
  surveyedCount: integer("surveyedCount").notNull().default(0),
  courseCode: text("courseCode").notNull(),
  sessionCode: text("sessionCode").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

export const CurrentAcademicTermTable = pgTable("current_academic_term", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  year: integer("year").notNull(),
  quarter: text("quarter").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
})

// Connect to  Postgres
export const db = drizzle(process.env.DATABASE_URL!)
