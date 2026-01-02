"use client"

import { useMemo } from "react"
import { useStore } from "zustand"
import { coursePlanStore } from "@/store/course-plan.store"
import { isScheduleFeatureEnabled } from "@/config/features"

export function useIsCourseScheduled(courseCode?: string) {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !courseCode || !hydrated) return false

    // Check all terms to see if the course exists in any term
    const allTerms = coursePlanStore.getState().terms
    for (const term of allTerms) {
      const course = coursePlanStore.getState().getCourseByCode(term.id, courseCode)
      if (course) {
        return true
      }
    }
    return false
  }, [enabled, courseCode, hydrated, plansByTerm])
}

