import { useHasTimeConflict, useCanAddToSchedule } from "@/store/schedule.store"
import { ConvexCourseOverview } from "@/types/convex-courses"
import { isScheduleFeatureEnabled } from "@/config/features"
import { useScheduleToggleWithToasts } from "@/components/pages/course-detail/use-schedule-toggle"

export function useSessionScheduling(
  session: any,
  course: ConvexCourseOverview,
  termId?: string
) {
  // Construct the data structure expected by useScheduleToggleWithToasts
  const courseDetail = {
    myplanCourse: {
      courseCode: course.courseCode,
      title: course.title,
      credit: course.credit,
      currentTermData: termId
        ? [
            {
              termId,
              sessions:
                course.enroll?.find((e) => e.termId === termId)?.sessions || [],
            },
          ]
        : [],
    },
  }

  const { isScheduled, canAdd, triggerToggle } = useScheduleToggleWithToasts(
    session,
    courseDetail
  )
  const hasTimeConflictCheck = useHasTimeConflict(session)

  // Check for time conflicts independently - prioritize this over switch reasons
  const hasTimeConflict = !isScheduled && hasTimeConflictCheck

  // Allow switching between sessions (but only if no time conflict)
  const canSwitch =
    !hasTimeConflict &&
    !canAdd.ok &&
    (canAdd.reason === "switch-single-letter" ||
      canAdd.reason === "switch-double-letter")
  const isDisabled = !isScheduled && !canAdd.ok && !canSwitch

  const getTooltipText = () => {
    if (isScheduled) return "Remove from schedule"
    if (hasTimeConflict) return "Time conflict with your schedule"
    if (canAdd.ok) return "Add to schedule"
    if (
      canAdd.reason === "switch-single-letter" ||
      canAdd.reason === "switch-double-letter"
    ) {
      return "Switch to this session"
    }
    if (canAdd.reason === "single-letter-exists")
      return "Single-letter session already added for this course"
    if (canAdd.reason === "double-letter-exists")
      return "Double-letter session already added for this course"
    if (canAdd.reason === "time-conflict")
      return "Time conflict with your schedule"
    return "Cannot add this session"
  }

  const handleClick = () => {
    if (!isDisabled) {
      triggerToggle()
    }
  }

  return {
    isScheduled,
    canAdd,
    hasTimeConflict,
    canSwitch,
    isDisabled,
    getTooltipText,
    handleClick,
  }
}
