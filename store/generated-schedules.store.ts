"use client"

import { useMemo } from "react"
import { createStore, useStore } from "zustand"
import { type GeneratedScheduleVariant } from "./schedule.store"

type GeneratedSchedulesState = {
  variants: GeneratedScheduleVariant[]
  selectedVariantIds: Set<string>
  maxSelectedVariants: number
  setVariants: (variants: GeneratedScheduleVariant[]) => void
  toggleVariant: (variantId: string) => void
  clearVariants: () => void
  clearSelection: () => void
}

export const generatedSchedulesStore = createStore<GeneratedSchedulesState>()((set) => ({
  variants: [],
  selectedVariantIds: new Set(),
  maxSelectedVariants: 3,
  
  setVariants: (variants) => {
    set((state) => {
      // Preserve selected variant IDs that still exist in new variants
      const newVariantIds = new Set(variants.map(v => v.id))
      const preservedSelection = new Set(
        Array.from(state.selectedVariantIds).filter(id =>
          newVariantIds.has(id)
        )
      )
      
      return { 
        variants,
        selectedVariantIds: preservedSelection
      }
    })
  },
  
  toggleVariant: (variantId) => {
    set((state) => {
      const newSelection = new Set(state.selectedVariantIds)
      
      if (newSelection.has(variantId)) {
        // Deselect
        newSelection.delete(variantId)
      } else {
        // Select (if under limit)
        if (newSelection.size < state.maxSelectedVariants) {
          newSelection.add(variantId)
        }
      }
      
      return { selectedVariantIds: newSelection }
    })
  },
  
  clearVariants: () => {
    set({ variants: [], selectedVariantIds: new Set() })
  },
  
  clearSelection: () => {
    set({ selectedVariantIds: new Set() })
  },
}))

const emptyArray: GeneratedScheduleVariant[] = []
const emptyStringArray: string[] = []
const emptySet = new Set<string>()

export function useGeneratedSchedules() {
  return useStore(generatedSchedulesStore, (s) => s)
}

export function useGeneratedScheduleVariants() {
  return useStore(generatedSchedulesStore, (s) => s.variants, {
    getServerSnapshot: () => emptyArray,
  })
}

export function useSelectedVariantIds() {
  const selectedVariantIds = useStore(
    generatedSchedulesStore,
    (s) => s.selectedVariantIds,
    {
      getServerSnapshot: () => emptySet,
    }
  )
  
  return useMemo(
    () => Array.from(selectedVariantIds),
    [selectedVariantIds]
  )
}

export function useSelectedVariants() {
  const variants = useStore(generatedSchedulesStore, (s) => s.variants, {
    getServerSnapshot: () => emptyArray,
  })
  const selectedVariantIds = useStore(
    generatedSchedulesStore,
    (s) => s.selectedVariantIds,
    {
      getServerSnapshot: () => emptySet,
    }
  )
  
  return useMemo(
    () => variants.filter((v) => selectedVariantIds.has(v.id)),
    [variants, selectedVariantIds]
  )
}

export function useCanSelectMoreVariants() {
  return useStore(
    generatedSchedulesStore,
    (s) => s.selectedVariantIds.size < s.maxSelectedVariants,
    {
      getServerSnapshot: () => true,
    }
  )
}

