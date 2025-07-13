import { eq, sql } from "drizzle-orm"

import {
  CoursesTable,
  MyPlanQuarterCoursesTable,
  ProgramsTable,
  db,
} from "@/lib/db/schema"

export class CourseService {
  static async getCoursesByProgram(programCode: string) {
    const courses = await db
      .select({
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
      })
      .from(CoursesTable)
      .leftJoin(ProgramsTable, eq(CoursesTable.programCode, ProgramsTable.code))
      .where(eq(CoursesTable.programCode, programCode))
      .orderBy(CoursesTable.code)

    return courses
  }

  static async getCourseByCode(code: string) {
    const courses = await db
      .select({
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
        myplanData: MyPlanQuarterCoursesTable.data,
      })
      .from(CoursesTable)
      .leftJoin(
        MyPlanQuarterCoursesTable,
        eq(CoursesTable.code, MyPlanQuarterCoursesTable.code)
      )
      .where(eq(CoursesTable.code, code))
      .leftJoin(ProgramsTable, eq(CoursesTable.programCode, ProgramsTable.code))

    return courses.length > 0 ? courses[0] : null
  }

  static async getAllCourses() {
    const courses = await db
      .select({
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
      })
      .from(CoursesTable)
      .leftJoin(ProgramsTable, eq(CoursesTable.programCode, ProgramsTable.code))
      .orderBy(CoursesTable.code)
      .limit(20)

    return courses
  }

  static async getRandomCourses(count: number) {
    const courses = await db
      .select({
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
      })
      .from(CoursesTable)
      .leftJoin(ProgramsTable, eq(CoursesTable.programCode, ProgramsTable.code))
      .orderBy(sql`RANDOM()`)
      .limit(count)

    return courses
  }
}

export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourseByCode>>
>
