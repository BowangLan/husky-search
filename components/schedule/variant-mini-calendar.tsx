"use client"

import { useMemo } from "react"
import { type ScheduleSession } from "@/store/schedule.store"
import { expandDays, weekDays } from "@/lib/utils"

type Meeting = {
  days?: string
  time?: string
}

type CalendarEvent = {
  start: number
  end: number
  session: ScheduleSession
  courseCode: string
  meeting?: Meeting
}

type LaidOutEvent = CalendarEvent & { col: number; cols: number }

function parseTimeRangeToMinutes(range?: string): [number, number] | null {
  if (!range) return null
  const [start, end] = String(range).split("-").map((s) => s.trim())
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

type VariantMiniCalendarProps = {
  courses: Array<{
    courseCode: string
    sessions: ScheduleSession[]
  }>
  variantColor?: string
}

export function VariantMiniCalendar({
  courses,
  variantColor,
}: VariantMiniCalendarProps) {
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

    courses.forEach((course) => {
      course.sessions.forEach((session) => {
        const details: Meeting[] = Array.isArray(session.meetingDetailsList)
          ? session.meetingDetailsList
          : []
        details.forEach((m) => {
          const range = parseTimeRangeToMinutes(m.time)
          const days = expandDays(m.days)
          if (!range || days.length === 0) return
          const [start, end] = range
          days.forEach((d) => {
            if (!baseMap[d]) return
            baseMap[d].push({
              start,
              end,
              session,
              meeting: m,
              courseCode: course.courseCode,
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
  }, [courses])

  const startOfDay = 8 * 60
  const endOfDay = 22 * 60
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60
  const rowPx = 24 // Small row height for compact variant calendar
  const viewHeight = intervals * rowPx

  const hasEvents = useMemo(() => {
    return Object.values(eventsByDay).some((events) => events.length > 0)
  }, [eventsByDay])

  const defaultColor = variantColor || "var(--color-purple-500)"

  if (!hasEvents) {
    return (
      <div className="text-[10px] text-muted-foreground px-2 py-4 text-center">
        No scheduled sessions with meeting times
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="text-[10px] font-medium text-muted-foreground px-1 py-1 flex-shrink-0 border-b">
        Weekly Schedule
      </div>
      <div className="overflow-auto flex-1 min-h-[200px]">
        <div className="grid grid-cols-8">
          <div />
          {weekDays.map((d) => (
            <div
              key={d}
              className="text-[9px] font-medium text-muted-foreground px-0.5 py-0.5 border-b border-foreground/10 text-center"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-8">
          <div className="col-span-1 border-r border-foreground/10">
            {Array.from({ length: intervals + 1 }, (_, i) => {
              const minutes = startOfDay + i * 60
              const hour = Math.floor(minutes / 60)
              const label = `${((hour + 11) % 12) + 1}${hour >= 12 ? "P" : "A"}`
              return (
                <div
                  key={`t-${i}`}
                  className="text-[8px] text-muted-foreground px-0.5 flex items-start justify-end"
                  style={{ transform: "translateY(-3px)", height: `${rowPx}px` }}
                >
                  {label}
                </div>
              )
            })}
          </div>

          <div className="col-span-7">
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
                    const heightPct =
                      ((ev.end - ev.start) / totalMinutes) * 100
                    const widthPct = 100 / (ev.cols || 1)
                    const leftPct = (ev.col || 0) * widthPct

                    return (
                      <div
                        key={`${ev.session.id}-${i}`}
                        className="absolute rounded text-[8px] leading-tight shadow-sm border px-0.5 py-0.5 overflow-hidden"
                        style={{
                          top: `${topPct}%`,
                          height: `${heightPct}%`,
                          left: `calc(${leftPct}% + 1px)`,
                          width: `calc(${widthPct}% - 2px)`,
                          background: `color-mix(in oklab, ${defaultColor} 60%, transparent)`,
                          borderColor: defaultColor,
                        }}
                        title={`${ev.courseCode} ${ev.session.code}`}
                      >
                        <div className="truncate text-[8px]">
                          {ev.courseCode} {ev.session.code}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

