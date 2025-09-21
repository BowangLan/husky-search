"use client"

import { useUserStore } from "@/store/user.store"

// Centralized permission configuration using component names directly
export const COMPONENTS = {
  COURSE_DETAIL_STATS: "CourseDetailStatsSection",
  GPA_DISTRIBUTION: "GPADistroChartCard",
  CEC_EVALUATIONS: "CECEvaluations",
} as const

export type ComponentName = typeof COMPONENTS[keyof typeof COMPONENTS]

type PermissionType = "student" | "public"

// Permission rules - define what conditions grant each component access
export const COMPONENT_RULES: Record<ComponentName, PermissionType> = {
  [COMPONENTS.COURSE_DETAIL_STATS]: "public",
  [COMPONENTS.GPA_DISTRIBUTION]: "public",
  [COMPONENTS.CEC_EVALUATIONS]: "public",
}

// Hook to check if user has access to a component
export const useHasComponentAccess = (componentName: ComponentName): boolean => {
  const isUserStudent = useUserStore((state) => state.isUserStudent)

  // Re-evaluate permission rule when user state changes
  const permissionType = COMPONENT_RULES[componentName]

  if (permissionType === "public") {
    return true
  }

  return permissionType === "student" && isUserStudent
}

// Utility to check component access without hook (for use outside components)
export const hasComponentAccess = (componentName: ComponentName): boolean => {
  const permissionType = COMPONENT_RULES[componentName]

  if (permissionType === "public") {
    return true
  }

  const isUserStudent = useUserStore.getState().isUserStudent
  return permissionType === "student" && isUserStudent
}