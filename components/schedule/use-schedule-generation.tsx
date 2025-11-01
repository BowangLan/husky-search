"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { api } from "@/convex/_generated/api"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"
import { useScheduledCourses } from "@/store/schedule.store"
import { useQuery } from "convex/react"
import { Loader2 } from "lucide-react"

import { generateScheduleVariants } from "@/lib/schedule-generator"

export function useScheduleGeneration() {
  const courses = useScheduledCourses()
  const { setVariants } = useGeneratedSchedules()
  const [isGenerating, setIsGenerating] = useState(false)

  // Instance-level refs for tracking state and cancellation
  const generationKeyRef = useRef("")
  const cancelledRef = useRef(false)
  const coursesRef = useRef(courses)
  const coursesWithSessionsDataRef = useRef<Array<{
    courseCode: string
    courseTitle?: string
    courseCredit?: string | number
    sessions: any[]
  }> | undefined>(undefined)
  const currentGenerationKeyRef = useRef("")

  // Check if there are courses without sessions
  const coursesWithoutSessions = useMemo(() => {
    return courses.filter((c) => c.sessions.length === 0)
  }, [courses])

  const courseCodesToFetch = useMemo(() => {
    return coursesWithoutSessions.map((c) => c.courseCode)
  }, [coursesWithoutSessions])

  // Create a stable key for the current generation state
  const currentGenerationKey = useMemo(() => {
    return JSON.stringify({
      coursesWithoutSessions: courseCodesToFetch.sort(),
      coursesWithSessions: courses
        .filter((c) => c.sessions.length > 0)
        .map((c) => ({
          code: c.courseCode,
          sessions: c.sessions.map((s) => s.id).sort(),
        })),
    })
  }, [courseCodesToFetch, courses])

  const coursesWithSessionsData = useQuery(
    api.courses.getCoursesWithSessions,
    courseCodesToFetch.length > 0 ? { courseCodes: courseCodesToFetch } : "skip"
  )

  // Keep refs in sync with latest values
  useEffect(() => {
    coursesRef.current = courses
  }, [courses])

  useEffect(() => {
    coursesWithSessionsDataRef.current = coursesWithSessionsData
  }, [coursesWithSessionsData])

  useEffect(() => {
    currentGenerationKeyRef.current = currentGenerationKey
  }, [currentGenerationKey])

  // Auto-generate schedules when courses or course data changes
  useEffect(() => {
    // Reset cancellation flag at start of effect
    cancelledRef.current = false

    // If no courses without sessions, clear variants and reset generation key
    if (coursesWithoutSessions.length === 0) {
      setIsGenerating(false)
      // Always clear variants when there are no courses without sessions
      // Check if we need to clear (avoid unnecessary state updates)
      if (generationKeyRef.current !== "") {
        generationKeyRef.current = ""
      }
      // Always ensure variants are cleared (use a separate effect to avoid race conditions)
      setVariants([])
      return
    }

    // Skip if course data is still loading
    if (coursesWithSessionsData === undefined) {
      setIsGenerating(false)
      return
    }

    // Skip if course data is empty (no sessions found)
    if (coursesWithSessionsData.length === 0) {
      setIsGenerating(false)
      // Clear variants if we previously had some but now there's no data
      if (generationKeyRef.current !== "") {
        generationKeyRef.current = ""
        setVariants([])
      }
      return
    }

    // Check if the generation key has changed (indicating we need to regenerate)
    // This happens when sessions are added/removed or courses change
    const keyChanged = generationKeyRef.current !== currentGenerationKey

    // Skip if we've already generated for this exact state
    if (!keyChanged) {
      setIsGenerating(false)
      return
    }

    // Mark that we're generating for this state
    generationKeyRef.current = currentGenerationKey
    setIsGenerating(true)

    // Use setTimeout to allow UI to update before heavy computation
    const timeoutId = setTimeout(() => {
      // Check cancellation before any work
      if (cancelledRef.current) return

      // Get latest values from refs
      const latestCourses = coursesRef.current
      const latestCoursesWithSessionsData = coursesWithSessionsDataRef.current
      const latestKey = currentGenerationKeyRef.current

      // Double-check that we're still generating for the same state
      // This prevents stale closures from causing incorrect updates
      if (latestKey !== generationKeyRef.current) {
        // Key changed, skip this generation
        if (!cancelledRef.current) {
          setIsGenerating(false)
        }
        return
      }

      // Verify we still have valid data
      if (latestCoursesWithSessionsData === undefined || latestCoursesWithSessionsData.length === 0) {
        if (!cancelledRef.current) {
          setIsGenerating(false)
          setVariants([])
        }
        return
      }

      try {
        // Generate schedule variants using latest values
        // Generates ALL valid combinations (no limit)
        const generatedVariants = generateScheduleVariants(
          latestCourses,
          latestCoursesWithSessionsData
        )

        // Check cancellation again before state update
        if (cancelledRef.current) return

        // Verify key still matches (triple-check)
        if (currentGenerationKeyRef.current !== generationKeyRef.current) {
          return
        }

        if (generatedVariants.length > 0) {
          setVariants(generatedVariants)
        } else {
          // Clear variants if generation returned empty
          setVariants([])
        }
      } catch (error) {
        if (!cancelledRef.current) {
          console.error("Error generating schedules:", error)
          setVariants([])
        }
      } finally {
        if (!cancelledRef.current) {
          setIsGenerating(false)
        }
      }
    }, 100)

    return () => {
      cancelledRef.current = true
      clearTimeout(timeoutId)
    }
  }, [
    courses,
    coursesWithoutSessions,
    coursesWithSessionsData,
    currentGenerationKey,
    setVariants,
  ])

  const reload = () => {
    // Clear the generation key to force regeneration
    generationKeyRef.current = ""
    // Clear variants to reset state
    setVariants([])
    // Reset loading state
    setIsGenerating(false)
  }

  return {
    isGenerating,
    isLoadingCourseData:
      coursesWithSessionsData === undefined && courseCodesToFetch.length > 0,
    reload,
  }
}

export function ScheduleGenerationLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-8 border-l">
      <Loader2 className="size-6 animate-spin text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground">
        Generating schedule variants...
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        This may take a few seconds
      </p>
    </div>
  )
}
