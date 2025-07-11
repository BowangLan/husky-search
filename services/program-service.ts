import { count, eq } from "drizzle-orm"

import { CoursesTable, ProgramsTable, db } from "@/lib/db/schema"

export class ProgramService {
  static async getProgramByCode(code: string) {
    const program = await db
      .select({
        id: ProgramsTable.id,
        name: ProgramsTable.name,
        code: ProgramsTable.code,
        courseCount: count(CoursesTable.id),
      })
      .from(ProgramsTable)
      .leftJoin(CoursesTable, eq(ProgramsTable.code, CoursesTable.programCode))
      .groupBy(ProgramsTable.id, ProgramsTable.name, ProgramsTable.code)
      .where(eq(ProgramsTable.code, code))
    return program
  }

  static async getAllPrograms() {
    const programs = await db
      .select({
        id: ProgramsTable.id,
        name: ProgramsTable.name,
        code: ProgramsTable.code,
        courseCount: count(CoursesTable.id),
      })
      .from(ProgramsTable)
      .leftJoin(CoursesTable, eq(ProgramsTable.code, CoursesTable.programCode))
      .groupBy(ProgramsTable.id, ProgramsTable.name, ProgramsTable.code)
      .orderBy(ProgramsTable.name)

    return programs
  }
}
