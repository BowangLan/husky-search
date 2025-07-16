import { count, desc, eq, sql } from "drizzle-orm"

import {
  CoursesTable,
  MyPlanQuarterCoursesTable,
  ProgramsTable,
  db,
} from "@/lib/db/schema"

export class CourseService {
  // Shared select fields for course queries
  private static baseSelect = {
    id: CoursesTable.id,
    code: CoursesTable.code,
    title: CoursesTable.title,
    description: CoursesTable.description,
    credit: CoursesTable.credit,
    subject: CoursesTable.subject,
    number: CoursesTable.number,
    quarters: CoursesTable.quarters,
    programCode: CoursesTable.programCode,
    programName: ProgramsTable.name,
  }

  // Shared select fields for course queries with myplanData
  private static baseSelectWithMyPlan = {
    ...CourseService.baseSelect,
    myplanData: MyPlanQuarterCoursesTable.data,
  }

  // Shared join logic for course queries
  private static joinPrograms(query: any) {
    return query.leftJoin(
      ProgramsTable,
      eq(CoursesTable.programCode, ProgramsTable.code)
    )
  }

  private static joinMyPlan(query: any) {
    return query.leftJoin(
      MyPlanQuarterCoursesTable,
      eq(CoursesTable.code, MyPlanQuarterCoursesTable.code)
    )
  }

  static async getCoursesByProgram(programCode: string) {
    let query = db.select(CourseService.baseSelectWithMyPlan).from(CoursesTable)
    query = CourseService.joinPrograms(query)
    query = CourseService.joinMyPlan(query)
    const courses = await query
      .where(eq(CoursesTable.programCode, programCode))
      .groupBy(
        CoursesTable.id,
        CoursesTable.code,
        CoursesTable.title,
        CoursesTable.description,
        CoursesTable.credit,
        CoursesTable.subject,
        CoursesTable.number,
        CoursesTable.quarters,
        CoursesTable.programCode,
        ProgramsTable.name,
        MyPlanQuarterCoursesTable.data,
        MyPlanQuarterCoursesTable.quarter
      )
      .orderBy(CoursesTable.code, desc(MyPlanQuarterCoursesTable.quarter))
    return courses
  }

  static async getTotalCourseCount() {
    const tcount = await db.select({ count: count() }).from(CoursesTable)
    return tcount[0].count
  }

  static async getCourseByCode(code: string) {
    let query = db.select(CourseService.baseSelectWithMyPlan).from(CoursesTable)
    query = CourseService.joinMyPlan(query)
    query = CourseService.joinPrograms(query)
    const courses = await query
      .where(eq(CoursesTable.code, code))
      .groupBy(
        CoursesTable.id,
        CoursesTable.code,
        CoursesTable.title,
        CoursesTable.description,
        CoursesTable.credit,
        CoursesTable.subject,
        CoursesTable.number,
        CoursesTable.quarters,
        CoursesTable.programCode,
        ProgramsTable.name,
        MyPlanQuarterCoursesTable.data,
        MyPlanQuarterCoursesTable.quarter
      )
      .orderBy(CoursesTable.code, desc(MyPlanQuarterCoursesTable.quarter))
    return courses.length > 0 ? courses[0] : null
  }

  static async getAllCourses() {
    let query = db.select(CourseService.baseSelect).from(CoursesTable)
    query = CourseService.joinPrograms(query)
    const courses = await query
      .orderBy(CoursesTable.code, desc(MyPlanQuarterCoursesTable.quarter))
      .limit(20)
    return courses
  }

  static async getRandomCourses(count: number) {
    let query = db.select(CourseService.baseSelectWithMyPlan).from(CoursesTable)
    query = CourseService.joinPrograms(query)
    query = CourseService.joinMyPlan(query)
    const courses = await query
      .groupBy(
        CoursesTable.id,
        CoursesTable.code,
        CoursesTable.title,
        CoursesTable.description,
        CoursesTable.credit,
        CoursesTable.subject,
        CoursesTable.number,
        CoursesTable.quarters,
        CoursesTable.programCode,
        ProgramsTable.name,
        MyPlanQuarterCoursesTable.data,
        MyPlanQuarterCoursesTable.quarter
      )
      .orderBy(sql`RANDOM()`)
      .limit(count)
    return courses
  }
}

export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourseByCode>>
>
