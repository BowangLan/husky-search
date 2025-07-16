import { count, eq } from "drizzle-orm"

import {
  CoursesTable,
  MyPlanSubjectAreasTable,
  ProgramsTable,
  db,
} from "@/lib/db/schema"

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
        myplanSubjectArea: {
          id: MyPlanSubjectAreasTable.id,
          code: MyPlanSubjectAreasTable.code,
          title: MyPlanSubjectAreasTable.title,
          departmentCode: MyPlanSubjectAreasTable.departmentCode,
          departmentTitle: MyPlanSubjectAreasTable.departmentTitle,
          collegeCode: MyPlanSubjectAreasTable.collegeCode,
          collegeTitle: MyPlanSubjectAreasTable.collegeTitle,
          campus: MyPlanSubjectAreasTable.campus,
        },
      })
      .from(ProgramsTable)
      .leftJoin(CoursesTable, eq(ProgramsTable.code, CoursesTable.programCode))
      .leftJoin(
        MyPlanSubjectAreasTable,
        eq(ProgramsTable.myplanSubjectAreaId, MyPlanSubjectAreasTable.id)
      )
      .groupBy(
        ProgramsTable.id,
        ProgramsTable.name,
        ProgramsTable.code,
        MyPlanSubjectAreasTable.id
      )
      .orderBy(ProgramsTable.name)

    return programs
  }
}

export type ProgramInfo = Awaited<
  ReturnType<typeof ProgramService.getAllPrograms>
>[number]
