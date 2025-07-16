// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"
import { CourseDetail } from "@/services/course-service"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
          <Badge key={index} size={size} variant="blue-outline">
            {req}
          </Badge>
        ))}
      </div>
    </ViewTransition>
  )
}

export const getCourseCreditString = (
  course: CourseDetail | DatabaseCourse
) => {
  let s = course.credit
  if ("myplanData" in course && course.myplanData) {
    if (typeof course.myplanData.credit === "string") {
      s = course.myplanData.credit
    } else if (Array.isArray(course.myplanData.credit)) {
      s = course.myplanData.credit.join(",")
    }
  }
  return s
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
      <Badge size={size} variant="green-outline">
        {s} Credits
      </Badge>
    </ViewTransition>
  )
}

export const CourseLevelBadge = ({ course }: { course: CourseDetail }) => {
  return (
    <ViewTransition name={`course-level-${course.id}`}>
      <Badge variant="purple-outline">
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
      <Tooltip>
        <TooltipTrigger>
          <Link
            href={`/majors/${course.programCode}`}
            prefetch
            scroll={false}
            className="z-20"
          >
            <Badge size={size} variant="purple-outline">
              {course.programName || "No program"}
            </Badge>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{"Go to major page"}</p>
        </TooltipContent>
      </Tooltip>
    </ViewTransition>
  )
}
