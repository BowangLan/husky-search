"use client"

import { create } from "zustand"
import type { PrereqGraphCourseNodeData } from "@/lib/prereq-graph-utils"

export type PrereqGraphSelectedCourseStore = {
  selectedCourse: PrereqGraphCourseNodeData | null
  setSelectedCourse: (course: PrereqGraphCourseNodeData | null) => void
  clearSelectedCourse: () => void
}

export const usePrereqGraphSelectedCourseStore = create<PrereqGraphSelectedCourseStore>(
  (set) => ({
    selectedCourse: null,
    setSelectedCourse: (course: PrereqGraphCourseNodeData | null) =>
      set({ selectedCourse: course }),
    clearSelectedCourse: () => set({ selectedCourse: null }),
  })
)

