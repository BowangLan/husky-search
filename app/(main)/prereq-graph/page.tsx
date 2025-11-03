"use client"

import { useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { useCourseDataStore } from "@/store/course-data.store"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useQuery } from "convex/react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { InteractivePrereqGraph } from "@/components/prereq-graph/full-size-prereq-graph"

export default function PrereqGraphPage() {
  const searchParams = useSearchParams()
  const subjectArea = searchParams.get("subjectArea")
  const courseCodesParam = searchParams.get("courseCodes")
  const nodes = useInteractivePrereqGraphState((state) => state.nodes)
  const edges = useInteractivePrereqGraphState((state) => state.edges)

  // Parse courseCodes from query param (comma-separated string)
  const courseCodes = useMemo(() => {
    if (!courseCodesParam) return null
    // Split by comma and filter out empty strings
    const codes = courseCodesParam
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    return codes.length > 0 ? codes : null
  }, [courseCodesParam])

  // Query courses by subject area and course codes in parallel
  const coursesBySubjectArea = useQuery(
    api.courses.listOverviewBySubjectArea,
    subjectArea && subjectArea.length > 0
      ? {
          subjectArea,
        }
      : "skip"
  )

  const coursesByCodes = useQuery(
    api.courses.listOverviewByCourseCodes,
    courseCodes && courseCodes.length > 0
      ? {
          courseCodes,
        }
      : "skip"
  )

  console.log("[render] prereq-graph/page", {
    subjectArea,
    courseCodes,
    coursesBySubjectArea,
    coursesByCodes,
  })

  // Get store actions
  const setCourses = useInteractivePrereqGraphState((state) => state.setCourses)

  // Merge results from both queries when available
  useEffect(() => {
    // If neither parameter is provided, clear the store
    if ((!subjectArea || subjectArea.length === 0) && !courseCodes) {
      setCourses([])
      return
    }

    // Wait for both queries to complete if they're both requested
    const hasSubjectAreaQuery = subjectArea && subjectArea.length > 0
    const hasCourseCodesQuery = courseCodes && courseCodes.length > 0

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

    console.log("uniqubeCourses", uniqueCourses)

    setCourses(uniqueCourses)
    useCourseDataStore.getState().setCourseData(uniqueCourses)
  }, [
    coursesBySubjectArea,
    coursesByCodes,
    subjectArea,
    courseCodes,
    setCourses,
  ])

  // Get loading state - loading if any active query is still loading
  const hasSubjectAreaQuery = subjectArea && subjectArea.length > 0
  const hasCourseCodesQuery = courseCodes && courseCodes.length > 0

  // If no queries are active, not loading
  let isLoading = false
  if (hasSubjectAreaQuery && coursesBySubjectArea === undefined) {
    isLoading = true
  }
  if (hasCourseCodesQuery && coursesByCodes === undefined) {
    isLoading = true
  }
  if (!hasSubjectAreaQuery && !hasCourseCodesQuery) {
    isLoading = false
  }

  return (
    <div className="h-full w-full">
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center">
          Loading graph...
        </div>
      ) : (
        <>
          <InteractivePrereqGraph nodes={nodes} edges={edges} />
          <div>
            <h1>Prereq Graph</h1>
          </div>
          {`Nodes: ${nodes.length}, Edges: ${edges.length}`}
        </>
      )}
    </div>
  )
}
