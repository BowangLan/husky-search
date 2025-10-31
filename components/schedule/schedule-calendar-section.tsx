"use client"

import { useMemo } from "react"

import { useSelectedVariants } from "@/store/generated-schedules.store"
import { type ScheduleCourse } from "@/store/schedule.store"
import { ScheduleCalendar } from "./schedule-calendar"

type ScheduleCalendarSectionProps = {
  courses: ScheduleCourse[]
  sessionDataMap: Map<string, any>
}

export function ScheduleCalendarSection({
  courses,
  sessionDataMap,
}: ScheduleCalendarSectionProps) {
  const selectedVariants = useSelectedVariants()

  const variantColors = useMemo(() => {
    const colorMap = new Map<string, string>()
    const variantColors = [
      "var(--color-purple-500)",
      "var(--color-blue-500)",
      "var(--color-green-500)",
    ]
    selectedVariants.forEach((variant: { id: string }, idx: number) => {
      colorMap.set(variant.id, variantColors[idx % variantColors.length])
    })
    return colorMap
  }, [selectedVariants])

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className="flex items-center justify-between flex-none px-4 py-2 border-b">
        <h3 className="font-semibold text-sm">Weekly Schedule</h3>
      </div>
      <ScheduleCalendar
        courses={courses}
        sessionDataMap={sessionDataMap}
        selectedVariants={selectedVariants}
        variantColors={variantColors}
      />
    </div>
  )
}

