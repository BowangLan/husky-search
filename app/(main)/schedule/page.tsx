"use client"

import { useState, useMemo } from "react"
import { api } from "@/convex/_generated/api"
import { useScheduledCoursesByActiveTerm, type ScheduleCourse, type ScheduleSession } from "@/store/schedule.store"
import { useQuery } from "convex/react"

import { isScheduleFeatureEnabled } from "@/config/features"
import { ScheduleHeader } from "@/components/schedule/schedule-header"
import { GeneratedSchedulesPanel } from "@/components/schedule/generated-schedules-panel"
import { ScheduleCoursesList } from "@/components/schedule/schedule-courses-list"
import { ScheduleCalendarSection } from "@/components/schedule/schedule-calendar-section"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

export default function SchedulePage() {
  if (!isScheduleFeatureEnabled()) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Schedule feature is not enabled</p>
      </div>
    )
  }

  const coursesByActiveTerm = useScheduledCoursesByActiveTerm()
  
  // Flatten courses from all active terms for the calendar view
  const courses = useMemo(() => {
    const allCourses: ScheduleCourse[] = []
    coursesByActiveTerm.forEach((termCourses) => {
      allCourses.push(...termCourses)
    })
    return allCourses
  }, [coursesByActiveTerm])
  
  const [activeTab, setActiveTab] = useState<"schedule" | "generation">("schedule")

  // Fetch session data from Convex
  const sessionIds = courses.flatMap((c) => c.sessions.map((s: ScheduleSession) => s.id))
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )
  const isLoadingSessionData =
    sessionDataList === undefined && sessionIds.length > 0

  // Create a map of sessionId -> sessionData for quick lookup
  const sessionDataMap = useMemo(() => {
    const map = new Map<string, any>()
    if (sessionDataList) {
      sessionDataList.forEach((data: any) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [sessionDataList])

  return (
    <Tabs 
      value={activeTab} 
      onValueChange={(v) => setActiveTab(v as "schedule" | "generation")} 
      className="flex flex-col h-full overflow-hidden"
    >
      <ScheduleHeader />

      <TabsContent value="schedule" className="flex-1 min-h-0 overflow-hidden mt-0">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={40} minSize={20} maxSize={50}>
            <ScheduleCoursesList
              sessionDataMap={sessionDataMap}
              isLoadingSessionData={isLoadingSessionData}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={70} minSize={50}>
            <ScheduleCalendarSection
              courses={courses}
              sessionDataMap={sessionDataMap}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </TabsContent>

      <TabsContent value="generation" className="flex-1 min-h-0 overflow-hidden mt-0">
        <GeneratedSchedulesPanel />
      </TabsContent>
    </Tabs>
  )
}
