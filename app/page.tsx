import { CourseService } from "@/services/course-service"

import { CourseCardLink } from "@/components/course-card"

export default async function IndexPage() {
  const courses = await CourseService.getRandomCourses(20)
  const totalCourseCount = await CourseService.getTotalCourseCount()

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      {/* Courses Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="w-full mb-12 flex flex-col gap-2">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
              Browse Courses at UW
            </h2>
            <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span>{totalCourseCount} courses available</span>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found. Please check back later.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch justify-stretch">
              {courses.map((course) => (
                <CourseCardLink key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
