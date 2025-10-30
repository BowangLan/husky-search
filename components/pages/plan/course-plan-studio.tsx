"use client"

import { useState, useRef, useEffect } from "react"
import { ImperativePanelHandle } from "react-resizable-panels"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

import { AddTermDialog } from "./add-term-dialog"
import { CalendarViewPane } from "./calendar-view-pane"
import { CourseBrowsePane } from "./course-browse-pane"
import { CourseSearchDialog } from "./course-search-dialog"
import { PlanToolbar } from "./plan-toolbar"
import { ScheduleViewPane } from "./schedule-view-pane"
import { TermViewPane } from "./term-view-pane"

export function CoursePlanStudio() {
  const [isAddTermOpen, setIsAddTermOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null)
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false)
  const [calendarCollapsed, setCalendarCollapsed] = useState(false)
  const [browseCollapsed, setBrowseCollapsed] = useState(false)

  const schedulePanelRef = useRef<ImperativePanelHandle>(null)
  const calendarPanelRef = useRef<ImperativePanelHandle>(null)
  const browsePanelRef = useRef<ImperativePanelHandle>(null)

  // Auto-collapse/expand panels when fold state changes
  useEffect(() => {
    if (scheduleCollapsed) {
      schedulePanelRef.current?.collapse()
    } else {
      schedulePanelRef.current?.expand()
    }
  }, [scheduleCollapsed])

  useEffect(() => {
    if (calendarCollapsed) {
      calendarPanelRef.current?.collapse()
    } else {
      calendarPanelRef.current?.expand()
    }
  }, [calendarCollapsed])

  useEffect(() => {
    if (browseCollapsed) {
      browsePanelRef.current?.collapse()
    } else {
      browsePanelRef.current?.expand()
    }
  }, [browseCollapsed])

  const handleAddCourseToTerm = (termId: string) => {
    setSelectedTermId(termId)
    setIsSearchOpen(true)
  }

  const handleSearchCourse = () => {
    setSelectedTermId(null)
    setIsSearchOpen(true)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar - Fixed at top, not resizable */}
      <PlanToolbar
        onAddTerm={() => setIsAddTermOpen(true)}
        onSearchCourse={handleSearchCourse}
      />

      {/* Resizable Panes Container */}
      <div className="flex-1 overflow-hidden bg-accent p-2">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Column: Course Browse and Term View */}
          <ResizablePanel defaultSize={70} minSize={25}>
            <ResizablePanelGroup direction="vertical">
              {/* Course Browse Pane */}
              <ResizablePanel
                ref={browsePanelRef}
                defaultSize={70}
                minSize={8}
                collapsible={true}
                collapsedSize={8}
              >
                <CourseBrowsePane />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Year/Term View Pane */}
              <ResizablePanel defaultSize={30} minSize={8}>
                <TermViewPane
                  onAddTerm={() => setIsAddTermOpen(true)}
                  onAddCourseToTerm={handleAddCourseToTerm}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Column: Schedule and Calendar */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              {/* Schedule List View Pane */}
              <ResizablePanel
                ref={schedulePanelRef}
                defaultSize={50}
                minSize={8}
                collapsible={true}
                collapsedSize={8}
              >
                <ScheduleViewPane onFoldChange={setScheduleCollapsed} />
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Calendar View Pane */}
              <ResizablePanel
                ref={calendarPanelRef}
                defaultSize={50}
                minSize={8}
                collapsible={true}
                collapsedSize={8}
              >
                <CalendarViewPane onFoldChange={setCalendarCollapsed} />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Dialogs */}
      <AddTermDialog open={isAddTermOpen} onOpenChange={setIsAddTermOpen} />
      <CourseSearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        selectedTermId={selectedTermId}
      />
    </div>
  )
}
