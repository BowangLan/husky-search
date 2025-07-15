// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"
import { CourseDetail } from "@/services/course-service"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"

export const CourseGenEdRequirements = ({
  course,
  size,
}: {
  course: CourseDetail | DatabaseCourse
  size?: React.ComponentProps<typeof Badge>["size"]
}) => {
  if (!("myplanData" in course && course.myplanData)) {
    return null
  }

  const genEdReqs = course.myplanData.genEduReqs

  return (
    // <ViewTransition name={`course-gen-ed-requirements-${course.id}`}>
    <ViewTransition>
      <div className="flex flex-wrap gap-2">
        {genEdReqs.map((req, index) => (
          <Badge
            key={index}
            size={size}
            className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
          >
            {req}
          </Badge>
        ))}
      </div>
    </ViewTransition>
  )
}

export const CourseCreditBadge = ({
  course,
  size,
}: {
  course: CourseDetail | DatabaseCourse
  size?: React.ComponentProps<typeof Badge>["size"]
}) => {
  let s = course.credit
  if ("myplanData" in course && course.myplanData) {
    if (typeof course.myplanData.credit === "string") {
      s = course.myplanData.credit
    } else if (Array.isArray(course.myplanData.credit)) {
      s = course.myplanData.credit.join(",")
    }
  }
  return (
    <ViewTransition name={`course-credit-${course.id}`}>
      <Badge
        size={size}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/20"
      >
        {s} Credits
      </Badge>
    </ViewTransition>
  )
}

export const CourseLevelBadge = ({ course }: { course: CourseDetail }) => {
  return (
    <ViewTransition name={`course-level-${course.id}`}>
      <Badge
        variant="secondary"
        // className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-600 dark:text-amber-400 border-yellow-500/20"
      >
        {`${course.number}`.slice(0, 1) + "00"}
      </Badge>
    </ViewTransition>
  )
}

export const CourseProgramBadgeLink = ({
  course,
  size,
}: {
  course: CourseDetail | DatabaseCourse
  size?: React.ComponentProps<typeof Badge>["size"]
}) => {
  return (
    <ViewTransition name={`course-program-${course.id}`}>
      <Link
        href={`/majors/${course.programCode}`}
        prefetch
        scroll={false}
        className="z-20"
      >
        <Badge
          variant="outline"
          size={size}
          className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
        >
          {course.programName || "No program"}
        </Badge>
      </Link>
    </ViewTransition>
  )
}
