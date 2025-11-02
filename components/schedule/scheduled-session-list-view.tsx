"use client"

import * as React from "react"
import { api } from "@/convex/_generated/api"
import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
  useScheduledCoursesByActiveTerm,
} from "@/store/schedule.store"
import { useQuery } from "convex/react"
import { Info } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { MiniCalendarView } from "@/components/schedule/mini-calendar-view"
import {
  CourseCardCompact,
  CourseCardDetailed,
} from "@/components/schedule/schedule-course-card"

const RIGHT_SIDEBAR_DETAILS_COOKIE_NAME = "right_sidebar_details"
const RIGHT_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function ScheduledSessionListView({ termId }: { termId?: string }) {
  // Details on/off state (persist to cookie)
  const [showDetails, setShowDetails] = React.useState<boolean>(() => {
    if (typeof document === "undefined") return true
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${RIGHT_SIDEBAR_DETAILS_COOKIE_NAME}=([^;]*)`)
    )
    return match ? match[1] === "true" : true
  })

  const toggleDetails = React.useCallback(() => {
    setShowDetails((prev) => {
      const next = !prev
      document.cookie = `${RIGHT_SIDEBAR_DETAILS_COOKIE_NAME}=${next}; path=/; max-age=${RIGHT_SIDEBAR_COOKIE_MAX_AGE}`
      return next
    })
  }, [])

  // Get courses - filter by termId if provided
  const allCourses = useScheduledCourses()
  const coursesByActiveTerm = useScheduledCoursesByActiveTerm()
  const courses = React.useMemo(() => {
    if (termId) {
      return coursesByActiveTerm.get(termId) || []
    }
    return allCourses
  }, [termId, allCourses, coursesByActiveTerm])

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
      <div className="px-3 py-2 border-b flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground">
          Scheduled Sessions
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={toggleDetails}
          aria-pressed={showDetails}
          aria-label="Toggle details"
        >
          <Info className="size-4 mr-1" />
          <span className="text-xs">Details</span>
          <Badge
            variant={showDetails ? "green" : "secondary"}
            size="flat-sm"
            className="ml-2"
          >
            {showDetails ? "On" : "Off"}
          </Badge>
        </Button>
      </div>
      {courses.length > 0 ? (
        <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full overflow-y-auto p-2">
              <div className="space-y-2.5">
                {courses.map((c) => {
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
                })}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={50} minSize={20}>
            <div className="h-full border-t">
              <MiniCalendarView courses={courses} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 min-h-0">
          <div className="text-xs text-muted-foreground px-2 py-4">
            No courses yet. Add sessions from course pages or the calendar view.
          </div>
        </div>
      )}
    </div>
  )
}
