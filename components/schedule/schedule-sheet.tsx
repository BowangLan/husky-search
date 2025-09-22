"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  useClearSchedule,
  useRemoveFromSchedule,
  useScheduledSessions,
} from "@/store/schedule.store"
import { Calendar, Clock, List, MapPin, Trash2 } from "lucide-react"

import { expandDays, weekDays } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FilterTabItem, FilterTabList } from "@/components/ui/filter-tabs"
import { CopySLNButton } from "@/components/copy-sln-button"
import { isScheduleFeatureEnabled } from "@/config/features"

export function ScheduleSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!isScheduleFeatureEnabled()) return null
  const sessions = useScheduledSessions()
  const remove = useRemoveFromSchedule()
  const clear = useClearSchedule()
  const [viewType, setViewType] = useState<"list" | "calendar">("list")

  // Keyboard shortcut: Alt+S to toggle dialog (avoid typing fields)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey) return
      const k = e.key?.toLowerCase()
      if (k !== "s") return
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName
        const isEditable = (target as any).isContentEditable
        if (
          isEditable ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          (target as any).closest?.('[role="textbox"]')
        ) {
          return
        }
      }
      e.preventDefault()
      onOpenChange(!open)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  // Calendar helpers (mirrors course-sessions-calendar-view)
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
    session: any
    meeting?: Meeting
  }
  type LaidOutEvent = CalendarEvent & { col: number; cols: number }

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
    "var(--color-red-500)",
    "var(--color-orange-500)",
    "var(--color-amber-500)",
    "var(--color-yellow-500)",
    "var(--color-lime-500)",
    "var(--color-green-500)",
    "var(--color-emerald-500)",
    "var(--color-teal-500)",
    "var(--color-cyan-500)",
    "var(--color-sky-500)",
    "var(--color-blue-500)",
    "var(--color-indigo-500)",
    "var(--color-violet-500)",
    "var(--color-purple-500)",
    "var(--color-fuchsia-500)",
    "var(--color-pink-500)",
    "var(--color-rose-500)",
  ]

  // Group sessions by course for list and calendar coloring
  const courses = useMemo(() => {
    const map: Record<
      string,
      {
        code: string
        title?: string
        credit?: string | number
        sessions: typeof sessions
      }
    > = {}
    sessions.forEach((s) => {
      const code = s.courseCode || "Unknown"
      if (!map[code]) {
        map[code] = {
          code,
          title: s.courseTitle,
          credit: s.courseCredit,
          sessions: [],
        }
      }
      // prefer to keep first non-empty meta
      if (!map[code].title && s.courseTitle) map[code].title = s.courseTitle
      if (!map[code].credit && s.courseCredit !== undefined)
        map[code].credit = s.courseCredit
      map[code].sessions.push(s)
    })
    return Object.values(map)
  }, [sessions])

  const courseColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    courses.forEach((c, idx) => {
      colorMap.set(c.code, sessionColors[idx % sessionColors.length])
    })
    return colorMap
  }, [courses])

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
    sessions.forEach((session) => {
      const color =
        courseColors.get(session.courseCode || "Unknown") || sessionColors[0]
      const details: Meeting[] = Array.isArray(session.meetingDetailsList)
        ? session.meetingDetailsList
        : []
      details.forEach((m) => {
        const range = parseTimeRangeToMinutes(m.time)
        const days = expandDays(m.days)
        if (!range || days.length === 0) return
        const [start, end] = range
        const label = `${session.courseCode ?? ""} ${session.code}${
          m.building ? ` • ${m.building}` : ``
        }${m.room ? ` ${m.room}` : ``}`
        days.forEach((d) => {
          if (!baseMap[d]) return
          baseMap[d].push({ start, end, label, color, session, meeting: m })
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
  }, [sessions])

  const startOfDay = 8 * 60
  const endOfDay = 22 * 60
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60
  const rowPx = 64
  const viewHeight = intervals * rowPx

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="size-4" />
            My Schedule
          </DialogTitle>
          <DialogDescription>
            Sessions you have added to your weekly schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center flex-none mb-4">
            {/* View toggle */}
            <div>
              <FilterTabList>
                <FilterTabItem
                  square={true}
                  active={viewType === "list"}
                  onClick={() => setViewType("list")}
                >
                  <List className="size-4" />
                </FilterTabItem>
                <FilterTabItem
                  square={true}
                  active={viewType === "calendar"}
                  onClick={() => setViewType("calendar")}
                >
                  <Calendar className="size-4" />
                </FilterTabItem>
              </FilterTabList>
            </div>
          </div>

          {/* List View */}
          <div
            className="pb-24 space-y-3 flex-1 overflow-y-auto"
            style={{ display: viewType === "list" ? "block" : "none" }}
          >
            {sessions.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No sessions yet. Add sessions from course pages or the calendar
                view.
              </div>
            ) : (
              courses.map((c) => (
                <div key={c.code} className="rounded-md border">
                  {/* Course header */}
                  <div className="px-3 py-3 border-b flex items-center gap-2">
                    {/* <div
                      className="size-2 rounded-full"
                      style={{
                        background:
                          courseColors.get(c.code) || sessionColors[0],
                      }}
                    /> */}

                    <div className="min-w-0 flex flex-col">
                      <div className="font-medium truncate text-base/tight flex items-center gap-2">
                        <Link
                          href={`/courses/${encodeURIComponent(c.code)}`}
                          className="hover:text-purple-500 trans"
                        >
                          {c.code}
                        </Link>
                        {c.credit !== undefined ? (
                          <div className="text-xs/tight text-muted-foreground">
                            {String(c.credit)} cr
                            {/* {String(c.credit) === "1" ? "" : "s"} */}
                          </div>
                        ) : null}
                      </div>
                      {c.title ? (
                        <span className="text-muted-foreground text-xs/tight truncate">
                          {c.title}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Sessions under course */}
                  <div className="p-3 space-y-3">
                    {c.sessions.map((s) => (
                      <div key={s.id} className="">
                        <div className="flex items-center gap-2">
                          <div className="font-medium truncate">
                            {s.code}
                            {s.type ? (
                              <span className="text-muted-foreground">
                                {" "}
                                • {s.type}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex-1" />
                          {s.registrationCode ? (
                            <CopySLNButton session={s} />
                          ) : null}
                        </div>
                        {s.instructor ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.instructor}
                          </div>
                        ) : null}
                        <div className="mt-2 space-y-1">
                          {(s.meetingDetailsList ?? []).map((m, i) => (
                            <div
                              key={i}
                              className="text-[13px] text-foreground/80 flex flex-wrap items-center gap-x-3 gap-y-1"
                            >
                              <span className="inline-flex items-center gap-1.5 tabular-nums">
                                <Clock className="size-4 opacity-70" />
                                {(m.days && m.days.trim()) || "TBA"}
                                {m.time ? ` • ${m.time}` : ""}
                              </span>
                              {(m.building || m.room) && (
                                <span className="inline-flex items-center gap-1.5 uppercase">
                                  <span className="text-foreground/30">•</span>
                                  <MapPin className="size-4 opacity-70" />
                                  {m.building ? `${m.building}` : null}
                                  {m.room ? ` ${m.room}` : ""}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => remove(s.id)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Calendar View */}
          <div
            className="px-4 pb-24 flex-col"
            style={{ display: viewType === "calendar" ? "flex" : "none" }}
          >
            <div className="w-full overflow-x-auto flex-1 flex flex-col">
              {/* Course legend */}
              {courses.length > 0 && (
                <div className="px-2 pb-3 flex flex-wrap gap-x-4 gap-y-2 flex-none">
                  {courses.map((c) => (
                    <div
                      key={`legend-${c.code}`}
                      className="flex items-center gap-2 min-w-0"
                    >
                      <div
                        className="size-2 rounded-full"
                        style={{
                          background:
                            courseColors.get(c.code) || sessionColors[0],
                        }}
                      />
                      <div className="text-xs min-w-0">
                        <Link
                          href={`/courses/${encodeURIComponent(c.code)}`}
                          className="underline underline-offset-2 hover:text-purple-500 trans"
                        >
                          {c.code}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-y-auto flex-1">
                {/* Header days row */}
                <div className="grid grid-cols-8">
                  <div />
                  {weekDays.map((d) => (
                    <div
                      key={d}
                      className="text-xs font-medium text-muted-foreground px-2 py-2 border-b border-foreground/10"
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
                      const label = `${((hour + 11) % 12) + 1} ${
                        hour >= 12 ? "PM" : "AM"
                      }`
                      return (
                        <div
                          key={`t-${i}`}
                          className="text-[11px] text-muted-foreground px-2 flex items-start justify-end"
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
                            const topPct =
                              ((ev.start - startOfDay) / totalMinutes) * 100
                            const heightPct =
                              ((ev.end - ev.start) / totalMinutes) * 100
                            const widthPct = 100 / (ev.cols || 1)
                            const leftPct = (ev.col || 0) * widthPct
                            return (
                              <div
                                key={`${ev.session.id}-${i}`}
                                className="absolute rounded-md text-[11px] leading-tight shadow-sm border px-1.5 py-1 trans"
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
                                <div className="truncate">{ev.label}</div>
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
          </div>
        </div>

        <div className="mt-auto p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => clear()}
              disabled={sessions.length === 0}
            >
              Clear all
            </Button>
            <Button className="flex-1" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
