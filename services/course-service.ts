import { eq } from "drizzle-orm"
import { CoursesTable, db } from "@/lib/db/schema"

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
      })
      .from(CoursesTable)
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
      })
      .from(CoursesTable)
      .where(eq(CoursesTable.code, code))
    
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
      })
      .from(CoursesTable)
      .orderBy(CoursesTable.code)
    
    return courses
  }
}
