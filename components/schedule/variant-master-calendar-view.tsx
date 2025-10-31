"use client"

import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import {
  type GeneratedScheduleVariant,
  type ScheduleSession,
} from "@/store/schedule.store"
import { useQuery } from "convex/react"

import { cn, expandDays, weekDays } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CourseCardDetailed } from "./schedule-course-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { useSchedule } from "@/store/schedule.store"
import { toast } from "sonner"

type Meeting = {
  building?: string
  campus?: string
  days?: string
  room?: string
  time?: string
}

type CalendarEvent = {
  start: number
  end: number
  label: string
  color: string
  session: ScheduleSession
  courseCode: string
  meeting?: Meeting
  variantId: string
}

type LaidOutEvent = CalendarEvent & { col: number; cols: number }

function parseTimeRangeToMinutes(range?: string): [number, number] | null {
  if (!range) return null
  const [start, end] = String(range)
    .split("-")
    .map((s) => s.trim())
  const parse = (t: string): number => {
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
    if (!m) return 0
    let hh = parseInt(m[1], 10)
    const mm = m[2] ? parseInt(m[2], 10) : 0
    const ap = m[3].toUpperCase()
    if (ap === "PM" && hh !== 12) hh += 12
    if (ap === "AM" && hh === 12) hh = 0
    return hh * 60 + mm
  }
  return [parse(start), parse(end)]
}

function layoutEventsForDay(events: CalendarEvent[]): LaidOutEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    return a.end - b.end
  })
  const results: LaidOutEvent[] = []
  let cluster: CalendarEvent[] = []
  let clusterEnd = -Infinity
  const assignCluster = (clusterEvents: CalendarEvent[]) => {
    const columnEnds: number[] = []
    const assigned: Array<{ ev: CalendarEvent; col: number }> = []
    for (const ev of clusterEvents) {
      let assignedCol = -1
      for (let i = 0; i < columnEnds.length; i++) {
        if (columnEnds[i] <= ev.start) {
          assignedCol = i
          break
        }
      }
      if (assignedCol === -1) {
        assignedCol = columnEnds.length
        columnEnds.push(ev.end)
      } else {
        columnEnds[assignedCol] = ev.end
      }
      assigned.push({ ev, col: assignedCol })
    }
    const cols = columnEnds.length
    for (const a of assigned) {
      results.push({ ...a.ev, col: a.col, cols })
    }
  }
  for (const ev of sorted) {
    if (cluster.length === 0) {
      cluster.push(ev)
      clusterEnd = ev.end
      continue
    }
    if (ev.start < clusterEnd) {
      cluster.push(ev)
      clusterEnd = Math.max(clusterEnd, ev.end)
    } else {
      assignCluster(cluster)
      cluster = [ev]
      clusterEnd = ev.end
    }
  }
  if (cluster.length > 0) assignCluster(cluster)
  return results
}

const SESSION_EVENT_CARD_TYPE = "variant-master-calendar-event-card"

function CalendarEventCard({
  topPct,
  heightPct,
  leftPct,
  widthPct,
  event,
  sessionData,
  hoveredCourseCode,
  hoveredVariantId,
  onCourseHoverChange,
  onClick,
}: {
  topPct: number
  heightPct: number
  leftPct: number
  widthPct: number
  event: CalendarEvent
  sessionData?: any
  hoveredCourseCode?: string | null
  hoveredVariantId?: string | null
  onCourseHoverChange?: (courseCode: string | null, variantId: string | null) => void
  onClick?: () => void
}) {
  const isHovered = hoveredCourseCode === event.courseCode && hoveredVariantId === event.variantId

  const handleMouseEnter = () => {
    // Update parent hover state instantly
    onCourseHoverChange?.(event.courseCode, event.variantId)
  }

  const handleMouseLeave = () => {
    // Clear hover state instantly
    onCourseHoverChange?.(null, null)
  }

  return (
    <div
      data-type={SESSION_EVENT_CARD_TYPE}
      data-session-id={event.session.id}
      data-variant-id={event.variantId}
      data-event-card="true"
      className={cn(
        "absolute rounded text-[10px] leading-tight shadow-sm border px-1 py-0.5 overflow-hidden cursor-pointer transition-all",
        "hover:shadow-md hover:z-10",
        isHovered && "ring-2 ring-purple-500 shadow-lg opacity-100",
        !isHovered && hoveredCourseCode && hoveredVariantId && "opacity-30"
      )}
      style={{
        top: `${topPct}%`,
        height: `${heightPct}%`,
        left: `calc(${leftPct}% + 1px)`,
        width: `calc(${widthPct}% - 2px)`,
        background: `color-mix(in oklab, ${event.color} ${isHovered ? "80%" : "60%"}, transparent)`,
        borderColor: event.color,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      <div className="truncate font-medium">{event.label}</div>
    </div>
  )
}

type VariantMasterCalendarViewProps = {
  visibleVariants: GeneratedScheduleVariant[]
  variantColors: Map<string, string>
  hoveredCourseCode?: string | null
  hoveredVariantId?: string | null
  onCourseHoverChange?: (courseCode: string | null, variantId: string | null) => void
}

export function VariantMasterCalendarView({
  visibleVariants,
  variantColors,
  hoveredCourseCode,
  hoveredVariantId,
  onCourseHoverChange,
}: VariantMasterCalendarViewProps) {
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const { addCourse, addSessionToCourse, hasSession, hasCourse, canAddSession } = useSchedule()
  // Get all session IDs from visible variants
  const sessionIds = useMemo(() => {
    return visibleVariants.flatMap((variant) =>
      variant.courses.flatMap((course) => course.sessions.map((s) => s.id))
    )
  }, [visibleVariants])

  // Fetch session data from Convex
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )

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

  const eventsByDay = useMemo(() => {
    const baseMap: Record<string, Array<CalendarEvent>> = {
      M: [],
      T: [],
      W: [],
      Th: [],
      F: [],
      Sa: [],
      Su: [],
    }

    visibleVariants.forEach((variant) => {
      const variantColor =
        variantColors.get(variant.id) || "var(--color-purple-500)"

      variant.courses.forEach((course) => {
        course.sessions.forEach((session) => {
          const details: Meeting[] = Array.isArray(session.meetingDetailsList)
            ? session.meetingDetailsList
            : []
          details.forEach((m) => {
            const range = parseTimeRangeToMinutes(m.time)
            const days = expandDays(m.days)
            if (!range || days.length === 0) return
            const [start, end] = range
            const label = `${course.courseCode} ${session.code}${
              m.building ? ` • ${m.building}` : ``
            }${m.room ? ` ${m.room}` : ``}`
            days.forEach((d) => {
              if (!baseMap[d]) return
              baseMap[d].push({
                start,
                end,
                label,
                color: variantColor,
                session,
                meeting: m,
                courseCode: course.courseCode,
                variantId: variant.id,
              })
            })
          })
        })
      })
    })

    const laidOut: Record<string, Array<LaidOutEvent>> = {
      M: [],
      T: [],
      W: [],
      Th: [],
      F: [],
      Sa: [],
      Su: [],
    }
    ;(Object.keys(baseMap) as Array<keyof typeof baseMap>).forEach((d) => {
      laidOut[d] = layoutEventsForDay(baseMap[d])
    })
    return laidOut
  }, [visibleVariants, variantColors])

  const startOfDay = 8 * 60
  const endOfDay = 22 * 60
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60
  const rowPx = 42
  const viewHeight = intervals * rowPx

  const hasEvents = useMemo(() => {
    return Object.values(eventsByDay).some((events) => events.length > 0)
  }, [eventsByDay])

  // Get course data for selected course from specific variant
  const selectedCourseData = useMemo(() => {
    if (!selectedCourseCode || !selectedVariantId) return null
    
    // Find the specific variant
    const variant = visibleVariants.find((v) => v.id === selectedVariantId)
    if (!variant) return null

    // Find the course in this variant
    const course = variant.courses.find((c) => c.courseCode === selectedCourseCode)
    if (!course || course.sessions.length === 0) return null

    return {
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      courseCredit: course.courseCredit,
      sessions: course.sessions,
    }
  }, [selectedCourseCode, selectedVariantId, visibleVariants])

  // Get session IDs for selected course
  const selectedCourseSessionIds = useMemo(() => {
    if (!selectedCourseData) return []
    return selectedCourseData.sessions.map((s) => s.id)
  }, [selectedCourseData])

  // Fetch session data for selected course
  const selectedCourseSessionDataList = useQuery(
    api.courses.getSessionsByIds,
    selectedCourseSessionIds.length > 0 ? { sessionIds: selectedCourseSessionIds } : "skip"
  )
  const isLoadingSelectedCourseData = selectedCourseSessionDataList === undefined && selectedCourseSessionIds.length > 0

  // Create a map of sessionId -> sessionData for selected course
  const selectedCourseSessionDataMap = useMemo(() => {
    const map = new Map<string, any>()
    if (selectedCourseSessionDataList) {
      selectedCourseSessionDataList.forEach((data: any) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [selectedCourseSessionDataList])

  const handleAddToSchedule = () => {
    if (!selectedCourseData) return

    let addedCount = 0
    let skippedCount = 0

    // Check if course exists in the term, if not create it
    if (!hasCourse(selectedCourseData.courseCode)) {
      addCourse(selectedCourseData.courseCode, {
        courseTitle: selectedCourseData.courseTitle,
        courseCredit: selectedCourseData.courseCredit,
      })
    }

    // Add each session to the course
    selectedCourseData.sessions.forEach((session) => {
      const sessionId = session.id
      const wasAlreadyAdded = hasSession(sessionId)
      
      if (!wasAlreadyAdded) {
        // Check if session can be added (validation)
        const check = canAddSession(session, { courseCode: selectedCourseData.courseCode })
        
        if (check.ok) {
          // Add session directly to existing course
          addSessionToCourse(selectedCourseData.courseCode, session)
          addedCount++
        } else {
          // Session couldn't be added due to conflict or rule violation
          skippedCount++
        }
      } else {
        // Session already exists, skip it
        skippedCount++
      }
    })

    // Show toast notification
    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} session${addedCount !== 1 ? "s" : ""} to schedule${
          skippedCount > 0 ? ` (${skippedCount} skipped)` : ""
        }`
      )
      setSelectedCourseCode(null)
      setSelectedVariantId(null)
    } else if (skippedCount > 0) {
      toast.info(
        `Could not add sessions. ${skippedCount} session${skippedCount !== 1 ? "s" : ""} were skipped due to conflicts or rules.`
      )
    }
  }

  const handleEventClick = (courseCode: string, variantId: string) => {
    setSelectedCourseCode(courseCode)
    setSelectedVariantId(variantId)
  }

  if (!hasEvents) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-xs text-muted-foreground text-center">
          No events to display. Scroll through variant cards to see schedules.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto min-h-0">
      <div className="grid grid-cols-8">
        <div className="col-span-1 border-r border-foreground/10 flex-shrink-0">
          <div className="h-8 border-b border-foreground/10" />
          {Array.from({ length: intervals + 1 }, (_, i) => {
            const minutes = startOfDay + i * 60
            const hour = Math.floor(minutes / 60)
            const label = `${((hour + 11) % 12) + 1}${hour >= 12 ? "PM" : "AM"}`
            return (
              <div
                key={`t-${i}`}
                className="text-xs text-muted-foreground px-2 flex items-start justify-end"
                style={{ transform: "translateY(-8px)", height: `${rowPx}px` }}
              >
                {label}
              </div>
            )
          })}
        </div>

        <div className="col-span-7">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div
                key={`header-${d}`}
                className="text-xs font-medium text-muted-foreground px-2 py-2 border-b border-foreground/10 text-center"
              >
                {d}
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-7 relative"
            style={{ height: `${viewHeight}px` }}
          >
            {Array.from({ length: intervals + 1 }, (_, i) => (
              <div
                key={`hl-${i}`}
                className="pointer-events-none absolute left-0 right-0 border-t border-foreground/5"
                style={{ top: `${(i / intervals) * 100}%` }}
              />
            ))}

            {weekDays.map((d) => (
              <div
                key={`col-${d}`}
                className="relative border-r border-foreground/10 last:border-r-0"
              >
                {eventsByDay[d].map((ev, i) => {
                  const topPct = ((ev.start - startOfDay) / totalMinutes) * 100
                  const heightPct = ((ev.end - ev.start) / totalMinutes) * 100
                  const widthPct = 100 / (ev.cols || 1)
                  const leftPct = (ev.col || 0) * widthPct
                  const sessionData = sessionDataMap.get(ev.session.id)
                  return (
                    <CalendarEventCard
                      key={`${ev.session.id}-${ev.variantId}-${i}`}
                      topPct={topPct}
                      heightPct={heightPct}
                      leftPct={leftPct}
                      widthPct={widthPct}
                      event={ev}
                      sessionData={sessionData}
                      hoveredCourseCode={hoveredCourseCode}
                      hoveredVariantId={hoveredVariantId}
                      onCourseHoverChange={onCourseHoverChange}
                      onClick={() => handleEventClick(ev.courseCode, ev.variantId)}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={selectedCourseCode !== null && selectedVariantId !== null} onOpenChange={(open) => {
        if (!open) {
          setSelectedCourseCode(null)
          setSelectedVariantId(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {selectedCourseData?.courseCode}
              {selectedCourseData?.courseTitle ? ` - ${selectedCourseData.courseTitle}` : ""}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(80vh-180px)] pr-4">
            {selectedCourseData && (
              <div className="space-y-3">
                <CourseCardDetailed
                  course={{
                    id: `dialog-${selectedCourseData.courseCode}`,
                    courseCode: selectedCourseData.courseCode,
                    courseTitle: selectedCourseData.courseTitle,
                    courseCredit: selectedCourseData.courseCredit,
                    sessions: selectedCourseData.sessions,
                  }}
                  sessionDataMap={selectedCourseSessionDataMap}
                  isLoadingSessionData={isLoadingSelectedCourseData}
                />
              </div>
            )}
          </ScrollArea>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              setSelectedCourseCode(null)
              setSelectedVariantId(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddToSchedule}>
              Add to Schedule & Course Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
