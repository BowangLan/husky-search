import { CourseService } from "@/services/course-service"

import { CourseCardGridView } from "@/components/course-card"
import { PageWithHeaderLayout } from "@/components/page-wrapper"
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "@/components/section"

export default async function IndexPage() {
  // const courses = await CourseService.getRandomCourses(20)
  const courses = await CourseService.getCourses(40)
  const totalCourseCount = await CourseService.getTotalCourseCount()
  // const coursesByCredit = await CourseService.getCoursesByCredit("1", {
  //   page: 1,
  //   pageSize: 20,
  // })

  if (courses.length === 0) {
    return (
      <PageWithHeaderLayout>
        <div className="text-center py-12">
          <div className="text-muted-foreground text-lg">
            No courses found. Please check back later.
          </div>
        </div>
      </PageWithHeaderLayout>
    )
  }

  return (
    <PageWithHeaderLayout>
      <Section withPadding>
        <SectionHeader
          title="Courses by Credit"
          subtitle="Most popular courses at UW by credit"
        />
        <SectionContent>
          {/* <CourseCardGridView courses={coursesByCredit} /> */}
        </SectionContent>
      </Section>
      <Section withPadding>
        <SectionHeader
          title="Popular Courses at UW"
          subtitle="Most popular courses at UW by section count"
        />
        <SectionContent>
          <CourseCardGridView courses={courses} />
        </SectionContent>
      </Section>
    </PageWithHeaderLayout>
  )
}
