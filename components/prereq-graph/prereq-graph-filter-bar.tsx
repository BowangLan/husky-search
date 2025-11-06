"use client"

import { useEffect, useRef, useState } from "react"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useNodes, useReactFlow } from "@xyflow/react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import {
  createNodesAndEdgesFromCourses,
  type PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function PrereqGraphFilterBar() {
  const [onlyPrimaryCourses, setOnlyPrimaryCourses] = useState(false)
  const { getNodes, setNodes } = useReactFlow<PrereqGraphNodeUnion>()
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )
  const rf = useReactFlow<PrereqGraphNodeUnion>()

  // Store the original hidden state of nodes to restore when filter is disabled
  const originalHiddenState = useRef<Map<string, boolean>>(new Map())
  const prevNodesLengthRef = useRef<number>(0)

  useEffect(() => {
    // const currentNodes = getNodes()
    // const nodesLength = currentNodes.length

    // Track previous nodes length to detect when nodes are added/removed
    // prevNodesLengthRef.current = nodesLength

    if (onlyPrimaryCourses) {
      // Store original hidden state before applying filter (only for new nodes)
      // currentNodes.forEach((node) => {
      //   if (!originalHiddenState.current.has(node.id)) {
      //     originalHiddenState.current.set(node.id, node.hidden ?? false)
      //   }
      // })

      // Filter nodes to only show primary courses
      // Keep group nodes and nodes whose courseCode is in primaryCourseCodes
      // const filteredNodes = currentNodes.map((node) => {
      //   // Keep group nodes (subject area nodes) visible
      //   if ("subjectArea" in node.data) {
      //     return node
      //   }

      //   // For course nodes, check if courseCode is in primaryCourseCodes
      //   if ("courseCode" in node.data) {
      //     const courseCode = node.data.courseCode
      //     const isPrimary = primaryCourseCodes.has(courseCode)
      //     return {
      //       ...node,
      //       hidden: !isPrimary,
      //     }
      //   }

      //   return node
      // })

      const courseDependenciesMap =
        useInteractivePrereqGraphState.getState().courseDependenciesMap

      // Step 1: Find all prerequisites of each primary course (going backwards)
      // Map: primaryCourseCode -> Set of all its prerequisites
      const prerequisitesByPrimary = new Map<string, Set<string>>()

      const collectPrerequisites = (
        courseCode: string,
        visited: Set<string>,
        targetSet: Set<string>
      ) => {
        if (visited.has(courseCode)) {
          return
        }
        visited.add(courseCode)

        const courseDependencies = courseDependenciesMap.get(courseCode)
        if (courseDependencies) {
          courseDependencies.leftCourseCodes.forEach((prereqCode) => {
            targetSet.add(prereqCode)
            collectPrerequisites(prereqCode, visited, targetSet)
          })
        }
      }

      Array.from(primaryCourseCodes).forEach((primaryCode) => {
        const prereqSet = new Set<string>()
        collectPrerequisites(primaryCode, new Set<string>(), prereqSet)
        prerequisitesByPrimary.set(primaryCode, prereqSet)
      })

      // Step 2: Count how many primary courses each prerequisite is connected to
      // A course is "connected" to a primary course if it's a prerequisite (directly or indirectly)
      const prerequisiteCounts = new Map<string, number>()
      prerequisitesByPrimary.forEach((prereqSet) => {
        prereqSet.forEach((prereqCode) => {
          prerequisiteCounts.set(
            prereqCode,
            (prerequisiteCounts.get(prereqCode) || 0) + 1
          )
        })
      })

      // Step 3: Only include courses that are prerequisites of multiple primary courses
      // This ensures we only show courses that connect primary courses, not leaf nodes
      const coursesBetweenPrimary = new Set<string>()

      // Always include primary courses themselves
      primaryCourseCodes.forEach((code) => coursesBetweenPrimary.add(code))

      // Include all prerequisites that are prerequisites of multiple primary courses
      prerequisiteCounts.forEach((count, prereqCode) => {
        if (count > 1) {
          coursesBetweenPrimary.add(prereqCode)
        }
      })

      // Step 4: For each shared prerequisite, recursively include all its prerequisites
      // that are also prerequisites of multiple primary courses
      // This builds the complete path between primary courses
      const collectSharedPrereqPaths = (
        courseCode: string,
        visited: Set<string>
      ) => {
        if (visited.has(courseCode)) {
          return
        }
        visited.add(courseCode)

        const courseDependencies = courseDependenciesMap.get(courseCode)
        if (courseDependencies) {
          courseDependencies.leftCourseCodes.forEach((prereqCode) => {
            const count = prerequisiteCounts.get(prereqCode) || 0
            // Only include if this prerequisite is also shared by multiple primary courses
            if (count > 1) {
              coursesBetweenPrimary.add(prereqCode)
              collectSharedPrereqPaths(prereqCode, visited)
            }
          })
        }
      }

      // Collect paths for all shared prerequisites
      Array.from(coursesBetweenPrimary).forEach((courseCode) => {
        if (!primaryCourseCodes.has(courseCode)) {
          collectSharedPrereqPaths(courseCode, new Set<string>())
        }
      })

      const coursesRecord: Record<string, ConvexCourseOverview> =
        Object.fromEntries(
          Array.from(coursesBetweenPrimary)
            .map((courseCode) => {
              const course = useInteractivePrereqGraphState
                .getState()
                .getCourse(courseCode)
              if (course) {
                return [courseCode, course]
              }
              return null
            })
            .filter((course) => course !== null)
        )

      useInteractivePrereqGraphState.getState().computeGraph({ coursesRecord })

      setTimeout(() => {
        rf.fitView()
      }, 200)
    } else {
      // Restore original hidden state when filter is disabled
      // const restoredNodes = currentNodes.map((node) => {
      //   const originalHidden = originalHiddenState.current.get(node.id) ?? false
      //   return {
      //     ...node,
      //     hidden: originalHidden,
      //   }
      // })
      // setNodes(restoredNodes)

      useInteractivePrereqGraphState.getState().computeGraph()
      originalHiddenState.current.clear()
    }
  }, [onlyPrimaryCourses, primaryCourseCodes, getNodes, setNodes])

  return (
    <div className="flex items-center gap-2 px-1 py-2 border-t">
      <Checkbox
        id="only-primary-courses"
        checked={onlyPrimaryCourses}
        onCheckedChange={(checked) => setOnlyPrimaryCourses(checked === true)}
      />
      <Label
        htmlFor="only-primary-courses"
        className="text-sm font-normal cursor-pointer"
      >
        Only show primary courses
      </Label>
    </div>
  )
}
