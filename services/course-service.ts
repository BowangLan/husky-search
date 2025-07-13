import { eq } from "drizzle-orm"

import { CoursesTable, ProgramsTable, db } from "@/lib/db/schema"

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
      })
      .from(CoursesTable)
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
}
