"use client"

import * as React from "react"
import { api } from "@/convex/_generated/api"
import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
} from "@/store/schedule.store"
import { useQuery } from "convex/react"
import { toast } from "sonner"

import {
  CourseCardCompact,
  CourseCardDetailed,
} from "@/components/schedule/right-sidebar-course-card"
import { DetailsToggleButton } from "@/components/app-right-sidebar"

type ScheduledSessionListViewProps = {
  showDetails: boolean
}

export function ScheduledSessionListView({
  showDetails,
}: ScheduledSessionListViewProps) {
  const courses = useScheduledCourses()
  const remove = useRemoveFromSchedule()
  const removeCourse = useRemoveCourse()

  // Fetch session data from Convex
  const sessionIds = courses.flatMap((c) => c.sessions.map((s) => s.id))
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )
  const isLoadingSessionData =
    sessionDataList === undefined && sessionIds.length > 0

  // Create a map of sessionId -> sessionData for quick lookup
  const sessionDataMap = React.useMemo(() => {
    const map = new Map()
    if (sessionDataList) {
      sessionDataList.forEach((data) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [sessionDataList])

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Scheduled Sessions
        </span>
        <DetailsToggleButton />
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2.5">
          {courses.length === 0 ? (
            <div className="text-xs text-muted-foreground px-2 py-4">
              No courses yet. Add sessions from course pages or the calendar
              view.
            </div>
          ) : (
            courses.map((c) => {
              const onRemoveCourse = () => {
                removeCourse(c.id)
                toast.success(`Removed ${c.courseCode} from schedule`)
              }
              const onRemoveSession = (sessionId: string) =>
                remove(c.courseCode, sessionId)

              return showDetails ? (
                <CourseCardDetailed
                  key={c.id}
                  course={c as any}
                  sessionDataMap={sessionDataMap as any}
                  isLoadingSessionData={isLoadingSessionData}
                  onRemoveCourse={onRemoveCourse}
                  onRemoveSession={onRemoveSession}
                />
              ) : (
                <CourseCardCompact
                  key={c.id}
                  course={c as any}
                  sessionDataMap={sessionDataMap as any}
                  isLoadingSessionData={isLoadingSessionData}
                  onRemoveCourse={onRemoveCourse}
                  onRemoveSession={onRemoveSession}
                />
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

