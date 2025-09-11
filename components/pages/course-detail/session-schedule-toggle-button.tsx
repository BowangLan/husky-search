"use client"

import { useCanAddToSchedule } from "@/store/schedule.store"
import {
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

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useScheduleToggleWithToasts } from "./use-schedule-toggle"

export const SessionScheduleToggleButton = ({ session }: { session: any }) => {
  const { isScheduled, canAdd, triggerToggle } =
    useScheduleToggleWithToasts(session)
  const isDisabled = !isScheduled && !canAdd.ok
  let variant = "default"
  if (isDisabled) {
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
              isScheduled || (isDisabled && "text-foreground/80")
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
          : canAdd.ok
          ? "Add to schedule"
          : canAdd.reason === "single-letter-exists"
          ? "Single-letter session already added for this course"
          : canAdd.reason === "double-letter-exists"
          ? "Double-letter session already added for this course"
          : canAdd.reason === "double-letter-prefix-mismatch"
          ? "Pick a double-letter session starting with your selected single letter"
          : canAdd.reason === "time-conflict"
          ? "Time conflict with your schedule"
          : "Cannot add this session"}
      </TooltipContent>
    </Tooltip>
  )
}
