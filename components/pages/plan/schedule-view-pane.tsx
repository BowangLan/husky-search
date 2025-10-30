"use client"

import Link from "next/link"
import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
} from "@/store/schedule.store"
import { Calendar, X } from "lucide-react"

import { isScheduleFeatureEnabled } from "@/config/features"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  PaneContainer,
  PaneContent,
  PaneToolbar,
  PaneToolbarItem,
} from "./pane-container"

export interface ScheduleViewPaneProps {
  onFoldChange?: (folded: boolean) => void
}

export function ScheduleViewPane({ onFoldChange }: ScheduleViewPaneProps = {}) {
  const enabled = isScheduleFeatureEnabled()
  const courses = enabled ? useScheduledCourses() : []
  const remove = useRemoveFromSchedule()
  const removeCourse = useRemoveCourse()

  if (!enabled) {
    return (
      <PaneContainer>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            Schedule Feature Disabled
          </h3>
          <p className="text-muted-foreground max-w-sm">
            Enable the schedule feature in your environment settings.
          </p>
        </div>
      </PaneContainer>
    )
  }

  if (courses.length === 0) {
    return (
      <PaneContainer onFoldChange={onFoldChange}>
        <PaneToolbar foldable>
          <div className="flex items-center justify-between">
            <PaneToolbarItem>My Schedule</PaneToolbarItem>
          </div>
        </PaneToolbar>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900/20 p-4 mb-4">
            <Calendar className="size-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Schedule Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Add sessions from course pages to see your schedule here.
          </p>
        </div>
      </PaneContainer>
    )
  }

  // Calculate total credits
  const totalCredits = courses.reduce((sum, c) => {
    const credit = c.creditOverwrite ?? c.courseCredit
    const num =
      typeof credit === "number" ? credit : parseFloat(String(credit)) || 0
    return sum + num
  }, 0)

  return (
    <PaneContainer onFoldChange={onFoldChange}>
      <PaneToolbar foldable>
        <div className="flex items-center justify-between">
          <PaneToolbarItem>My Schedule</PaneToolbarItem>
          <Badge variant="secondary" className="text-sm">
            {totalCredits} credits
          </Badge>
        </div>
      </PaneToolbar>

      <PaneContent className="space-y-3">
        {courses.map((course) => {
          const effectiveCredit = course.creditOverwrite ?? course.courseCredit
          const creditNum =
            typeof effectiveCredit === "number"
              ? effectiveCredit
              : parseFloat(String(effectiveCredit)) || 0

          return (
            <div
              key={course.id}
              className="border rounded-lg bg-card shadow-sm overflow-hidden"
            >
              {/* Course header */}
              <div className="px-3 py-2.5 bg-muted/30 border-b flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/courses/${encodeURIComponent(course.courseCode)}`}
                      className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {course.courseCode}
                    </Link>
                    <Badge variant="secondary" size="sm" className="text-xs">
                      {creditNum} CR
                    </Badge>
                  </div>
                  {course.courseTitle && (
                    <div className="text-xs text-muted-foreground truncate">
                      {course.courseTitle}
                    </div>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 shrink-0"
                  onClick={() => removeCourse(course.id)}
                  title="Remove course"
                >
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Sessions */}
              {course.sessions.length > 0 ? (
                <div className="divide-y">
                  {course.sessions.map((session) => (
                    <div
                      key={session.id}
                      className="px-3 py-2 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium">
                              {session.code}
                            </span>
                            {session.type && (
                              <Badge
                                variant="secondary"
                                size="sm"
                                className="text-[10px] uppercase"
                              >
                                {session.type}
                              </Badge>
                            )}
                            {session.registrationCode && (
                              <span className="text-xs text-muted-foreground">
                                SLN {session.registrationCode}
                              </span>
                            )}
                          </div>

                          {/* Meeting details */}
                          {session.meetingDetailsList &&
                            session.meetingDetailsList.length > 0 && (
                              <div className="space-y-0.5">
                                {session.meetingDetailsList.map(
                                  (meeting, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-muted-foreground"
                                    >
                                      {meeting.days && meeting.time && (
                                        <span className="font-medium text-foreground">
                                          {meeting.days} {meeting.time}
                                        </span>
                                      )}
                                      {meeting.building && meeting.room && (
                                        <span className="ml-2">
                                          {meeting.building} {meeting.room}
                                        </span>
                                      )}
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                          {session.instructor &&
                            session.instructor !== "--" && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {session.instructor}
                              </div>
                            )}
                        </div>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0"
                          onClick={() => remove(course.courseCode, session.id)}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                  No sessions selected
                </div>
              )}
            </div>
          )
        })}
      </PaneContent>
    </PaneContainer>
  )
}
