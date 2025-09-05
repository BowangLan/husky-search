import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { useEffect } from "react"
import { ProgramDetail } from "@/services/program-service"

export const MAX_RECENT_VISITS = 10

export type VisitCacheStore = {
  majors: Map<string, number>
  courses: Map<string, number>
  recentMajors: ProgramDetail[]
  recentCourses: string[]
  recentMajorsSet: Set<string>
  recentCoursesSet: Set<string>
  hydrated: boolean
  recordMajorVisit: (program: ProgramDetail) => void
  recordCourseVisit: (id: string) => void
  getTopMajors: (limit?: number) => { id: string; count: number }[]
  getTopCourses: (limit?: number) => { id: string; count: number }[]
  getRecentMajors: (limit?: number) => ProgramDetail[]
  getRecentCourses: (limit?: number) => string[]
  clearMajors: () => void
  clearCourses: () => void
  clearAll: () => void
}

function uniqueFrontInsert(list: string[], id: string, max: number): string[] {
  const next = [id, ...list.filter((x) => x !== id)]
  return next.length > max ? next.slice(0, max) : next
}

function updateRecent(
  list: string[],
  set: Set<string>,
  id: string,
  max: number
): { list: string[]; set: Set<string> } {
  let nextList = list
  const nextSet = new Set(set)
  if (nextSet.has(id)) {
    nextList = nextList.filter((x) => x !== id)
  } else if (nextList.length >= max) {
    const removed = nextList[nextList.length - 1]
    nextSet.delete(removed)
    nextList = nextList.slice(0, max - 1)
  }
  nextList = [id, ...nextList]
  nextSet.add(id)
  return { list: nextList, set: nextSet }
}

function updateRecentProgram(
  list: ProgramDetail[],
  set: Set<string>,
  program: ProgramDetail,
  max: number
): { list: ProgramDetail[]; set: Set<string> } {
  const code = program.code
  let nextList = list
  const nextSet = new Set(set)
  if (nextSet.has(code)) {
    nextList = nextList.filter((p) => p.code !== code)
  } else if (nextList.length >= max) {
    const removed = nextList[nextList.length - 1]
    nextSet.delete(removed.code)
    nextList = nextList.slice(0, max - 1)
  }
  nextList = [program, ...nextList]
  nextSet.add(code)
  return { list: nextList, set: nextSet }
}

function sortedTopEntries(records: Map<string, number>, limit: number) {
  return Array.from(records.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }))
}

type TaggedMap = { __type: "Map"; value: [string, number][] }
type TaggedSet = { __type: "Set"; value: string[] }

function isTaggedMap(value: unknown): value is TaggedMap {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __type?: unknown }).__type === "Map" &&
    Array.isArray((value as { value?: unknown }).value)
  )
}

function isTaggedSet(value: unknown): value is TaggedSet {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __type?: unknown }).__type === "Set" &&
    Array.isArray((value as { value?: unknown }).value)
  )
}

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
      clear: () => { },
      key: () => null,
      length: 0,
    } as Storage
  }
  return window.localStorage
}, {
  replacer: (_key, value) => {
    if (value instanceof Map) {
      return { __type: "Map", value: Array.from(value.entries()) }
    }
    if (value instanceof Set) {
      return { __type: "Set", value: Array.from(value.values()) }
    }
    return value
  },
  reviver: (_key, value) => {
    if (isTaggedMap(value)) return new Map(value.value)
    if (isTaggedSet(value)) return new Set(value.value)
    // Back-compat: unwrap any previously stored ProgramDetailArray tags
    if (
      typeof value === "object" &&
      value !== null &&
      (value as { __type?: unknown }).__type === "ProgramDetailArray" &&
      Array.isArray((value as { value?: unknown }).value)
    ) {
      return (value as { value: ProgramDetail[] }).value
    }
    return value
  }
})

export const visitCacheStore = createStore<VisitCacheStore>()(
  persist(
    (set, get) => ({
      majors: new Map<string, number>(),
      courses: new Map<string, number>(),
      recentMajors: [],
      recentCourses: [],
      recentMajorsSet: new Set<string>(),
      recentCoursesSet: new Set<string>(),
      hydrated: false,

      recordMajorVisit: (program: ProgramDetail) => {
        set((state) => {
          const majors = new Map(state.majors)
          const code = program.code
          majors.set(code, (majors.get(code) ?? 0) + 1)
          const { list, set: rset } = updateRecentProgram(
            state.recentMajors,
            state.recentMajorsSet,
            program,
            MAX_RECENT_VISITS
          )
          return { majors, recentMajors: list, recentMajorsSet: rset }
        })
      },

      recordCourseVisit: (id: string) => {
        set((state) => {
          const courses = new Map(state.courses)
          courses.set(id, (courses.get(id) ?? 0) + 1)
          const { list, set: rset } = updateRecent(
            state.recentCourses,
            state.recentCoursesSet,
            id,
            MAX_RECENT_VISITS
          )
          return { courses, recentCourses: list, recentCoursesSet: rset }
        })
      },

      getTopMajors: (limit = 10) => sortedTopEntries(get().majors, limit),
      getTopCourses: (limit = 10) => sortedTopEntries(get().courses, limit),
      getRecentMajors: (limit = MAX_RECENT_VISITS) => get().recentMajors.slice(0, limit),
      getRecentCourses: (limit = MAX_RECENT_VISITS) => get().recentCourses.slice(0, limit),

      clearMajors: () => set({ majors: new Map(), recentMajors: [], recentMajorsSet: new Set() }),
      clearCourses: () => set({ courses: new Map(), recentCourses: [], recentCoursesSet: new Set() }),
      clearAll: () =>
        set({
          majors: new Map(),
          courses: new Map(),
          recentMajors: [],
          recentCourses: [],
          recentMajorsSet: new Set(),
          recentCoursesSet: new Set(),
        }),
    }),
    {
      name: "visit-cache",
      version: 1,
      storage: ssrSafeStorage,
      partialize: (state) => ({
        majors: state.majors,
        courses: state.courses,
        recentMajors: state.recentMajors,
        recentCourses: state.recentCourses,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.recentMajorsSet = new Set(state.recentMajors.map((p) => p.code))
        state.recentCoursesSet = new Set(state.recentCourses)
        state.hydrated = true
      },
    }
  )
)

export function useTrackMajorVisit(program?: ProgramDetail | null) {
  const recordMajorVisit = useStore(visitCacheStore, (s) => s.recordMajorVisit)
  useEffect(() => {
    if (!program || !program.code) return
    recordMajorVisit(program)
  }, [program?.code, recordMajorVisit, program])
}

export function useTrackCourseVisit(id?: string | null) {
  const recordCourseVisit = useStore(visitCacheStore, (s) => s.recordCourseVisit)
  useEffect(() => {
    if (!id) return
    recordCourseVisit(id)
  }, [id, recordCourseVisit])
}