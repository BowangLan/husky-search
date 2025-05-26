import { courses } from "@/data/courses"

import { CourseCard } from "@/components/course-card"

export default function IndexPage() {
  return (
    <section className="container px-4 py-6 md:px-6 md:py-8 mx-auto">
      <div className="flex max-w-[980px] flex-col items-start gap-3 mb-8">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
          Explore UW Courses
        </h1>
        <p className="max-w-[700px] text-lg text-muted-foreground">
          Browse through our comprehensive collection of courses from various
          departments. Find detailed information about credits, prerequisites,
          and course content.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map((course) => (
          <CourseCard key={course.id} {...course} />
        ))}
      </div>
    </section>
  )
}
