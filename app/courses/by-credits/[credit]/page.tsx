import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"

import { ComposedCourseListView } from "@/components/composed-course-list-view"
import { CourseCardGridView } from "@/components/course-card"
import { PageWithHeaderLayout } from "@/components/page-wrapper"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ credit: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { credit } = await params
  const { subjects: subjectsParam } = await searchParams

  if (!credit) {
    return notFound()
  }

  const subjects: Set<string> = subjectsParam
    ? new Set(
        (Array.isArray(subjectsParam)
          ? subjectsParam
          : subjectsParam.split(",")
        ).map((subject) => decodeURIComponent(subject))
      )
    : new Set()

  const courses = await CourseService.getCourses(100, {
    credit,
    hasPrereq: false,
    subjects,
  })

  return (
    <PageWithHeaderLayout
      title={`${credit} Credits Courses`}
      subtitle={`Courses with ${credit} credits`}
    >
      <ComposedCourseListView data={courses} filters={{ subjects }} />
    </PageWithHeaderLayout>
  )
}
