"use client"

import { useRef } from "react"
import { AlertTriangle } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { isScheduleFeatureEnabled } from "@/config/features"
import {
  getEnrollOutlineClasses,
  getSessionEnrollState,
} from "@/lib/session-utils"
import { cn } from "@/lib/utils"
import { useCoursePopover } from "@/hooks/use-course-popover"
import { useSessionScheduling } from "@/hooks/use-session-scheduling"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { CoursePopoverContent } from "@/components/course-popover-content"

// Clickable session pill that combines the pill styling with toggle functionality
export const ClickableSessionPill = ({
  session,
  course,
  termId,
}: {
  session: any
  course: ConvexCourseOverview
  termId?: string
}) => {
  const {
    isScheduled,
    hasTimeConflict,
    canSwitch,
    isDisabled,
    getTooltipText,
    handleClick,
  } = useSessionScheduling(session, course, termId)

  if (!isScheduleFeatureEnabled()) {
    // If schedule feature is disabled, just show the regular pill
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium tabular-nums",
          getEnrollOutlineClasses(getSessionEnrollState(session))
        )}
      >
        {session.code}
      </span>
    )
  }

  // Determine background and styling based on state
  let pillClasses = cn(
    "inline-flex h-7 items-center rounded-md border px-2.5 text-xs font-medium tabular-nums transition-colors cursor-pointer",
    getEnrollOutlineClasses(getSessionEnrollState(session))
  )

  if (isScheduled) {
    // Already scheduled - show primary colors like in course-session-chips
    pillClasses = cn(
      pillClasses,
      "bg-primary text-white border-primary dark:bg-primary dark:text-white dark:border-primary"
    )
  } else if (hasTimeConflict) {
    // Time conflict - keep base colors, icon will indicate conflict
  } else if (isDisabled) {
    // Disabled - reduce opacity
    pillClasses = cn(pillClasses, "opacity-50 cursor-not-allowed")
  } else {
    // Available or can switch - add hover effects
    pillClasses = cn(
      pillClasses,
      "hover:bg-accent hover:border-accent-foreground/20"
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(pillClasses, "relative")} onClick={handleClick}>
          {session.code}
          {hasTimeConflict && (
            <AlertTriangle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-orange-500" />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>{getTooltipText()}</TooltipContent>
    </Tooltip>
  )
}

export function CoursePopoverWrapper({
  course,
  children,
  className,
  contentClassName,
  align = "start",
  side = "left",
  sideOffset = 4,
  alignOffset = 0,
}: {
  course: ConvexCourseOverview
  children: React.ReactNode
  className?: string
  contentClassName?: string
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  sideOffset?: number
  alignOffset?: number
}) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  const {
    popoverOpen,
    setPopoverOpen,
    isCourseScheduled,
    toggleCourseInSchedule,
    openPopover,
    closePopover,
    cancelClose,
    primaryEnroll,
    hasPrereqs,
    sessions,
  } = useCoursePopover(course)

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger
        ref={triggerRef}
        className={cn("active:outline-none focus:outline-none", className)}
        onMouseEnter={openPopover}
        onMouseLeave={closePopover}
      >
        {children}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className={cn("w-[500px] p-5", contentClassName)}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={cancelClose}
        onMouseLeave={closePopover}
      >
        <CoursePopoverContent
          course={course}
          isCourseScheduled={isCourseScheduled}
          toggleCourseInSchedule={toggleCourseInSchedule}
          hasPrereqs={hasPrereqs}
          sessions={sessions}
          primaryEnroll={primaryEnroll}
          cancelClose={cancelClose}
          closePopover={closePopover}
        />
      </PopoverContent>
    </Popover>
  )
}
