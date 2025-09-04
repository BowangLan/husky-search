import { useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { CourseDetail } from "@/convex/courses"
import { useQuery } from "convex/react"
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Info,
  KeyRound,
  MapPin,
  Pin,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { MyPlanCourse, MyPlanCourseDetail } from "@/types/myplan"
import { capitalize, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SessionRow = ({
  session,
  courseData,
  pinned,
}: {
  session: any
  courseData: CourseDetail
  pinned?: boolean
}) => {
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

  const enrollCount = Number((session as any).enrollCount ?? 0)
  const enrollMaximum = Number((session as any).enrollMaximum ?? 0)
  const isClosed = enrollCount >= enrollMaximum
  const capacityPct = Math.min(
    100,
    (enrollCount / Math.max(1, enrollMaximum)) * 100
  )
  const isCopied = copiedId === session.id

  const sessionRaw =
    courseData.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
      (item: any) => item.activityId === session.id
    ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

  return (
    <div key={session.id} className="group relative">
      <Separator />

      {/* Accent gradient bar */}
      {/* <div
        className={cn(
          "absolute left-0 top-0 h-full w-[2px] opacity-0 transition-opacity duration-300",
          "bg-gradient-to-b from-purple-500 via-fuchsia-500 to-blue-500",
          "group-hover:opacity-100"
        )}
      /> */}

      <div
        className="px-4 py-4 md:px-6 flex w-full flex-col gap-3 md:grid md:items-center md:gap-6"
        style={{
          gridTemplateColumns:
            "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(160px,240px)",
        }}
      >
        {/* Session code */}
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
                  <p className="max-w-[288px]">{sessionRaw.sectionComments}</p>
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

        {/* Instructor */}
        <div
          className="text-sm overflow-hidden min-w-0"
          style={{
            flex: "1 1 64px",
            minWidth: "96px",
            maxWidth: "160px",
          }}
        >
          <div className="text-muted-foreground truncate whitespace-nowrap">
            {session.instructor}
          </div>
        </div>

        {/* Meeting details */}
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
                      {/* {meeting.campus && (
                                <>
                                  <span className="text-foreground/40">|</span>
                                  <span>{meeting.campus}</span>
                                </>
                              )} */}
                    </div>
                  )
                )}
              </div>
            )}
        </div>

        {/* SLN Code (click to copy) */}
        <div className="text-xs md:text-sm text-foreground/80 font-mono">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "relative h-8 px-2 gap-1 text-foreground group active:scale-[0.98] transition-transform"
                  // copiedId === session.id &&
                  //   "ring-1 ring-emerald-500/30"
                )}
                onClick={() =>
                  handleCopy((session as any).registrationCode, session.id)
                }
              >
                <AnimatePresence>
                  {isCopied && (
                    <motion.span
                      key="sln-ring"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 0.6, scale: 1.05 }}
                      exit={{ opacity: 0, scale: 1.15 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 rounded-md"
                    />
                  )}
                </AnimatePresence>
                <span className="mr-1">
                  {/* SLN: {(session as any).registrationCode} */}
                  {(session as any).registrationCode}
                </span>
                <AnimatePresence>
                  {isCopied ? (
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
              {isCopied ? "Copied!" : "Click to copy"}
            </TooltipContent>
          </Tooltip>
          <div aria-live="polite" className="sr-only">
            {isCopied ? "SLN copied to clipboard" : undefined}
          </div>
        </div>

        {/* Status */}
        {/* <div
                  className=""
                  style={{ flex: "1 1 64px", minWidth: "64px" }}
                >
                  <Badge
                    variant={isClosed ? "red-outline" : "green-outline"}
                    size="sm"
                  >
                    {isClosed ? "Closed" : "Open"}
                  </Badge>
                </div> */}

        {/* Capacity */}
        <div>
          {session.stateKey === "active" && (
            <>
              <div className="flex items-center gap-1 mb-1">
                <div className="text-xs text-muted-foreground tabular-nums">
                  <span
                    className={cn(
                      "font-semibold text-foreground text-sm",
                      isClosed && "text-muted-foreground"
                    )}
                  >
                    {Math.max(0, enrollMaximum - enrollCount)}
                  </span>
                  {" avail of "}
                  <span>{enrollMaximum}</span>
                </div>
                <div className="flex-1"></div>
                {/* <div className="text-xs text-muted-foreground tabular-nums">
                          {capacityPct.toFixed(1)}%
                        </div> */}
                {sessionRaw.enrollStatus === "add code required" && (
                  <div className="text-xs text-muted-foreground tabular-nums">
                    <span className="font-semibold text-foreground text-sm">
                      --
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-row items-center gap-1.5 text-[13px] text-foreground tabular-nums leading-none",
                    isClosed && "text-muted-foreground",
                    sessionRaw.enrollStatus === "add code required"
                      ? "hidden"
                      : ""
                  )}
                >
                  {/* Dot */}
                  <div
                    className={cn(
                      "size-2 rounded-full",
                      isClosed ? "bg-red-500" : "bg-green-500"
                    )}
                  />
                  {/* {isClosed ? "Closed" : "Open"} */}
                  {capitalize(sessionRaw.enrollStatus)}
                </div>
              </div>
              <Progress
                value={capacityPct}
                className={cn(
                  "h-2 bg-foreground/5",
                  isClosed && "bg-foreground/10"
                )}
                indicatorClassName={cn(
                  "bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500",
                  isClosed && "from-red-600 via-red-500 to-red-700"
                )}
              />
            </>
          )}

          {session.stateKey !== "active" && (
            <div className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
              {/* alert Icon */}
              <AlertCircle className="size-4 opacity-70" />
              {capitalize(session.stateKey)}
            </div>
          )}
        </div>
      </div>

      {/* Row hover background */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-foreground/[0.02] dark:bg-foreground/[0.03]" />
      </div>

      {/* {!last && <Separator />} */}
    </div>
  )
}

const SessionChip = ({
  session,
  getSessionEnrollState,
  selectedSessionIds,
  setSelectedSessionIds,
  parentSessionId,
  pinnedSessionIds,
  setPinnedSessionIds,
}: {
  session: any
  getSessionEnrollState: (session: any) => string
  selectedSessionIds: string[]
  setSelectedSessionIds: (ids: string[]) => void
  parentSessionId?: string
  pinnedSessionIds: string[]
  setPinnedSessionIds: (ids: string[]) => void
}) => {
  const enrollState = getSessionEnrollState(session)

  const chipClasses =
    enrollState === "closed"
      ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30"
      : enrollState === "open"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30"
      : enrollState === "add code required"
      ? "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30"
      : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/30"

  const dotClasses =
    enrollState === "closed"
      ? "bg-rose-500 dark:bg-rose-400"
      : enrollState === "open"
      ? "bg-emerald-500 dark:bg-emerald-400"
      : enrollState === "add code required"
      ? "bg-amber-500 dark:bg-amber-400"
      : "bg-slate-400 dark:bg-slate-400"

  return (
    <div
      key={session.id}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 h-7 justify-center text-xs border",
        "transition-colors duration-150 cursor-pointer",
        chipClasses,
        pinnedSessionIds.includes(session.id) &&
          "bg-purple-600 text-white border-purple-600 dark:bg-purple-600 dark:text-white dark:border-purple-600"
      )}
      onMouseEnter={() =>
        setSelectedSessionIds(
          parentSessionId ? [parentSessionId, session.id] : [session.id]
        )
      }
      onFocus={() =>
        setSelectedSessionIds(
          parentSessionId ? [parentSessionId, session.id] : [session.id]
        )
      }
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        setPinnedSessionIds(
          pinnedSessionIds.includes(session.id)
            ? pinnedSessionIds.filter((id) => id !== session.id)
            : [...pinnedSessionIds, session.id]
        )
      }}
    >
      {/* <span className={cn("size-1.5 rounded-full", dotClasses)} /> */}
      <span className="font-medium tabular-nums">{session.code}</span>
    </div>
  )
}

const SessionsOverview = ({
  data,
  selectedSessionIds,
  setSelectedSessionIds,
  pinnedSessionIds,
  setPinnedSessionIds,
}: {
  data: CourseDetail
  selectedSessionIds: string[]
  setSelectedSessionIds: (ids: string[]) => void
  pinnedSessionIds: string[]
  setPinnedSessionIds: (ids: string[]) => void
}) => {
  const termData = data.myplanCourse?.currentTermData?.[0]
  const sessions = termData?.sessions

  if (typeof sessions === "undefined") return null

  const hasDoubleLetterCode = sessions.some(
    (session) => session.code.length > 1
  )

  const getSessionEnrollState = (session: any) => {
    const enrollCount = Number((session as any).enrollCount ?? 0)
    const enrollMaximum = Number((session as any).enrollMaximum ?? 0)

    const sessionRaw =
      data.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
        (item: any) => item.activityId === session.id
      ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

    if (session.stateKey !== "active") {
      return session.stateKey
    }

    if (enrollCount >= enrollMaximum) {
      return "closed"
    }

    if (
      sessionRaw.enrollStatus !== "closed" &&
      sessionRaw.enrollStatus !== "open"
    ) {
      return sessionRaw.enrollStatus
    }

    return "open"
  }

  if (!hasDoubleLetterCode) {
    return (
      <div className="flex flex-row items-center flex-wrap gap-2">
        {sessions.map((session) => {
          return (
            <SessionChip
              key={session.id}
              session={session}
              getSessionEnrollState={getSessionEnrollState}
              selectedSessionIds={selectedSessionIds}
              setSelectedSessionIds={setSelectedSessionIds}
              pinnedSessionIds={pinnedSessionIds}
              setPinnedSessionIds={setPinnedSessionIds}
            />
          )
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
          <div key={letter}>
            <div className="flex flex-row items-center flex-wrap gap-2">
              {sessions.sessions.map((session) => {
                return (
                  <SessionChip
                    key={session.id}
                    session={session}
                    getSessionEnrollState={getSessionEnrollState}
                    selectedSessionIds={selectedSessionIds}
                    setSelectedSessionIds={setSelectedSessionIds}
                    parentSessionId={sessions.parentSessionId}
                    pinnedSessionIds={pinnedSessionIds}
                    setPinnedSessionIds={setPinnedSessionIds}
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
          </div>
        )
      })}
    </div>
  )
}

export const CourseSessionsSection = ({
  courseCode,
}: {
  courseCode: string
}) => {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>([])
  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })

  if (!data) return null

  const termData = data.myplanCourse?.currentTermData?.[0]
  const sessions = termData?.sessions

  if (typeof sessions === "undefined") return null

  let displayedSessions = sessions
  if (selectedSessionIds.length > 0) {
    displayedSessions = displayedSessions.filter((s: any) =>
      selectedSessionIds.includes(s.id)
    )
  }
  const pinnedSessions = sessions.filter((s: any) =>
    pinnedSessionIds.includes(s.id)
  )

  return (
    <Card
      className="overflow-hidden py-0 md:py-0 min-h-screen"
      hoverInteraction={false}
      // onMouseLeave={() => setSelectedSessionIds([])}
    >
      <CardContent className="px-0 md:px-0">
        {/* Overall enroll status */}
        <div
          className="my-4 mx-4 md:mx-6 md:my-6"
          onMouseLeave={() => setSelectedSessionIds([])}
        >
          <SessionsOverview
            data={data}
            selectedSessionIds={selectedSessionIds}
            setSelectedSessionIds={setSelectedSessionIds}
            pinnedSessionIds={pinnedSessionIds}
            setPinnedSessionIds={setPinnedSessionIds}
          />
        </div>
        <div>
          {pinnedSessions.map((session, idx) => (
            <SessionRow
              key={session.id}
              session={session}
              courseData={data}
              pinned
            />
          ))}
        </div>
        <div>
          {displayedSessions.map((session, idx) => (
            <SessionRow key={session.id} session={session} courseData={data} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
