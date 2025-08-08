import { count, eq } from "drizzle-orm"

import {
  CoursesTable,
  MyPlanQuarterCoursesTable,
  MyPlanSubjectAreasTable,
  ProgramsTable,
  db,
} from "@/lib/db/schema"

export class ProgramService {
  static async getProgramByCode(code: string) {
    const program = await db
      .select({
        id: MyPlanSubjectAreasTable.id,
        code: MyPlanSubjectAreasTable.code,
        title: MyPlanSubjectAreasTable.title,
        campus: MyPlanSubjectAreasTable.campus,
        collegeCode: MyPlanSubjectAreasTable.collegeCode,
        collegeTitle: MyPlanSubjectAreasTable.collegeTitle,
        departmentCode: MyPlanSubjectAreasTable.departmentCode,
        departmentTitle: MyPlanSubjectAreasTable.departmentTitle,
        codeNoSpaces: MyPlanSubjectAreasTable.codeNoSpaces,
        quotedCode: MyPlanSubjectAreasTable.quotedCode,
        courseDuplicate: MyPlanSubjectAreasTable.courseDuplicate,
      })
      .from(MyPlanSubjectAreasTable)
      .leftJoin(
        MyPlanQuarterCoursesTable,
        eq(
          MyPlanSubjectAreasTable.code,
          MyPlanQuarterCoursesTable.subjectAreaCode
        )
      )
      .groupBy(
        MyPlanSubjectAreasTable.id,
        MyPlanSubjectAreasTable.code,
        MyPlanSubjectAreasTable.title,
        MyPlanSubjectAreasTable.campus,
        MyPlanSubjectAreasTable.collegeCode,
        MyPlanSubjectAreasTable.collegeTitle,
        MyPlanSubjectAreasTable.departmentCode,
        MyPlanSubjectAreasTable.departmentTitle,
        MyPlanSubjectAreasTable.codeNoSpaces,
        MyPlanSubjectAreasTable.quotedCode,
        MyPlanSubjectAreasTable.courseDuplicate
      )
      .where(eq(MyPlanSubjectAreasTable.code, code))
    return program[0] ?? null
  }

  static async getProgramByCodeLegacy(code: string) {
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
    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const programs = await db
      .select({
        id: MyPlanSubjectAreasTable.id,
        code: MyPlanSubjectAreasTable.code,
        title: MyPlanSubjectAreasTable.title,
        campus: MyPlanSubjectAreasTable.campus,
        collegeCode: MyPlanSubjectAreasTable.collegeCode,
        collegeTitle: MyPlanSubjectAreasTable.collegeTitle,
        departmentCode: MyPlanSubjectAreasTable.departmentCode,
        departmentTitle: MyPlanSubjectAreasTable.departmentTitle,
        codeNoSpaces: MyPlanSubjectAreasTable.codeNoSpaces,
        quotedCode: MyPlanSubjectAreasTable.quotedCode,
        courseDuplicate: MyPlanSubjectAreasTable.courseDuplicate,
        courseCount: count(MyPlanQuarterCoursesTable.code),
      })
      .from(MyPlanSubjectAreasTable)
      .leftJoin(
        MyPlanQuarterCoursesTable,
        eq(
          MyPlanSubjectAreasTable.code,
          MyPlanQuarterCoursesTable.subjectAreaCode
        )
      )
      .groupBy(
        MyPlanSubjectAreasTable.id,
        MyPlanSubjectAreasTable.code,
        MyPlanSubjectAreasTable.title,
        MyPlanSubjectAreasTable.campus,
        MyPlanSubjectAreasTable.collegeCode,
        MyPlanSubjectAreasTable.collegeTitle,
        MyPlanSubjectAreasTable.departmentCode,
        MyPlanSubjectAreasTable.departmentTitle,
        MyPlanSubjectAreasTable.codeNoSpaces,
        MyPlanSubjectAreasTable.id
      )

    return programs
  }

  static async getAllProgramsLegacy() {
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

export type ProgramDetail = Awaited<
  ReturnType<typeof ProgramService.getProgramByCode>
>
