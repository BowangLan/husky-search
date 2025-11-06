"use client"

import { createNodesAndEdgesFromCourses, PrereqGraphNodeUnion } from "@/lib/prereq-graph-utils"
import { ConvexCourseOverview } from "@/types/convex-courses"
import { Edge } from "@xyflow/react"
import { create } from "zustand"

export type DisplayOptions = {
  ignoreUnlistedNodes: boolean
  hideUnconnectedNodes: boolean
}

export type InteractivePrereqGraphState = {
  // Internal state - optimized with Sets and Maps for O(1) operations
  coursesMap: Map<string, ConvexCourseOverview> // Map keyed by courseCode for O(1) lookups
  courseDependenciesMap: Map<string, {
    leftCourseCodes: Set<string>
    rightCourseCodes: Set<string>
  }> // Map keyed by courseCode for O(1) lookups, value is a set of left and right course codes
  subjectAreas: Set<string> // Set of subject areas for O(1) membership checks
  courseCodes: Set<string> // Set of course codes for O(1) membership checks
  primaryCourseCodes: Set<string> // These are passed to useQuery(api.courses.listOverviewByCourseCodes)
  primarySubjectArea: string | null // These are passed to useQuery(api.courses.listOverviewBySubjectArea)
  displayOptions: DisplayOptions

  // Computed state - nodes and edges derived from input state
  nodes: PrereqGraphNodeUnion[]
  edges: Edge[]

  // Getters - computed from Maps/Sets for compatibility
  getCourses: () => ConvexCourseOverview[] // Get courses as array
  getCourse: (courseCode: string) => ConvexCourseOverview | undefined // Get single course by code
  hasCourse: (courseCode: string) => boolean // Check if course exists
  hasSubjectArea: (subjectArea: string) => boolean // Check if subject area exists
  getSubjectAreasArray: () => string[] // Get subject areas as array
  getCourseCodesArray: () => string[] // Get course codes as array

  // Actions
  setCourses: (courses: ConvexCourseOverview[]) => void
  setPrimaryCourseCodes: (courseCodes: Set<string>) => void
  setPrimarySubjectArea: (subjectArea: string | null) => void
  addCourse: (course: ConvexCourseOverview) => void
  removeCourse: (courseCode: string) => void
  setSubjectAreas: (subjectAreas: string[]) => void
  addSubjectArea: (subjectArea: string) => void
  removeSubjectArea: (subjectArea: string) => void
  setCourseCodes: (courseCodes: string[]) => void
  addCourseCode: (courseCode: string) => void
  removeCourseCode: (courseCode: string) => void
  setDisplayOptions: (options: Partial<DisplayOptions>) => void
  updateDisplayOptions: (options: Partial<DisplayOptions>) => void
  clear: () => void // Clear all state

  // Internal: compute nodes and edges from current state
  computeGraph: (params?: {
    coursesRecord?: Record<string, ConvexCourseOverview>
  }) => void
}

export const useInteractivePrereqGraphState = create<InteractivePrereqGraphState>((set, get) => ({
  // Initial state - using Maps and Sets
  coursesMap: new Map(),
  courseDependenciesMap: new Map(),
  subjectAreas: new Set(),
  courseCodes: new Set(),
  primaryCourseCodes: new Set(),
  primarySubjectArea: null,
  displayOptions: {
    ignoreUnlistedNodes: true,
    hideUnconnectedNodes: false,
  },
  nodes: [],
  edges: [],

  // Getters
  getCourses: () => {
    return Array.from(get().coursesMap.values())
  },

  getCourse: (courseCode: string) => {
    return get().coursesMap.get(courseCode)
  },

  hasCourse: (courseCode: string) => {
    return get().coursesMap.has(courseCode)
  },

  hasSubjectArea: (subjectArea: string) => {
    return get().subjectAreas.has(subjectArea)
  },

  getSubjectAreasArray: () => {
    return Array.from(get().subjectAreas)
  },

  getCourseCodesArray: () => {
    return Array.from(get().courseCodes)
  },

  // Actions
  setCourses: (courses: ConvexCourseOverview[]) => {
    const coursesMap = new Map<string, ConvexCourseOverview>()
    const subjectAreas = new Set<string>()
    const courseCodes = new Set<string>()

    // Build Map and Sets in single pass - O(n)
    courses.forEach((course) => {
      coursesMap.set(course.courseCode, course)
      subjectAreas.add(course.subjectArea)
      courseCodes.add(course.courseCode)
    })

    const courseDependenciesMap = new Map<string, {
      leftCourseCodes: Set<string>
      rightCourseCodes: Set<string>
    }>()
    courses.forEach((course) => {
      courseDependenciesMap.set(course.courseCode, {
        leftCourseCodes: new Set(),
        rightCourseCodes: new Set(),
      })
    })

    const { nodes, edges } = createNodesAndEdgesFromCourses(Object.fromEntries(coursesMap), {
      ignoreUnlistedNodes: get().displayOptions.ignoreUnlistedNodes,
      hideUnconnectedNodes: get().displayOptions.hideUnconnectedNodes,
    })

    edges.forEach((edge) => {
      courseDependenciesMap.get(edge.source)?.rightCourseCodes.add(edge.target)
      courseDependenciesMap.get(edge.target)?.leftCourseCodes.add(edge.source)
    })

    set({ coursesMap, subjectAreas, courseCodes, courseDependenciesMap, nodes, edges })
    console.log("[interactive-prereq-graph-state] setCourses", {
      coursesMapSize: coursesMap.size,
      subjectAreasSize: subjectAreas.size,
      courseCodesSize: courseCodes.size,
    })
  },

  setPrimaryCourseCodes: (courseCodes: Set<string>) => {
    set({ primaryCourseCodes: courseCodes })
  },

  setPrimarySubjectArea: (subjectArea: string | null) => {
    set({ primarySubjectArea: subjectArea })
  },

  addCourse: (course: ConvexCourseOverview) => {
    const { coursesMap, subjectAreas, courseCodes } = get()
    const newMap = new Map(coursesMap)
    const newSubjectAreas = new Set(subjectAreas)
    const newCourseCodes = new Set(courseCodes)

    newMap.set(course.courseCode, course)
    newSubjectAreas.add(course.subjectArea)
    newCourseCodes.add(course.courseCode)

    set({ coursesMap: newMap, subjectAreas: newSubjectAreas, courseCodes: newCourseCodes })
    get().computeGraph()
  },

  removeCourse: (courseCode: string) => {
    const { coursesMap, subjectAreas, courseCodes } = get()
    const course = coursesMap.get(courseCode)

    if (!course) return

    const newMap = new Map(coursesMap)
    const newCourseCodes = new Set(courseCodes)

    newMap.delete(courseCode)
    newCourseCodes.delete(courseCode)

    // Check if any other courses have this subject area
    const hasOtherCoursesInSubjectArea = Array.from(newMap.values()).some(
      (c) => c.subjectArea === course.subjectArea
    )
    const newSubjectAreas = new Set(subjectAreas)
    if (!hasOtherCoursesInSubjectArea) {
      newSubjectAreas.delete(course.subjectArea)
    }

    set({ coursesMap: newMap, subjectAreas: newSubjectAreas, courseCodes: newCourseCodes })
    get().computeGraph()
  },

  setSubjectAreas: (subjectAreas: string[]) => {
    const newSet = new Set(subjectAreas)
    set({ subjectAreas: newSet })
    // Note: This doesn't automatically filter courses, it's just metadata
    // The actual filtering should be done by the query that fetches courses
  },

  addSubjectArea: (subjectArea: string) => {
    const { subjectAreas } = get()
    const newSet = new Set(subjectAreas)
    newSet.add(subjectArea)
    set({ subjectAreas: newSet })
  },

  removeSubjectArea: (subjectArea: string) => {
    const { subjectAreas } = get()
    const newSet = new Set(subjectAreas)
    newSet.delete(subjectArea)
    set({ subjectAreas: newSet })
  },

  setCourseCodes: (courseCodes: string[]) => {
    const newSet = new Set(courseCodes)
    set({ courseCodes: newSet })
    // Note: This doesn't automatically filter courses, it's just metadata
    // The actual filtering should be done by the query that fetches courses
  },

  addCourseCode: (courseCode: string) => {
    const { courseCodes } = get()
    const newSet = new Set(courseCodes)
    newSet.add(courseCode)
    set({ courseCodes: newSet })
  },

  removeCourseCode: (courseCode: string) => {
    const { courseCodes } = get()
    const newSet = new Set(courseCodes)
    newSet.delete(courseCode)
    set({ courseCodes: newSet })
  },

  setDisplayOptions: (options: Partial<DisplayOptions>) => {
    set({
      displayOptions: {
        ...get().displayOptions,
        ...options,
      },
    })
    get().computeGraph()
  },

  updateDisplayOptions: (options: Partial<DisplayOptions>) => {
    get().setDisplayOptions(options)
  },

  clear: () => {
    set({
      coursesMap: new Map(),
      subjectAreas: new Set(),
      courseCodes: new Set(),
      nodes: [],
      edges: [],
    })
  },

  // Internal: compute nodes and edges from current state
  computeGraph: (params) => {
    let coursesRecord: Record<string, ConvexCourseOverview> = {}
    if (params?.coursesRecord) {
      coursesRecord = params.coursesRecord
    } else {
      const { coursesMap } = get()
      coursesRecord = Object.fromEntries(coursesMap)
    }
    const { displayOptions } = get()

    if (Object.keys(coursesRecord).length === 0) {
      set({ nodes: [], edges: [] })
      console.log("[interactive-prereq-graph-state] _computeGraph no courses")
      return
    }

    // Create nodes and edges from courses
    const { nodes, edges } = createNodesAndEdgesFromCourses(coursesRecord, {
      ignoreUnlistedNodes: displayOptions.ignoreUnlistedNodes,
      hideUnconnectedNodes: displayOptions.hideUnconnectedNodes,
    })

    set({ nodes, edges })
    console.log("[interactive-prereq-graph-state] _computeGraph completed", {
      nodesCount: nodes.length,
      edgesCount: edges.length,
    })
  },
}))
