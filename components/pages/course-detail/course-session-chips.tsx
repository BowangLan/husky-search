import { useRef, useState } from "react"
import { useToggleSchedule } from "@/store/schedule.store"
import { X } from "lucide-react"
import { toast } from "sonner"

import { getEnrollOutlineClasses } from "@/lib/session-utils"
import { capitalize, cn, expandDays } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import {
  CourseSessionsProvider,
  useCourseSessions,
} from "./course-sessions-context"
import { useScheduleToggleWithToasts } from "./use-schedule-toggle"

const DELAYED_HOVER_TIMEOUT = 200

const SessionChip = ({
  session,
  parentSessionId,
}: {
  session: any
  parentSessionId?: string
}) => {
  const {
    data,
    getSessionEnrollState,
    selectedSessionIds,
    setSelectedSessionIds,
    pinnedSessionIds,
    setPinnedSessionIds,
  } = useCourseSessions()

  const selectedSessionIdSet = new Set(selectedSessionIds)
  const delayedHoverTimeout = useRef<NodeJS.Timeout | null>(null)

  const { triggerToggle, isScheduled } = useScheduleToggleWithToasts(session)

  const enrollState = getSessionEnrollState(session)
  const chipClasses = getEnrollOutlineClasses(enrollState)

  const isSelected = selectedSessionIdSet.has(session.id)
  const isPinned = pinnedSessionIds.includes(session.id)

  const handleHover = () => {
    if (selectedSessionIdSet.size > 0) {
      setSelectedSessionIds(
        parentSessionId ? [parentSessionId, session.id] : [session.id]
      )
    } else {
      delayedHoverTimeout.current = setTimeout(() => {
        setSelectedSessionIds(
          parentSessionId ? [parentSessionId, session.id] : [session.id]
        )
      }, DELAYED_HOVER_TIMEOUT)
    }
  }

  const handleClick = () => {
    triggerToggle()
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 justify-center text-xs border trans",
        "transition-colors duration-150 cursor-pointer",
        chipClasses,
        // isPinned &&
        //   "bg-purple-600 text-white border-purple-600 dark:bg-purple-600 dark:text-white dark:border-purple-600",
        isScheduled &&
          "bg-purple-600 text-white border-purple-600 dark:bg-purple-600 dark:text-white dark:border-purple-600",
        selectedSessionIdSet.size > 0 &&
          !isSelected &&
          !isPinned &&
          "opacity-40"
      )}
      onMouseEnter={() => {
        handleHover()
      }}
      onMouseLeave={() => {
        if (delayedHoverTimeout.current) {
          clearTimeout(delayedHoverTimeout.current)
          delayedHoverTimeout.current = null
        }
      }}
      onFocus={() => {
        handleHover()
      }}
      onBlur={() => {
        if (delayedHoverTimeout.current) {
          clearTimeout(delayedHoverTimeout.current)
          delayedHoverTimeout.current = null
        }
      }}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        handleClick()
      }}
    >
      {/* <span className={cn("size-1.5 rounded-full", dotClasses)} /> */}
      <span className="font-medium tabular-nums">{session.code}</span>
    </div>
  )
}

export const SessionChips = () => {
  const {
    data,
    selectedSessionIds,
    setSelectedSessionIds,
    showOpenOnly,
    selectedWeekDaySet,
    pinnedSessionIds,
    setPinnedSessionIds,
  } = useCourseSessions()
  const termData = data.myplanCourse?.currentTermData?.[0]
  let sessions = termData?.sessions

  if (selectedWeekDaySet.size > 0) {
    sessions = sessions?.filter((session) =>
      session.meetingDetailsList.some((m) =>
        expandDays(m.days).some((d) => selectedWeekDaySet.has(d))
      )
    )
  }

  if (showOpenOnly) {
    sessions = sessions?.filter(
      (session) =>
        session.stateKey === "active" &&
        session.enrollCount < session.enrollMaximum
    )
  }

  if (typeof sessions === "undefined") return null

  const hasDoubleLetterCode = sessions.some(
    (session) => session.code.length > 1
  )

  if (!hasDoubleLetterCode) {
    return (
      <div className="flex flex-row items-center flex-wrap gap-2">
        {sessions.map((session) => {
          return <SessionChip key={session.id} session={session} />
        })}
      </div>
    )
  }

  // Group sessions by first letter
  const groupedSessions = sessions
    .toSorted((a, b) => a.code.localeCompare(b.code))
    .reduce(
      (acc, session) => {
        const code = session.code
        if (code.length === 1) {
          if (!acc[code]) {
            acc[code] = {
              sessions: [session],
              parentSessionId: session.id,
            }
          } else {
            // should not happen
            acc[code].sessions.push(session)
          }
        } else {
          if (!acc[code[0]]) {
            // should not happen
            acc[code[0]] = {
              sessions: [],
              parentSessionId: undefined,
            }
          }

          acc[code[0]].sessions.push(session)
        }
        return acc
      },
      {} as Record<
        string,
        {
          sessions: any[]
          parentSessionId?: string
        }
      >
    )

  return (
    <div className="flex flex-col gap-2 w-full">
      {Object.entries(groupedSessions).map(([letter, sessions], idx) => {
        return (
          <div
            className="flex flex-row items-center flex-wrap gap-2"
            key={letter}
          >
            {sessions.sessions.map((session) => {
              return (
                <SessionChip
                  key={session.id}
                  session={session}
                  parentSessionId={sessions.parentSessionId}
                />
              )
            })}

            {/* last */}
            {idx === Object.entries(groupedSessions).length - 1 &&
              pinnedSessionIds.length > 0 && (
                <>
                  <div className="flex-1"></div>

                  {/* Clear button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-3 hover:bg-foreground/5 dark:hover:bg-foreground/10 text-muted-foreground"
                    onClick={() => setPinnedSessionIds([])}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </>
              )}
          </div>
        )
      })}
    </div>
  )
}
