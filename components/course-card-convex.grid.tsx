import { Suspense, use } from "react"

import { ConvexCourseOverview } from "@/types/convex-courses"

import { ConvexCourseCardLink } from "./course-card-convex"
import { ConvexCourseCardSkeleton } from "./course-card-convex.skeleton"

export const ConvexCourseCardGridInner = ({
  courses,
}: {
  courses: ConvexCourseOverview[]
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {courses.map((course) => (
        <ConvexCourseCardLink key={course.courseCode} course={course} />
      ))}
    </div>
  )
}

export const ConvexCourseCardGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <ConvexCourseCardSkeleton key={index} />
      ))}
    </div>
  )
}

export const ConvexCourseCardGrid = ({
  courses,
}: {
  courses: ConvexCourseOverview[]
}) => {
  return <ConvexCourseCardGridInner courses={courses} />
}

export const ConvexCourseCardGridWithSuspense = ({
  courses,
}: {
  courses: Promise<ConvexCourseOverview[]>
}) => {
  return (
    <Suspense fallback={<ConvexCourseCardGridSkeleton />}>
      <ConvexCourseCardGrid courses={use(courses)} />
    </Suspense>
  )
}
