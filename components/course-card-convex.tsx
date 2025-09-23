"use client"

import { Suspense } from "react"
import Link from "next/link"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { cn, getGenEdLabel } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ConvexCourseCardGrid } from "./course-card-convex.grid"
import { ConvexCourseCardSkeleton } from "./course-card-convex.skeleton"
import { Badge } from "./ui/badge"

const CourseEnrollProgress = ({
  enrollMax,
  enrollCount,
  openSessionCount,
}: {
  enrollMax: number
  enrollCount: number
  openSessionCount: number
}) => {
  const isClosed = enrollCount >= enrollMax
  const percentFull =
    enrollMax > 0 ? Math.round((enrollCount / enrollMax) * 100) : 0
  const isNearlyFull = !isClosed && percentFull >= 85
  return (
    <div className="flex flex-col gap-1.5 mt-2">
      <div className="flex justify-between">
        <span className="text-xs text-foreground/60 font-light">
          <span
            className={cn(
              "font-medium text-sm",
              isNearlyFull && "text-amber-500 dark:text-amber-300",
              !isClosed && "text-foreground"
            )}
          >
            {Math.max(0, enrollMax - enrollCount)}{" "}
          </span>
          avail of {enrollMax.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          {/* {isNearlyFull && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] leading-none">
                  {Math.max(0, enrollMax - enrollCount)} left
                </div>
              </TooltipTrigger>
              <TooltipContent>Nearly full</TooltipContent>
            </Tooltip>
          )} */}
          <span className="text-xs text-foreground/60 font-light text-right">
            {/* {percentFull}% full */}
          </span>

          {/* open session count */}
          {/* <span className="text-xs text-foreground/60 font-light text-right">
            <span className="font-medium text-foreground text-sm">
              {openSessionCount}
            </span>
            open sessions
          </span> */}
        </div>
      </div>
      <Progress
        className={cn("h-1.5 bg-foreground/5", isClosed && "bg-foreground/10")}
        indicatorClassName={cn(
          isClosed
            ? "progress-indicator-red"
            : isNearlyFull
            ? "progress-indicator-yellow"
            : "progress-indicator-green"
        )}
        value={percentFull}
      />
    </div>
  )
}

export function ConvexCourseCardLink({
  course,
  className,
}: {
  course: ConvexCourseOverview
  className?: string
}) {
  const cardContent = (
    <Card className={cn("relative group isolate overflow-visible", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/courses/${course.courseCode}`}
        className="absolute inset-0 cursor-pointer z-10"
        prefetch
      ></Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30 hidden md:block">
        <div className="flex h-full items-center justify-center">
          <div className="text-3xl font-medium text-muted-foreground/30">
            {course.courseCode}
          </div>
        </div>
      </div>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            {/* Header */}
            <div className="flex flex-col gap-0.5">
              {/* Row */}
              <div className="flex items-center mb-0.5">
                <div className="flex items-baseline flex-none">
                  <h3 className="text-base md:text-lg/tight font-medium">
                    {course.courseCode}
                  </h3>
                  <span className="text-muted-foreground text-xs md:text-sm inline-block ml-2 font-mono">
                    ({course.credit})
                  </span>
                </div>
                <div className="flex-1"></div>
              </div>

              {/* Row */}
              <h3 className="text-xs/tight md:text-sm/tight font-light text-foreground opacity-60 line-clamp-1">
                {course.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap absolute top-4 right-4">
              {!course.genEdReqs?.length && (
                <Badge size="sm" variant="blue-outline" className="invisible">
                  No gen ed requirements
                </Badge>
              )}
              {(course.genEdReqs ?? []).map((req, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Badge size="sm" variant="blue-outline" className="z-20">
                      {req}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {getGenEdLabel(req)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            <div className="md:flex items-center gap-2 flex-wrap absolute top-4 left-4 hidden">
              {(course.prereqs ?? []).map((req, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Badge
                      size="sm"
                      variant="secondary"
                      className="z-20 cursor-default"
                    >
                      <span className="font-semibold">
                        {course.prereqs?.length}
                      </span>{" "}
                      Prereqs
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {course.prereqs?.map((prereq, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {prereq}
                      </Badge>
                    ))}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {course.enroll.map((enroll) => (
              <CourseEnrollProgress
                key={enroll.termId}
                enrollMax={enroll.enrollMax}
                enrollCount={enroll.enrollCount ?? 0}
                openSessionCount={enroll.openSessionCount ?? 0}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return cardContent

  // return (
  //   <HoverCard openDelay={120} closeDelay={120}>
  //     <HoverCardTrigger asChild>{cardContent}</HoverCardTrigger>
  //     <HoverCardContent className="w-80 z-[999]" align="start" side="bottom" sideOffset={8} avoidCollisions={true}>
  //       <div className="space-y-2">
  //         <h4 className="text-sm font-semibold">Prerequisites</h4>
  //         <div className="flex flex-wrap gap-1">
  //           {course.prereqs?.map((prereq, index) => (
  //             <Badge key={index} variant="secondary" className="text-xs">
  //               {prereq}
  //             </Badge>
  //           ))}
  //         </div>
  //       </div>
  //     </HoverCardContent>
  //   </HoverCard>
  // )
}

export const ConvexCourseCardHorizontalList = ({
  courses,
}: {
  courses: ConvexCourseOverview[]
}) => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full items-stretch overflow-x-auto overflow-y-visible snap-x snap-mandatory py-2 -translate-y-2 flex-none">
      {courses.map((course) => (
        <ConvexCourseCardLink
          key={course.courseCode}
          course={course}
          className="w-60 md:w-64 lg:w-64 flex-none h-auto"
        />
      ))}
    </div>
  )
}
