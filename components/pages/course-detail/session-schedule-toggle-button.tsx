"use client"

import * as React from "react"
import { MyplanCourseTermSession } from "@/convex/schema"
import { useCanAddToSchedule, useHasTimeConflict } from "@/store/schedule.store"
import {
  AlertTriangle,
  CalendarMinus,
  CalendarPlus,
  Check,
  Minus,
  MinusCircle,
  Plus,
  PlusCircle,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { isScheduleFeatureEnabled } from "@/config/features"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSchedulePreview } from "@/components/schedule/schedule-preview-context"

import { useScheduleToggleWithToasts } from "./use-schedule-toggle"
import { useCourseSessions } from "./course-sessions-context"

export const SessionScheduleToggleButton = ({
  session,
}: {
  session: MyplanCourseTermSession
}) => {
  const { data } = useCourseSessions()
  const { isScheduled, canAdd, triggerToggle } =
    useScheduleToggleWithToasts(session, data)
  const hasTimeConflictCheck = useHasTimeConflict(session)

  if (!isScheduleFeatureEnabled()) return null

  // Check for time conflicts independently - prioritize this over switch reasons
  const hasTimeConflict = !isScheduled && hasTimeConflictCheck

  // Allow switching between sessions (but only if no time conflict)
  const canSwitch =
    !hasTimeConflict &&
    !canAdd.ok &&
    (canAdd.reason === "switch-single-letter" ||
      canAdd.reason === "switch-double-letter")
  const isDisabled = !isScheduled && !canAdd.ok && !canSwitch

  let variant = "default"
  if (canSwitch) {
    variant = "secondary"
  } else if (isDisabled) {
    variant = "ghost"
  } else if (isScheduled) {
    variant = "ghost"
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex ${isDisabled ? "cursor-not-allowed" : ""}`}
        >
          <Button
            type="button"
            variant={variant as any}
            size="sm"
            className={cn(
              "h-8 px-0 w-8 gap-1 text-xs",
              isScheduled || (isDisabled && "text-foreground/80"),
              hasTimeConflict && "text-orange-500"
            )}
            disabled={isDisabled}
            onClick={triggerToggle}
          >
            {isScheduled ? (
              <>
                {/* <CalendarMinus className="size-4" /> */}
                {/* <MinusCircle className="size-4" /> */}
                {/* <Minus className="size-4" /> */}
                {/* <Check className="size-4" /> */}
                <X className="size-4" />
                {/* Remove */}
              </>
            ) : hasTimeConflict ? (
              <>
                <AlertTriangle className="size-4" />
              </>
            ) : (
              <>
                <CalendarPlus className="size-4" />
                {/* <PlusCircle className="size-4" /> */}
                {/* <Plus className="size-4" /> */}
                {/* Add */}
              </>
            )}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isScheduled
          ? "Remove from schedule"
          : hasTimeConflict
          ? "Time conflict with your schedule"
          : canAdd.ok
          ? "Add to schedule"
          : canAdd.reason === "switch-single-letter" ||
            canAdd.reason === "switch-double-letter"
          ? "Switch to this session"
          : canAdd.reason === "single-letter-exists"
          ? "Single-letter session already added for this course"
          : canAdd.reason === "double-letter-exists"
          ? "Double-letter session already added for this course"
          : canAdd.reason === "time-conflict"
          ? "Time conflict with your schedule"
          : "Cannot add this session"}
      </TooltipContent>
    </Tooltip>
  )
}
