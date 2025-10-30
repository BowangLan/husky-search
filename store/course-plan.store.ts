"use client"

import { useCallback, useMemo } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

// Session types (matching schedule store structure)
export type ScheduleMeeting = {
  days?: string
  time?: string
  building?: string
  room?: string
  campus?: string
}

export type ScheduleSession = {
  id: string
  code: string
  type?: string
  instructor?: string
  registrationCode?: string | number
  meetingDetailsList?: ScheduleMeeting[]
}

// Course types
export type PlannedCourse = {
  id: string // unique identifier for this planned course instance
  courseCode: string // e.g. "CSE 142"
  courseTitle?: string
  credits: number | string
  customCredits?: number // user override for variable credit courses
  sessions: ScheduleSession[] // empty for future terms, populated for active term
  notes?: string
  color?: string // custom color for visualization
}

export type Quarter = "Winter" | "Spring" | "Summer" | "Autumn"

export type Term = {
  id: string // e.g. "2025-Winter"
  year: number
  quarter: Quarter
  label: string // e.g. "Winter 2025"
}

export type TermPlan = {
  termId: string
  courses: PlannedCourse[]
}

export type CoursePlanState = {
  hydrated: boolean
  terms: Term[] // list of planned terms in chronological order
  plansByTerm: Record<string, TermPlan> // termId -> courses in that term
  activeTermId: string | null // the current active term for scheduling

  // Term management
  addTerm: (year: number, quarter: Quarter) => void
  removeTerm: (termId: string) => void
  reorderTerms: (termIds: string[]) => void
  setActiveTerm: (termId: string | null) => void

  // Course management (basic)
  addCourse: (termId: string, course: Omit<PlannedCourse, "id">) => void
  removeCourse: (termId: string, courseId: string) => void
  updateCourse: (termId: string, courseId: string, updates: Partial<PlannedCourse>) => void
  moveCourse: (courseId: string, fromTermId: string, toTermId: string) => void

  // Session management (for active term with detailed scheduling)
  addSessionToCourse: (termId: string, courseCode: string, session: any) => void
  removeSessionFromCourse: (termId: string, courseCode: string, sessionId: string) => void
  hasSession: (termId: string, sessionId: string) => boolean
  getCourseByCode: (termId: string, courseCode: string) => PlannedCourse | undefined

  // Bulk operations
  clearTerm: (termId: string) => void
  clearAll: () => void

  // Queries
  getTerm: (termId: string) => Term | undefined
  getTermPlan: (termId: string) => TermPlan | undefined
  getAllCourses: () => PlannedCourse[]
  getTotalCredits: (termId?: string) => number
  getActiveTermPlan: () => TermPlan | undefined
}

const quarterOrder: Record<Quarter, number> = {
  Winter: 1,
  Spring: 2,
  Summer: 3,
  Autumn: 4,
}

const quarterNames: Quarter[] = ["Winter", "Spring", "Summer", "Autumn"]

function createTermId(year: number, quarter: Quarter): string {
  return `${year}-${quarter}`
}

function createTermLabel(year: number, quarter: Quarter): string {
  return `${quarter} ${year}`
}

function sortTerms(terms: Term[]): Term[] {
  return [...terms].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return quarterOrder[a.quarter] - quarterOrder[b.quarter]
  })
}

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage
  }
  return window.localStorage
})

function normalizeSession(raw: any): ScheduleSession {
  const meetingDetailsList: ScheduleMeeting[] = Array.isArray(
    raw?.meetingDetailsList
  )
    ? raw.meetingDetailsList.map((m: any) => ({
      days: m?.days,
      time: m?.time,
      building: m?.building,
      room: m?.room,
      campus: m?.campus,
    }))
    : []

  return {
    id: String(raw?.id ?? raw?.activityId ?? raw?.registrationCode ?? crypto.randomUUID()),
    code: String(raw?.code ?? ""),
    type: raw?.type,
    instructor: raw?.instructor,
    registrationCode: raw?.registrationCode,
    meetingDetailsList,
  }
}

export const coursePlanStore = createStore<CoursePlanState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      terms: [],
      plansByTerm: {},
      activeTermId: null,

      addTerm: (year: number, quarter: Quarter) => {
        set((state) => {
          const termId = createTermId(year, quarter)

          // Check if term already exists
          if (state.terms.some((t) => t.id === termId)) {
            return {}
          }

          const newTerm: Term = {
            id: termId,
            year,
            quarter,
            label: createTermLabel(year, quarter),
          }

          const updatedTerms = sortTerms([...state.terms, newTerm])

          return {
            terms: updatedTerms,
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: { termId, courses: [] },
            },
          }
        })
      },

      removeTerm: (termId: string) => {
        set((state) => {
          const updatedTerms = state.terms.filter((t) => t.id !== termId)
          const updatedPlans = { ...state.plansByTerm }
          delete updatedPlans[termId]

          return {
            terms: updatedTerms,
            plansByTerm: updatedPlans,
          }
        })
      },

      reorderTerms: (termIds: string[]) => {
        set((state) => {
          const termMap = new Map(state.terms.map((t) => [t.id, t]))
          const reorderedTerms = termIds
            .map((id) => termMap.get(id))
            .filter((t): t is Term => t !== undefined)

          return { terms: reorderedTerms }
        })
      },

      setActiveTerm: (termId: string | null) => {
        set({ activeTermId: termId })
      },

      addCourse: (termId: string, course: Omit<PlannedCourse, "id">) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          const newCourse: PlannedCourse = {
            ...course,
            id: crypto.randomUUID(),
            sessions: course.sessions ?? [], // ensure sessions array exists
          }

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: [...plan.courses, newCourse],
              },
            },
          }
        })
      },

      removeCourse: (termId: string, courseId: string) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: plan.courses.filter((c) => c.id !== courseId),
              },
            },
          }
        })
      },

      updateCourse: (termId: string, courseId: string, updates: Partial<PlannedCourse>) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: plan.courses.map((c) =>
                  c.id === courseId ? { ...c, ...updates } : c
                ),
              },
            },
          }
        })
      },

      moveCourse: (courseId: string, fromTermId: string, toTermId: string) => {
        set((state) => {
          const fromPlan = state.plansByTerm[fromTermId]
          const toPlan = state.plansByTerm[toTermId]

          if (!fromPlan || !toPlan) return {}

          const course = fromPlan.courses.find((c) => c.id === courseId)
          if (!course) return {}

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [fromTermId]: {
                ...fromPlan,
                courses: fromPlan.courses.filter((c) => c.id !== courseId),
              },
              [toTermId]: {
                ...toPlan,
                courses: [...toPlan.courses, course],
              },
            },
          }
        })
      },

      // Session management
      addSessionToCourse: (termId: string, courseCode: string, session: any) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          const courseIndex = plan.courses.findIndex((c) => c.courseCode === courseCode)

          if (courseIndex === -1) {
            // Course doesn't exist, create it
            const newCourse: PlannedCourse = {
              id: crypto.randomUUID(),
              courseCode,
              credits: 0,
              sessions: [normalizeSession(session)],
            }
            return {
              plansByTerm: {
                ...state.plansByTerm,
                [termId]: {
                  ...plan,
                  courses: [...plan.courses, newCourse],
                },
              },
            }
          }

          // Course exists, add session to it
          const course = plan.courses[courseIndex]
          const normalized = normalizeSession(session)

          // Check if session already exists
          if (course.sessions.some((s) => s.id === normalized.id)) {
            return {}
          }

          const updatedCourses = [...plan.courses]
          updatedCourses[courseIndex] = {
            ...course,
            sessions: [...course.sessions, normalized],
          }

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: updatedCourses,
              },
            },
          }
        })
      },

      removeSessionFromCourse: (termId: string, courseCode: string, sessionId: string) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          const courseIndex = plan.courses.findIndex((c) => c.courseCode === courseCode)
          if (courseIndex === -1) return {}

          const course = plan.courses[courseIndex]
          const updatedSessions = course.sessions.filter((s) => s.id !== sessionId)

          // If no sessions left and this is the active term, you might want to remove the course
          // For now, we'll keep the course but with empty sessions
          const updatedCourses = [...plan.courses]
          updatedCourses[courseIndex] = {
            ...course,
            sessions: updatedSessions,
          }

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: updatedCourses,
              },
            },
          }
        })
      },

      hasSession: (termId: string, sessionId: string) => {
        const plan = get().plansByTerm[termId]
        if (!plan) return false
        return plan.courses.some((c) => c.sessions.some((s) => s.id === sessionId))
      },

      getCourseByCode: (termId: string, courseCode: string) => {
        const plan = get().plansByTerm[termId]
        if (!plan) return undefined
        return plan.courses.find((c) => c.courseCode === courseCode)
      },

      clearTerm: (termId: string) => {
        set((state) => {
          const plan = state.plansByTerm[termId]
          if (!plan) return {}

          return {
            plansByTerm: {
              ...state.plansByTerm,
              [termId]: {
                ...plan,
                courses: [],
              },
            },
          }
        })
      },

      clearAll: () => {
        set({ terms: [], plansByTerm: {} })
      },

      getTerm: (termId: string) => {
        return get().terms.find((t) => t.id === termId)
      },

      getTermPlan: (termId: string) => {
        return get().plansByTerm[termId]
      },

      getAllCourses: () => {
        const state = get()
        return state.terms.flatMap((t) => state.plansByTerm[t.id]?.courses ?? [])
      },

      getTotalCredits: (termId?: string) => {
        const state = get()

        if (termId) {
          const plan = state.plansByTerm[termId]
          if (!plan) return 0

          return plan.courses.reduce((sum, course) => {
            const credits = course.customCredits ?? course.credits
            return sum + (typeof credits === "number" ? credits : parseFloat(String(credits)) || 0)
          }, 0)
        }

        // Total across all terms
        return state.terms.reduce((sum, term) => {
          return sum + state.getTotalCredits(term.id)
        }, 0)
      },

      getActiveTermPlan: () => {
        const state = get()
        if (!state.activeTermId) return undefined
        return state.plansByTerm[state.activeTermId]
      },
    }),
    {
      name: "course-plan-store",
      version: 2, // Increment version for migration
      storage: ssrSafeStorage,
      partialize: (state) => ({
        terms: state.terms,
        plansByTerm: state.plansByTerm,
        activeTermId: state.activeTermId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.hydrated = true
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // Migration from v1 to v2: add sessions array to all courses
          const state = persistedState as any
          if (state.plansByTerm) {
            Object.keys(state.plansByTerm).forEach((termId) => {
              const plan = state.plansByTerm[termId]
              if (plan && plan.courses) {
                plan.courses = plan.courses.map((course: any) => ({
                  ...course,
                  sessions: course.sessions ?? [],
                }))
              }
            })
          }
          state.activeTermId = null
        }
        return persistedState as CoursePlanState
      },
    }
  )
)

// Hooks
export function useCoursePlan() {
  return useStore(coursePlanStore, (s) => s)
}

export function useTerms() {
  const terms = useStore(coursePlanStore, (s) => s.terms)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)
  return useMemo(() => (hydrated ? terms : []), [hydrated, terms])
}

export function useTermPlan(termId: string) {
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)
  return useMemo(
    () => (hydrated ? plansByTerm[termId] : undefined),
    [hydrated, plansByTerm, termId]
  )
}

export function useTotalCredits(termId?: string) {
  const getTotalCredits = useStore(coursePlanStore, (s) => s.getTotalCredits)
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(
    () => (hydrated ? getTotalCredits(termId) : 0),
    [hydrated, getTotalCredits, plansByTerm, termId]
  )
}

export function useAddTerm() {
  const addTerm = useStore(coursePlanStore, (s) => s.addTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (year: number, quarter: Quarter) => {
      if (!hydrated) return
      addTerm(year, quarter)
    },
    [hydrated, addTerm]
  )
}

export function useAddCourse() {
  const addCourse = useStore(coursePlanStore, (s) => s.addCourse)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (termId: string, course: Omit<PlannedCourse, "id">) => {
      if (!hydrated) return
      addCourse(termId, course)
    },
    [hydrated, addCourse]
  )
}

export function useRemoveCourse() {
  const removeCourse = useStore(coursePlanStore, (s) => s.removeCourse)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (termId: string, courseId: string) => {
      if (!hydrated) return
      removeCourse(termId, courseId)
    },
    [hydrated, removeCourse]
  )
}

export function useUpdateCourse() {
  const updateCourse = useStore(coursePlanStore, (s) => s.updateCourse)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (termId: string, courseId: string, updates: Partial<PlannedCourse>) => {
      if (!hydrated) return
      updateCourse(termId, courseId, updates)
    },
    [hydrated, updateCourse]
  )
}
