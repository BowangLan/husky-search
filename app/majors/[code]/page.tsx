import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"
import { and, desc, eq, sql } from "drizzle-orm"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { getCourseLatestEnrollCount } from "@/lib/course-utils"
import {
  CoursesTable,
  CurrentAcademicTermTable,
  MyPlanCourseDetailTable,
  MyPlanQuarterCoursesTable,
  MyPlanSubjectAreasTable,
  db,
} from "@/lib/db/schema"
import { ProgramDetailPage } from "@/components/pages/program-detail-page"

const POPULAR_COURSES_LIMIT = 15

const SHOW_ENROLL_DATA_FOR_POPULAR_COURSES = false
const SHOW_ENROLL_DATA_FOR_ALL_COURSES = false

async function getCoursesByProgram(programCode: string) {
  const courses = await db
    .select({
      ...CourseService.myplanCourseSelect,
      description: CoursesTable.description,
      detail: MyPlanCourseDetailTable.data,
    })
    .from(MyPlanQuarterCoursesTable)
    .leftJoin(
      CoursesTable,
      and(
        eq(MyPlanQuarterCoursesTable.subjectAreaCode, CoursesTable.subject),
        eq(CoursesTable.number, MyPlanQuarterCoursesTable.number)
      )
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
    .innerJoin(
      MyPlanSubjectAreasTable,
      eq(
        MyPlanQuarterCoursesTable.subjectAreaCode,
        MyPlanSubjectAreasTable.code
      )
    )
    .where(eq(MyPlanQuarterCoursesTable.subjectAreaCode, programCode))
    .orderBy(
      MyPlanQuarterCoursesTable.code,
      desc(MyPlanQuarterCoursesTable.quarter)
    )

  // group courses by quarter
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.code]) {
      const enrollInfo = course.detail
        ? getCourseLatestEnrollCount(course.detail)
        : {
            enrollMax: 0,
            enrollCount: 0,
          }

      acc[course.code] = {
        code: course.code,
        title: course.data.title,
        subjectAreaCode: course.subjectAreaCode,
        subjectAreaTitle: course.subjectAreaTitle,
        description: course.description ?? "",
        number: course.number,
        enrollData: SHOW_ENROLL_DATA_FOR_ALL_COURSES ? enrollInfo : undefined,
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

async function getPopularCoursesByProgram(programCode: string, limit: number) {
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
    .where(and(eq(CoursesTable.subject, programCode)))
    .orderBy(desc(MyPlanQuarterCoursesTable.enrollCount))
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
        enrollData: SHOW_ENROLL_DATA_FOR_POPULAR_COURSES
          ? {
              enrollMax: course.enrollMax,
              enrollCount: course.enrollCount,
            }
          : undefined,
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

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: codeParam } = await params
  const code = decodeURIComponent(codeParam)

  const program = await unstable_cache(
    async () => {
      return await ProgramService.getProgramByCode(code)
    },
    ["program-detail", code],
    // { revalidate: 60 * 60 * 24, tags: ["program-detail"] } // 1 day
    { revalidate: 1, tags: ["program-detail"] } // 1 day
  )()

  if (!program) {
    notFound()
  }

  const courses = await unstable_cache(
    async () => {
      return await getCoursesByProgram(code)
    },
    ["program-courses", code],
    // { revalidate: 60 * 60 * 24, tags: ["program-courses"] } // 1 day
    { revalidate: 1, tags: ["program-courses"] } // 1 day
  )()

  // const courses = await getCoursesByProgram(code)

  const popularCourses = await unstable_cache(
    async () => {
      return await getPopularCoursesByProgram(code, POPULAR_COURSES_LIMIT)
    },
    ["program-top10-courses", code],
    // { revalidate: 60 * 60 * 24, tags: ["program-top10-courses"] } // 1 day
    { revalidate: 1, tags: ["program-top10-courses"] } // 1 day
  )()

  // const popularCourses = await getPopularCoursesByProgram(
  //   code,
  //   POPULAR_COURSES_LIMIT
  // )

  return (
    <ProgramDetailPage
      program={program}
      courses={courses}
      // top10Courses={courses.slice(0, 10)}
      popularCourses={popularCourses}
    />
  )
}
