"use client"

import { useMemo, useRef, useState } from "react"
import { type GeneratedScheduleVariant } from "@/store/schedule.store"

import { CompactVariantCard } from "./compact-variant-card"
import { VariantMasterCalendarView } from "./variant-master-calendar-view"

type VariantCardsAndCalendarViewProps = {
  variants: GeneratedScheduleVariant[]
  variantColors: Map<string, string>
}

export function VariantCardsAndCalendarView({
  variants,
  variantColors,
}: VariantCardsAndCalendarViewProps) {
  const [visibleVariantIds, setVisibleVariantIds] = useState<Set<string>>(
    new Set()
  )
  const [pinnedVariantIds, setPinnedVariantIds] = useState<Set<string>>(
    new Set()
  )
  const [hoveredCourseCode, setHoveredCourseCode] = useState<string | null>(null)
  const [hoveredVariantId, setHoveredVariantId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const handleCourseHoverChange = (courseCode: string | null, variantId: string | null) => {
    setHoveredCourseCode(courseCode)
    setHoveredVariantId(variantId)
  }

  const handleVariantVisibilityChange = (variantId: string, visible: boolean) => {
    setVisibleVariantIds((prev) => {
      const next = new Set(prev)
      if (visible) {
        next.add(variantId)
      } else {
        next.delete(variantId)
      }
      return next
    })
  }

  const handlePinToggle = (variantId: string) => {
    setPinnedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) {
        next.delete(variantId)
      } else {
        next.add(variantId)
      }
      return next
    })
  }

  const visibleVariants = useMemo(() => {
    // Include both visible and pinned variants
    return variants.filter(
      (variant) => visibleVariantIds.has(variant.id) || pinnedVariantIds.has(variant.id)
    )
  }, [variants, visibleVariantIds, pinnedVariantIds])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Horizontal scrollable variant cards */}
      <div
        ref={scrollContainerRef}
        className="flex-none overflow-x-auto overflow-y-hidden border-b"
      >
        <div className="inline-flex flex-nowrap gap-3 p-3">
          {variants.map((variant, idx) => (
            <CompactVariantCard
              key={variant.id}
              variant={variant}
              variantIndex={idx}
              variantColor={
                variantColors.get(variant.id) || "var(--color-purple-500)"
              }
              scrollContainerRef={scrollContainerRef}
              onVisibleChange={(visible) =>
                handleVariantVisibilityChange(variant.id, visible)
              }
              isVisible={visibleVariantIds.has(variant.id)}
              isPinned={pinnedVariantIds.has(variant.id)}
              onPinToggle={() => handlePinToggle(variant.id)}
            />
          ))}
        </div>
      </div>

      {/* Master calendar view */}
      <VariantMasterCalendarView
        visibleVariants={visibleVariants}
        variantColors={variantColors}
        hoveredCourseCode={hoveredCourseCode}
        hoveredVariantId={hoveredVariantId}
        onCourseHoverChange={handleCourseHoverChange}
      />
    </div>
  )
}

