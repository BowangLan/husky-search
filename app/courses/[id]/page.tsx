import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"

import { CourseDetailPage } from "@/components/pages/course-detail-page"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params
  const course = await CourseService.getCourseByCode(
    decodeURIComponent(courseCode)
  )
  if (!course) {
    return notFound()
  }

  return <CourseDetailPage course={course} />
}
