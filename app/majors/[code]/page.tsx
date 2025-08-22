import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"
import { and, asc, desc, eq, sql } from "drizzle-orm"

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
const ALL_COURSES_LIMIT = 200

const SHOW_ENROLL_DATA_FOR_POPULAR_COURSES = false
const SHOW_ENROLL_DATA_FOR_ALL_COURSES = false

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: codeParam } = await params
  const code = decodeURIComponent(codeParam).toUpperCase()

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
      return await CourseService.getCourses({
        limit: ALL_COURSES_LIMIT,
        sortBy: "popular",
        withEnrollData: SHOW_ENROLL_DATA_FOR_ALL_COURSES,
        programCode: code,
      })
    },
    ["program-courses", code],
    // { revalidate: 60 * 60 * 24, tags: ["program-courses"] } // 1 day
    { revalidate: 1, tags: ["program-courses", code] } // 1 day
  )()

  // get top 10 courses sort by enroll max
  const popularCourses = courses.slice(0, 10)

  return (
    <ProgramDetailPage
      program={program}
      courses={courses}
      // top10Courses={courses.slice(0, 10)}
      popularCourses={popularCourses}
    />
  )
}
