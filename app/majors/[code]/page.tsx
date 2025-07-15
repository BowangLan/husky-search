// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedList } from "@/components/animated-list"
import { CourseCardGrid, CourseCardLink } from "@/components/course-card"
import { ProgramDetailPage } from "@/components/pages/program-detail-page"

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const programs = await ProgramService.getProgramByCode(code)

  if (!programs || programs.length === 0) {
    notFound()
  }

  const program = programs[0]
  const courses = await CourseService.getCoursesByProgram(code)

  return <ProgramDetailPage program={program} courses={courses} />
}
