// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { parseTermId } from "@/lib/course-utils"
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

  if (genEdReqs.length === 0) {
    return null
  }

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
    // <ViewTransition name={`course-program-${course.code}`}>
    <ViewTransition>
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

export const getQuarterColor = (quarter: number) => {
  if (quarter === 1) return "blue"
  if (quarter === 2) return "green"
  if (quarter === 3) return "yellow"
  if (quarter === 4) return "orange"
  return "gray"
}

export const CourseQuarterBadges = ({
  course,
}: {
  course: MyPlanCourseCodeGroup
}) => {
  const quarters = course.data.map((c) => c.quarter).map(parseTermId)

  return (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      {quarters.map((quarter) => (
        <Badge
          key={quarter.label}
          variant={`${getQuarterColor(quarter.quarter)}`}
          className="text-[11px] px-1.5 py-0.5"
        >
          {quarter.labelShort}
        </Badge>
      ))}
    </div>
  )
}
