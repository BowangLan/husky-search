import { useState } from "react"
import Link from "next/link"
import { MyplanCourseTermSession } from "@/convex/schema"
import { useIsSessionScheduled } from "@/store/schedule.store"
import { Clock, Info, KeyRound, MapPin, Pin } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { MyPlanCourseDetail } from "@/types/myplan"
import { capitalize, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CopySLNButton } from "@/components/copy-sln-button"
import { SessionEnrollProgress } from "@/components/session-enroll-progress"

import { useCourseSessions } from "./course-sessions-context"
import { InstructorHoverCard } from "./instructor-hover-card"
import { SessionScheduleToggleButton } from "./session-schedule-toggle-button"

export const SessionRowDesktop = ({
  session,
  pinned,
}: {
  session: MyplanCourseTermSession
  pinned?: boolean
}) => {
  const { data } = useCourseSessions()
  const isScheduled = useIsSessionScheduled(session.id)

  const sessionRaw =
    data?.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
      (item: any) => item.activityId === session.id
    ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

  return (
    <div key={session.id} className="group relative hidden lg:block">
      <div
        className={cn(
          "px-4 py-4 md:px-6 flex w-full flex-col gap-3 md:grid md:items-center md:gap-6",
          isScheduled &&
            "bg-gradient-to-r dark:from-primary/40 dark:to-primary/60 from-primary/5 to-primary/15"
        )}
        style={{
          gridTemplateColumns:
            "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(200px,240px) auto",
        }}
      >
        <div>
          <div className={cn("flex items-center gap-2")}>
            {pinned && <Pin className="size-3.5 text-violet-500" />}
            <h3 className="text-sm md:text-base font-medium tracking-tight">
              {session.code}
            </h3>
            {session.addCodeRequired && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <KeyRound className="size-3.5 opacity-70" />
                </TooltipTrigger>
                <TooltipContent>
                  This session requires an add code.
                </TooltipContent>
              </Tooltip>
            )}
            {sessionRaw?.sectionComments && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 opacity-70" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[360px]">{sessionRaw.sectionComments}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex">
            <span className="text-xs text-muted-foreground">
              {capitalize(session.type)}
            </span>
          </div>
        </div>

        <div className="text-sm overflow-hidden min-w-0">
          <InstructorHoverCard
            instructor={session.instructor}
            cecData={data?.cecCourse || []}
          >
            <div
              className={cn(
                `truncate whitespace-nowrap transition-colors flex items-center gap-1.5`,
                data?.cecCourse?.some(
                  (item) => item.professor === session.instructor
                )
                  ? "text-foreground cursor-default hover:text-foreground"
                  : "text-muted-foreground"
              )}
              style={{
                opacity: data?.cecCourse?.some(
                  (item) => item.professor === session.instructor
                )
                  ? 1
                  : 0.7,
              }}
            >
              {session.instructor}
              {data?.cecCourse?.some(
                (item) => item.professor === session.instructor
              ) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>CEC data available</TooltipContent>
                </Tooltip>
              )}
            </div>
          </InstructorHoverCard>
        </div>

        <div className="text-sm">
          {Array.isArray(session.meetingDetailsList) &&
            session.meetingDetailsList.length > 0 && (
              <div className="space-y-1">
                {session.meetingDetailsList.map(
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
                      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-foreground/80"
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
                              target="_blank"
                              rel="noopener noreferrer"
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
            )}
        </div>

        <div className="flex items-center gap-2">
          <CopySLNButton session={session} />
        </div>

        <div>
          <SessionEnrollProgress session={session} />
        </div>

        <SessionScheduleToggleButton session={session} />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-foreground/[0.02] dark:bg-foreground/[0.03]" />
      </div>
    </div>
  )
}

export const SessionRowMobile = ({
  session,
  pinned,
}: {
  session: MyplanCourseTermSession
  pinned?: boolean
}) => {
  const { data } = useCourseSessions()

  const sessionRaw =
    data?.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
      (item: any) => item.activityId === session.id
    ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

  return (
    <div key={session.id} className="group relative lg:hidden">
      <div className="px-4 py-4 flex flex-col gap-3 w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          {/* Code & Type */}
          <div>
            <div className={cn("flex items-center gap-2")}>
              {pinned && <Pin className="size-3.5 text-violet-500" />}
              <h3 className="text-sm md:text-base font-medium tracking-tight">
                {session.code}
              </h3>
              {session.addCodeRequired && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <KeyRound className="size-3.5 opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    This session requires an add code.
                  </TooltipContent>
                </Tooltip>
              )}
              {sessionRaw?.sectionComments && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3.5 opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-[360px]">
                      {sessionRaw.sectionComments}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="flex">
              <span className="text-xs text-muted-foreground">
                {capitalize(session.type)}
              </span>
            </div>
          </div>

          {/* Copy SLN and Add/Remove */}
          <div className="flex items-center gap-1">
            <CopySLNButton session={session} />
            <SessionScheduleToggleButton session={session} />
          </div>
        </div>

        {!!session.instructor && (
          <InstructorHoverCard
            instructor={session.instructor}
            cecData={data?.cecCourse || []}
          >
            <div
              className={`truncate whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                data?.cecCourse?.some(
                  (item) => item.professor === session.instructor
                )
                  ? "text-muted-foreground cursor-default hover:text-foreground"
                  : "text-muted-foreground"
              }`}
              style={{
                opacity: data?.cecCourse?.some(
                  (item) => item.professor === session.instructor
                )
                  ? 1
                  : 0.7,
              }}
            >
              {session.instructor}
              {data?.cecCourse?.some(
                (item) => item.professor === session.instructor
              ) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>CEC data available</TooltipContent>
                </Tooltip>
              )}
            </div>
          </InstructorHoverCard>
        )}

        <div className="text-sm">
          {Array.isArray(session.meetingDetailsList) &&
            session.meetingDetailsList.length > 0 && (
              <div className="space-y-1">
                {session.meetingDetailsList.map(
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
                      className="flex flex-wrap items-center justify-between sm:justify-start gap-x-2 gap-y-1 text-xs text-foreground/80"
                    >
                      <span className="inline-flex items-center gap-1.5 tabular-nums">
                        <Clock className="size-4 opacity-70" />
                        {(meeting.days && meeting.days.trim()) || "TBA"}
                        {meeting.time ? ` • ${meeting.time}` : ""}
                      </span>
                      {(meeting.building || meeting.room) && (
                        <span className="inline-flex items-center gap-1.5 uppercase">
                          <span className="hidden sm:inline text-foreground/30">
                            •
                          </span>
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
            )}
        </div>

        <SessionEnrollProgress session={session} />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-foreground/[0.02] dark:bg-foreground/[0.03]" />
      </div>
    </div>
  )
}

const SessionList = ({
  sessions,
  pinned,
}: {
  sessions: MyplanCourseTermSession[]
  pinned?: boolean
}) => {
  return (
    <div>
      {sessions.map((session, index) => (
        <div key={session.id}>
          <SessionRowDesktop session={session} pinned={pinned} />
          <SessionRowMobile session={session} pinned={pinned} />
          {index !== sessions.length - 1 && <Separator />}
        </div>
      ))}
    </div>
  )
}

export const PinnedSessionsList = () => {
  const { pinnedSessions } = useCourseSessions()
  return <SessionList sessions={pinnedSessions} pinned />
}

export const DisplayedSessionsList = () => {
  const { displayedSessions } = useCourseSessions()
  return <SessionList sessions={displayedSessions} />
}
