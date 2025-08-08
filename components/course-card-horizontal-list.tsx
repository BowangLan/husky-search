import { MyPlanCourseCodeGroup } from "@/types/myplan"

import { CourseCardLink } from "./course-card"

export const CourseCardHorizontalList = ({
  courses,
}: {
  courses: MyPlanCourseCodeGroup[]
}) => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full overflow-x-auto snap-x snap-mandatory py-4 -translate-y-4">
      {courses.map((course) => (
        <CourseCardLink
          key={course.code}
          course={course}
          className="w-72 flex-none"
        />
      ))}
    </div>
  )
}
