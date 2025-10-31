"use client"

import { useEffect, useRef, useState } from "react"
import { type GeneratedScheduleVariant } from "@/store/schedule.store"
import { useSchedule } from "@/store/schedule.store"
import { Eye, Plus, Pin } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { RichButton } from "@/components/ui/rich-button"

import { GeneratedScheduleVariantDetailDialog } from "./generated-schedule-variant-detail-dialog"

type CompactVariantCardProps = {
  variant: GeneratedScheduleVariant
  variantIndex: number
  variantColor: string
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  onVisibleChange?: (visible: boolean) => void
  isVisible?: boolean
  isPinned?: boolean
  onPinToggle?: () => void
}

export function CompactVariantCard({
  variant,
  variantIndex,
  variantColor,
  scrollContainerRef,
  onVisibleChange,
  isVisible = false,
  isPinned = false,
  onPinToggle,
}: CompactVariantCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const { addCourse, addSessionToCourse, hasSession, hasCourse, canAddSession } = useSchedule()
  const cardRef = useRef<HTMLDivElement | null>(null)
  // Use IntersectionObserver to track visibility
  useEffect(() => {
    if (!cardRef.current || !onVisibleChange) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        onVisibleChange(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        root: scrollContainerRef?.current || null,
        rootMargin: "0px",
      }
    )

    observer.observe(cardRef.current)

    return () => observer.disconnect()
  }, [onVisibleChange, scrollContainerRef])



  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle pin if clicking on buttons or dialogs
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('[role="dialog"]') ||
      target.closest('[role="button"]')
    ) {
      return
    }
    onPinToggle?.()
  }

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPinToggle?.()
  }

  const handleAddToSchedule = () => {
    let addedCount = 0
    let skippedCount = 0

    variant.courses.forEach((course) => {
      if (!hasCourse(course.courseCode)) {
        addCourse(course.courseCode, {
          courseTitle: course.courseTitle,
          courseCredit: course.courseCredit,
        })
      }

      course.sessions.forEach((session) => {
        const sessionId = session.id
        const wasAlreadyAdded = hasSession(sessionId)
        
        if (!wasAlreadyAdded) {
          const check = canAddSession(session, { courseCode: course.courseCode })
          
          if (check.ok) {
            addSessionToCourse(course.courseCode, session)
            addedCount++
          } else {
            skippedCount++
          }
        } else {
          skippedCount++
        }
      })
    })

    if (addedCount > 0) {
      toast.success(
        `Added ${addedCount} session${addedCount !== 1 ? "s" : ""} to schedule${
          skippedCount > 0 ? ` (${skippedCount} skipped)` : ""
        }`
      )
    } else if (skippedCount > 0) {
      toast.info(
        `Could not add sessions. ${skippedCount} session${skippedCount !== 1 ? "s" : ""} were skipped due to conflicts or rules.`
      )
    }
  }

  return (
    <div
      ref={cardRef}
      data-variant-id={variant.id}
      data-variant-card="true"
      className={cn(
        "flex flex-col w-64 flex-shrink-0 border rounded-lg overflow-hidden transition-all cursor-pointer",
        // Pin state - dashed border
        isPinned && "border-dashed"
      )}
      style={{
        borderColor: `color-mix(in oklab, ${variantColor} 25%, transparent)`,
        background: `color-mix(in oklab, ${variantColor} 50%, transparent)`,
      }}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between gap-2 px-3 py-2 border-b flex-shrink-0"
        style={{
          borderColor: `color-mix(in oklab, ${variantColor} 25%, transparent)`,
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h4 className="font-semibold text-xs truncate">
            Variant {variantIndex + 1}
          </h4>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isPinned && (
            <RichButton
              tooltip="Unpin variant"
              variant="ghost"
              className="size-5 shrink-0"
              onClick={handlePinClick}
            >
              <Pin className="size-3 fill-primary text-primary" />
            </RichButton>
          )}
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogTrigger asChild>
              <RichButton
                tooltip="View details"
                variant="ghost"
                className="size-5 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <Eye className="size-3" />
              </RichButton>
            </DialogTrigger>
            <GeneratedScheduleVariantDetailDialog
              variant={variant}
              variantIndex={variantIndex}
              variantColor={variantColor}
            />
          </Dialog>
          <RichButton
            tooltip="Add to schedule"
            variant="ghost"
            className="size-5 shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              handleAddToSchedule()
            }}
          >
            <Plus className="size-3" />
          </RichButton>
        </div>
      </div>

      {/* Courses & Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {variant.courses.map((course) => (
          <div
            key={course.courseCode}
            className="flex flex-row flex-wrap items-center gap-1"
          >
            <span className="font-medium text-xs text-foreground shrink-0">
              {course.courseCode}
            </span>
            {course.sessions.map((session) => (
              <Badge
                key={session.id}
                variant="outline"
                className="text-[10px] h-4 px-1.5 rounded-full shrink-0"
              >
                {session.code}
              </Badge>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

