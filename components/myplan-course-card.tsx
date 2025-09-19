"use client"

import Link from "next/link"

import { MyplanCourse } from "@/convex/schema"
import { cn, getGenEdLabel } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Badge } from "./ui/badge"

const EnrollmentStatsDisplay = ({
  statsEnrollPercent,
  statsEnrollMax,
}: {
  statsEnrollPercent: number
  statsEnrollMax: number
}) => {
  const percentDisplay = Math.round(statsEnrollPercent * 100)
  const isHighDemand = statsEnrollPercent > 0.8
  const isMediumDemand = statsEnrollPercent > 0.5

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-foreground/60 font-light">
          Max enrollment: {statsEnrollMax.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <Badge
            size="sm"
            variant={isHighDemand ? "destructive" : isMediumDemand ? "outline" : "secondary"}
            className="text-xs"
          >
            {percentDisplay}% filled
          </Badge>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {isHighDemand ? "Very competitive" : isMediumDemand ? "Moderately competitive" : "Less competitive"}
      </div>
    </div>
  )
}

export function MyplanCourseCardLink({
  course,
  className,
  showEnrollmentStats = false,
}: {
  course: MyplanCourse
  className?: string
  showEnrollmentStats?: boolean
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

            {showEnrollmentStats && course.statsEnrollMax > 0 && (
              <EnrollmentStatsDisplay
                statsEnrollPercent={course.statsEnrollPercent}
                statsEnrollMax={course.statsEnrollMax}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const MyplanCourseCardHorizontalList = ({
  courses,
  showEnrollmentStats = false,
}: {
  courses: MyplanCourse[]
  showEnrollmentStats?: boolean
}) => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full items-stretch overflow-x-auto snap-x snap-mandatory py-2 -translate-y-2 flex-none">
      {courses.map((course) => (
        <MyplanCourseCardLink
          key={course.courseCode}
          course={course}
          className="w-60 md:w-64 lg:w-64 flex-none h-auto"
          showEnrollmentStats={showEnrollmentStats}
        />
      ))}
    </div>
  )
}