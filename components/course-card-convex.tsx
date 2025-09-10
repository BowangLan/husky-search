"use client"

import Link from "next/link"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { cn, getGenEdLabel } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex justify-between">
        <span className="text-xs text-foreground/60 font-light">
          <span
            className={cn(
              "font-medium text-foreground text-sm",
              isNearlyFull && "text-amber-500 dark:text-amber-300"
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
  return (
    <Card className={cn("relative group isolate", className)}>
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
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="flex items-baseline flex-none">
                <h3 className="text-base md:text-lg font-medium">
                  {course.courseCode}
                </h3>
                <span className="text-muted-foreground text-xs md:text-sm inline-block ml-2 font-mono">
                  ({course.credit})
                </span>
              </div>
              <div className="flex-1"></div>
            </div>
            <h3 className="text-xs md:text-sm font-normal text-foreground opacity-60 line-clamp-1">
              {course.title}
            </h3>

            <div className="flex items-center gap-2 flex-wrap mt-2">
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
}

export const ConvexCourseCardHorizontalList = ({
  courses,
}: {
  courses: ConvexCourseOverview[]
}) => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full items-stretch overflow-x-auto snap-x snap-mandatory py-4 -translate-y-4">
      {courses.map((course) => (
        <ConvexCourseCardLink
          key={course.courseCode}
          course={course}
          className="w-72 flex-none h-auto"
        />
      ))}
    </div>
  )
}
