"use client"

import { useMemo, useState } from "react"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"
import { RotateCw, Sparkles, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DEFAULT_GENERATION_OPTIONS,
  type ScheduleGenerationOptions,
} from "@/config/schedule-generation"

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
  
  // Manage generation options state
  const [generationOptions, setGenerationOptions] = useState<ScheduleGenerationOptions>(
    DEFAULT_GENERATION_OPTIONS
  )
  
  const {
    reload,
    isGenerating,
    isLoadingCourseData,
  } = useScheduleGeneration(generationOptions)

  const isLoading = isGenerating || isLoadingCourseData

  const variantColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    variants.forEach((variant, idx) => {
      colorMap.set(variant.id, VARIANT_COLORS[idx % VARIANT_COLORS.length])
    })
    return colorMap
  }, [variants])

  const handleOptionChange = (
    option: keyof ScheduleGenerationOptions,
    value: boolean
  ) => {
    setGenerationOptions((prev) => ({
      ...prev,
      [option]: value,
    }))
  }

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
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs px-2"
                disabled={isLoading}
              >
                <Settings className="size-3 mr-1" />
                Options
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Generation Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Label
                        htmlFor="include-closed"
                        className="text-xs cursor-pointer flex-1"
                      >
                        Include closed sessions
                      </Label>
                      <Switch
                        id="include-closed"
                        checked={generationOptions.includeClosedSessions}
                        onCheckedChange={(checked) =>
                          handleOptionChange("includeClosedSessions", checked)
                        }
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <Label
                        htmlFor="include-codes"
                        className="text-xs cursor-pointer flex-1"
                      >
                        Include courses requiring codes
                      </Label>
                      <Switch
                        id="include-codes"
                        checked={generationOptions.includeCoursesRequiringCodes}
                        onCheckedChange={(checked) =>
                          handleOptionChange("includeCoursesRequiringCodes", checked)
                        }
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
