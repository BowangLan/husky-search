"use client"

import Link from "next/link"
import { MyplanCourseTermSession } from "@/convex/schema"
import { Bell, Info, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
}

export function ScheduledSessionCard({
  session,
  sessionData,
  isLoading = false,
  onRemove,
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
  const enrollCount = sessionData ? parseInt(String(sessionData.enrollCount || "0")) : 0
  const enrollMaximum = sessionData ? parseInt(String(sessionData.enrollMaximum || "0")) : 0
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
    <div key={session.id} className="px-4 py-3">
      {/* Session header with section and status */}
      <div className="flex items-start gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{code}</span>
          {registrationCode ? (
            <Badge variant="secondary" size="sm">
              {registrationCode}
            </Badge>
          ) : null}
          {type ? (
            <Badge variant="secondary" size="sm" className="uppercase">
              {type}
            </Badge>
          ) : null}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Badge variant={statusVariant} size="sm" className="font-semibold">
            {statusText}
          </Badge>
          {isLoading ? (
            <Badge variant="secondary" size="sm" className="animate-pulse">
              Loading...
            </Badge>
          ) : hasError ? (
            <Badge variant="red" size="sm">
              Failed to load
            </Badge>
          ) : sessionData && enrollMaximum > 0 ? (
            <Badge variant="secondary" size="sm">
              {availableSeats} AVAIL OF {enrollMaximum}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Meeting mode - show if we have meeting details */}
      {meetingDetailsList &&
        meetingDetailsList.length > 0 && (
          <div className="text-sm text-muted-foreground mb-2">
            {meetingDetailsList[0]?.campus === "Online" ||
            meetingDetailsList[0]?.building === "ONLINE"
              ? "Online"
              : "In-person"}
          </div>
        )}

      {/* Meeting details */}
      <div className="space-y-1.5 mb-3">
        {(meetingDetailsList ?? []).map((m, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-center gap-2 text-foreground">
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
          <div className="text-sm text-foreground">
            Instructor: {instructor}
          </div>
        ) : null}
      </div>

      {/* Enrollment restrictions notice */}
      {registrationCode && qtryr && (
        <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400 mb-3">
          <Info className="size-4 mt-0.5 shrink-0" />
          <a
            href={`https://sdb.admin.washington.edu/timeschd/uwnetid/sln.asp?QTRYR=${qtryr}&SLN=${registrationCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-left"
          >
            Check enrollment restrictions
          </a>
        </div>
      )}

      {/* Section comments */}
      {sectionComments && (
        <div className="text-sm text-muted-foreground mb-3 p-2 bg-muted/50 rounded-md">
          {sectionComments}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="size-9">
          <Bell className="size-4" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-9"
          onClick={onRemove}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  )
}
