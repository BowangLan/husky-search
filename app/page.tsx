import { CourseService } from "@/services/course-service"

import { CourseCardLink } from "@/components/course-card"
import { PageWithHeaderLayout } from "@/components/page-wrapper"

export default async function IndexPage() {
  // const courses = await CourseService.getRandomCourses(20)
  const courses = await CourseService.getPopularCourses(20)
  const totalCourseCount = await CourseService.getTotalCourseCount()

  return (
    <PageWithHeaderLayout
      title="Popular Courses at UW"
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{totalCourseCount} courses available</span>
        </div>
      }
    >
      <section className="px-page mx-page">
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">
              No courses found. Please check back later.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch justify-stretch">
            {courses.map((course) => (
              <CourseCardLink key={course.code} course={course} />
            ))}
          </div>
        )}
      </section>
    </PageWithHeaderLayout>
  )
}
