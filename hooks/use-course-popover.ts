import { useRef, useState } from "react"
import { coursePlanStore } from "@/store/course-plan.store"
import { scheduleStore } from "@/store/schedule.store"
import { toast } from "sonner"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { isScheduleFeatureEnabled } from "@/config/features"
import { useIsCourseScheduled } from "@/hooks/use-is-course-scheduled"

const DELAY_MS = 200

function pickPrimaryEnroll(course: ConvexCourseOverview) {
  const enroll = course.enroll ?? []
  if (enroll.length === 0) return null

  // Pick the row with the largest max seats; it best matches the single-row UI.
  return enroll.reduce((best, cur) =>
    cur.enrollMax > best.enrollMax ? cur : best
  )
}

export function useCoursePopover(course: ConvexCourseOverview) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Course-level scheduling
  const isCourseScheduled = useIsCourseScheduled(course.courseCode)

  const toggleCourseInSchedule = () => {
    if (!isScheduleFeatureEnabled()) return

    if (isCourseScheduled) {
      // Find and remove the course from all terms
      const allTerms = coursePlanStore.getState().terms
      for (const term of allTerms) {
        const courseInTerm = coursePlanStore
          .getState()
          .getCourseByCode(term.id, course.courseCode)
        if (courseInTerm) {
          scheduleStore.getState().removeCourse(courseInTerm.id)
          toast.success(`Removed ${course.courseCode} from your schedule`)
          return
        }
      }
    } else {
      // Add course without specific session
      const primaryEnroll = pickPrimaryEnroll(course)
      const courseId = scheduleStore.getState().addCourse(course.courseCode, {
        courseTitle: course.title,
        courseCredit: course.credit,
        termId: primaryEnroll?.termId,
      })
      if (courseId) {
        toast.success(`Added ${course.courseCode} to your schedule`)
      }
    }
  }

  const openPopover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setPopoverOpen(true), DELAY_MS)
  }

  const closePopover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => setPopoverOpen(false), DELAY_MS)
  }

  const cancelClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  // Computed values
  const primaryEnroll = pickPrimaryEnroll(course)
  const prereqCount = course.prereqs?.length ?? 0
  const hasPrereqs = prereqCount > 0
  const sessions = Array.isArray(primaryEnroll?.sessions)
    ? primaryEnroll?.sessions
    : []

  return {
    popoverOpen,
    setPopoverOpen,
    isCourseScheduled,
    toggleCourseInSchedule,
    openPopover,
    closePopover,
    cancelClose,
    primaryEnroll,
    prereqCount,
    hasPrereqs,
    sessions,
  }
}
