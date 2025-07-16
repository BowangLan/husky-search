import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"

import { ProgramDetailPage } from "@/components/pages/program-detail-page"

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const program = await ProgramService.getProgramByCode(code)

  if (!program) {
    notFound()
  }

  const courses = await CourseService.getCoursesByProgram(code)

  return <ProgramDetailPage program={program} courses={courses} />
}
