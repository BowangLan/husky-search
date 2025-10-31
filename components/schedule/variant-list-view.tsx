"use client"

import * as React from "react"
import { Info } from "lucide-react"

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
import { type ScheduleCourse } from "@/store/schedule.store"

const RIGHT_SIDEBAR_DETAILS_COOKIE_NAME = "right_sidebar_details"
const RIGHT_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type VariantListViewProps = {
  courses: ScheduleCourse[]
  sessionDataMap: Map<string, any>
  isLoadingSessionData: boolean
  onRemoveCourse: (courseId: string) => void
  onRemoveSession: (courseCode: string, sessionId: string) => void
}

export function VariantListView({
  courses,
  sessionDataMap,
  isLoadingSessionData,
  onRemoveCourse,
  onRemoveSession,
}: VariantListViewProps) {
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
                  const onRemoveCourseHandler = () => {
                    onRemoveCourse(c.id)
                  }
                  const onRemoveSessionHandler = (sessionId: string) =>
                    onRemoveSession(c.courseCode, sessionId)

                  return showDetails ? (
                    <CourseCardDetailed
                      key={c.id}
                      course={c as any}
                      sessionDataMap={sessionDataMap as any}
                      isLoadingSessionData={isLoadingSessionData}
                      onRemoveCourse={onRemoveCourseHandler}
                      onRemoveSession={onRemoveSessionHandler}
                    />
                  ) : (
                    <CourseCardCompact
                      key={c.id}
                      course={c as any}
                      sessionDataMap={sessionDataMap as any}
                      isLoadingSessionData={isLoadingSessionData}
                      onRemoveCourse={onRemoveCourseHandler}
                      onRemoveSession={onRemoveSessionHandler}
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

