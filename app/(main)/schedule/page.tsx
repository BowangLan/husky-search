"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import {
  useClearSchedule,
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
} from "@/store/schedule.store"
import { useQuery } from "convex/react"
import {
  Calendar,
  Check,
  Copy,
  MoreVertical,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { isScheduleFeatureEnabled } from "@/config/features"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { ScheduledSessionCard } from "@/components/schedule/scheduled-session-card"
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar"

export default function SchedulePage() {
  if (!isScheduleFeatureEnabled()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Schedule feature is not enabled</p>
      </div>
    )
  }

  const courses = useScheduledCourses()
  const remove = useRemoveFromSchedule()
  const removeCourse = useRemoveCourse()
  const clear = useClearSchedule()
  const [copied, setCopied] = useState(false)

  // Fetch session data from Convex
  const sessionIds = courses.flatMap((c) => c.sessions.map((s) => s.id))
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )
  const isLoadingSessionData =
    sessionDataList === undefined && sessionIds.length > 0

  // Create a map of sessionId -> sessionData for quick lookup
  const sessionDataMap = useMemo(() => {
    const map = new Map()
    if (sessionDataList) {
      sessionDataList.forEach((data) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [sessionDataList])

  const handleCopySLNs = async () => {
    // Get all SLN codes (registrationCode), filter out undefined/null, and join with commas
    const slnCodes = courses
      .flatMap((c) => c.sessions)
      .map((s) => s.registrationCode)
      .filter((code) => code !== undefined && code !== null && code !== "")
      .join(",")

    if (slnCodes) {
      try {
        await navigator.clipboard.writeText(slnCodes)
        setCopied(true)
        const count = slnCodes.split(",").length
        toast.success(`Copied ${count} SLN code${count > 1 ? "s" : ""}`, {
          description: slnCodes,
          duration: 3000,
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error("Failed to copy SLN codes", {
          description: "Please try again or copy manually",
        })
      }
    } else {
      toast.error("No SLN codes to copy", {
        description: "Add sessions with registration codes first",
      })
    }
  }

  

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="size-5" />
          <h1 className="text-2xl font-semibold">My Schedule</h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopySLNs}
                  disabled={courses.length === 0}
                  className="h-8"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1.5" />
                      Copy SLN Codes
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Copy all registration codes to paste into Register.UW
                  {courses.length > 0 &&
                    (() => {
                      const count = courses
                        .flatMap((c) => c.sessions)
                        .filter((s) => s.registrationCode).length
                      return ` (${count} code${count !== 1 ? "s" : ""})`
                    })()}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clear()}
            disabled={courses.length === 0}
            className="h-8"
          >
            <X className="size-3.5" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: List View */}
        <div className="flex flex-col w-full max-w-md border-r flex-shrink-0">
          <div className="flex items-center justify-between flex-none px-3 py-1.5 border-b">
            <h3 className="font-semibold text-xs">Courses</h3>
          </div>

          <div className="px-3 space-y-2.5 flex-1 overflow-y-auto py-3">
            {courses.length === 0 ? (
              <div className="text-xs text-muted-foreground">
                No courses yet. Add sessions from course pages or the calendar
                view.
              </div>
            ) : (
              courses.map((c) => (
                <div
                  key={c.id}
                  className="border-l-2 border-l-purple-600 border border-border bg-card shadow-sm"
                >
                  {/* Course header */}
                  <div className="px-3 py-2 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Link
                          href={`/courses/${encodeURIComponent(
                            c.courseCode
                          )}`}
                          className="font-semibold text-base text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {c.courseCode}
                        </Link>
                        {c.courseCredit !== undefined ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5"
                          >
                            {String(c.courseCredit)} CR
                          </Badge>
                        ) : null}
                      </div>
                      {c.courseTitle ? (
                        <div className="text-xs text-foreground">
                          {c.courseTitle}
                        </div>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-6 shrink-0"
                        >
                          <MoreVertical className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            removeCourse(c.id)
                            toast.success(
                              `Removed ${c.courseCode} from schedule`
                            )
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 />
                          Remove course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Sessions under course */}
                  {c.sessions.length > 0 ? (
                    <div className="border-t divide-y">
                      {c.sessions.map((s) => (
                        <ScheduledSessionCard
                          key={s.id}
                          session={s}
                          sessionData={sessionDataMap.get(s.id)}
                          isLoading={isLoadingSessionData}
                          onRemove={() => remove(c.courseCode, s.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="border-t px-3 py-2 text-xs text-muted-foreground">
                      No sessions selected
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Calendar View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between flex-none px-4 py-2 border-b">
            <h3 className="font-semibold text-sm">Weekly Schedule</h3>
          </div>
          <ScheduleCalendar courses={courses} sessionDataMap={sessionDataMap} />
        </div>
      </div>
    </div>
  )
}

