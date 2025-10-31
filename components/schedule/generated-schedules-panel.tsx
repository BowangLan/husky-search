"use client"

import { useMemo } from "react"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"
import { RotateCw, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  ScheduleGenerationLoading,
  useScheduleGeneration,
} from "./use-schedule-generation"
import { VariantCardsAndCalendarView } from "./variant-cards-and-calendar-view"

const VARIANT_COLORS = [
  "var(--color-purple-500)",
  "var(--color-blue-500)",
  "var(--color-green-500)",
  "var(--color-orange-500)",
  "var(--color-pink-500)",
  "var(--color-cyan-500)",
  "var(--color-indigo-500)",
  "var(--color-rose-500)",
]

export function GeneratedSchedulesPanel() {
  const { variants, clearSelection } = useGeneratedSchedules()
  const {
    reload,
    isGenerating,
    isLoadingCourseData,
  } = useScheduleGeneration()

  const isLoading = isGenerating || isLoadingCourseData

  const variantColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    variants.forEach((variant, idx) => {
      colorMap.set(variant.id, VARIANT_COLORS[idx % VARIANT_COLORS.length])
    })
    return colorMap
  }, [variants])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full flex-shrink-0">
        <div className="flex items-center justify-between flex-none px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-500" />
            <h3 className="font-semibold text-xs">Generated Schedules</h3>
          </div>
        </div>
        <ScheduleGenerationLoading />
      </div>
    )
  }

  if (variants.length === 0) {
    return (
      <div className="flex flex-col h-full flex-shrink-0">
        <div className="flex items-center justify-between flex-none px-3 py-1.5 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-purple-500" />
            <h3 className="font-semibold text-xs">Generated Schedules</h3>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-xs text-muted-foreground text-center">
            No variants available. Add courses without sessions to generate
            schedule options.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full flex-shrink-0">
      <div className="flex items-center justify-between flex-none px-3 py-1.5 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-purple-500" />
          <h3 className="font-semibold text-xs">Generated Schedules</h3>
          <span className="text-xs text-muted-foreground">
            ({variants.length})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="h-6 text-xs px-2"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reload}
            className="h-6 text-xs px-2"
            disabled={isLoading}
          >
            <RotateCw className="size-3 mr-1" />
            Reload
          </Button>
        </div>
      </div>

      <VariantCardsAndCalendarView
        variants={variants}
        variantColors={variantColors}
      />
    </div>
  )
}
