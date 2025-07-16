import { count, desc, eq, sql } from "drizzle-orm"

import { MyPlanCourse } from "@/types/myplan"
import { groupQuarterCoursesByCode } from "@/lib/course-utils"
import {
  CoursesTable,
  MyPlanQuarterCoursesTable,
  MyPlanSubjectAreasTable,
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

  private static myplanCourseSelect = {
    id: MyPlanQuarterCoursesTable.id,
    code: MyPlanQuarterCoursesTable.code,
    data: MyPlanQuarterCoursesTable.data,
    quarter: MyPlanQuarterCoursesTable.quarter,
    myplanId: MyPlanQuarterCoursesTable.myplanId,
    subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
    subjectAreaTitle: MyPlanSubjectAreasTable.title,
  }

  // Shared join logic for course queries
  private static joinPrograms(query: any) {
    return query.leftJoin(
      ProgramsTable,
      eq(CoursesTable.programCode, ProgramsTable.code)
    )
  }

  private static joinMyPlanSubjectAreas(query: any) {
    return query.innerJoin(
      MyPlanSubjectAreasTable,
      eq(
        MyPlanQuarterCoursesTable.subjectAreaCode,
        MyPlanSubjectAreasTable.code
      )
    )
  }

  private static joinMyPlan(query: any) {
    return query.leftJoin(
      MyPlanQuarterCoursesTable,
      eq(CoursesTable.code, MyPlanQuarterCoursesTable.code)
    )
  }

  static async getCoursesByProgram(programCode: string) {
    let query = db
      .select(CourseService.myplanCourseSelect)
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .where(eq(MyPlanQuarterCoursesTable.subjectAreaCode, programCode))
      .orderBy(
        MyPlanQuarterCoursesTable.code,
        desc(MyPlanQuarterCoursesTable.quarter)
      )

    // group courses by quarter
    const groupedCourses = groupQuarterCoursesByCode(courses)
    return groupedCourses
  }

  static async getCoursesByProgramLegacy(programCode: string) {
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
    let query = db
      .select(CourseService.myplanCourseSelect)
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .where(eq(MyPlanQuarterCoursesTable.code, code))
      .orderBy(desc(MyPlanQuarterCoursesTable.quarter))

    const course = courses.length > 0 ? courses[0] : null
    return course ? groupQuarterCoursesByCode([course])[0] : null
  }

  static async getCourseByCodeLegacy(code: string) {
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

  static async getPopularCourses(count: number) {
    let query = db
      .select(CourseService.myplanCourseSelect)
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .orderBy(
        sql`jsonb_array_length(data->'sectionGroups') DESC NULLS LAST`
      )
      .limit(count)
    return groupQuarterCoursesByCode(courses)
  }
}

export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourseByCode>>
>
