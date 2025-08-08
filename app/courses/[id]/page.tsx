import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"

import { CourseDetailPage } from "@/components/pages/course-detail-page"

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params

  const course = await unstable_cache(
    async () => {
      return await CourseService.getCourseDetailByCode(
        decodeURIComponent(courseCode).toUpperCase()
      )
    },
    ["course-detail", courseCode],
    { revalidate: 60 * 60 * 24, tags: ["course-detail"] } // 1 day
  )()

  if (!course) {
    return notFound()
  }

  return <CourseDetailPage course={course} />
}
