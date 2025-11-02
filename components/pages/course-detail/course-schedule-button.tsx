"use client"

import { useState } from "react"
import { Check, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { isScheduleFeatureEnabled } from "@/config/features"
import { useSchedule, useScheduleCourse } from "@/store/schedule.store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChooseTermDialog } from "./choose-term-dialog"

interface CourseScheduleButtonProps {
  courseCode: string
  courseTitle?: string
  courseCredit?: string | number
  className?: string
  variant?: "desktop" | "mobile"
}

export function CourseScheduleButton({
  courseCode,
  courseTitle,
  courseCredit,
  className,
  variant = "desktop",
}: CourseScheduleButtonProps) {
  const scheduleEnabled = isScheduleFeatureEnabled()
  const scheduledCourse = useScheduleCourse(courseCode)
  const schedule = useSchedule()
  const [dialogOpen, setDialogOpen] = useState(false)
  
  const isCourseInSchedule = !!scheduledCourse
  const hasSessions = scheduledCourse?.sessions && scheduledCourse.sessions.length > 0
  const sessionCodes = scheduledCourse?.sessions.map(s => s.code).join(", ") || ""

  const handleAddToSchedule = () => {
    if (!scheduleEnabled) return
    setDialogOpen(true)
  }

  const handleSelectTerm = (termId: string) => {
    if (!scheduleEnabled) return
    
    const wasAlreadyAdded = schedule.hasCourse(courseCode)
    if (wasAlreadyAdded) {
      toast.info(`${courseCode} is already in your schedule`)
      return
    }

    schedule.addCourse(courseCode, {
      courseTitle,
      courseCredit,
      termId,
    })
    
    toast.success(`Added ${courseCode} to your schedule`)
  }

  const handleRemoveFromSchedule = () => {
    if (!scheduleEnabled || !scheduledCourse) return
    
    schedule.removeCourse(scheduledCourse.id)
    toast.success(`Removed ${courseCode} from your schedule`)
  }

  if (!scheduleEnabled) return null

  const buttonContent = hasSessions ? (
    <Button
      variant="outline"
      size="sm"
      disabled
      className={variant === "mobile" ? "flex-1 min-w-0" : "max-w-[200px]"}
    >
      <Check className="size-4 shrink-0" />
      <span className="truncate">{sessionCodes}</span>
    </Button>
  ) : isCourseInSchedule ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRemoveFromSchedule}
      className={variant === "mobile" ? "flex-1" : undefined}
    >
      <Check className="size-4" />
      {variant === "mobile" ? "Added" : "Added"}
      <X className="size-4 ml-1" />
    </Button>
  ) : (
    <Button
      variant="default"
      size="sm"
      onClick={handleAddToSchedule}
      className={variant === "mobile" ? "flex-1" : undefined}
    >
      <Plus className="size-4" />
      Add to Schedule
    </Button>
  )

  const tooltipContent = hasSessions
    ? `Sessions ${sessionCodes} are in your schedule`
    : isCourseInSchedule
    ? "Remove course from schedule"
    : "Add course to schedule without selecting sessions"

  return (
    <>
      {variant === "mobile" ? (
        buttonContent
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      )}
      <ChooseTermDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSelectTerm={handleSelectTerm}
      />
    </>
  )
}

