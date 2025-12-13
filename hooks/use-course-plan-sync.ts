"use client"

import { useEffect, useCallback, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCoursePlan } from "@/store/course-plan.store"
import { toast } from "sonner"

export function useCoursePlanSync() {
  const { user } = useUser()
  const store = useCoursePlan()
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  // Convex hooks
  const defaultPlan = useQuery(
    api.coursePlans.getDefaultPlan,
    user ? {} : "skip"
  )
  const createPlan = useMutation(api.coursePlans.createPlan)
  const updatePlan = useMutation(api.coursePlans.updatePlan)

  // Initial load from backend
  useEffect(() => {
    if (!user || !defaultPlan || !store.hydrated) return

    // Only load if we don't have a local plan or it's outdated
    if (
      !store.convexPlanId ||
      !store.lastSyncedAt ||
      (defaultPlan.updatedAt > store.lastSyncedAt)
    ) {
      console.log("[Sync] Loading plan from backend")
      store.loadFromBackend(defaultPlan)
    }
  }, [user, defaultPlan, store.hydrated])

  // Sync to backend when local changes occur
  const syncToBackend = useCallback(async () => {
    if (!user || !store.hydrated) return
    if (store.syncStatus === "syncing") return

    try {
      store.setSyncStatus("syncing")

      const planData = {
        terms: store.terms,
        plansByTerm: store.plansByTerm,
        activeTermIds: store.activeTermIds,
      }

      if (!store.convexPlanId) {
        // Create new plan
        console.log("[Sync] Creating new plan")
        const planId = await createPlan({
          name: "My Course Plan",
          isDefault: true,
          ...planData,
        })
        store.setConvexPlanId(planId)
        store.markSynced(1)
      } else {
        // Update existing plan
        console.log("[Sync] Updating plan")
        const result = await updatePlan({
          planId: store.convexPlanId,
          ...planData,
          version: store.remoteVersion ?? 0,
        })

        if (result?.version) {
          store.markSynced(result.version)
        }
      }

      store.setSyncStatus("synced")
      console.log("[Sync] Sync successful")
    } catch (error) {
      console.error("[Sync] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Sync failed"

      if (errorMessage.includes("modified by another device")) {
        toast.error("Plan conflict", {
          description: "Your plan was modified on another device. Refreshing...",
        })
        // Reload from backend
        if (defaultPlan) {
          store.loadFromBackend(defaultPlan)
        }
      } else {
        store.setSyncStatus("error", errorMessage)
        toast.error("Failed to sync plan", {
          description: errorMessage,
        })
      }
    }
  }, [user, store, createPlan, updatePlan, defaultPlan])

  // Debounced sync on local changes
  useEffect(() => {
    if (!user || !store.hydrated) return
    if (store.localVersion === 0) return // Initial state

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Debounce sync by 2 seconds
    syncTimeoutRef.current = setTimeout(() => {
      syncToBackend()
    }, 2000)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [
    store.terms,
    store.plansByTerm,
    store.activeTermIds,
    store.localVersion,
    syncToBackend,
  ])

  // Migration: Check if user has local data but no backend plan
  useEffect(() => {
    if (!user || !store.hydrated) return

    // Check if user has local data but no backend plan
    if (!defaultPlan && store.terms.length > 0 && !store.convexPlanId) {
      console.log("[Migration] Migrating local plan to backend")

      // Create plan from local storage
      createPlan({
        name: "My Course Plan",
        isDefault: true,
        terms: store.terms,
        plansByTerm: store.plansByTerm,
        activeTermIds: store.activeTermIds || [],
      }).then((planId) => {
        store.setConvexPlanId(planId)
        store.markSynced(1)
        toast.success("Plan synced to cloud", {
          description: "Your local plan has been saved to your account",
        })
      }).catch((error) => {
        console.error("[Migration] Failed to migrate plan:", error)
        toast.error("Failed to sync local plan", {
          description: "Your plan is still saved locally",
        })
      })
    }
  }, [user, defaultPlan, store, createPlan])

  return {
    syncStatus: store.syncStatus,
    syncError: store.syncError,
    lastSyncedAt: store.lastSyncedAt,
    manualSync: syncToBackend,
  }
}
