"use client"

import { useMemo } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { expandDays } from "@/lib/utils"

export type ScheduleViolationReason =
  | "single-letter-exists"
  | "double-letter-exists"
  | "double-letter-prefix-mismatch"
  | "time-conflict"

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
  courseCode?: string
  courseTitle?: string
  courseCredit?: string | number
}

export type ScheduleState = {
  hydrated: boolean
  sessionsById: Record<string, ScheduleSession>
  add: (
    session: any,
    options?: { courseCode?: string; courseTitle?: string; courseCredit?: string | number }
  ) => void
  remove: (sessionId: string) => void
  toggle: (
    session: any,
    options?: {
      courseCode?: string
      onViolation?: (reason: ScheduleViolationReason) => void
      courseTitle?: string
      courseCredit?: string | number
    }
  ) => void
  clear: () => void
  has: (sessionId?: string) => boolean
  getAll: () => ScheduleSession[]

  // Checks
  canAdd: (
    session: any,
    options?: { courseCode?: string }
  ) => { ok: true } | { ok: false; reason: ScheduleViolationReason }
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

function normalizeSession(
  raw: any,
  courseCode?: string,
  courseMeta?: { courseTitle?: string; courseCredit?: string | number }
): ScheduleSession {
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
    courseCode,
    courseTitle: courseMeta?.courseTitle,
    courseCredit: courseMeta?.courseCredit,
  }
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

function hasTimeConflict(candidate: ScheduleSession, existing: ScheduleSession[]): boolean {
  const candidateMeetings = candidate.meetingDetailsList ?? []
  for (const m of candidateMeetings) {
    const range = parseTimeRangeToMinutes(m.time)
    const days = expandDays(m.days)
    if (!range || days.length === 0) continue
    const [cStart, cEnd] = range
    for (const e of existing) {
      for (const em of e.meetingDetailsList ?? []) {
        const er = parseTimeRangeToMinutes(em.time)
        const edays = expandDays(em.days)
        if (!er || edays.length === 0) continue
        // Check shared day
        const sharesDay = days.some((d) => edays.includes(d))
        if (!sharesDay) continue
        const [eStart, eEnd] = er
        // Overlap if start < otherEnd && end > otherStart
        const overlaps = cStart < eEnd && cEnd > eStart
        if (overlaps) return true
      }
    }
  }
  return false
}

export const scheduleStore = createStore<ScheduleState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      sessionsById: {},
      canAdd: (session: any, options?: { courseCode?: string }) => {
        const normalized = normalizeSession(session, options?.courseCode)
        const sessions = Object.values(get().sessionsById)

        // Rule 1: For a given course, only one single-letter code and one double-letter code
        const courseCode = options?.courseCode ?? normalized.courseCode
        if (courseCode) {
          const sameCourse = sessions.filter((s) => s.courseCode === courseCode)
          const currentAlpha = (normalized.code || "").replace(/[^A-Za-z]/g, "")
          const isSingle = currentAlpha.length === 1
          const isDouble = currentAlpha.length === 2
          if (isSingle) {
            const existsSingle = sameCourse.some((s) => (s.code || "").replace(/[^A-Za-z]/g, "").length === 1)
            if (existsSingle)
              return { ok: false as const, reason: "single-letter-exists" }
          }
          if (isDouble) {
            // Enforce: if a single-letter session exists for this course, any double-letter must start with it
            const existingSingleAlpha = (
              sameCourse.find((s) => (s.code || "").replace(/[^A-Za-z]/g, "").length === 1)?.code || ""
            )
              .replace(/[^A-Za-z]/g, "")
              .toUpperCase()
            if (existingSingleAlpha) {
              if (!currentAlpha.toUpperCase().startsWith(existingSingleAlpha)) {
                return { ok: false as const, reason: "double-letter-prefix-mismatch" }
              }
            }
            const existsDouble = sameCourse.some((s) => (s.code || "").replace(/[^A-Za-z]/g, "").length === 2)
            if (existsDouble)
              return { ok: false as const, reason: "double-letter-exists" }
          }
        }

        // Rule 2: Time conflict check
        const conflicts = hasTimeConflict(normalized, sessions)
        if (conflicts) return { ok: false as const, reason: "time-conflict" }

        return { ok: true as const }
      },
      add: (
        session: any,
        options?: { courseCode?: string; courseTitle?: string; courseCredit?: string | number }
      ) =>
        set((state) => {
          const normalized = normalizeSession(session, options?.courseCode, {
            courseTitle: options?.courseTitle,
            courseCredit: options?.courseCredit,
          })
          return {
            sessionsById: {
              ...state.sessionsById,
              [normalized.id]: normalized,
            },
          }
        }),
      remove: (sessionId: string) =>
        set((state) => {
          if (!state.sessionsById[sessionId]) return {}
          const next = { ...state.sessionsById }
          delete next[sessionId]
          return { sessionsById: next }
        }),
      toggle: (
        session: any,
        options?: {
          courseCode?: string
          onViolation?: (reason: ScheduleViolationReason) => void
          courseTitle?: string
          courseCredit?: string | number
        }
      ) => {
        const id = String(session?.id ?? session?.activityId ?? session?.registrationCode)
        if (get().has(id)) get().remove(id)
        else {
          const check = get().canAdd(session, { courseCode: options?.courseCode })
          if (check.ok) get().add(session, options)
          else options?.onViolation?.(check.reason)
        }
      },
      clear: () => set({ sessionsById: {} }),
      has: (sessionId?: string) => {
        if (!sessionId) return false
        return !!get().sessionsById[String(sessionId)]
      },
      getAll: () => Object.values(get().sessionsById),
    }),
    {
      name: "schedule-store",
      version: 1,
      storage: ssrSafeStorage,
      partialize: (state) => ({ sessionsById: state.sessionsById }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.hydrated = true
      },
    }
  )
)

// Hooks
export function useSchedule() {
  return useStore(scheduleStore, (s) => s)
}

export function useIsSessionScheduled(sessionId?: string | null) {
  const sessionsById = useStore(scheduleStore, (s) => s.sessionsById)
  const hydrated = useStore(scheduleStore, (s) => s.hydrated)
  return useMemo(() => {
    if (!sessionId) return false
    if (!hydrated) return false
    return !!sessionsById[String(sessionId)]
  }, [sessionsById, hydrated, sessionId])
}

export function useScheduledSessions(): ScheduleSession[] {
  const sessionsById = useStore(scheduleStore, (s) => s.sessionsById)
  const hydrated = useStore(scheduleStore, (s) => s.hydrated)
  return useMemo(() => (hydrated ? Object.values(sessionsById) : []), [sessionsById, hydrated])
}

export function useScheduleCount(): number {
  const sessionsById = useStore(scheduleStore, (s) => s.sessionsById)
  const hydrated = useStore(scheduleStore, (s) => s.hydrated)
  return hydrated ? Object.keys(sessionsById).length : 0
}

export function useToggleSchedule(): ScheduleState["toggle"] {
  const toggle = useStore(scheduleStore, (s) => s.toggle)
  return toggle
}

export function useRemoveFromSchedule(): (sessionId: string) => void {
  const remove = useStore(scheduleStore, (s) => s.remove)
  return remove
}

export function useClearSchedule(): () => void {
  const clear = useStore(scheduleStore, (s) => s.clear)
  return clear
}

export function useCanAddToSchedule(
  session?: any,
  options?: { courseCode?: string }
): { ok: boolean; reason?: ScheduleViolationReason } {
  const hydrated = useStore(scheduleStore, (s) => s.hydrated)
  const canAddFn = useStore(scheduleStore, (s) => s.canAdd)
  // Subscribe to sessions to recompute when schedule changes
  const sessionsById = useStore(scheduleStore, (s) => s.sessionsById)
  return useMemo(() => {
    if (!hydrated || !session) return { ok: false }
    const res = canAddFn(session, { courseCode: options?.courseCode })
    return res.ok ? { ok: true } : { ok: false, reason: res.reason }
  }, [hydrated, canAddFn, sessionsById, session, options?.courseCode])
}


