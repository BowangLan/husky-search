"use client"

import { useEffect } from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"

import { InteractivePrereqGraph } from "@/components/prereq-graph/full-size-prereq-graph"

export default function PhysicsPrereqGraphPage() {
  // Query Physics courses
  const courses = useQuery(api.courses.listOverviewBySubjectArea, {
    subjectArea: "PHYS",
  })

  // Get store actions
  const setCourses = useInteractivePrereqGraphState((state) => state.setCourses)

  // Update store when query results change
  useEffect(() => {
    if (courses !== undefined) {
      setCourses(courses || [])
    }
  }, [courses, setCourses])

  // Get loading state
  const isLoading = courses === undefined

  return (
    <div className="h-full w-full">
      {isLoading ? (
        <div className="h-full w-full flex items-center justify-center">
          Loading graph...
        </div>
      ) : (
        <InteractivePrereqGraph nodes={[]} edges={[]} />
      )}
    </div>
  )
}
