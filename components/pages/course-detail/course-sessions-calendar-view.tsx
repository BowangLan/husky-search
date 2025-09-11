import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  useIsSessionScheduled,
  useToggleSchedule,
} from "@/store/schedule.store"
import {
  AlertCircle,
  CalendarMinus,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  Info,
  KeyRound,
  MapPin,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { MyPlanCourseDetail } from "@/types/myplan"
import {
  getEnrollOutlineClasses,
  getEnrollPrimaryClasses,
  getSessionEnrollState,
} from "@/lib/session-utils"
import {
  capitalize,
  cn,
  expandDays,
  formatTimeString,
  weekDays,
} from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CopySLNButton } from "@/components/copy-sln-button"
import { SessionEnrollProgress } from "@/components/session-enroll-progress"

import { useCourseSessions } from "./course-sessions-context"
import { SessionScheduleToggleButton } from "./session-schedule-toggle-button"

type Meeting = {
  building?: string
  campus?: string
  days?: string
  room?: string
  time?: string
}

function parseTimeRangeToMinutes(range?: string): [number, number] | null {
  if (!range) return null
  // Example: "8:30 AM - 9:50 AM"
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

type CalendarEvent = {
  start: number
  end: number
  label: string
  color: string
  session: any
  meeting?: Meeting
}

type LaidOutEvent = CalendarEvent & { col: number; cols: number }

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

const SESSION_EVENT_CARD_TYPE = "session-event-card"

const CalendarEventCard = ({
  topPct,
  heightPct,
  leftPct,
  widthPct,
  event,
}: {
  topPct: number
  heightPct: number
  leftPct: number
  widthPct: number
  event: CalendarEvent
}) => {
  const { data, getSessionEnrollState } = useCourseSessions()
  const code: string =
    typeof event.session?.code === "string" ? event.session.code : ""
  const alphabetic = code.replace(/[^A-Za-z]/g, "")
  const isTwoLetters = alphabetic.length === 2

  const baseColor = `${event.color}`
  const borderColor = isTwoLetters
    ? `color-mix(in oklab, ${baseColor} 40%, transparent)`
    : baseColor
  const backgroundColor = isTwoLetters
    ? `color-mix(in oklab, ${baseColor} 10%, transparent)`
    : `color-mix(in oklab, ${baseColor} 60%, transparent)`

  const enrollState = getSessionEnrollState(event.session)
  const enrollStateClasses = getEnrollOutlineClasses(enrollState)
  const enrollStatePrimaryClasses = getEnrollPrimaryClasses(enrollState)
  const [copied, setCopied] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const openTimerRef = useRef<number | null>(null)
  const enrollCount = Number((event.session as any).enrollCount ?? 0)
  const enrollMaximum = Number((event.session as any).enrollMaximum ?? 0)
  const isClosed = enrollCount >= enrollMaximum
  const capacityPct = Math.min(
    100,
    (enrollCount / Math.max(1, enrollMaximum)) * 100
  )

  const sessionRaw =
    data.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
      (item: any) => item.activityId === event.session.id
    ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

  const handleCopy = async (value: string | number) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(true)
      toast.success(`Copied SLN ${String(value)}`)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      toast.error("Unable to copy. Clipboard may be blocked.")
    }
  }

  const openNow = () => {
    // using data-session-id to highlight all sessions with the same id
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

    openTimerRef.current = window.setTimeout(() => {
      setIsOpen(true)
    }, 500)
  }

  const closeSoon = () => {
    // remove highlight and unhighlight classes
    Array.from(
      document.querySelectorAll(`[data-type="${SESSION_EVENT_CARD_TYPE}"]`)
    ).forEach((el) => {
      el.classList.remove("card-highlight")
      el.classList.remove("card-unhighlight")
    })

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current)
      openTimerRef.current = null
    }

    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false)
    }, 120)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "absolute rounded-md text-[11px] leading-tight shadow-sm border px-1.5 py-1 trans",
            enrollStateClasses
          )}
          style={{
            top: `${topPct}%`,
            height: `${heightPct}%`,
            left: `calc(${leftPct}% + 1px)`,
            width: `calc(${widthPct}% - 2px)`,
          }}
          title={event.label}
          data-session-id={event.session?.id}
          data-type={SESSION_EVENT_CARD_TYPE}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
          onFocus={openNow}
          onBlur={closeSoon}
        >
          <div className="flex items-center">
            <div
              className={cn(
                "size-1.5 rounded-full mr-1",
                enrollStatePrimaryClasses
              )}
            />
            {/* <div className="truncate">{event.session.code}</div> */}
            <div className="truncate">
              {event.session.code}{" "}
              {event.meeting?.building
                ? ` • ${event.meeting.building} ${event.meeting.room}`
                : ""}
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="py-3 px-4 w-[380px] md:w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <div className="space-y-3 mb-2">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "size-2 rounded-full flex-none",
                    enrollStatePrimaryClasses
                  )}
                />
                <h3 className="text-base font-semibold tracking-tight truncate">
                  {event.session.code}
                </h3>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground uppercase">
                  {capitalize(event.session.type)}
                </span>
                {sessionRaw?.addCodeRequired && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <KeyRound className="size-4 opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      This session requires an add code.
                    </TooltipContent>
                  </Tooltip>
                )}
                {sessionRaw?.sectionComments && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-4 opacity-70" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[288px]">
                        {sessionRaw.sectionComments}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <SessionScheduleToggleButton session={event.session} />
              <CopySLNButton session={event.session} />
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

          {/* Meetings */}
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

          {/* Enrollment */}
          <div className="space-y-2">
            <SessionEnrollProgress
              session={event.session}
              sessionRaw={sessionRaw}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export const CourseSessionsCalendarView = () => {
  const { displayedSessions } = useCourseSessions()

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

    displayedSessions.forEach((session, idx) => {
      const color = sessionColors[idx % sessionColors.length]
      const details: Meeting[] = Array.isArray(session.meetingDetailsList)
        ? session.meetingDetailsList
        : []
      details.forEach((m) => {
        const range = parseTimeRangeToMinutes(m.time)
        const days = expandDays(m.days)
        if (!range || days.length === 0) return
        const [start, end] = range
        const label = `${session.code}${m.building ? ` • ${m.building}` : ""}${
          m.room ? ` ${m.room}` : ""
        }`
        days.forEach((d) => {
          if (!baseMap[d]) return
          baseMap[d].push({ start, end, label, color, session, meeting: m })
        })
      })
    })
    // Layout concurrent events into columns per day
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
  }, [displayedSessions])

  // Layout window and sizing
  const startOfDay = 8 * 60 // 8:00 AM
  const endOfDay = 22 * 60 // 10:00 PM
  const totalMinutes = endOfDay - startOfDay
  const intervals = (endOfDay - startOfDay) / 60 // 12 one-hour blocks
  const rowPx = 64
  const viewHeight = intervals * rowPx // 576px

  const hourLabels = Array.from({ length: intervals + 1 }, (_, i) => {
    const minutes = startOfDay + i * 60
    const hour = Math.floor(minutes / 60)
    return `${((hour + 11) % 12) + 1} ${hour >= 12 ? "PM" : "AM"}`
  })

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[960px]">
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
            {hourLabels.map((label, i) => (
              <div
                key={`t-${i}`}
                className="text-[11px] text-muted-foreground px-4 flex items-start justify-end"
                style={{ transform: "translateY(-7px)", height: `${rowPx}px` }}
              >
                {label}
              </div>
            ))}
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
                    const heightPct = ((ev.end - ev.start) / totalMinutes) * 100
                    const widthPct = 100 / (ev.cols || 1)
                    const leftPct = (ev.col || 0) * widthPct
                    return (
                      <CalendarEventCard
                        key={`${ev.session.id}-${i}`}
                        topPct={topPct}
                        heightPct={heightPct}
                        leftPct={leftPct}
                        widthPct={widthPct}
                        event={ev}
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
