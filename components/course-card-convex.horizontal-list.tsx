import { ConvexCourseOverview } from "@/types/convex-courses"

import { ConvexCourseCardLinkV2 } from "./course-card-convex.v2"

export const ConvexCourseCardHorizontalList = ({
  courses,
}: {
  courses: ConvexCourseOverview[]
}) => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full items-stretch overflow-x-auto overflow-y-visible snap-x snap-mandatory py-2 -translate-y-2 flex-none">
      {courses.map((course) => (
        <ConvexCourseCardLinkV2
          key={course.courseCode}
          course={course}
          className="w-60 md:w-72 flex-none h-auto"
        />
      ))}
    </div>
  )
}
