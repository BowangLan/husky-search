import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { MyPlanCourseCodeGroupWithDetail } from "@/types/myplan"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "@/components/ui/external-link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
} from "@/components/course-modules"

export const CourseDetailHeader = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  return (
    // my should be the same as page-wrapper
    <section className="my-page-header space-y-2 md:space-y-4">
      <div className="flex items-center gap-2 pb-2">
        {/* <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {`${course.subject} ${course.number}`}
            </Badge> */}
        <CourseProgramBadgeLink course={course} />
        {/* <CourseLevelBadge course={course} /> */}
        {/* <CourseCreditBadge course={course} /> */}
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl font-medium text-foreground sm:text-4xl lg:text-5xl leading-6">
            {course.code.slice(0, -3)}
            <span className="font-semibold text-primary">
              {course.code.slice(-3, -2)}
            </span>
            {course.code.slice(-2)}
          </h1>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-muted-foreground text-base md:text-lg lg:text-xl inline-block ml-2 font-mono">
                ({course.data[0]!.data.credit})
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>This course is worth {course.data[0]!.data.credit} credits.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-normal text-foreground sm:text-xl lg:text-2xl opacity-60">
            {course.title}
          </h2>
        </div>
      </div>
      <div className="flex flex-col items-start md:flex-row md:items-center gap-2">
        <div className="flex items-center gap-2">
          {/* <CourseLevelBadge course={course} /> */}
          {/* <CourseCreditBadge course={course} /> */}
          <CourseGenEdRequirements course={course} />
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-6">
          <ExternalLink
            href={`https://myplan.uw.edu/course/#/courses/${course.code}`}
          >
            View on MyPlan
          </ExternalLink>
          <ExternalLink
            href={`https://dawgpath.uw.edu/course?id=${course.code}&campus=seattle`}
          >
            View on DawgPath
          </ExternalLink>
        </div>
      </div>
      <div className="items-center gap-2 hidden">
        {/* Program */}
        <Link
          href={`/majors/${course.subjectAreaCode}`}
          prefetch
          scroll={false}
        >
          <Badge
            size="lg"
            variant="outline"
            className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            {capitalize(course.subjectAreaTitle)}
          </Badge>
        </Link>
      </div>
    </section>
  )
}
