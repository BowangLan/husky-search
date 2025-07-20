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
    title: text("title").notNull(),
    description: text("description").notNull(),
    credit: text("credit").notNull(),
    subject: text("subject").notNull(),
    number: text("number").notNull(),
    quarters: text("quarters").notNull(),
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
    quarter: text("quarter").notNull(),
    data: jsonb("data").$type<MyPlanCourse>().notNull(),
    myplanId: text("myplanId").notNull().unique(),
    detail: jsonb("detail").$type<MyPlanCourseDetail>(),
    subjectAreaCode: text("subjectAreaCode")
      .references(() => MyPlanSubjectAreasTable.code)
      .notNull(),
    hasDuplicate: boolean("hasDuplicate").notNull().default(false),
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

// Connect to  Postgres
export const db = drizzle(process.env.DATABASE_URL!)
