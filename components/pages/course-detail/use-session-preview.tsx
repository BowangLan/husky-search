"use client"

import * as React from "react"
import { useSchedulePreview } from "@/components/schedule/schedule-preview-context"
import { useScheduleToggleWithToasts } from "./use-schedule-toggle"

export function useSessionPreview(session: any) {
  const { setPreviewSession } = useSchedulePreview()
  const { courseCode, isScheduled } = useScheduleToggleWithToasts(session)

  const handleMouseEnter = React.useCallback(() => {
    if (!courseCode) return

    // Normalize session to ScheduleSession format
    const normalizedSession = {
      id: String(
        session?.id ?? session?.activityId ?? session?.registrationCode ?? ""
      ),
      code: String(session?.code ?? ""),
      type: session?.type,
      instructor: session?.instructor,
      registrationCode: session?.registrationCode,
      meetingDetailsList: Array.isArray(session?.meetingDetailsList)
        ? session.meetingDetailsList.map((m: any) => ({
            days: m?.days,
            time: m?.time,
            building: m?.building,
            room: m?.room,
            campus: m?.campus,
          }))
        : [],
    }
    setPreviewSession({ session: normalizedSession, courseCode, isScheduled })
  }, [session, courseCode, isScheduled, setPreviewSession])

  const handleMouseLeave = React.useCallback(() => {
    setPreviewSession(null)
  }, [setPreviewSession])

  return { handleMouseEnter, handleMouseLeave }
}
