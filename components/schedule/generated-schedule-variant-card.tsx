"use client"

import { useState } from "react"
import { Eye, Check, X } from "lucide-react"
import { type GeneratedScheduleVariant } from "@/store/schedule.store"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RichButton } from "@/components/ui/rich-button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GeneratedScheduleVariantDetailDialog } from "./generated-schedule-variant-detail-dialog"

type GeneratedScheduleVariantCardProps = {
  variant: GeneratedScheduleVariant
  variantIndex: number
  variantColors: Map<string, string>
}

export function GeneratedScheduleVariantCard({
  variant,
  variantIndex,
  variantColors,
}: GeneratedScheduleVariantCardProps) {
  const { selectedVariantIds, toggleVariant, maxSelectedVariants } = useGeneratedSchedules()
  const isSelected = selectedVariantIds.has(variant.id)
  const canSelect = selectedVariantIds.size < maxSelectedVariants || isSelected
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleToggle = () => {
    if (canSelect) {
      toggleVariant(variant.id)
    }
  }

  return (
    <>
      <div
        className={cn(
          "border rounded-lg p-4 transition-all",
          isSelected
            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20 shadow-md"
            : "border-border bg-card hover:border-purple-300 dark:hover:border-purple-700",
          !canSelect && !isSelected && "opacity-50"
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div
              className="size-3 rounded-full shrink-0"
              style={{
                background: variantColors.get(variant.id) || "var(--color-purple-500)",
              }}
            />
            <h4 className="font-semibold text-sm">Schedule Variant {variantIndex + 1}</h4>
            {isSelected && (
              <Badge variant="secondary" className="text-xs">
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
                variantColor={variantColors.get(variant.id) || "var(--color-purple-500)"}
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
                handleToggle()
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

        <div className="space-y-2">
          {variant.courses.map((course) => (
            <div key={course.courseCode} className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{course.courseCode}</span>
                {course.sessions.map((session) => (
                  <Badge
                    key={session.id}
                    variant="outline"
                    className="text-[10px] h-4 px-1.5"
                  >
                    {session.code}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>

        {!canSelect && !isSelected && (
          <div className="mt-2 text-xs text-muted-foreground">
            Maximum {maxSelectedVariants} variants can be selected
          </div>
        )}
      </div>
    </>
  )
}
