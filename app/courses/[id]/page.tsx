import { notFound } from "next/navigation"
import { courses } from "@/data/courses"
import { CourseDetailPage } from "@/pages/course-detail-page"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params
  const course = courses.find((course) => course.code === courseCode)
  if (!course) {
    return notFound()
  }

  return <CourseDetailPage course={course} />
}
