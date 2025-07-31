import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm"

import {
  MyPlanCourse,
  MyPlanCourseCodeGroup,
  MyPlanCourseDetail,
} from "@/types/myplan"
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
    number: MyPlanQuarterCoursesTable.number,
  }

  private static myplanCourseSelectSimple = {
    id: MyPlanQuarterCoursesTable.id,
    code: MyPlanQuarterCoursesTable.code,
    // data: MyPlanQuarterCoursesTable.data,
    // quarter: MyPlanQuarterCoursesTable.quarter,
    // myplanId: MyPlanQuarterCoursesTable.myplanId,
    // subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
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
      .select({
        ...CourseService.myplanCourseSelect,
        description: CoursesTable.description,
        // sql<string>`min(${MyPlanQuarterCoursesTable.data}->>'description')`.as(
        //   "description"
        // ),
      })
      .from(MyPlanQuarterCoursesTable)
    // .leftJoin(
    //   CoursesTable,
    // and(
    //   eq(MyPlanQuarterCoursesTable.subjectAreaCode, CoursesTable.subject),
    //   eq(CoursesTable.number, MyPlanQuarterCoursesTable.number)
    // )
    //   eq(MyPlanQuarterCoursesTable.code, CoursesTable.code)
    // )
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .where(eq(MyPlanQuarterCoursesTable.subjectAreaCode, programCode))
      .orderBy(
        MyPlanQuarterCoursesTable.code,
        desc(MyPlanQuarterCoursesTable.quarter)
      )

    // group courses by quarter
    const groupedCourses = courses.reduce((acc, course) => {
      if (!acc[course.code]) {
        acc[course.code] = {
          code: course.code,
          title: course.data.title,
          subjectAreaCode: course.subjectAreaCode,
          subjectAreaTitle: course.subjectAreaTitle,
          description: course.description ?? "",
          number: course.number,
          data: [],
        }
      }
      acc[course.code].data.push({
        data: course.data,
        quarter: course.quarter,
        subjectAreaCode: course.subjectAreaCode,
        myplanId: course.myplanId,
      })
      return acc
    }, {} as Record<string, MyPlanCourseCodeGroup>)

    return Object.values(groupedCourses)
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

  static async getCoursesByCredit(
    credit: string,
    {
      page,
      pageSize = 20,
    }: {
      page: number
      pageSize?: number
    }
  ) {
    let query = db
      .select({
        code: MyPlanQuarterCoursesTable.code,
        title: sql<string>`min(${MyPlanQuarterCoursesTable.data}->>'title')`.as(
          "title"
        ),
        subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
        subjectAreaTitle: MyPlanSubjectAreasTable.title,
        data: sql<MyPlanCourseCodeGroup["data"]>`
        array_agg(jsonb_build_object(
          'data', ${MyPlanQuarterCoursesTable.data},
          'quarter', ${MyPlanQuarterCoursesTable.quarter},
          'subjectAreaCode', ${MyPlanQuarterCoursesTable.subjectAreaCode},
          'myplanId', ${MyPlanQuarterCoursesTable.myplanId}
        ) ORDER BY ${MyPlanQuarterCoursesTable.quarter} DESC)
        `,
      })
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .groupBy(
        MyPlanQuarterCoursesTable.id,
        MyPlanQuarterCoursesTable.code,
        MyPlanQuarterCoursesTable.data,
        MyPlanQuarterCoursesTable.quarter,
        MyPlanQuarterCoursesTable.myplanId,
        MyPlanQuarterCoursesTable.subjectAreaCode
      )
      .having(
        // and(
        //   ilike(
        //     sql`regexp_replace(${MyPlanQuarterCoursesTable.code}, ' \d+$', '')`,
        //     `${qWithoutNumber}%`
        //   ),
        //   like(
        //     sql`regexp_replace(${MyPlanQuarterCoursesTable.code}, '^[A-Z\s]+ ', '')`,
        //     courseCode ? `${courseCode}%` : "%%"
        //   )
        // )
        sql`${credit} = ANY((${MyPlanQuarterCoursesTable.data}->>'allCredits')::text[])`
      )
      .orderBy(asc(MyPlanQuarterCoursesTable.code))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return courses
  }

  static async getTotalCourseCount() {
    const tcount = await db
      .select({ count: count() })
      .from(MyPlanQuarterCoursesTable)
    return tcount[0].count
  }

  static async getCourseDetailByCode(code: string) {
    type MyPlanCourseCodeGroupWithDetail = {
      code: string
      title: string
      subjectAreaCode: string
      subjectAreaTitle: string
      data: {
        data: MyPlanCourse
        quarter: string
        subjectAreaCode: string
        myplanId: string
        detail: MyPlanCourseDetail | null
      }[]
    }

    const groupQuarterCoursesWithDetailByCode = (
      courses: {
        id: number
        code: string
        data: MyPlanCourse
        quarter: string
        myplanId: string
        subjectAreaCode: string
        subjectAreaTitle: string
        detail: MyPlanCourseDetail | null
      }[]
    ) => {
      const groupedCourses = courses.reduce((acc, course) => {
        if (!acc[course.code]) {
          acc[course.code] = {
            code: course.code,
            title: course.data.title,
            subjectAreaCode: course.subjectAreaCode,
            subjectAreaTitle: course.subjectAreaTitle,
            data: [],
          }
        }
        acc[course.code].data.push({
          data: course.data,
          quarter: course.quarter,
          subjectAreaCode: course.subjectAreaCode,
          myplanId: course.myplanId,
          detail: course.detail,
        })
        return acc
      }, {} as Record<string, MyPlanCourseCodeGroupWithDetail>)

      return Object.values(groupedCourses)
    }

    let query = db
      .select({
        id: MyPlanQuarterCoursesTable.id,
        code: MyPlanQuarterCoursesTable.code,
        data: MyPlanQuarterCoursesTable.data,
        quarter: MyPlanQuarterCoursesTable.quarter,
        myplanId: MyPlanQuarterCoursesTable.myplanId,
        detail: MyPlanQuarterCoursesTable.detail,
        subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
        subjectAreaTitle: MyPlanSubjectAreasTable.title,
      })
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)
    const courses = await query
      .where(eq(MyPlanQuarterCoursesTable.code, code))
      .orderBy(desc(MyPlanQuarterCoursesTable.quarter))

    if (courses.length === 0) return null

    return groupQuarterCoursesWithDetailByCode(courses)[0] ?? null
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

  static async getCourses(
    count: number,
    {
      page = 1,
      sortBy = "popular",

      // filters
      credit,
      hasPrereq,
      subjects,
    }: {
      page?: number
      sortBy?: "popular" | "code"
      credit?: string
      hasPrereq?: boolean
      subjects?: Set<string>
    } = {}
  ) {
    const totalSectionGroups = sql<number>`
    SUM(jsonb_array_length(${MyPlanQuarterCoursesTable.data}->'sectionGroups'))
  `.as("totalSectionGroups") // Give it an alias for use in orderBy

    let query: any = db
      .select({
        code: MyPlanQuarterCoursesTable.code,
        title: sql<string>`min(${MyPlanQuarterCoursesTable.data}->>'title')`.as(
          "title"
        ),
        subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
        subjectAreaTitle: MyPlanSubjectAreasTable.title,
        data: sql<MyPlanCourseCodeGroup["data"]>`
        array_agg(jsonb_build_object(
          'data', ${MyPlanQuarterCoursesTable.data},
          'quarter', ${MyPlanQuarterCoursesTable.quarter},
          'subjectAreaCode', ${MyPlanQuarterCoursesTable.subjectAreaCode},
          'myplanId', ${MyPlanQuarterCoursesTable.myplanId}
        ) ORDER BY ${MyPlanQuarterCoursesTable.quarter} DESC)
        `,
      })
      .from(MyPlanQuarterCoursesTable)
    query = CourseService.joinMyPlanSubjectAreas(query)

    let whereClauses: any[] = []

    if (credit) {
      whereClauses.push(
        sql`(
        ${MyPlanQuarterCoursesTable.data}->'allCredits' @> '["${sql.raw(
          credit
        )}"]'
        OR
        ${MyPlanQuarterCoursesTable.data}->'allCredits' = '["${sql.raw(
          credit
        )}"]'
      )`
      )
    }

    if (typeof hasPrereq === "boolean") {
      if (hasPrereq) {
        whereClauses.push(
          sql`${MyPlanQuarterCoursesTable.data}->>'prereqs' != ''`
        )
      } else {
        whereClauses.push(
          sql`${MyPlanQuarterCoursesTable.data}->>'prereqs' = ''`
        )
      }
    }

    if (subjects && subjects.size > 0) {
      whereClauses.push(
        // sql`${MyPlanQuarterCoursesTable.subjectAreaCode} = ANY(ARRAY[${sql.raw(
        //   Array.from(subjects).join(",")
        // )}]::text[])`
        inArray(MyPlanQuarterCoursesTable.subjectAreaCode, Array.from(subjects))
      )
    }

    let sortByClauses = [sql`${totalSectionGroups.getSQL()} DESC`]
    if (sortBy === "code") {
      sortByClauses = [asc(MyPlanQuarterCoursesTable.code)]
    }

    const courses = await query
      .where(and(...whereClauses))
      .groupBy(
        MyPlanQuarterCoursesTable.code,
        MyPlanQuarterCoursesTable.subjectAreaCode,
        MyPlanSubjectAreasTable.title
      )
      .orderBy(...sortByClauses)
      .limit(count)
      .offset((page - 1) * count)
    return courses
  }

  static async search(
    keywords: string,
    {
      page,
      pageSize = 20,
    }: {
      page: number
      pageSize?: number
    }
  ) {
    const extractNumber = (query: string) => {
      // return the first sequence of numbers {1:3}
      return (
        query
          .match(/\d{1,3}/)?.[0]
          .replace(/\D/g, "")
          .trim() ?? null
      )
    }

    const qWithoutNumber = keywords.replaceAll(/\d/g, "").trim()
    const courseCode = extractNumber(keywords)

    console.log(`Query: '${keywords}'`)
    console.log(`Q without number: '${qWithoutNumber}%'`)
    console.log(`Course code: '${courseCode}%'`)

    let query = db
      .select({
        code: MyPlanQuarterCoursesTable.code,
        title: sql<string>`min(${MyPlanQuarterCoursesTable.data}->>'title')`.as(
          "title"
        ),
        // subjectAreaCode: MyPlanQuarterCoursesTable.subjectAreaCode,
        // subjectAreaTitle: MyPlanSubjectAreasTable.title,
      })
      .from(MyPlanQuarterCoursesTable)

    query = CourseService.joinMyPlanSubjectAreas(query)

    const courses = await query
      .where(
        and(
          or(
            sql`regexp_replace(${
              MyPlanQuarterCoursesTable.code
            }, '[\s\d]+', '') ilike '${sql.raw(qWithoutNumber)}%'`,
            sql`regexp_replace(${
              MyPlanQuarterCoursesTable.code
            }, '\d+', '') ilike '${sql.raw(qWithoutNumber)}%'`
          ),
          like(
            sql`right(${MyPlanQuarterCoursesTable.code}, 3)`,
            !!courseCode ? `${courseCode}%` : "%%"
          )
        )
      )
      .groupBy(MyPlanQuarterCoursesTable.code)
      .orderBy(asc(MyPlanQuarterCoursesTable.code))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return courses
  }
}

export type CourseDetail = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourseDetailByCode>>
>

export type CourseSearchResultItem = NonNullable<
  Awaited<ReturnType<typeof CourseService.search>>
>[number]

export type GetCourseResponseItem = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourses>>
>[number]

export type GetCoursesByProgramResponseItem = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCoursesByProgram>>
>[number]
