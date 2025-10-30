"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { useScheduledCourses } from "@/store/schedule.store"
import { expandDays, weekDays } from "@/lib/utils"
import { isScheduleFeatureEnabled } from "@/config/features"
import { PaneContainer, PaneToolbar, PaneToolbarItem, PaneContent } from "./pane-container"

export interface CalendarViewPaneProps {
  onFoldChange?: (folded: boolean) => void
}

type CalendarEvent = {
  start: number
  end: number
  label: string
  color: string
  courseCode: string
}

type LaidOutEvent = CalendarEvent & { col: number; cols: number }

export function CalendarViewPane({ onFoldChange }: CalendarViewPaneProps = {}) {
  const enabled = isScheduleFeatureEnabled()
  const courses = enabled ? useScheduledCourses() : []

  // Parse time range to minutes
  function parseTimeRangeToMinutes(range?: string): [number, number] | null {
    if (!range) return null
    const [start, end] = range.split("-").map((s) => s.trim())
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

  // Layout events to avoid overlaps
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

  const sessionColors = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#eab308", // yellow
    "#84cc16", // lime
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
  ]

  const courseColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    courses.forEach((c, idx) => {
      colorMap.set(c.courseCode, sessionColors[idx % sessionColors.length])
    })
    return colorMap
  }, [courses])

  const eventsByDay = useMemo(() => {
    const baseMap: Record<string, CalendarEvent[]> = {
      M: [],
      T: [],
      W: [],
      Th: [],
      F: [],
      Sa: [],
      Su: [],
    }

    courses.forEach((course) => {
      const color = courseColors.get(course.courseCode) || sessionColors[0]
      course.sessions.forEach((session) => {
        const details = Array.isArray(session.meetingDetailsList)
          ? session.meetingDetailsList
          : []
        details.forEach((m) => {
          const range = parseTimeRangeToMinutes(m.time)
          const days = expandDays(m.days)
          if (!range || days.length === 0) return
          const [start, end] = range
          const label = `${course.courseCode} ${session.code}${
            m.building ? ` • ${m.building}` : ""
          }${m.room ? ` ${m.room}` : ""}`
          days.forEach((d) => {
            if (!baseMap[d]) return
            baseMap[d].push({ start, end, label, color, courseCode: course.courseCode })
          })
        })
      })
    })

    const laidOut: Record<string, LaidOutEvent[]> = {
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
  }, [courses, courseColors])

  const startOfDay = 8 * 60
  const endOfDay = 22 * 60
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60
  const rowPx = 64
  const viewHeight = intervals * rowPx

  if (!enabled) {
    return (
      <PaneContainer>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Calendar className="size-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Schedule Feature Disabled</h3>
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
            <PaneToolbarItem>Weekly Calendar</PaneToolbarItem>
          </div>
        </PaneToolbar>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-4 mb-4">
            <Calendar className="size-12 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Schedule Yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Add sessions from course pages to see your weekly calendar.
          </p>
        </div>
      </PaneContainer>
    )
  }

  return (
    <PaneContainer onFoldChange={onFoldChange}>
      <PaneToolbar foldable>
        <div className="flex items-center justify-between">
          <PaneToolbarItem>Weekly Calendar</PaneToolbarItem>
        </div>
      </PaneToolbar>

      {/* Course legend */}
      {courses.length > 0 && (
        <div className="flex-none px-4 py-3 border-b bg-muted/20">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {courses.map((c) => (
              <div key={c.id} className="flex items-center gap-2 min-w-0">
                <div
                  className="size-2.5 rounded-full shrink-0"
                  style={{
                    background: courseColors.get(c.courseCode) || sessionColors[0],
                  }}
                />
                <Link
                  href={`/courses/${encodeURIComponent(c.courseCode)}`}
                  className="text-xs hover:underline truncate"
                >
                  {c.courseCode}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <PaneContent className="overflow-auto p-4">
        <div className="min-w-[600px]">
          {/* Header days row */}
          <div className="grid grid-cols-8 mb-1">
            <div className="text-xs font-medium text-muted-foreground px-2 py-2" />
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-xs font-semibold text-center px-2 py-2 border-b-2 border-foreground/20"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-8">
            {/* Time axis */}
            <div className="col-span-1 border-r border-foreground/10">
              {Array.from({ length: intervals + 1 }, (_, i) => {
                const minutes = startOfDay + i * 60
                const hour = Math.floor(minutes / 60)
                const label = `${((hour + 11) % 12) + 1} ${hour >= 12 ? "PM" : "AM"}`
                return (
                  <div
                    key={`t-${i}`}
                    className="text-[10px] text-muted-foreground px-1.5 flex items-start justify-end"
                    style={{
                      transform: "translateY(-7px)",
                      height: `${rowPx}px`,
                    }}
                  >
                    {label}
                  </div>
                )
              })}
            </div>

            {/* Days columns */}
            <div className="col-span-7">
              <div
                className="grid grid-cols-7 relative"
                style={{ height: `${viewHeight}px` }}
              >
                {/* Hour gridlines */}
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
                      return (
                        <div
                          key={`${ev.courseCode}-${i}`}
                          className="absolute rounded text-[10px] leading-tight shadow-sm border px-1 py-0.5 overflow-hidden"
                          style={{
                            top: `${topPct}%`,
                            height: `${heightPct}%`,
                            left: `calc(${leftPct}% + 1px)`,
                            width: `calc(${widthPct}% - 2px)`,
                            background: `color-mix(in oklab, ${ev.color} 60%, transparent)`,
                            borderColor: ev.color,
                          }}
                          title={ev.label}
                        >
                          <div className="truncate font-medium">{ev.label}</div>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PaneContent>
    </PaneContainer>
  )
}
