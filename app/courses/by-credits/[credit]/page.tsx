import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"

import { CourseCardGridView } from "@/components/course-card"
import { PageWithHeaderLayout } from "@/components/page-wrapper"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export default async function Page({
  params,
}: {
  params: Promise<{ credit: string }>
}) {
  const { credit } = await params

  if (!credit) {
    return notFound()
  }

  const courses = await CourseService.getCourses(100, {
    credit,
    hasPrereq: false,
  })

  return (
    <PageWithHeaderLayout
      title={`${credit} Credits Courses`}
      subtitle={`Courses with ${credit} credits`}
    >
      <Section withPadding>
        <SectionContent>
          <CourseCardGridView courses={courses} />
        </SectionContent>
      </Section>
    </PageWithHeaderLayout>
  )
}
