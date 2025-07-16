// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { capitalize } from "@/lib/utils"
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
  course: MyPlanCourseCodeGroup
  size?: React.ComponentProps<typeof Badge>["size"]
}) => {
  if (!("data" in course && course.data)) {
    return null
  }

  const genEdReqs = course.data[0].data.genEduReqs

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

export const CourseLevelBadge = ({
  course,
}: {
  course: MyPlanCourseCodeGroup
}) => {
  return (
    <ViewTransition name={`course-level-${course.code}`}>
      <Badge variant="purple-outline">
        {`${course.code}`.slice(0, 1) + "00"}
      </Badge>
    </ViewTransition>
  )
}

export const CourseProgramBadgeLink = ({
  course,
  size,
}: {
  course: MyPlanCourseCodeGroup
  size?: React.ComponentProps<typeof Badge>["size"]
}) => {
  return (
    <ViewTransition name={`course-program-${course.code}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/majors/${course.subjectAreaCode}`}
            prefetch
            scroll={false}
            className="z-20 flex"
          >
            <Badge size={size} variant="purple-outline">
              {capitalize(course.subjectAreaTitle)}
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
