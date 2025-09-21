import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { CourseDetailPage } from "@/components/pages/course-detail-page"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params
  const course = await fetchQuery(api.courses.getByCourseCodeBrief, {
    courseCode: decodeURIComponent(courseCode).toUpperCase(),
  })

  if (!course) {
    return notFound()
  }

  return {
    title: `${course.courseCode}`,
    description: course.description,
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params

  return (
    <CourseDetailPage
      courseCode={decodeURIComponent(courseCode).toUpperCase()}
    />
  )
}
