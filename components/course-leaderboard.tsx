"use client"

import Link from "next/link"
import { MyplanCourse } from "@/convex/schema"
import { Award, Medal, Trophy } from "lucide-react"

import { cn, getGenEdLabel } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Badge } from "./ui/badge"
import { ScoreHelpTooltip } from "./score-help-tooltip"

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <Trophy className="size-4 text-yellow-500" aria-label="1st place" />
      )
    case 2:
      return <Medal className="size-4 text-gray-400" aria-label="2nd place" />
    case 3:
      return <Award className="size-4 text-amber-600" aria-label="3rd place" />
    default:
      return (
        <div
          className="size-4 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground"
          aria-label={`${rank}th place`}
        >
          {rank}
        </div>
      )
  }
}

const getEasinessLabel = (
  easinessScore: number,
  isEasiest: boolean = false
) => {
  if (isEasiest) {
    if (easinessScore >= 80)
      return { label: "Very Easy", color: "bg-green-500" }
    if (easinessScore >= 60) return { label: "Easy", color: "bg-green-400" }
    if (easinessScore >= 40)
      return { label: "Moderate", color: "bg-yellow-400" }
    return { label: "Challenging", color: "bg-orange-400" }
  } else {
    if (easinessScore <= 20)
      return { label: "Extremely Difficult", color: "bg-red-600" }
    if (easinessScore <= 40)
      return { label: "Very Difficult", color: "bg-red-500" }
    if (easinessScore <= 60)
      return { label: "Difficult", color: "bg-orange-400" }
    return { label: "Moderate", color: "bg-yellow-400" }
  }
}

interface CourseWithEasiness extends MyplanCourse {
  easinessScore?: number | null
}

interface CourseLeaderboardProps {
  courses: CourseWithEasiness[]
  type: "easiest" | "toughest"
  showRanking?: boolean
}

export function CourseLeaderboard({
  courses,
  type,
  showRanking = true,
}: CourseLeaderboardProps) {
  const isEasiest = type === "easiest"

  return (
    <div
      className="rounded-md border overflow-hidden"
      role="table"
      aria-label={`${isEasiest ? "Easiest" : "Toughest"} courses leaderboard`}
    >
      {/* Header */}
      <div
        className={cn(
          "hidden md:grid items-center bg-muted/30 text-xs uppercase text-muted-foreground px-4 py-2 gap-4"
        )}
        style={{
          gridTemplateColumns: showRanking
            ? "2rem 1fr auto 12rem 6rem"
            : "1fr auto 12rem 6rem",
        }}
        role="row"
      >
        {showRanking && (
          <div className="flex items-center justify-center" role="columnheader">
            #
          </div>
        )}
        <div className="truncate" role="columnheader">
          Course
        </div>
        <div className="truncate" role="columnheader">
          Gen Eds
        </div>
        <div className="text-right truncate" role="columnheader">
          Easiness
        </div>
        <div
          className="text-right truncate flex items-center justify-end gap-1"
          role="columnheader"
        >
          Score
          <ScoreHelpTooltip />
        </div>
      </div>

      {/* Rows */}
      {courses.map((course, index) => {
        const rank = index + 1
        const easinessScore = course.easinessScore ?? 0
        const easinessLabel = getEasinessLabel(easinessScore, isEasiest)

        return (
          <div
            key={course.courseCode}
            className={cn(
              "relative group px-4 py-3 border-t transition-all duration-150 cursor-pointer hover:bg-muted/60 hover:shadow-sm hover:ring-1 hover:ring-border focus-within:ring-2 focus-within:ring-ring",
              "md:grid md:items-center md:gap-4"
            )}
            style={{
              gridTemplateColumns: showRanking
                ? "2rem 1fr auto 12rem 6rem"
                : "1fr auto 12rem 6rem",
            }}
            role="row"
          >
            <Link
              href={`/courses/${course.courseCode}`}
              className="absolute inset-0 cursor-pointer z-10"
              prefetch
              aria-label={`View details for ${course.courseCode} - ${course.title}`}
            />

            {/* Mobile Layout */}
            <div className="md:hidden space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {showRanking && (
                    <div className="flex items-center justify-center mt-1">
                      {getRankIcon(rank)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {course.courseCode}
                      </h3>
                      <span
                        className="text-sm text-muted-foreground font-mono"
                        aria-label={`${course.credit} credit hours`}
                      >
                        ({course.credit})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {course.title}
                    </p>
                  </div>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <div
                    className="text-xl font-bold text-foreground"
                    aria-label={`Easiness score: ${easinessScore}`}
                  >
                    {easinessScore}
                  </div>
                  <div
                    className="text-xs text-muted-foreground"
                    aria-hidden="true"
                  >
                    score
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn("h-2 w-2 rounded-full", easinessLabel.color)}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-muted-foreground">
                    {easinessLabel.label}
                  </span>
                </div>

                {course.genEdReqs && course.genEdReqs.length > 0 && (
                  <div
                    className="flex flex-wrap gap-1"
                    role="list"
                    aria-label="General education requirements"
                  >
                    {course.genEdReqs.slice(0, 2).map((req, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Badge
                            size="sm"
                            variant="blue-outline"
                            className="z-20 text-xs"
                            role="listitem"
                          >
                            {req}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {getGenEdLabel(req)}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {course.genEdReqs.length > 2 && (
                      <Badge
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        role="listitem"
                        aria-label={`${
                          course.genEdReqs.length - 2
                        } additional requirements`}
                      >
                        +{course.genEdReqs.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Layout */}
            {showRanking && (
              <div
                className="hidden md:flex items-center justify-center"
                role="cell"
              >
                {getRankIcon(rank)}
              </div>
            )}

            <div className="hidden md:block min-w-0" role="cell">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                  {course.courseCode}
                </h3>
                <span
                  className="text-sm text-muted-foreground font-mono"
                  aria-label={`${course.credit} credit hours`}
                >
                  ({course.credit})
                </span>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1">
                {course.title}
              </p>
            </div>

            <div
              className="hidden md:flex flex-row items-center gap-2"
              role="cell"
            >
              {course.genEdReqs && course.genEdReqs.length > 0 && (
                <div
                  className="mt-1 flex flex-wrap gap-1"
                  role="list"
                  aria-label="General education requirements"
                >
                  {course.genEdReqs.slice(0, 3).map((req, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Badge
                          size="sm"
                          variant="blue-outline"
                          className="z-20"
                          role="listitem"
                        >
                          {req}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {getGenEdLabel(req)}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                  {course.genEdReqs.length > 3 && (
                    <Badge
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      role="listitem"
                      aria-label={`${
                        course.genEdReqs.length - 3
                      } additional requirements`}
                    >
                      +{course.genEdReqs.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div
              className="hidden md:block justify-self-end text-right"
              role="cell"
            >
              <div className="flex items-center gap-2 justify-end">
                <div
                  className={cn("h-2 w-2 rounded-full", easinessLabel.color)}
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground">
                  {easinessLabel.label}
                </span>
              </div>
            </div>

            <div
              className="hidden md:block justify-self-end text-right"
              role="cell"
            >
              <div
                className="text-xl font-bold text-foreground"
                aria-label={`Easiness score: ${easinessScore}`}
              >
                {easinessScore}
              </div>
              <div className="text-xs text-muted-foreground" aria-hidden="true">
                Easiness score
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
