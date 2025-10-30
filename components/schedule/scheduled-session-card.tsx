"use client"

import Link from "next/link"
import { MyplanCourseTermSession } from "@/convex/schema"
import { Bell, Info, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge, badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { CopySLNButton } from "../copy-sln-button"
import { ExternalLink } from "../ui/external-link"
import { RichButton } from "../ui/rich-button"

type ScheduledSessionCardProps = {
  session: {
    id: string
    code: string
    type?: string
    instructor?: string
    registrationCode?: string | number
    meetingDetailsList?: Array<{
      days?: string
      time?: string
      building?: string
      room?: string
      campus?: string
    }>
    courseCode?: string
    courseTitle?: string
    courseCredit?: string | number
  }
  sessionData?: MyplanCourseTermSession | null
  isLoading?: boolean
  onRemove: () => void
  showDetails?: boolean
  compact?: boolean
}

const SESSION_INDENT = 40

export function ScheduledSessionCard({
  session,
  sessionData,
  isLoading = false,
  onRemove,
  showDetails = true,
  compact = false,
}: ScheduledSessionCardProps) {
  // Determine the state: loading, loaded with data, or error (no data)
  const hasError = !isLoading && !sessionData

  // For basic session info (always available from store)
  const code = session.code
  const registrationCode = session.registrationCode
  const type = session.type
  const meetingDetailsList = session.meetingDetailsList
  const instructor = session.instructor

  // For enrollment data (only from sessionData)
  const enrollCount = sessionData
    ? parseInt(String(sessionData.enrollCount || "0"))
    : 0
  const enrollMaximum = sessionData
    ? parseInt(String(sessionData.enrollMaximum || "0"))
    : 0
  const availableSeats = enrollMaximum - enrollCount
  const isOpen = availableSeats > 0
  const stateKey = sessionData?.stateKey
  const enrollStatus = sessionData?.enrollStatus
  const qtryr = sessionData?.qtryr
  const sectionComments = sessionData?.sectionComments

  // Determine status text and variant
  let statusText = "UNKNOWN"
  let statusVariant: "green" | "yellow" | "red" | "secondary" = "secondary"

  if (isLoading) {
    statusText = "..."
    statusVariant = "secondary"
  } else if (hasError) {
    // No data available from server
    statusText = "ERROR"
    statusVariant = "red"
  } else if (stateKey === "inactive") {
    statusText = "CLOSED"
    statusVariant = "red"
  } else if (enrollStatus === "closed") {
    statusText = "CLOSED"
    statusVariant = "red"
  } else if (isOpen) {
    statusText = "OPEN"
    statusVariant = "green"
  } else {
    statusText = "FULL"
    statusVariant = "yellow"
  }

  return (
    <div key={session.id} className={cn(compact ? "px-3 py-0" : "px-3 py-3")}>
      {/* Session header with section and status */}
      <div className={cn("flex items-center gap-2", compact ? "" : "mb-2")}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm w-6 inline-block">{code}</span>
          {registrationCode ? (
            // <ExternalLink
            //   href={`https://sdb.admin.washington.edu/timeschd/uwnetid/sln.asp?QTRYR=${qtryr}&SLN=${registrationCode}`}
            //   className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            // >
            //   {registrationCode}
            // </ExternalLink>
            // <span className="text-xs">{registrationCode}</span>
            <div className="ml-2">
              <span className="text-sm">{registrationCode}</span>
              {/* <CopySLNButton
                session={session}
                className={cn(
                  badgeVariants({
                    size: "flat-sm",
                    variant: "secondary",
                  }),
                  "[&_svg]:size-3 "
                )}
                iconClassName={"size-3 opacity-70"}
              /> */}
            </div>
          ) : null}
          {type ? (
            <Badge variant="secondary" className="uppercase" size="flat-sm">
              {type}
            </Badge>
          ) : null}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Badge variant={statusVariant} size="flat-sm">
            {statusText}
          </Badge>
          {showDetails &&
            (isLoading ? (
              <Badge variant="secondary" size="flat-sm">
                Loading...
              </Badge>
            ) : hasError ? (
              <Badge variant="red" size="flat-sm">
                Failed to load
              </Badge>
            ) : sessionData && enrollMaximum > 0 ? (
              <Badge variant="secondary" size="flat-sm">
                {availableSeats} AVAIL OF {enrollMaximum}
              </Badge>
            ) : null)}
        </div>

        <RichButton
          tooltip="Remove session"
          size={compact ? "icon-xs" : "icon-sm"}
          variant="ghost"
          onClick={onRemove}
        >
          <X />
        </RichButton>
      </div>

      {/* Meeting mode - show if we have meeting details */}
      {showDetails && meetingDetailsList && meetingDetailsList.length > 0 && (
        <div
          className="text-xs text-muted-foreground mb-2"
          style={{ marginLeft: SESSION_INDENT }}
        >
          {meetingDetailsList[0]?.campus === "Online" ||
          meetingDetailsList[0]?.building === "ONLINE"
            ? "Online"
            : "In-person"}
        </div>
      )}

      {/* Meeting details */}
      {showDetails && (
        <div
          className="space-y-1.5 mb-3"
          style={{ marginLeft: SESSION_INDENT }}
        >
          {(meetingDetailsList ?? []).map((m, i) => (
            <div key={i} className="text-xs">
              <div className="flex items-center gap-1.5 text-foreground">
                {m.days && m.time ? (
                  <>
                    <span className="font-medium">{m.days}</span>
                    <span>{m.time}</span>
                  </>
                ) : (
                  <span>Meeting time and location: --</span>
                )}
                {m.building && m.room && (
                  <>
                    <span className="ml-auto uppercase font-medium">
                      {m.building} {m.room}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
          {instructor && instructor !== "--" ? (
            <div className="text-xs text-foreground">
              Instructor: {instructor}
            </div>
          ) : null}
        </div>
      )}

      {/* Enrollment restrictions notice */}
      {/* {registrationCode && qtryr && (
        <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 mb-3">
          <Info className="size-3 mt-0.5 shrink-0" />
          <a
            href={`https://sdb.admin.washington.edu/timeschd/uwnetid/sln.asp?QTRYR=${qtryr}&SLN=${registrationCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-left"
          >
            Check enrollment restrictions
          </a>
        </div>
      )} */}

      {/* Section comments */}
      {/* {sectionComments && (
        <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted/50 rounded-md">
          {sectionComments}
        </div>
      )} */}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {/* <Button size="icon" variant="outline" className="size-7">
          <Bell />
        </Button> */}
        <div className="flex-1"></div>
      </div>
    </div>
  )
}
