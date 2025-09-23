import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

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

  const coursesData = await fetchQuery(api.courses.listOverviewByCredit, {
    credit,
    limit: 100,
  })

  // Transform to match the expected format
  const courses = coursesData.data.map(course => ({
    code: course.courseCode,
    title: course.title,
    description: course.description,
    subjectAreaCode: course.subjectArea,
    subjectAreaTitle: "", // Will be filled by subject lookup
    number: course.courseNumber,
    enrollData: {
      enrollMax: course.enroll[0]?.enrollMax ?? 0,
      enrollCount: course.enroll[0]?.enrollCount ?? 0,
    },
    data: course.enroll.map(e => ({
      data: {} as any, // Simplified for now
      quarter: e.termId,
      subjectAreaCode: course.subjectArea,
      myplanId: e.termId,
    })),
  }))

  return (
    <PageWithHeaderLayout
      title={`${credit} Credits Courses`}
      subtitle={`Courses with ${credit} credits`}
    >
      <ComposedCourseListView data={courses} filters={{ subjects }} />
    </PageWithHeaderLayout>
  )
}
