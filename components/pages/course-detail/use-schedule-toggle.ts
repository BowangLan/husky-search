"use client"

import {
  useCanAddToSchedule,
  useIsSessionScheduled,
  useToggleSchedule,
  scheduleStore,
} from "@/store/schedule.store"
import { toast } from "sonner"

import { isScheduleFeatureEnabled } from "@/config/features"
import { useCourseSessions } from "./course-sessions-context"

export function useScheduleToggleWithToasts(session: any) {
  const scheduleEnabled = isScheduleFeatureEnabled()
  const { data } = useCourseSessions()
  const scheduled = useIsSessionScheduled(session?.id)
  const courseCode = (data as any)?.myplanCourse?.courseCode as
    | string
    | undefined
  const courseTitle = (data as any)?.myplanCourse?.title as string | undefined
  const courseCredit = (data as any)?.myplanCourse?.credit as
    | string
    | number
    | undefined
  const canAddResult = useCanAddToSchedule(session, { courseCode })
  const toggle = useToggleSchedule()
  const isScheduled = scheduleEnabled ? scheduled : false
  const canAdd = scheduleEnabled ? canAddResult : { ok: false as const }

  const triggerToggle = () => {
    if (!scheduleEnabled) return
    const willAdd = !isScheduled && canAdd.ok
    if (willAdd) {
      // If this is a double-letter session, try to add its parent single-letter first.
      // Only show a single toast message for the double-letter add; no extra toast for parent add.
      const alpha = String((session as any)?.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      const isDouble = alpha.length === 2
      let parentAdded = false
      let parentCode: string | undefined
      if (isDouble) {
        const termData = (data as any)?.myplanCourse?.currentTermData?.[0]
        const sessions: any[] = Array.isArray(termData?.sessions) ? termData.sessions : []
        const parent = sessions.find((s: any) =>
          String(s?.code || "").replace(/[^A-Za-z]/g, "").toUpperCase() === alpha[0]
        )
        if (parent) {
          const parentId = String(parent?.id ?? parent?.activityId ?? parent?.registrationCode)
          const hasParent = scheduleStore.getState().has(parentId)
          if (!hasParent) {
            const parentCheck = scheduleStore.getState().canAdd(parent, { courseCode })
            if ((parentCheck as any)?.ok) {
              scheduleStore.getState().add(parent, { courseCode, courseTitle, courseCredit })
              parentAdded = true
              parentCode = String(parent?.code ?? alpha[0])
            }
          }
        }
      }

      const meeting = Array.isArray((session as any)?.meetingDetailsList)
        ? (session as any).meetingDetailsList.find(
          (m: any) => m?.days || m?.time
        )
        : undefined
      const when = [meeting?.days, meeting?.time].filter(Boolean).join(" ")
      const codePart = [courseCode, (session as any)?.code]
        .filter(Boolean)
        .join(" ")
      const titlePart = courseTitle ? ` — ${courseTitle}` : ""
      const whenPart = when ? ` (${when})` : ""
      if (parentAdded && parentCode) {
        // Show both codes under a single course code
        toast.success(`Added ${courseCode} ${parentCode} and ${(session as any)?.code} to your schedule`)
      } else {
        toast.success(`Added ${codePart} to your schedule`)
      }
    }
    toggle(session, {
      courseCode,
      courseTitle,
      courseCredit,
      onViolation: (reason) => {
        if (reason === "single-letter-exists")
          toast.error(
            "You already added a single-letter session for this course."
          )
        else if (reason === "double-letter-exists")
          toast.error(
            "You already added a double-letter session for this course."
          )
        else if (reason === "double-letter-prefix-mismatch")
          toast.error(
            "Choose a double-letter session that starts with your selected single-letter session."
          )
        else if (reason === "time-conflict")
          toast.error("This session conflicts with your current schedule.")
        else toast.error("Unable to add this session.")
      },
    })
  }

  return { isScheduled, canAdd, triggerToggle }
}
