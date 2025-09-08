import { useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Info,
  KeyRound,
  MapPin,
  Pin,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { MyPlanCourseDetail } from "@/types/myplan"
import { capitalize, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SessionEnrollProgress } from "@/components/session-enroll-progress"

import { useCourseSessions } from "./course-sessions-context"

const CopySLNButton = ({ session }: { session: any }) => {
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const handleCopy = async (value: string | number, id: string | number) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedId(id)
      toast.success(`Copied SLN ${String(value)}`)
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr))
      }, 1500)
    } catch (err) {
      toast.error("Unable to copy. Clipboard may be blocked.")
    }
  }

  return (
    <div className="text-xs md:text-sm text-foreground/80 font-mono">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-8 px-2 gap-1 text-foreground group active:scale-[0.98] transition-transform"
            )}
            onClick={() => handleCopy(session.registrationCode, session.id)}
          >
            <AnimatePresence>
              {copiedId === session.id ? (
                <motion.span
                  key="sln-ring"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.6, scale: 1.05 }}
                  exit={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 rounded-md"
                />
              ) : null}
            </AnimatePresence>
            <span className="mr-1">{session.registrationCode}</span>
            <AnimatePresence>
              {copiedId === session.id ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="text-green-500 size-4 transition-transform duration-200 ease-out scale-110" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy className="opacity-70 size-4 transition-transform duration-200 ease-out group-active:scale-95" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="sr-only">Copy SLN</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copiedId === session.id ? "Copied!" : "Click to copy"}
        </TooltipContent>
      </Tooltip>
      <div aria-live="polite" className="sr-only">
        {copiedId === session.id ? "SLN copied to clipboard" : undefined}
      </div>
    </div>
  )
}

export const SessionRowDesktop = ({
  session,
  pinned,
}: {
  session: any
  pinned?: boolean
}) => {
  const { data } = useCourseSessions()

  const sessionRaw =
    data.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
      (item: any) => item.activityId === session.id
    ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

  return (
    <div key={session.id} className="group relative hidden lg:block">
      <div
        className="px-4 py-4 md:px-6 flex w-full flex-col gap-3 md:grid md:items-center md:gap-6"
        style={{
          gridTemplateColumns:
            "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(160px,240px)",
        }}
      >
        <div>
          <div className={cn("flex items-center gap-2")}>
            {pinned && <Pin className="size-3.5 text-violet-500" />}
            <h3 className="text-sm md:text-base font-medium tracking-tight">
              {session.code}
            </h3>
            {sessionRaw.addCodeRequired && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <KeyRound className="size-3.5 opacity-70" />
                </TooltipTrigger>
                <TooltipContent>
                  This session requires an add code.
                </TooltipContent>
              </Tooltip>
            )}
            {sessionRaw.sectionComments && (
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
          <div className="text-muted-foreground truncate whitespace-nowrap">
            {session.instructor}
          </div>
        </div>

        <div className="text-sm">
          {Array.isArray((session as any).meetingDetailsList) &&
            (session as any).meetingDetailsList.length > 0 && (
              <div className="space-y-1">
                {(session as any).meetingDetailsList.map(
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

        <CopySLNButton session={session} />

        <div>
          <SessionEnrollProgress session={session} sessionRaw={sessionRaw} />
        </div>
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
  session: any
  pinned?: boolean
}) => {
  const { data } = useCourseSessions()
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const handleCopy = async (value: string | number, id: string | number) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedId(id)
      toast.success(`Copied SLN ${String(value)}`)
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr))
      }, 1500)
    } catch (err) {
      toast.error("Unable to copy. Clipboard may be blocked.")
    }
  }

  const sessionRaw =
    data.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
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
              {sessionRaw.addCodeRequired && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <KeyRound className="size-3.5 opacity-70" />
                  </TooltipTrigger>
                  <TooltipContent>
                    This session requires an add code.
                  </TooltipContent>
                </Tooltip>
              )}
              {sessionRaw.sectionComments && (
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

          {/* Copy SLN */}
          <CopySLNButton session={session} />
        </div>

        {!!session.instructor && (
          <div className="text-muted-foreground truncate whitespace-nowrap">
            {session.instructor}
          </div>
        )}

        <div className="text-sm">
          {Array.isArray((session as any).meetingDetailsList) &&
            (session as any).meetingDetailsList.length > 0 && (
              <div className="space-y-1">
                {(session as any).meetingDetailsList.map(
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

        <SessionEnrollProgress session={session} sessionRaw={sessionRaw} />
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
  sessions: any[]
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
