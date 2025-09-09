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
  MyPlanCourseCodeGroupWithDetail,
  MyPlanCourseDetail,
} from "@/types/myplan"
import { getCourseLatestEnrollCount } from "@/lib/course-utils"
import {
  CourseCECDataTable,
  CoursesTable,
  CurrentAcademicTermTable,
  MyPlanCourseDetailTable,
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

  public static myplanCourseSelect = {
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
    const courses = await db
      .select({
        id: CoursesTable.id,
        code: CoursesTable.code,
        title: CoursesTable.title,
        description: CoursesTable.description,
        subjectAreaCode: CoursesTable.subject,
        number: CoursesTable.number,
        quarter: MyPlanQuarterCoursesTable.quarter,
        myplanShortData: MyPlanQuarterCoursesTable.data,
        detail: MyPlanCourseDetailTable.data,
        enrollMax: MyPlanQuarterCoursesTable.enrollMax,
        enrollCount: MyPlanQuarterCoursesTable.enrollCount,
        genEdReqs: CoursesTable.genEdReqs,
        myplanId: MyPlanQuarterCoursesTable.myplanId,

        // TODO: Get the actual CEC data for the course
        cecData: sql<any>`
        (
          SELECT COALESCE(
            json_agg(
              ${CourseCECDataTable}.*
            ), '[]'
          )
          FROM ${CourseCECDataTable}
          WHERE ${CourseCECDataTable.courseCode} ilike '%${sql.raw(code)}%'
        )
        `,
      })
      .from(CoursesTable)
      .innerJoin(
        MyPlanQuarterCoursesTable,
        and(
          eq(
            sql`CONCAT(${MyPlanQuarterCoursesTable.subjectAreaCode}, ${MyPlanQuarterCoursesTable.number})`,
            CoursesTable.myplanCode
          )
        )
      )
      .innerJoin(
        CurrentAcademicTermTable,
        eq(CurrentAcademicTermTable.name, MyPlanQuarterCoursesTable.quarter)
      )
      .leftJoin(
        MyPlanCourseDetailTable,
        and(
          eq(
            MyPlanCourseDetailTable.subject,
            MyPlanQuarterCoursesTable.subjectAreaCode
          ),
          eq(MyPlanCourseDetailTable.number, MyPlanQuarterCoursesTable.number)
        )
      )
      .where(
        and(
          eq(CoursesTable.code, code)
          // eq(CurrentAcademicTermTable.name, MyPlanQuarterCoursesTable.quarter)
        )
      )

    const g = courses.reduce((acc, course) => {
      if (!acc[course.code]) {
        acc[course.code] = {
          code: course.code,
          title: course.title,
          subjectAreaCode: course.subjectAreaCode,
          subjectAreaTitle:
            course.detail?.courseSummaryDetails?.curriculumTitle ?? "",
          number: course.number,
          description: course.description,
          enrollData: {
            enrollMax: course.enrollMax,
            enrollCount: course.enrollCount,
          },
          detail: course.detail ?? undefined,
          data: [],
          cecData: course.cecData ?? undefined,
        }

        acc[course.code].data.push({
          data: course.myplanShortData,
          quarter: course.quarter,
          subjectAreaCode: course.subjectAreaCode,
          myplanId: course.myplanId,
        })
      }
      return acc
    }, {} as Record<string, MyPlanCourseCodeGroupWithDetail>)

    if (Object.keys(g).length === 0) {
      return null
    }

    return Object.values(g)[0]
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

  static async getCourses({
    programCode,
    limit,
    sortBy = "popular",
    withEnrollData = true,
  }: {
    programCode?: string
    limit: number
    sortBy?: "popular" | "course-code"
    withEnrollData?: boolean
  }) {
    const whereClauses: any[] = []

    if (programCode) {
      whereClauses.push(eq(CoursesTable.subject, programCode))
    }

    let sortByClause: any
    if (sortBy === "popular") {
      sortByClause = desc(MyPlanQuarterCoursesTable.enrollCount)
    } else if (sortBy === "course-code") {
      sortByClause = asc(CoursesTable.code)
    } else {
      sortByClause = asc(CoursesTable.code)
    }

    const courses1 = await db
      .select({
        id: CoursesTable.id,
        code: CoursesTable.code,
        title: CoursesTable.title,
        description: CoursesTable.description,
        subjectAreaCode: CoursesTable.subject,
        number: CoursesTable.number,
        quarter: MyPlanQuarterCoursesTable.quarter,
        myplanShortData: MyPlanQuarterCoursesTable.data,
        detail: MyPlanCourseDetailTable.data,
        enrollMax: MyPlanQuarterCoursesTable.enrollMax,
        enrollCount: MyPlanQuarterCoursesTable.enrollCount,
        genEdReqs: CoursesTable.genEdReqs,
        myplanId: MyPlanQuarterCoursesTable.myplanId,
      })
      .from(CoursesTable)
      .innerJoin(
        MyPlanQuarterCoursesTable,
        and(
          eq(
            sql`CONCAT(${MyPlanQuarterCoursesTable.subjectAreaCode}, ${MyPlanQuarterCoursesTable.number})`,
            CoursesTable.myplanCode
          )
        )
      )
      .innerJoin(
        CurrentAcademicTermTable,
        eq(CurrentAcademicTermTable.name, MyPlanQuarterCoursesTable.quarter)
      )
      .leftJoin(
        MyPlanCourseDetailTable,
        and(
          eq(
            MyPlanCourseDetailTable.subject,
            MyPlanQuarterCoursesTable.subjectAreaCode
          ),
          eq(MyPlanCourseDetailTable.number, MyPlanQuarterCoursesTable.number)
        )
      )
      .where(and(...whereClauses))
      .orderBy(sortByClause)
      .limit(limit)

    const courses = courses1.reduce((acc, course) => {
      if (!acc[course.code]) {
        acc[course.code] = {
          code: course.code,
          title: course.title,
          subjectAreaCode: course.subjectAreaCode,
          subjectAreaTitle:
            course.detail?.courseSummaryDetails?.curriculumTitle ?? "",
          number: course.number,
          description: course.description,
          enrollData: withEnrollData
            ? {
              enrollMax: course.enrollMax,
              enrollCount: course.enrollCount,
            }
            : {
              enrollMax: course.enrollMax,
            },
          // genEdReqs: course.genEdReqs,
          data: [],
        }

        acc[course.code].data.push({
          data: course.myplanShortData,
          quarter: course.quarter,
          subjectAreaCode: course.subjectAreaCode,
          myplanId: course.myplanId,
        })
      }
      return acc
    }, {} as Record<string, MyPlanCourseCodeGroup>)

    return Object.values(courses).toSorted(
      (a, b) => (b.enrollData?.enrollMax ?? 0) - (a.enrollData?.enrollMax ?? 0)
    )
  }

  static async getCoursesLeg(
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
  ): Promise<MyPlanCourseCodeGroup[]> {
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

    let sortByClauses = [sql`${MyPlanQuarterCoursesTable.enrollMax} DESC`]
    if (sortBy === "code") {
      sortByClauses = [asc(MyPlanQuarterCoursesTable.code)]
    }

    const courses = await query
      .where(and(...whereClauses))
      .groupBy(
        MyPlanQuarterCoursesTable.code,
        MyPlanQuarterCoursesTable.subjectAreaCode,
        MyPlanSubjectAreasTable.title,
        MyPlanQuarterCoursesTable.enrollMax
      )
      .orderBy(...sortByClauses)
      .limit(count)
      .offset((page - 1) * count)

    return courses

    const courses1 = courses.reduce((acc: any, course: any) => {
      if (!acc[course.code]) {
        acc[course.code] = {
          code: course.code,
          title: course.title,
          subjectAreaCode: course.subjectAreaCode,
          subjectAreaTitle:
            course.detail?.courseSummaryDetails?.curriculumTitle ?? "",
          number: course.number,
          description: course.description,
          // enrollData: SHOW_ENROLL_DATA_FOR_POPULAR_COURSES
          //   ? {
          //       enrollMax: course.enrollMax,
          //       enrollCount: course.enrollCount,
          //     }
          //   : undefined,
          // genEdReqs: course.genEdReqs,
          data: [],
        }

        acc[course.code].data.push({
          data: course.myplanShortData,
          quarter: course.quarter,
          subjectAreaCode: course.subjectAreaCode,
          myplanId: course.myplanId,
        })
      }
      return acc
    }, {} as Record<string, MyPlanCourseCodeGroup>)
    return Object.values(courses1)
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

    // console.log(`Query: '${keywords}'`)
    // console.log(`Q without number: '${qWithoutNumber}%'`)
    // console.log(`Course code: '${courseCode}%'`)

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
            sql`regexp_replace(${MyPlanQuarterCoursesTable.code
              }, '[\s\d]+', '') ilike '${sql.raw(qWithoutNumber)}%'`,
            sql`regexp_replace(${MyPlanQuarterCoursesTable.code
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

export type CourseSearchResultItem = NonNullable<
  Awaited<ReturnType<typeof CourseService.search>>
>[number]

export type GetCourseResponseItem = NonNullable<
  Awaited<ReturnType<typeof CourseService.getCourses>>
>[number]
