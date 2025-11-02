"use client"

import { useCallback, useMemo } from "react"
import { createStore, useStore } from "zustand"
import { expandDays } from "@/lib/utils"
import { isScheduleFeatureEnabled } from "@/config/features"
import { coursePlanStore, type ScheduleSession, type ScheduleMeeting } from "./course-plan.store"

// Re-export types from course-plan store for compatibility
export type { ScheduleMeeting, ScheduleSession } from "./course-plan.store"

export type ScheduleViolationReason =
  | "single-letter-exists"
  | "double-letter-exists"
  | "time-conflict"
  | "switch-single-letter"
  | "switch-double-letter"
  | "no-active-term"

export type ScheduleCourse = {
  id: string
  courseCode: string
  courseTitle?: string
  courseCredit?: string | number
  creditOverwrite?: string | number
  sessions: ScheduleSession[]
}

export type GeneratedScheduleVariant = {
  id: string
  courseAssignments: Map<string, ScheduleSession>
  courses: Array<{
    courseCode: string
    courseTitle?: string
    courseCredit?: string | number
    sessions: ScheduleSession[]
  }>
}

export type ScheduleState = {
  // Session operations
  addSessionToCourse: (courseCode: string, session: any, termId?: string) => void
  removeSessionFromCourse: (courseCode: string, sessionId: string, termId?: string) => void
  toggleSession: (
    session: any,
    options?: {
      courseCode?: string
      courseTitle?: string
      courseCredit?: string | number
      termId?: string
      onViolation?: (reason: ScheduleViolationReason) => void
    }
  ) => void
  hasSession: (sessionId?: string, termId?: string) => boolean

  // Course operations
  addCourse: (courseCode: string, options?: { courseTitle?: string; courseCredit?: string | number; termId?: string }) => string
  removeCourse: (courseId: string) => void
  updateCourseCreditOverwrite: (courseId: string, creditOverwrite?: string | number) => void
  hasCourse: (courseCode: string) => boolean
  getCourse: (courseCode: string) => ScheduleCourse | undefined

  // Global operations
  clear: () => void
  getAllCourses: () => ScheduleCourse[]
  getAllSessions: () => (ScheduleSession & { courseCode: string; courseTitle?: string; courseCredit?: string | number })[]

  // Validation
  canAddSession: (
    session: any,
    options?: { courseCode?: string }
  ) => { ok: true } | { ok: false; reason: ScheduleViolationReason; existingSessionId?: string }
}

// Helper functions
function getFirstActiveTermId(): string | null {
  const activeTermIds = coursePlanStore.getState().activeTermIds
  return activeTermIds.length > 0 ? activeTermIds[0] : null
}

// Helper to convert MyPlan termId (e.g. "20254" or "WIN 2025") to internal format
function parseMyPlanTermId(myplanTermId: string): { year: number; quarter: "Winter" | "Spring" | "Summer" | "Autumn" } | null {
  // Handle formats like "20254" (year + quarter code) or "WIN 2025"
  if (/^\d{5}$/.test(myplanTermId)) {
    // Format: "20254" -> year=2025, quarter code=4
    const year = parseInt(myplanTermId.substring(0, 4), 10)
    const quarterCode = parseInt(myplanTermId.substring(4), 10)
    const quarterMap: Record<number, "Winter" | "Spring" | "Summer" | "Autumn"> = {
      1: "Winter",
      2: "Spring",
      3: "Summer",
      4: "Autumn",
    }
    const quarter = quarterMap[quarterCode]
    if (quarter) {
      return { year, quarter }
    }
  } else if (/^(WIN|SPR|SUM|AUT)\s+\d{4}$/.test(myplanTermId.toUpperCase())) {
    // Format: "WIN 2025"
    const [quarterStr, yearStr] = myplanTermId.toUpperCase().split(/\s+/)
    const year = parseInt(yearStr, 10)
    const quarterMap: Record<string, "Winter" | "Spring" | "Summer" | "Autumn"> = {
      WIN: "Winter",
      SPR: "Spring",
      SUM: "Summer",
      AUT: "Autumn",
    }
    const quarter = quarterMap[quarterStr]
    if (quarter) {
      return { year, quarter }
    }
  }
  return null
}

// Helper to get or create active term (for backward compatibility with old schedule behavior)
function getOrCreateActiveTerm(): string {
  let termId = getFirstActiveTermId()

  if (!termId) {
    // Auto-create a default "Schedule" term for the current quarter
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Determine current quarter
    let quarter: "Winter" | "Spring" | "Summer" | "Autumn"
    if (month >= 1 && month <= 3) quarter = "Winter"
    else if (month >= 4 && month <= 6) quarter = "Spring"
    else if (month >= 7 && month <= 9) quarter = "Summer"
    else quarter = "Autumn"

    // Create the term if it doesn't exist
    coursePlanStore.getState().addTerm(year, quarter)
    termId = `${year}-${quarter}`

    // Add it to active term IDs
    const currentActiveTermIds = coursePlanStore.getState().activeTermIds
    if (!currentActiveTermIds.includes(termId)) {
      coursePlanStore.getState().setActiveTermIds([...currentActiveTermIds, termId])
    }
  }

  return termId
}

// Helper to ensure a term exists from MyPlan termId and return internal termId
function ensureTermFromMyPlan(myplanTermId: string): string {
  const parsed = parseMyPlanTermId(myplanTermId)
  if (!parsed) {
    // Fallback to current term if parse fails
    return getOrCreateActiveTerm()
  }

  const internalTermId = `${parsed.year}-${parsed.quarter}`

  // Check if term exists, if not create it
  const existingTerm = coursePlanStore.getState().getTerm(internalTermId)
  if (!existingTerm) {
    coursePlanStore.getState().addTerm(parsed.year, parsed.quarter)
  }

  // Add to active term IDs if no active terms are set
  const activeTermIds = coursePlanStore.getState().activeTermIds
  if (activeTermIds.length === 0) {
    coursePlanStore.getState().setActiveTermIds([internalTermId])
  } else if (!activeTermIds.includes(internalTermId)) {
    coursePlanStore.getState().setActiveTermIds([...activeTermIds, internalTermId])
  }

  return internalTermId
}

function parseTimeRangeToMinutes(range?: string): [number, number] | null {
  if (!range) return null
  const [start, end] = String(range).split("-").map((s) => s.trim())
  const parse = (t: string): number => {
    const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i)
    if (!m) return 0
    let hh = parseInt(m[1], 10)
    const mm = m[2] ? parseInt(m[2], 10) : 0
    const ap = m[3].toUpperCase()
    if (ap === "PM" && hh !== 12) hh += 12
    if (ap === "AM" && hh === 12) hh = 0
    return hh * 60 + mm
  }
  return [parse(start), parse(end)]
}

function hasTimeConflict(candidate: ScheduleSession, existingCourses: ScheduleCourse[]): boolean {
  const candidateMeetings = candidate.meetingDetailsList ?? []
  for (const m of candidateMeetings) {
    const range = parseTimeRangeToMinutes(m.time)
    const days = expandDays(m.days)
    if (!range || days.length === 0) continue
    const [cStart, cEnd] = range
    for (const course of existingCourses) {
      for (const session of course.sessions) {
        for (const em of session.meetingDetailsList ?? []) {
          const er = parseTimeRangeToMinutes(em.time)
          const edays = expandDays(em.days)
          if (!er || edays.length === 0) continue
          const sharesDay = days.some((d) => edays.includes(d))
          if (!sharesDay) continue
          const [eStart, eEnd] = er
          const overlaps = cStart < eEnd && cEnd > eStart
          if (overlaps) return true
        }
      }
    }
  }
  return false
}

function normalizeSession(raw: any): ScheduleSession {
  const meetingDetailsList: ScheduleMeeting[] = Array.isArray(raw?.meetingDetailsList)
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

// Create a Zustand store that delegates to coursePlanStore
export const scheduleStore = createStore<ScheduleState>()((set, get) => {
  // Subscribe to coursePlanStore changes to trigger re-renders
  coursePlanStore.subscribe(() => {
    set({})
  })

  return {
    // Course operations
    addCourse: (courseCode: string, options?: { courseTitle?: string; courseCredit?: string | number; termId?: string }) => {
      if (!isScheduleFeatureEnabled()) return ""
      const termId = options?.termId ? ensureTermFromMyPlan(options.termId) : getOrCreateActiveTerm()

      const existing = coursePlanStore.getState().getCourseByCode(termId, courseCode)
      if (existing) return existing.id

      coursePlanStore.getState().addCourse(termId, {
        courseCode,
        courseTitle: options?.courseTitle,
        credits: options?.courseCredit ?? 0,
        sessions: [],
      })

      const newCourse = coursePlanStore.getState().getCourseByCode(termId, courseCode)
      return newCourse?.id ?? ""
    },

    removeCourse: (courseId: string) => {
      if (!isScheduleFeatureEnabled()) return
      // Search all terms to find which one contains this course
      const allTerms = coursePlanStore.getState().terms
      for (const term of allTerms) {
        const plan = coursePlanStore.getState().plansByTerm[term.id]
        if (plan?.courses.some((c) => c.id === courseId)) {
          coursePlanStore.getState().removeCourse(term.id, courseId)
          return
        }
      }
    },

    updateCourseCreditOverwrite: (courseId: string, creditOverwrite?: string | number) => {
      if (!isScheduleFeatureEnabled()) return
      // Search all terms to find which one contains this course
      const allTerms = coursePlanStore.getState().terms
      for (const term of allTerms) {
        const plan = coursePlanStore.getState().plansByTerm[term.id]
        if (plan?.courses.some((c) => c.id === courseId)) {
          coursePlanStore.getState().updateCourse(term.id, courseId, {
            customCredits: typeof creditOverwrite === "number" ? creditOverwrite : parseFloat(String(creditOverwrite)),
          })
          return
        }
      }
    },

    hasCourse: (courseCode: string) => {
      const termId = getOrCreateActiveTerm()
      return !!coursePlanStore.getState().getCourseByCode(termId, courseCode)
    },

    getCourse: (courseCode: string) => {
      const termId = getOrCreateActiveTerm()
      const course = coursePlanStore.getState().getCourseByCode(termId, courseCode)
      if (!course) return undefined

      return {
        id: course.id,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        courseCredit: course.credits,
        creditOverwrite: course.customCredits,
        sessions: course.sessions,
      }
    },

    // Session operations
    addSessionToCourse: (courseCode: string, session: any, termId?: string) => {
      if (!isScheduleFeatureEnabled()) return
      const finalTermId = termId ? ensureTermFromMyPlan(termId) : getOrCreateActiveTerm()
      coursePlanStore.getState().addSessionToCourse(finalTermId, courseCode, session)
    },

    removeSessionFromCourse: (courseCode: string, sessionId: string, termId?: string) => {
      if (!isScheduleFeatureEnabled()) return
      if (termId) {
        const finalTermId = ensureTermFromMyPlan(termId)
        coursePlanStore.getState().removeSessionFromCourse(finalTermId, courseCode, sessionId)
      } else {
        // Search all terms to find which one contains this session
        const allTerms = coursePlanStore.getState().terms
        for (const term of allTerms) {
          const plan = coursePlanStore.getState().plansByTerm[term.id]
          if (plan?.courses.some((c) => c.courseCode === courseCode && c.sessions.some((s) => s.id === sessionId))) {
            coursePlanStore.getState().removeSessionFromCourse(term.id, courseCode, sessionId)
            return
          }
        }
      }
    },

    toggleSession: (
      session: any,
      options?: {
        courseCode?: string
        courseTitle?: string
        courseCredit?: string | number
        termId?: string
        onViolation?: (reason: ScheduleViolationReason) => void
      }
    ) => {
      if (!isScheduleFeatureEnabled()) return
      const termId = options?.termId ? ensureTermFromMyPlan(options.termId) : getOrCreateActiveTerm()

      const courseCode = options?.courseCode
      if (!courseCode) return

      const id = String(session?.id ?? session?.activityId ?? session?.registrationCode)

      if (get().hasSession(id, options?.termId)) {
        get().removeSessionFromCourse(courseCode, id, options?.termId)
      } else {
        const check = get().canAddSession(session, { courseCode })
        if (check.ok) {
          // Check if course exists in the specific termId (not just active term)
          let course = coursePlanStore.getState().getCourseByCode(termId, courseCode)
          if (!course) {
            get().addCourse(courseCode, {
              courseTitle: options?.courseTitle,
              courseCredit: options?.courseCredit,
              termId: options?.termId,
            })
          } else if (!course.courseTitle && options?.courseTitle) {
            coursePlanStore.getState().updateCourse(termId, course.id, {
              courseTitle: options?.courseTitle,
              credits: options?.courseCredit ?? course.credits,
            })
          }
          get().addSessionToCourse(courseCode, session, options?.termId)
        } else {
          options?.onViolation?.(check.reason)
        }
      }
    },

    hasSession: (sessionId?: string, termId?: string) => {
      if (!sessionId) return false
      const finalTermId = termId ? ensureTermFromMyPlan(termId) : getOrCreateActiveTerm()
      return coursePlanStore.getState().hasSession(finalTermId, String(sessionId))
    },

    // Global operations
    clear: () => {
      if (!isScheduleFeatureEnabled()) return
      // Clear all courses from all terms, matching getAllCourses behavior
      const allTerms = coursePlanStore.getState().terms
      for (const term of allTerms) {
        coursePlanStore.getState().clearTerm(term.id)
      }
    },

    getAllCourses: () => {
      // Return courses from all terms, not just active term
      const allTerms = coursePlanStore.getState().terms
      const allCourses: ScheduleCourse[] = []

      for (const term of allTerms) {
        const plan = coursePlanStore.getState().plansByTerm[term.id]
        if (plan) {
          const courses = plan.courses.map((c) => ({
            id: c.id,
            courseCode: c.courseCode,
            courseTitle: c.courseTitle,
            courseCredit: c.credits,
            creditOverwrite: c.customCredits,
            sessions: c.sessions,
          }))
          allCourses.push(...courses)
        }
      }

      return allCourses
    },

    getAllSessions: () => {
      // Return sessions from all terms, not just active term
      const allTerms = coursePlanStore.getState().terms
      const allSessions: (ScheduleSession & { courseCode: string; courseTitle?: string; courseCredit?: string | number })[] = []

      for (const term of allTerms) {
        const plan = coursePlanStore.getState().plansByTerm[term.id]
        if (plan) {
          const sessions = plan.courses.flatMap((c) =>
            c.sessions.map((s) => ({
              ...s,
              courseCode: c.courseCode,
              courseTitle: c.courseTitle,
              courseCredit: c.credits,
            }))
          )
          allSessions.push(...sessions)
        }
      }

      return allSessions
    },

    // Validation
    canAddSession: (session: any, options?: { courseCode?: string }) => {
      const termId = getOrCreateActiveTerm()

      const normalized = normalizeSession(session)
      const courses = get().getAllCourses()
      const courseCode = options?.courseCode

      // Rule 1: For a given course, only one single-letter code and one double-letter code
      if (courseCode) {
        const course = courses.find((c) => c.courseCode === courseCode)
        if (course) {
          const currentAlpha = (normalized.code || "").replace(/[^A-Za-z]/g, "")
          const isSingle = currentAlpha.length === 1
          const isDouble = currentAlpha.length === 2

          if (isSingle) {
            const existingSingle = course.sessions.find(
              (s) => (s.code || "").replace(/[^A-Za-z]/g, "").length === 1
            )
            if (existingSingle && existingSingle.id !== normalized.id) {
              return {
                ok: false as const,
                reason: "switch-single-letter" as const,
                existingSessionId: existingSingle.id,
              }
            }
          }
          if (isDouble) {
            const existingDouble = course.sessions.find(
              (s) => (s.code || "").replace(/[^A-Za-z]/g, "").length === 2
            )
            if (existingDouble && existingDouble.id !== normalized.id) {
              return {
                ok: false as const,
                reason: "switch-double-letter" as const,
                existingSessionId: existingDouble.id,
              }
            }
          }
        }
      }

      // Rule 2: Time conflict check
      const conflicts = hasTimeConflict(normalized, courses)
      if (conflicts) return { ok: false as const, reason: "time-conflict" as const }

      return { ok: true as const }
    },
  }
})

// Hooks - updated to watch coursePlanStore instead
export function useSchedule() {
  return useStore(scheduleStore, (s) => s)
}

export function useIsSessionScheduled(sessionId?: string | null) {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !sessionId || !hydrated) return false
    // Check all terms, not just active term, since sessions can be in any term
    const allTerms = coursePlanStore.getState().terms
    for (const term of allTerms) {
      if (coursePlanStore.getState().hasSession(term.id, String(sessionId))) {
        return true
      }
    }
    return false
  }, [enabled, sessionId, hydrated, plansByTerm])
}

export function useScheduledSessions(): (ScheduleSession & {
  courseCode: string;
  courseTitle?: string;
  courseCredit?: string | number
})[] {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated) return []
    return scheduleStore.getState().getAllSessions()
  }, [enabled, hydrated, plansByTerm])
}

export function useScheduledCourses(): ScheduleCourse[] {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated) return []
    return scheduleStore.getState().getAllCourses()
  }, [enabled, hydrated, plansByTerm])
}

export function useScheduledCoursesByActiveTerm(): Map<string, ScheduleCourse[]> {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const activeTermIds = useStore(coursePlanStore, (s) => s.activeTermIds)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    const result = new Map<string, ScheduleCourse[]>()
    if (!enabled || !hydrated) return result

    // Only include courses from active terms
    for (const termId of activeTermIds) {
      const plan = plansByTerm[termId]
      if (plan) {
        const courses = plan.courses.map((c) => ({
          id: c.id,
          courseCode: c.courseCode,
          courseTitle: c.courseTitle,
          courseCredit: c.credits,
          creditOverwrite: c.customCredits,
          sessions: c.sessions,
        }))
        result.set(termId, courses)
      } else {
        result.set(termId, [])
      }
    }

    return result
  }, [enabled, hydrated, plansByTerm, activeTermIds])
}

export function useScheduleCourse(courseCode: string): ScheduleCourse | undefined {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated || !courseCode) return undefined
    
    // Search across all terms in plansByTerm, not just active term
    // This ensures we find courses in any term, not just the active one
    for (const termId in plansByTerm) {
      const plan = plansByTerm[termId]
      if (plan) {
        const course = plan.courses.find((c) => c.courseCode === courseCode)
        if (course) {
          return {
            id: course.id,
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            courseCredit: course.credits,
            creditOverwrite: course.customCredits,
            sessions: course.sessions,
          }
        }
      }
    }
    return undefined
  }, [enabled, hydrated, courseCode, plansByTerm])
}

export function useScheduleCount(): number {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated) return 0
    // Count all courses from all terms
    return scheduleStore.getState().getAllCourses().length
  }, [enabled, hydrated, plansByTerm])
}

export function useToggleSchedule(): ScheduleState["toggleSession"] {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback<ScheduleState["toggleSession"]>(
    (session, options) => {
      if (!enabled || !hydrated) return
      scheduleStore.getState().toggleSession(session, options)
    },
    [enabled, hydrated]
  )
}

export function useRemoveFromSchedule(): (courseCode: string, sessionId: string, termId?: string) => void {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (courseCode: string, sessionId: string, termId?: string) => {
      if (!enabled || !hydrated) return
      // Store will search all terms if termId not provided
      scheduleStore.getState().removeSessionFromCourse(courseCode, sessionId, termId)
    },
    [enabled, hydrated]
  )
}

export function useRemoveCourse(): (courseId: string) => void {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (courseId: string) => {
      if (!enabled || !hydrated) return
      // Store will search all terms to find the course
      scheduleStore.getState().removeCourse(courseId)
    },
    [enabled, hydrated]
  )
}

export function useClearSchedule(): () => void {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(() => {
    if (!enabled || !hydrated) return
    // Store method uses getOrCreateActiveTerm() internally
    scheduleStore.getState().clear()
  }, [enabled, hydrated])
}

export function useCanAddToSchedule(
  session?: any,
  options?: { courseCode?: string }
): { ok: boolean; reason?: ScheduleViolationReason; existingSessionId?: string } {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated || !session) return { ok: false }
    const res = scheduleStore.getState().canAddSession(session, { courseCode: options?.courseCode })
    return res.ok ? { ok: true } : { ok: false, reason: res.reason, existingSessionId: res.existingSessionId }
  }, [enabled, hydrated, session, options?.courseCode, plansByTerm])
}

export function useHasTimeConflict(session?: any): boolean {
  const enabled = isScheduleFeatureEnabled()
  const plansByTerm = useStore(coursePlanStore, (s) => s.plansByTerm)
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useMemo(() => {
    if (!enabled || !hydrated || !session) return false
    const normalized = normalizeSession(session)
    const courses = scheduleStore.getState().getAllCourses()
    return hasTimeConflict(normalized, courses)
  }, [enabled, hydrated, session, plansByTerm])
}

export function useUpdateCourseCreditOverwrite(): (courseId: string, creditOverwrite?: string | number) => void {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (courseId: string, creditOverwrite?: string | number) => {
      if (!enabled || !hydrated) return
      // Store will search all terms to find the course
      scheduleStore.getState().updateCourseCreditOverwrite(courseId, creditOverwrite)
    },
    [enabled, hydrated]
  )
}

// Deprecated: For backward compatibility
export function useUpdateSessionCreditOverwrite(): (sessionId: string, creditOverwrite?: string | number) => void {
  const enabled = isScheduleFeatureEnabled()
  const hydrated = useStore(coursePlanStore, (s) => s.hydrated)

  return useCallback(
    (sessionId: string, creditOverwrite?: string | number) => {
      if (!enabled || !hydrated) return
      // Store will search all terms to find the course
      scheduleStore.getState().updateCourseCreditOverwrite(sessionId, creditOverwrite)
    },
    [enabled, hydrated]
  )
}
