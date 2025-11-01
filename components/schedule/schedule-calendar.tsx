"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Clock, MapPin, User } from "lucide-react"

import { type ScheduleCourse, type ScheduleSession } from "@/store/schedule.store"
import { cn, expandDays, weekDays } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { CopySLNButton } from "@/components/copy-sln-button"
import { SessionEnrollProgress } from "@/components/session-enroll-progress"

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
  isFixed?: boolean
  isGrayedOut?: boolean
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

const SESSION_EVENT_CARD_TYPE = "session-event-card"

function CalendarEventCard({
  topPct,
  heightPct,
  leftPct,
  widthPct,
  event,
  sessionData,
}: {
  topPct: number
  heightPct: number
  leftPct: number
  widthPct: number
  event: CalendarEvent
  sessionData?: any
}) {
  const [isOpen, setIsOpen] = useState(false)
  const openTimerRef = useRef<number | null>(null)
  const closeTimerRef = useRef<number | null>(null)

  const openNow = () => {
    Array.from(
      document.querySelectorAll(`[data-type="${SESSION_EVENT_CARD_TYPE}"]`)
    ).forEach((el) => {
      if ((el as HTMLElement).dataset.sessionId === event.session.id) {
        el.classList.add("card-highlight")
      } else {
        el.classList.add("card-unhighlight")
      }
    })

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    openTimerRef.current = window.setTimeout(() => setIsOpen(true), 500)
  }

  const closeSoon = () => {
    Array.from(
      document.querySelectorAll(`[data-type="${SESSION_EVENT_CARD_TYPE}"]`)
    ).forEach((el) => {
      el.classList.remove("card-highlight")
      el.classList.remove("card-unhighlight")
    })

    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "absolute rounded-md text-[11px] leading-tight shadow-sm border px-1.5 py-1 trans",
            event.isGrayedOut && "opacity-40"
          )}
          style={{
            top: `${topPct}%`,
            height: `${heightPct}%`,
            left: `calc(${leftPct}% + 1px)`,
            width: `calc(${widthPct}% - 2px)`,
            background: `color-mix(in oklab, ${event.color} 60%, transparent)`,
            borderColor: event.color,
          }}
          title={event.label}
          data-session-id={event.session.id}
          data-type={SESSION_EVENT_CARD_TYPE}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          onFocus={openNow}
          onBlur={closeSoon}
        >
          <div className="flex flex-col gap-0.5">
            <div className="truncate">{event.courseCode} {event.session.code}</div>
            {(event.meeting?.building || event.meeting?.room) && (
              <div className="truncate text-[10px] opacity-90">
                {event.meeting?.building || ""}
                {event.meeting?.building && event.meeting?.room ? " " : ""}
                {event.meeting?.room || ""}
              </div>
            )}
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="py-3 px-4 w-[360px] md:w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <div className="space-y-3 mb-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight truncate">
                  {event.session.code}
                </h3>
                <Link
                  href={`/courses/${encodeURIComponent(event.courseCode)}`}
                  className="text-[12px] underline underline-offset-2 hover:text-purple-500 trans"
                >
                  {event.courseCode}
                </Link>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <CopySLNButton session={event.session as any} />
            </div>
          </div>

          {event.session.instructor && (
            <div>
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground truncate">
                <User className="size-4 opacity-70" />
                <span className="truncate">{event.session.instructor}</span>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-1">
            {Array.isArray((event.session as any).meetingDetailsList) &&
              (event.session as any).meetingDetailsList.length > 0 &&
              (event.session as any).meetingDetailsList.map(
                (
                  meeting: {
                    days?: string
                    time?: string
                    building?: string
                    room?: string
                    campus?: string
                  },
                  i: number
                ) => (
                  <div
                    key={i}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-foreground/80"
                  >
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Clock className="size-4 opacity-70" />
                      {(meeting.days && meeting.days.trim()) || "TBA"}
                      {meeting.time ? ` • ${meeting.time}` : ""}
                    </span>
                    {(meeting.building || meeting.room) && (
                      <span className="inline-flex items-center gap-1.5 uppercase">
                        <span className="text-foreground/30">•</span>
                        <MapPin className="size-4 opacity-70" />
                        {!!meeting.building ? (
                          <Link
                            href={`http://uw.edu/maps/?${meeting.building}`}
                            className="underline underline-offset-2 hover:text-purple-500 trans"
                          >
                            {meeting.building}
                          </Link>
                        ) : null}
                        {meeting.room ? ` ${meeting.room}` : ""}
                      </span>
                    )}
                  </div>
                )
              )}
          </div>

          <Separator />

          <div className="space-y-2">
            <SessionEnrollProgress session={(sessionData ?? event.session) as any} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function ScheduleCalendar({
  courses,
  sessionDataMap,
  selectedVariants,
  variantColors,
}: {
  courses: ScheduleCourse[]
  sessionDataMap?: Map<string, any>
  selectedVariants?: Array<{
    id: string
    courses: Array<{
      courseCode: string
      courseTitle?: string
      courseCredit?: string | number
      sessions: ScheduleSession[]
    }>
  }>
  variantColors?: Map<string, string>
}) {
  const courseColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    courses.forEach((c, idx) => {
      colorMap.set(c.courseCode, sessionColors[idx % sessionColors.length])
    })
    return colorMap
  }, [courses])

  // Merge variant courses with regular courses for display
  const allCoursesToDisplay = useMemo(() => {
    const baseCourses = [...courses]
    
    if (selectedVariants && selectedVariants.length > 0) {
      // Add variant courses with their variant-specific colors
      selectedVariants.forEach((variant) => {
        variant.courses.forEach((variantCourse) => {
          // Check if this course already exists in base courses
          const existingCourse = baseCourses.find(
            (c) => c.courseCode === variantCourse.courseCode
          )
          
          if (!existingCourse) {
            // Course doesn't exist in base, add it with variant color
            baseCourses.push({
              id: `${variant.id}-${variantCourse.courseCode}`,
              courseCode: variantCourse.courseCode,
              courseTitle: variantCourse.courseTitle,
              courseCredit: variantCourse.courseCredit,
              sessions: variantCourse.sessions,
            })
          }
        })
      })
    }
    
    return baseCourses
  }, [courses, selectedVariants])

  // Enhanced color mapping that includes variant colors
  const enhancedCourseColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    
    // First, assign colors to regular courses
    courses.forEach((c, idx) => {
      colorMap.set(c.courseCode, sessionColors[idx % sessionColors.length])
    })
    
    // Then, assign variant-specific colors to variant courses
    if (selectedVariants && variantColors) {
      selectedVariants.forEach((variant) => {
        const variantColor = variantColors.get(variant.id)
        if (variantColor) {
          variant.courses.forEach((variantCourse) => {
            // Use variant color for variant courses, but only if not already assigned
            // We'll use a different key to distinguish variant courses
            const variantKey = `${variant.id}-${variantCourse.courseCode}`
            colorMap.set(variantKey, variantColor)
          })
        }
      })
    }
    
    return colorMap
  }, [courses, selectedVariants, variantColors])

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
    
    // Add regular courses (grayed out if variants are selected)
    const hasSelectedVariants = selectedVariants && selectedVariants.length > 0
    courses.forEach((course) => {
      const baseColor = courseColors.get(course.courseCode) || sessionColors[0]
      // Gray out fixed sessions when variants are selected
      const color = hasSelectedVariants 
        ? `color-mix(in oklab, ${baseColor} 30%, gray)`
        : baseColor
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
              color, 
              session, 
              meeting: m, 
              courseCode: course.courseCode,
              isFixed: true,
              isGrayedOut: hasSelectedVariants,
            })
          })
        })
      })
    })
    
    // Add variant courses
    if (selectedVariants && variantColors) {
      selectedVariants.forEach((variant) => {
        const variantColor = variantColors.get(variant.id) || sessionColors[0]
        variant.courses.forEach((variantCourse) => {
          variantCourse.sessions.forEach((session) => {
            const details: Meeting[] = Array.isArray(session.meetingDetailsList)
              ? session.meetingDetailsList
              : []
            details.forEach((m) => {
              const range = parseTimeRangeToMinutes(m.time)
              const days = expandDays(m.days)
              if (!range || days.length === 0) return
              const [start, end] = range
              const label = `${variantCourse.courseCode} ${session.code}${
                m.building ? ` • ${m.building}` : ``
              }${m.room ? ` ${m.room}` : ``} (Variant)`
              days.forEach((d) => {
                if (!baseMap[d]) return
                baseMap[d].push({ 
                  start, 
                  end, 
                  label, 
                  color: variantColor, 
                  session, 
                  meeting: m, 
                  courseCode: variantCourse.courseCode,
                  isFixed: false,
                  isGrayedOut: false,
                })
              })
            })
          })
        })
      })
    }
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
  }, [courses, courseColors, selectedVariants, variantColors])

  const startOfDay = 8 * 60
  const endOfDay = 22 * 60
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60
  const rowPx = 64
  const viewHeight = intervals * rowPx

  return (
    <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
      {(courses.length > 0 || (selectedVariants && selectedVariants.length > 0)) && (
        <div className="pb-3 flex flex-wrap gap-x-4 gap-y-2 flex-none">
          {courses.map((c) => (
            <div key={`legend-${c.id}`} className="flex items-center gap-2 min-w-0">
              <div
                className="size-2 rounded-full"
                style={{
                  background: courseColors.get(c.courseCode) || sessionColors[0],
                }}
              />
              <div className="text-xs min-w-0">
                <Link
                  href={`/courses/${encodeURIComponent(c.courseCode)}`}
                  className="underline underline-offset-2 hover:text-purple-500 trans"
                >
                  {c.courseCode}
                </Link>
              </div>
            </div>
          ))}
          {selectedVariants && variantColors && selectedVariants.map((variant) => {
            const variantColor = variantColors.get(variant.id)
            if (!variantColor) return null
            return variant.courses.map((c) => (
              <div key={`legend-variant-${variant.id}-${c.courseCode}`} className="flex items-center gap-2 min-w-0">
                <div
                  className="size-2 rounded-full"
                  style={{
                    background: variantColor,
                  }}
                />
                <div className="text-xs min-w-0">
                  <Link
                    href={`/courses/${encodeURIComponent(c.courseCode)}`}
                    className="underline underline-offset-2 hover:text-purple-500 trans"
                  >
                    {c.courseCode} (Variant)
                  </Link>
                </div>
              </div>
            ))
          })}
        </div>
      )}

      <div className="overflow-auto flex-1">
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
          <div className="col-span-1 border-r border-foreground/10">
            {Array.from({ length: intervals + 1 }, (_, i) => {
              const minutes = startOfDay + i * 60
              const hour = Math.floor(minutes / 60)
              const label = `${((hour + 11) % 12) + 1} ${hour >= 12 ? "PM" : "AM"}`
              return (
                <div
                  key={`t-${i}`}
                  className="text-[11px] text-muted-foreground px-2 flex items-start justify-end"
                  style={{ transform: "translateY(-7px)", height: `${rowPx}px` }}
                >
                  {label}
                </div>
              )
            })}
          </div>

          <div className="col-span-7">
            <div className="grid grid-cols-7 relative" style={{ height: `${viewHeight}px` }}>
              {Array.from({ length: intervals + 1 }, (_, i) => (
                <div
                  key={`hl-${i}`}
                  className="pointer-events-none absolute left-0 right-0 border-t border-foreground/5"
                  style={{ top: `${(i / intervals) * 100}%` }}
                />
              ))}

              {weekDays.map((d) => (
                <div key={`col-${d}`} className="relative border-r border-foreground/10 last:border-r-0">
                  {eventsByDay[d].map((ev, i) => {
                    const topPct = ((ev.start - startOfDay) / totalMinutes) * 100
                    const heightPct = ((ev.end - ev.start) / totalMinutes) * 100
                    const widthPct = 100 / (ev.cols || 1)
                    const leftPct = (ev.col || 0) * widthPct
                    const sessionData = sessionDataMap?.get(ev.session.id)
                    return (
                      <CalendarEventCard
                        key={`${ev.session.id}-${i}`}
                        topPct={topPct}
                        heightPct={heightPct}
                        leftPct={leftPct}
                        widthPct={widthPct}
                        event={ev}
                        sessionData={sessionData}
                      />
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

export default ScheduleCalendar


