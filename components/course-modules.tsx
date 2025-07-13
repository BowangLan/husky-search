import { CourseDetail } from "@/services/course-service"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"

export const CourseGenEdRequirements = ({
  course,
}: {
  course: CourseDetail | DatabaseCourse
}) => {
  if (!("myplanData" in course && course.myplanData)) {
    return null
  }

  const genEdReqs = course.myplanData?.genEduReqs || []

  return (
    <div className="flex flex-wrap gap-2">
      {genEdReqs.map((req, index) => (
        <Badge
          key={index}
          className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        >
          {req}
        </Badge>
      ))}
    </div>
  )
}

export const CourseCreditBadge = ({
  course,
}: {
  course: CourseDetail | DatabaseCourse
}) => {
  let s = (course.credit = course.credit)
  if ("myplanData" in course && course.myplanData) {
    if (typeof course.myplanData.credit === "string") {
      s = course.myplanData.credit
    } else if (Array.isArray(course.myplanData.credit)) {
      s = course.myplanData.credit.join(",")
    }
  }
  return (
    <Badge className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/20">
      {s} Credits
    </Badge>
  )
}

export const CourseLevelBadge = ({ course }: { course: CourseDetail }) => {
  return (
    <Badge
      variant="secondary"
      // className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-amber-400 border-yellow-500/20"
    >
      {`${course.number}`.slice(0, 1) + "00"}
    </Badge>
  )
}
