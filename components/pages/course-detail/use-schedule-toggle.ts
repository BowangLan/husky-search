"use client"

import { useMemo } from "react"
import { useStore } from "zustand"
import {
  useCanAddToSchedule,
  useIsSessionScheduled,
  useToggleSchedule,
  scheduleStore,
} from "@/store/schedule.store"
import { coursePlanStore } from "@/store/course-plan.store"
import { toast } from "sonner"

import { isScheduleFeatureEnabled } from "@/config/features"
import { useCourseSessions } from "./course-sessions-context"

export function useScheduleToggleWithToasts(session: any) {
  const scheduleEnabled = isScheduleFeatureEnabled()
  const { data } = useCourseSessions()
  // Extract termId from currentTermData
  const termId = (data as any)?.myplanCourse?.currentTermData?.[0]?.termId as string | undefined
  // Watch store changes to make isScheduledInTerm reactive
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)
  // Check if session is scheduled in the specific termId, not just active term
  const isScheduledInTerm = useMemo(() => {
    if (!scheduleEnabled || !termId || !session?.id || !hydrated) return false
    return scheduleStore.getState().hasSession(session.id, termId)
  }, [scheduleEnabled, termId, session?.id, hydrated, plansByTerm])
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
  // Use term-specific check if available, otherwise fall back to active term check
  const isScheduled = scheduleEnabled ? (isScheduledInTerm || scheduled) : false
  const canAdd = scheduleEnabled ? canAddResult : { ok: false as const }

  const triggerToggle = () => {
    if (!scheduleEnabled) return
    const willSwitch = !isScheduled && !canAdd.ok && (canAdd.reason === "switch-single-letter" || canAdd.reason === "switch-double-letter")
    const willAdd = !isScheduled && canAdd.ok

    // Handle switching between sessions (single-letter or double-letter)
    if (willSwitch && canAdd.existingSessionId && courseCode) {
      // Remove the existing session
      scheduleStore.getState().removeSessionFromCourse(courseCode, canAdd.existingSessionId, termId)
      // Add the new session
      scheduleStore.getState().addSessionToCourse(courseCode, session, termId)

      const meeting = Array.isArray((session as any)?.meetingDetailsList)
        ? (session as any).meetingDetailsList.find(
          (m: any) => m?.days || m?.time
        )
        : undefined
      const when = [meeting?.days, meeting?.time].filter(Boolean).join(" ")
      const codePart = [courseCode, (session as any)?.code]
        .filter(Boolean)
        .join(" ")
      toast.success(`Switched to ${codePart}`)
      return
    }

    if (willAdd && courseCode) {
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
          // Check if parent session exists in the specific termId
          const hasParent = termId 
            ? scheduleStore.getState().hasSession(parentId, termId)
            : scheduleStore.getState().hasSession(parentId)
          if (!hasParent) {
            const parentCheck = scheduleStore.getState().canAddSession(parent, { courseCode })
            if ((parentCheck as any)?.ok) {
              // Ensure course exists (addCourse handles termId conversion and returns existing ID if course already exists)
              scheduleStore.getState().addCourse(courseCode, { courseTitle, courseCredit, termId })
              scheduleStore.getState().addSessionToCourse(courseCode, parent, termId)
              parentAdded = true
              parentCode = String(parent?.code ?? alpha[0])
            }
          }
        }
      }

      // Use toggleSession instead of manually calling addCourse/addSessionToCourse
      // This ensures proper termId handling and course metadata
      toggle(session, {
        courseCode,
        courseTitle,
        courseCredit,
        termId,
        onViolation: (reason) => {
          if (reason === "switch-single-letter" || reason === "switch-double-letter") {
            // This should not happen as we handle it above, but just in case
            toast.error("Unable to switch sessions.")
          } else if (reason === "single-letter-exists")
            toast.error(
              "You already added a single-letter session for this course."
            )
          else if (reason === "double-letter-exists")
            toast.error(
              "You already added a double-letter session for this course."
            )
          else if (reason === "time-conflict")
            toast.error("This session conflicts with your current schedule.")
          else toast.error("Unable to add this session.")
        },
      })
      
      const meeting = Array.isArray((session as any)?.meetingDetailsList)
        ? (session as any).meetingDetailsList.find(
          (m: any) => m?.days || m?.time
        )
        : undefined
      const codePart = [courseCode, (session as any)?.code]
        .filter(Boolean)
        .join(" ")
      if (parentAdded && parentCode) {
        // Show both codes under a single course code
        toast.success(`Added ${courseCode} ${parentCode} and ${(session as any)?.code} to your schedule`)
      } else {
        toast.success(`Added ${codePart} to your schedule`)
      }
      // Don't call toggle() again - it's already been called above
      return
    }

    toggle(session, {
      courseCode,
      courseTitle,
      courseCredit,
      termId,
      onViolation: (reason) => {
        if (reason === "switch-single-letter" || reason === "switch-double-letter") {
          // This should not happen as we handle it above, but just in case
          toast.error("Unable to switch sessions.")
        } else if (reason === "single-letter-exists")
          toast.error(
            "You already added a single-letter session for this course."
          )
        else if (reason === "double-letter-exists")
          toast.error(
            "You already added a double-letter session for this course."
          )
        else if (reason === "time-conflict")
          toast.error("This session conflicts with your current schedule.")
        else toast.error("Unable to add this session.")
      },
    })
  }

  return { isScheduled, canAdd, triggerToggle, courseCode }
}
