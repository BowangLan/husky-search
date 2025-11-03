"use client"

import { api } from "@/convex/_generated/api"
import { useNode } from "@/store/prereq-graph-node-map.store"
import { usePrereqGraphSelectedCourseStore } from "@/store/prereq-graph-selected-course.store"
import { Panel } from "@xyflow/react"
import { useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import { Calendar, FileText, GraduationCap, Info, X } from "lucide-react"

import { isRequisitesEmpty, parseTermId } from "@/lib/course-utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { CopySLNButton } from "@/components/copy-sln-button"
import {
  formatRawPrereqs,
  parseDescription,
} from "@/components/pages/course-detail/course-metadata-section"
import { SessionEnrollProgress } from "@/components/session-enroll-progress"

import { CourseSessionsProvider } from "../pages/course-detail/course-sessions-context"
import { SessionScheduleToggleButton } from "../pages/course-detail/session-schedule-toggle-button"
import { Section, SectionTitle, TextCard } from "./panel-section"

const PANEL_WIDTH = "22rem"

export function SelectedCoursePanel() {
  const selectedCourse = usePrereqGraphSelectedCourseStore(
    (state) => state.selectedCourse
  )
  const clearSelectedCourse = usePrereqGraphSelectedCourseStore(
    (state) => state.clearSelectedCourse
  )
  const richNodeData = useNode(selectedCourse?.courseCode ?? "")

  const courseDetailData = useQuery(
    api.courses.getByCourseCode,
    selectedCourse?.courseCode
      ? { courseCode: selectedCourse.courseCode }
      : "skip"
  )

  if (!selectedCourse) {
    return null
  }

  const { courseCode, courseTitle } = selectedCourse
  const isLoading = courseDetailData === undefined
  const myplanCourse = courseDetailData?.myplanCourse ?? null
  const currentTermData = myplanCourse?.currentTermData ?? []
  const hasCurrentTermData = currentTermData.length > 0
  const totalSessions = currentTermData.reduce(
    (acc, t: any) => acc + (Array.isArray(t.sessions) ? t.sessions.length : 0),
    0
  )
  const isOfferedNow = hasCurrentTermData && totalSessions > 0

  const summaryDetails = myplanCourse?.detailData?.courseSummaryDetails
  const requisites = summaryDetails?.requisites ?? []
  const description = summaryDetails?.courseDescription
  const genEdReqs =
    myplanCourse?.genEdReqs?.filter(
      (req): req is string => typeof req === "string" && req.trim().length > 0
    ) ?? []
  const lastUpdatedLabel =
    myplanCourse?.lastUpdated != null
      ? formatDistanceToNow(new Date(myplanCourse.lastUpdated), {
          addSuffix: true,
        })
      : null

  return (
    <Panel position="top-right" className="pointer-events-auto">
      <div
        className="max-h-[85vh] overflow-y-auto shadow-lg border rounded-lg bg-background"
        style={{
          width: PANEL_WIDTH,
        }}
      >
        <header className="pb-3 sticky top-0 border-b z-10 bg-background px-4 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold truncate flex-none">
                  {courseCode}
                </h2>
                {/* Credits */}
                <div className="flex items-center gap-1 flex-none">
                  <span className="text-xs text-muted-foreground font-mono">
                    ({myplanCourse?.credit} CR)
                  </span>
                </div>
                {/* Offered now badge */}
                <div className="flex items-center gap-2 flex-none">
                  {isOfferedNow ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Offered now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">
                      Not offered
                    </span>
                  )}
                </div>
                <div className="flex-1"></div>
                {/* Gen Ed Requirements */}
                <div className="flex flex-wrap gap-1 flex-none">
                  {genEdReqs.map((req, index) => (
                    <Badge
                      key={`${req}-${index}`}
                      variant="blue-outline"
                      size="sm"
                    >
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>
              {courseTitle && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {courseTitle}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 -mt-1 -mr-1 flex-shrink-0"
              onClick={clearSelectedCourse}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </header>
        <div className="space-y-4 pt-4 pb-4">
          {isLoading ? (
            <Section>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Section>
          ) : (
            <>
              {!myplanCourse ? (
                <Section>
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    Course details are currently unavailable. Try again later.
                  </div>
                </Section>
              ) : (
                <>
                  {/* Current Term Data - compact session list */}
                  {hasCurrentTermData && (
                    <>
                      {currentTermData.map((term: any) => {
                        const sessions: any[] = Array.isArray(term.sessions)
                          ? term.sessions
                          : []
                        return (
                          <Section key={term.termId ?? `${courseCode}-term`}>
                            <SectionTitle>
                              {parseTermId(term.termId).label}{" "}
                              <span className="text-xs text-muted-foreground">
                                ({sessions.length} sessions)
                              </span>
                            </SectionTitle>
                            {sessions.length === 0 ? (
                              <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                                No sessions listed for this term.
                              </div>
                            ) : (
                              <CourseSessionsProvider courseCode={courseCode}>
                                <div className="border rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
                                  {sessions.map((session, index) => (
                                    <div key={session.id}>
                                      <div
                                        className="px-4 py-3 flex items-center gap-2"
                                        style={
                                          {
                                            // Compact Vercel/Linear-style row
                                            // left: code & type, middle: instructor/time, right: actions
                                          }
                                        }
                                      >
                                        <div className="w-4">
                                          <div className="text-sm font-medium">
                                            {session.code}
                                          </div>
                                        </div>
                                        <CopySLNButton
                                          session={session}
                                          className="text-xs"
                                          iconClassName="size-3"
                                        />
                                        <div className="flex-1 min-w-0 text-xs">
                                          {!!session.instructor && (
                                            <div className="text-foreground/80 truncate">
                                              {session.instructor}
                                            </div>
                                          )}
                                          {/* {Array.isArray(
                                          session.meetingDetailsList
                                        ) &&
                                          session.meetingDetailsList.length >
                                            0 && (
                                            <div className="text-muted-foreground/90 truncate">
                                              {session.meetingDetailsList
                                                .map((m: any) => {
                                                  const dayTime = `${
                                                    (m.days && m.days.trim()) ||
                                                    "TBA"
                                                  }${
                                                    m.time ? ` • ${m.time}` : ""
                                                  }`
                                                  const loc = [
                                                    m.building,
                                                    m.room,
                                                  ]
                                                    .filter(Boolean)
                                                    .join(" ")
                                                  return loc
                                                    ? `${dayTime} • ${loc}`
                                                    : dayTime
                                                })
                                                .join("; ")}
                                            </div>
                                          )} */}

                                          {/* <div className="mt-2">
                                          <SessionEnrollProgress
                                            session={session}
                                          />
                                        </div> */}
                                        </div>
                                        <SessionScheduleToggleButton
                                          session={session}
                                        />
                                      </div>
                                      {index !== sessions.length - 1 && (
                                        <Separator />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CourseSessionsProvider>
                            )}
                          </Section>
                        )
                      })}
                    </>
                  )}

                  {description && (
                    <Section>
                      <SectionTitle>Description</SectionTitle>
                      <div>
                        <TextCard>
                          <p className="text-sm/relaxed">
                            {parseDescription(description)}
                          </p>
                        </TextCard>
                      </div>
                    </Section>
                  )}

                  <Section>
                    <SectionTitle>Prerequisites</SectionTitle>
                    <div>
                      {!isRequisitesEmpty(requisites) ? (
                        <TextCard>
                          <ul className="space-y-1 list-disc list-inside text-sm/relaxed">
                            {formatRawPrereqs(requisites)}
                          </ul>
                        </TextCard>
                      ) : (
                        <p className="text-muted-foreground text-sm/normal">
                          No prerequisites
                        </p>
                      )}
                    </div>
                  </Section>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Panel>
  )
}
