"use client"

import Link from "next/link"
import { Link2 } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { cn, getGenEdLabel } from "@/lib/utils"
import { useCoursePopover } from "@/hooks/use-course-popover"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CoursePopoverContent } from "@/components/course-popover-content"
import { Icons } from "@/components/icons"

function pickPrimaryEnroll(course: ConvexCourseOverview) {
  const enroll = course.enroll ?? []
  if (enroll.length === 0) return null

  // Pick the row with the largest max seats; it best matches the single-row UI.
  return enroll.reduce((best, cur) =>
    cur.enrollMax > best.enrollMax ? cur : best
  )
}

function getSeatStatus({
  avail,
  isClosed,
  isNearlyFull,
}: {
  avail: number
  isClosed: boolean
  isNearlyFull: boolean
}) {
  if (isClosed || avail <= 0)
    return { label: "Closed", dotClass: "bg-rose-500" }
  if (isNearlyFull) return { label: "Nearly full", dotClass: "bg-amber-500" }
  return { label: "Seats available", dotClass: "bg-emerald-500" }
}

function getSessionStatus({ open, total }: { open: number; total: number }): {
  label: string
  dotClass: string
} {
  if (total <= 0) return { label: "No sessions found", dotClass: "bg-zinc-400" }
  if (open <= 0) return { label: "No open sessions", dotClass: "bg-rose-500" }
  if (open < total)
    return {
      label: `${open} of ${total} sessions open`,
      dotClass: "bg-amber-500",
    }
  return { label: "All sessions open", dotClass: "bg-emerald-500" }
}

const NEARLY_FULL_FIXED_THRESHOLD = 10
const NEARLY_FULL_PERCENT_THRESHOLD = 0.9
const NOT_NEARLY_FULL_FIXED_THRESHOLD = 25

function getIsNearlyFull({
  avail,
  percentFull,
}: {
  avail: number
  percentFull: number
}) {
  if (avail >= NOT_NEARLY_FULL_FIXED_THRESHOLD) return false
  return (
    avail < NEARLY_FULL_FIXED_THRESHOLD ||
    percentFull > NEARLY_FULL_PERCENT_THRESHOLD
  )
}

export function ConvexCourseListItem({
  course,
  className,
}: {
  course: ConvexCourseOverview
  className?: string
}) {
  const primaryEnroll = pickPrimaryEnroll(course)

  const enrollMax = primaryEnroll?.enrollMax ?? 0
  const enrollCount = primaryEnroll?.enrollCount ?? 0
  const avail = Math.max(0, enrollMax - enrollCount)

  const openSessionCount = (course.enroll ?? []).reduce(
    (sum, e) => sum + (e.openSessionCount ?? 0),
    0
  )
  const totalSessionCount = (course.enroll ?? []).reduce(
    (sum, e) => sum + (e.totalSessionCount ?? 0),
    0
  )
  const sessionStatus = getSessionStatus({
    open: openSessionCount,
    total: totalSessionCount,
  })

  const percentFull =
    enrollMax > 0 ? Math.round((enrollCount / enrollMax) * 100) : 0
  const isClosed = enrollMax > 0 && enrollCount >= enrollMax
  const isNearlyFull = !isClosed && getIsNearlyFull({ avail, percentFull })
  const seatStatus = getSeatStatus({ avail, isClosed, isNearlyFull })

  const prereqCount = course.prereqs?.length ?? 0
  const hasPrereqs = prereqCount > 0

  const {
    popoverOpen,
    setPopoverOpen,
    isCourseScheduled,
    toggleCourseInSchedule,
    primaryEnroll: popoverPrimaryEnroll,
    hasPrereqs: popoverHasPrereqs,
    sessions: popoverSessions,
  } = useCoursePopover(course)

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <article
        className={cn(
          "group flex items-center gap-4 px-4 py-3 border-b border-zinc-200 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/40",
          className
        )}
      >
        {/* Course Code & Credits */}
        <div className="flex flex-col gap-0.5 w-24 flex-none">
          <Link href={`/courses/${course.courseCode}`} prefetch>
            <span className="text-sm/tight font-medium text-zinc-900 dark:text-zinc-200 hover:underline cursor-pointer">
              {course.courseCode}
            </span>
          </Link>
          <span className="text-xs/tight font-normal text-zinc-600 dark:text-zinc-500">
            {course.credit} credits
          </span>
        </div>

        {/* Title & Gen Ed Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Icons.info className="h-3 w-3" />
              </Button>
            </PopoverTrigger>

            <Link href={`/courses/${course.courseCode}`} prefetch>
              <h4 className="text-sm font-normal text-zinc-700 line-clamp-1 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline cursor-pointer">
                {course.title}
              </h4>
            </Link>

            {/* Gen Ed Badges */}
            <div className="flex gap-1.5 flex-wrap flex-none ml-1">
              {(course.genEdReqs ?? []).slice(0, 3).map((req) => (
                <Tooltip key={req}>
                  <TooltipTrigger asChild>
                    <Link href={`/gen-eds/${req}`} prefetch>
                      <span className="rounded border border-zinc-200 bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-200 hover:border-zinc-300 dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:border-zinc-600 cursor-pointer">
                        {req}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {getGenEdLabel(req)}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {hasPrereqs && (
            <div className="flex items-center gap-1 ml-7">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <Link2 className="h-3 w-3 text-primary dark:text-primary" />
                    <span className="text-[11px] font-medium text-indigo-700/90 dark:text-primary/80">
                      {prereqCount} Prereq{prereqCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {course.prereqs?.map((prereq) => prereq).join(", ")}
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Prerequisites & Info */}
        {/* <div className="flex flex-col gap-1 w-32 flex-none">
          <div className="flex items-center gap-2">
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Icons.info className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
          </div>
        </div> */}

        {/* Enrollment Status */}
        <div className="flex items-center gap-3 flex-none">
          {primaryEnroll && enrollMax > 0 ? (
            <>
              {/* Seat status */}
              <div className="flex flex-col gap-0.5 min-w-[120px]">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          seatStatus.dotClass
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-500">
                        <span className="font-medium text-zinc-700 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300">
                          {avail.toLocaleString()}
                        </span>{" "}
                        / {enrollMax.toLocaleString()}
                        {" seats"}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">{`${avail.toLocaleString()} of ${enrollMax.toLocaleString()} seats available`}</TooltipContent>
                </Tooltip>

                {/* Session count status */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          sessionStatus.dotClass
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-xs text-zinc-600 dark:text-zinc-500">
                        <span className="font-medium text-zinc-700 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-300">
                          {openSessionCount.toLocaleString()}
                        </span>{" "}
                        / {totalSessionCount.toLocaleString()}{" "}
                        <span>sessions</span>
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {`${openSessionCount.toLocaleString()} of ${totalSessionCount.toLocaleString()} sessions open`}
                  </TooltipContent>
                </Tooltip>
              </div>

              <div className="h-1.5 w-20 sm:w-36 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className={cn(
                    "h-full",
                    isClosed
                      ? "bg-rose-500/80"
                      : isNearlyFull
                      ? "bg-amber-500/80"
                      : "bg-emerald-500/80"
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, percentFull))}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <span className="text-xs text-zinc-500 dark:text-zinc-600">
              Not offered
            </span>
          )}
        </div>
      </article>
      <PopoverContent className="w-[500px] p-5" side="bottom">
        <CoursePopoverContent
          course={course}
          isCourseScheduled={isCourseScheduled}
          toggleCourseInSchedule={toggleCourseInSchedule}
          hasPrereqs={popoverHasPrereqs}
          sessions={popoverSessions}
          primaryEnroll={popoverPrimaryEnroll}
          cancelClose={() => {}}
          closePopover={() => setPopoverOpen(false)}
        />
      </PopoverContent>
    </Popover>
  )
}

export function ConvexCourseListView({
  courses,
  className,
}: {
  courses: ConvexCourseOverview[]
  className?: string
}) {
  return (
    <div
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden",
        className
      )}
    >
      {courses.map((course, i) => (
        <ConvexCourseListItem
          key={`${course.courseCode}-${i}`} // this shouldn't be needed, but just in case
          course={course}
        />
      ))}
    </div>
  )
}
