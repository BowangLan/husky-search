import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"

import { ProgramDetailPage } from "@/components/pages/program-detail-page"

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
    { revalidate: 60 * 60 * 24, tags: ["program-detail"] } // 1 day
  )()

  if (!program) {
    notFound()
  }

  const courses = await unstable_cache(
    async () => {
      return await CourseService.getCoursesByProgram(code)
    },
    ["program-courses", code],
    { revalidate: 60 * 60 * 24, tags: ["program-courses"] } // 1 day
  )()

  return <ProgramDetailPage program={program} courses={courses} />
}
