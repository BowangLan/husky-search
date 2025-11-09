"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { useCourseDataStore } from "@/store/course-data.store"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useQuery } from "convex/react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import {
  parseCourseCodes,
  parseSubjectArea,
} from "@/hooks/use-prereq-graph-url-params"
import { InteractivePrereqGraph } from "@/components/prereq-graph/full-size-prereq-graph"

const usePrereqGraphPageSearchParamsHydration = () => {
  const searchParams = useSearchParams()
  const subjectArea = searchParams.get("subjectArea")
  const courseCodesParam = searchParams.get("courseCodes")

  useEffect(() => {
    const courseCodes = parseCourseCodes(courseCodesParam)
    const parsedSubjectArea = parseSubjectArea(subjectArea)
    console.log("[usePrereqGraphPageSearchParamsHydration] useEffect", {
      courseCodes,
      parsedSubjectArea,
    })
    useInteractivePrereqGraphState.getState().setPrimaryCourseCodes(courseCodes)
    useInteractivePrereqGraphState
      .getState()
      .setPrimarySubjectArea(parsedSubjectArea)
  }, [courseCodesParam, subjectArea])
}

function PrereqGraphPageClient() {
  usePrereqGraphPageSearchParamsHydration()
  const nodes = useInteractivePrereqGraphState((state) => state.nodes)
  const edges = useInteractivePrereqGraphState((state) => state.edges)
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )
  const primarySubjectArea = useInteractivePrereqGraphState(
    (state) => state.primarySubjectArea
  )
  const hasPrimarySubjectArea =
    primarySubjectArea !== null && primarySubjectArea.length > 0
  const hasPrimaryCourseCodes = primaryCourseCodes.size > 0

  // Parse courseCodes from query param (comma-separated string with + for spaces)

  // Query courses by subject area and course codes in parallel
  const coursesBySubjectArea = useQuery(
    api.courses.listOverviewBySubjectArea,
    hasPrimarySubjectArea
      ? {
        subjectArea: primarySubjectArea,
      }
      : "skip"
  )

  const coursesByCodes = useQuery(
    api.courses.listOverviewByCourseCodes,
    hasPrimaryCourseCodes
      ? {
        courseCodes: Array.from(primaryCourseCodes),
      }
      : "skip"
  )

  console.log("[render] prereq-graph/page", {
    primarySubjectArea,
    primaryCourseCodes,
    coursesBySubjectArea,
    coursesByCodes,
  })

  // Get store actions
  const setCourses = useInteractivePrereqGraphState((state) => state.setCourses)

  // Merge results from both queries when available - only runs once during initialization
  useEffect(() => {
    // Only run during initialization
    // If neither parameter is provided, clear the store and finish initialization
    if (
      (!primarySubjectArea || primarySubjectArea.length === 0) &&
      primaryCourseCodes.size === 0
    ) {
      setCourses([])
      return
    }

    // Wait for both queries to complete if they're both requested
    const hasSubjectAreaQuery =
      primarySubjectArea && primarySubjectArea.length > 0
    const hasCourseCodesQuery = primaryCourseCodes.size > 0

    console.log("[useEffect] prereq-graph/page", {
      hasSubjectAreaQuery,
      hasCourseCodesQuery,
    })

    // If subject area query is requested but still loading, wait
    if (hasSubjectAreaQuery && coursesBySubjectArea === undefined) {
      return
    }

    // If course codes query is requested but still loading, wait
    if (hasCourseCodesQuery && coursesByCodes === undefined) {
      return
    }

    // Merge results from both queries
    const coursesArray: ConvexCourseOverview[] = []

    // Add courses from subject area query
    if (hasSubjectAreaQuery && coursesBySubjectArea !== undefined) {
      if (Array.isArray(coursesBySubjectArea)) {
        coursesArray.push(...coursesBySubjectArea)
      }
    }

    // Add courses from course codes query (convert Record to array)
    if (hasCourseCodesQuery && coursesByCodes !== undefined) {
      const coursesFromCodes = Object.values(coursesByCodes)
      coursesArray.push(...coursesFromCodes)
    }

    // De-duplicate by courseCode (keep first occurrence)
    const uniqueCourses = Array.from(
      new Map(
        coursesArray.map((course) => [course.courseCode, course])
      ).values()
    )

    console.log("[useEffect] prereq-graph/page", { uniqueCourses })

    setCourses(uniqueCourses)
    useCourseDataStore.getState().setCourseData(uniqueCourses)

    // Mark initialization as complete
  }, [
    coursesBySubjectArea,
    coursesByCodes,
    primarySubjectArea,
    primaryCourseCodes,
    setCourses,
  ])

  // Get loading state - only show loading during initialization
  // After initialization, dynamic course additions are handled by usePrereqGraphAddCourse hook
  // and should not trigger the page-level loading state
  // const isBySubjectAreaLoading = hasPrimarySubjectArea && coursesBySubjectArea === undefined
  // const isByCourseCodesLoading = hasPrimaryCourseCodes && coursesByCodes === undefined
  // const isLoading = isBySubjectAreaLoading || isByCourseCodesLoading
  const isLoading = false

  return (
    <div className="h-full w-full">
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center">
          Loading graph...
        </div>
      ) : (
        <>
          <InteractivePrereqGraph nodes={nodes} edges={edges} />
        </>
      )}
    </div>
  )
}

export default function PrereqGraphPage() {
  return (
    <Suspense>
      <PrereqGraphPageClient />
    </Suspense>
  )
}
