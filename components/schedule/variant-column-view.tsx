"use client"

import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"
import { type GeneratedScheduleVariant } from "@/store/schedule.store"
import { useSchedule } from "@/store/schedule.store"
import { useQuery } from "convex/react"
import { Check, Eye, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { RichButton } from "@/components/ui/rich-button"

import { GeneratedScheduleVariantDetailDialog } from "./generated-schedule-variant-detail-dialog"
import { VariantMiniCalendar } from "./variant-mini-calendar"

type VariantColumnViewProps = {
  variants: GeneratedScheduleVariant[]
  variantColors: Map<string, string>
}

export function VariantColumnView({
  variants,
  variantColors,
}: VariantColumnViewProps) {
  const { selectedVariantIds, toggleVariant, maxSelectedVariants } =
    useGeneratedSchedules()

  // Get all session IDs from all variants
  const sessionIds = useMemo(() => {
    return variants.flatMap((variant) =>
      variant.courses.flatMap((course) => course.sessions.map((s) => s.id))
    )
  }, [variants])

  // Fetch session data from Convex
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )
  const isLoadingSessionData =
    sessionDataList === undefined && sessionIds.length > 0

  // Create a map of sessionId -> sessionData for quick lookup
  const sessionDataMap = useMemo(() => {
    const map = new Map<string, any>()
    if (sessionDataList) {
      sessionDataList.forEach((data: any) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [sessionDataList])

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden min-h-0">
      <div className="inline-flex flex-nowrap gap-4 p-4 h-full">
        {variants.map((variant, idx) => {
          const isSelected = selectedVariantIds.has(variant.id)
          const canSelect =
            selectedVariantIds.size < maxSelectedVariants || isSelected
          const variantColor =
            variantColors.get(variant.id) || "var(--color-purple-500)"

          return (
            <VariantColumn
              key={variant.id}
              variant={variant}
              variantIndex={idx}
              variantColor={variantColor}
              isSelected={isSelected}
              canSelect={canSelect}
              maxSelectedVariants={maxSelectedVariants}
              sessionDataMap={sessionDataMap}
              isLoadingSessionData={isLoadingSessionData}
              onToggle={() => toggleVariant(variant.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

type VariantColumnProps = {
  variant: GeneratedScheduleVariant
  variantIndex: number
  variantColor: string
  isSelected: boolean
  canSelect: boolean
  maxSelectedVariants: number
  sessionDataMap: Map<string, any>
  isLoadingSessionData: boolean
  onToggle: () => void
}

function VariantColumn({
  variant,
  variantIndex,
  variantColor,
  isSelected,
  canSelect,
  maxSelectedVariants,
  sessionDataMap,
  isLoadingSessionData,
  onToggle,
}: VariantColumnProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const { addCourse, addSessionToCourse, hasSession, hasCourse, canAddSession } = useSchedule()

  const handleAddToSchedule = () => {
    let addedCount = 0
    let skippedCount = 0

    variant.courses.forEach((course) => {
      // Check if course exists in the term, if not create it
      if (!hasCourse(course.courseCode)) {
        addCourse(course.courseCode, {
          courseTitle: course.courseTitle,
          courseCredit: course.courseCredit,
        })
      }

      // Add each session to the course
      course.sessions.forEach((session) => {
        const sessionId = session.id
        const wasAlreadyAdded = hasSession(sessionId)
        
        if (!wasAlreadyAdded) {
          // Check if session can be added (validation)
          const check = canAddSession(session, { courseCode: course.courseCode })
          
          if (check.ok) {
            // Add session directly to existing course
            addSessionToCourse(course.courseCode, session)
            addedCount++
          } else {
            // Session couldn't be added due to conflict or rule violation
            skippedCount++
          }
        } else {
          // Session already exists, skip it
          skippedCount++
        }
      })
    })

    // Show toast notification
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
      className={cn(
        "flex flex-col w-80 flex-shrink-0 border rounded-lg overflow-hidden transition-all",
        isSelected
          ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-md"
          : "border-border bg-card hover:border-purple-300 dark:hover:border-purple-700",
        !canSelect && !isSelected && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="size-3 rounded-full shrink-0"
            style={{
              background: variantColor,
            }}
          />
          <h4 className="font-semibold text-sm truncate">
            Variant {variantIndex + 1}
          </h4>
          {isSelected && (
            <Badge variant="secondary" className="text-xs shrink-0">
              Selected
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogTrigger asChild>
              <RichButton
                tooltip="View details"
                variant="ghost"
                size="icon-xs"
                className="size-6 shrink-0"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <Eye className="size-3.5" />
              </RichButton>
            </DialogTrigger>
            <GeneratedScheduleVariantDetailDialog
              variant={variant}
              variantIndex={variantIndex}
              variantColor={variantColor}
            />
          </Dialog>
          <Button
            size="icon"
            variant={isSelected ? "default" : "ghost"}
            className={cn(
              "size-6 shrink-0",
              isSelected && "bg-purple-600 hover:bg-purple-700"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            disabled={!canSelect && !isSelected}
          >
            {isSelected ? (
              <Check className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Add to Schedule Button */}
      <div className="px-3 py-2 border-b flex-shrink-0">
        <Button
          onClick={handleAddToSchedule}
          className="w-full"
          size="sm"
          variant="default"
        >
          <Plus className="size-4 mr-2" />
          Add to Schedule
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-none overflow-y-auto p-3 space-y-2 border-b">
        {variant.courses.map((course) => (
          <div
            key={course.courseCode}
            className="flex flex-row flex-wrap items-center gap-1.5"
          >
            <span className="font-medium text-xs text-foreground shrink-0">
              {course.courseCode}
            </span>
            {course.sessions.map((session) => (
              <Badge
                key={session.id}
                variant="outline"
                className="text-[10px] h-5 px-2 rounded-full shrink-0"
              >
                {session.code}
              </Badge>
            ))}
          </div>
        ))}
      </div>

      {/* Mini Calendar */}
      <div className="flex-shrink-0 border-t">
        <VariantMiniCalendar
          courses={variant.courses.map((c) => ({
            courseCode: c.courseCode,
            sessions: c.sessions,
          }))}
          variantColor={variantColor}
        />
      </div>

      {!canSelect && !isSelected && (
        <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/30">
          Maximum {maxSelectedVariants} variants can be selected
        </div>
      )}
    </div>
  )
}
