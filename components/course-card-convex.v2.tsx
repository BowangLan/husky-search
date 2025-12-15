"use client"

import Link from "next/link"
import { AlertCircle, Link2 } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { cn, getGenEdLabel } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function pickPrimaryEnroll(course: ConvexCourseOverview) {
  const enroll = course.enroll ?? []
  if (enroll.length === 0) return null

  // Pick the row with the largest max seats; it best matches the single-row UI.
  return enroll.reduce((best, cur) =>
    cur.enrollMax > best.enrollMax ? cur : best
  )
}

function getSeatBarClasses({
  isClosed,
  isNearlyFull,
}: {
  isClosed: boolean
  isNearlyFull: boolean
}) {
  if (isClosed) return "bg-rose-500/80"
  if (isNearlyFull) return "bg-amber-500/80"
  return "bg-emerald-500/80"
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

export function ConvexCourseCardLinkV2({
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

  const percentFull =
    enrollMax > 0 ? Math.round((enrollCount / enrollMax) * 100) : 0
  const isClosed = enrollMax > 0 && enrollCount >= enrollMax
  const isNearlyFull = !isClosed && percentFull >= 85
  const seatStatus = getSeatStatus({ avail, isClosed, isNearlyFull })

  const prereqCount = course.prereqs?.length ?? 0
  const hasPrereqs = prereqCount > 0

  return (
    <Link
      href={`/courses/${course.courseCode}`}
      prefetch
      className={cn(
        "group flex h-full flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-5 transition-all duration-300 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lg hover:shadow-zinc-200/60 dark:border-zinc-800/80 dark:bg-zinc-900/20 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60 dark:hover:shadow-black/40",
        className
      )}
    >
      <div>
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <h3 className="text-lg flex-none font-medium tracking-tight text-zinc-900 truncate dark:text-zinc-200">
              {course.courseCode}
            </h3>
            <span className="text-xs flex-none text-zinc-600 shrink-0 dark:text-zinc-500 inline-block">
              ({course.credit} cr)
            </span>
          </div>

          <div className="flex gap-1.5 flex-wrap justify-end items-center ml-auto">
            {(course.genEdReqs ?? []).slice(0, 3).map((req) => (
              <Tooltip key={req}>
                <TooltipTrigger asChild>
                  <span className="rounded border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-400">
                    {req}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">{getGenEdLabel(req)}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <h4 className="mb-3 line-clamp-2 font-normal text-sm leading-snug text-zinc-600 transition-colors group-hover:text-zinc-700 dark:text-zinc-400 dark:group-hover:text-zinc-300">
          {course.title}
        </h4>

        <div className="mb-2 flex items-center gap-1.5">
          {hasPrereqs ? (
            <>
              <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                  <Link2 className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-[11px] font-medium text-indigo-700/90 dark:text-indigo-400/80">
                    {prereqCount} Prereqs
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {course.prereqs?.map((prereq) => prereq).join(", ")}
                  {/* {JSON.stringify(course.prereqs, null, 2)} */}
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              {/* <AlertCircle className="h-3 w-3 text-zinc-500 dark:text-zinc-600" />
                <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-500">
                  No Prereqs
                </span> */}
            </>
          )}
        </div>
      </div>

      {primaryEnroll && enrollMax > 0 ? (
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-xs dark:border-zinc-800/50">
          <div className="flex items-center gap-2 min-w-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn("h-2 w-2 rounded-full", seatStatus.dotClass)}
                  aria-hidden="true"
                />
              </TooltipTrigger>
              <TooltipContent side="top">{seatStatus.label}</TooltipContent>
            </Tooltip>
            <span className="font-medium text-zinc-600 truncate dark:text-zinc-500">
              <span className="font-medium text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-500 dark:group-hover:text-zinc-300">
                {avail.toLocaleString()}
              </span>{" "}
              avail of {enrollMax.toLocaleString()}
            </span>
          </div>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className={cn(
                "h-full",
                getSeatBarClasses({ isClosed, isNearlyFull })
              )}
              style={{ width: `${Math.min(100, Math.max(0, percentFull))}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-xs dark:border-zinc-800/50">
          <span className="font-medium text-zinc-600 truncate dark:text-zinc-500">
            Not currently offered
          </span>
        </div>
      )}
    </Link>
  )
}
