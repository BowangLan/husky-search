import { type ScheduleCourse, type ScheduleSession } from "@/store/schedule.store"
import { expandDays } from "./utils"
import {
  type ScheduleGenerationOptions,
  DEFAULT_GENERATION_OPTIONS,
  filterSessionsByOptions,
} from "@/config/schedule-generation"

type Meeting = {
  days?: string
  time?: string
  building?: string
  room?: string
  campus?: string
}

type CourseWithSessions = {
  courseCode: string
  courseTitle?: string
  courseCredit?: string | number
  sessions: Array<{
    id: string
    code: string
    type?: string
    instructor?: string
    registrationCode?: string | number
    meetingDetailsList?: Meeting[]
  }>
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

function hasTimeConflict(
  candidateSession: ScheduleSession,
  existingSessions: ScheduleSession[]
): boolean {
  const candidateMeetings = candidateSession.meetingDetailsList ?? []
  
  for (const m of candidateMeetings) {
    const range = parseTimeRangeToMinutes(m.time)
    const days = expandDays(m.days)
    if (!range || days.length === 0) continue
    
    const [cStart, cEnd] = range
    
    for (const existingSession of existingSessions) {
      for (const em of existingSession.meetingDetailsList ?? []) {
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
  
  return false
}

function normalizeSession(raw: any): ScheduleSession {
  const meetingDetailsList: Array<{
    days?: string
    time?: string
    building?: string
    room?: string
    campus?: string
  }> = Array.isArray(raw?.meetingDetailsList)
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

/**
 * Validates that a session combination follows the rules:
 * - For each course, exactly one single-letter code and optionally one double-letter code
 * - Double-letter session's first letter must match the single-letter session's letter
 * - No time conflicts
 */
function isValidSchedule(
  sessionAssignments: Map<string, ScheduleSession[]>,
  coursesWithoutSessions: CourseWithSessions[]
): boolean {
  // Check single/double letter rule for each course
  for (const [courseCode, sessions] of sessionAssignments.entries()) {
    let singleLetter: ScheduleSession | null = null
    let doubleLetter: ScheduleSession | null = null
    
    for (const session of sessions) {
      const alpha = (session.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      if (alpha.length === 1) {
        if (singleLetter && singleLetter.id !== session.id) {
          return false // Multiple single-letter codes
        }
        singleLetter = session
      } else if (alpha.length === 2) {
        if (doubleLetter && doubleLetter.id !== session.id) {
          return false // Multiple double-letter codes
        }
        doubleLetter = session
      }
    }
    
    // Must have at least one single-letter session
    if (!singleLetter) {
      return false
    }
    
    // If there's a double-letter session, its first letter must match the single-letter session
    if (doubleLetter) {
      const singleLetterCode = (singleLetter.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      const doubleLetterCode = (doubleLetter.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      if (singleLetterCode[0] !== doubleLetterCode[0]) {
        return false // Double-letter session doesn't match single-letter session
      }
    }
  }
  
  // Check time conflicts
  const allSessions = Array.from(sessionAssignments.values()).flat()
  for (let i = 0; i < allSessions.length; i++) {
    for (let j = i + 1; j < allSessions.length; j++) {
      if (hasTimeConflict(allSessions[i], [allSessions[j]])) {
        return false
      }
    }
  }
  
  return true
}

/**
 * Generates valid schedule combinations for courses without selected sessions
 * Generates ALL possible valid combinations (no limit)
 */
export function generateScheduleVariants(
  scheduledCourses: ScheduleCourse[],
  coursesWithSessions: CourseWithSessions[],
  options: ScheduleGenerationOptions = DEFAULT_GENERATION_OPTIONS
): Array<{
  id: string
  courseAssignments: Map<string, ScheduleSession>
  courses: Array<{
    courseCode: string
    courseTitle?: string
    courseCredit?: string | number
    sessions: ScheduleSession[]
  }>
}> {
  // Identify courses without sessions
  const coursesWithoutSessions = scheduledCourses.filter((c) => c.sessions.length === 0)
  
  if (coursesWithoutSessions.length === 0) {
    return []
  }
  
  // Get available sessions for courses without sessions and filter by options
  const courseCodeToSessions = new Map<string, CourseWithSessions>()
  for (const course of coursesWithSessions) {
    if (coursesWithoutSessions.some((c) => c.courseCode === course.courseCode)) {
      // Filter sessions based on generation options
      const filteredSessions = filterSessionsByOptions(course.sessions, options)
      
      // Only include course if it has sessions after filtering
      if (filteredSessions.length > 0) {
        courseCodeToSessions.set(course.courseCode, {
          ...course,
          sessions: filteredSessions,
        })
      }
    }
  }
  
  // Get all fixed sessions (from courses that already have sessions)
  const fixedSessions: ScheduleSession[] = scheduledCourses
    .filter((c) => c.sessions.length > 0)
    .flatMap((c) => c.sessions)
  
  // Get courses with sessions (for metadata like title, credit)
  const coursesWithSessionsMap = new Map<string, ScheduleCourse>()
  scheduledCourses.forEach((c) => {
    coursesWithSessionsMap.set(c.courseCode, c)
  })
  
  // Generate combinations using backtracking
  const variants: Array<{
    id: string
    courseAssignments: Map<string, ScheduleSession>
    courses: Array<{
      courseCode: string
      courseTitle?: string
      courseCredit?: string | number
      sessions: ScheduleSession[]
    }>
  }> = []
  
  const courseCodes = Array.from(courseCodeToSessions.keys())
  
  // Pre-group sessions by type for each course
  // For double-letter sessions, group them by their first letter
  const courseSessionGroups = new Map<string, {
    singleLetter: ScheduleSession[]
    doubleLetterByFirstLetter: Map<string, ScheduleSession[]>
  }>()
  
  for (const courseCode of courseCodes) {
    const courseData = courseCodeToSessions.get(courseCode)!
    const singleLetter: ScheduleSession[] = []
    const doubleLetterByFirstLetter = new Map<string, ScheduleSession[]>()
    
    for (const sessionRaw of courseData.sessions) {
      const session = normalizeSession(sessionRaw)
      const alpha = (session.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      if (alpha.length === 1) {
        singleLetter.push(session)
      } else if (alpha.length === 2) {
        const firstLetter = alpha[0]
        if (!doubleLetterByFirstLetter.has(firstLetter)) {
          doubleLetterByFirstLetter.set(firstLetter, [])
        }
        doubleLetterByFirstLetter.get(firstLetter)!.push(session)
      }
    }
    
    courseSessionGroups.set(courseCode, { singleLetter, doubleLetterByFirstLetter })
  }
  
  function backtrack(
    index: number,
    currentAssignments: Map<string, ScheduleSession[]>
  ) {
    if (index === courseCodes.length) {
      // Check if this is a valid schedule
      if (isValidSchedule(currentAssignments, coursesWithoutSessions)) {
        const variantCourses = courseCodes.map((courseCode) => {
          const courseData = courseCodeToSessions.get(courseCode)!
          const assignedSessions = currentAssignments.get(courseCode)!
          const scheduledCourse = coursesWithSessionsMap.get(courseCode)
          
          return {
            courseCode: courseData.courseCode,
            courseTitle: scheduledCourse?.courseTitle || courseData.courseTitle,
            courseCredit: scheduledCourse?.courseCredit || courseData.courseCredit,
            sessions: assignedSessions,
          }
        })
        
        // Create a flat map for courseAssignments (for compatibility)
        const courseAssignmentsFlat = new Map<string, ScheduleSession>()
        for (const [courseCode, sessions] of currentAssignments.entries()) {
          // Store the first session (single-letter) for backward compatibility
          if (sessions.length > 0) {
            courseAssignmentsFlat.set(courseCode, sessions[0])
          }
        }
        
        variants.push({
          id: `variant-${variants.length + 1}`,
          courseAssignments: courseAssignmentsFlat,
          courses: variantCourses,
        })
      }
      return
    }
    
    const courseCode = courseCodes[index]
    const sessionGroups = courseSessionGroups.get(courseCode)!
    const { singleLetter, doubleLetterByFirstLetter } = sessionGroups
    
    // Must select at least one single-letter session
    if (singleLetter.length === 0) {
      return // Skip this course if no single-letter sessions
    }
    
    // Try each combination of single-letter and double-letter sessions
    for (const singleSession of singleLetter) {
      // Build the sessions array for this course
      const courseSessions: ScheduleSession[] = [singleSession]
      
      // Extract the first letter from the single-letter session code
      const singleLetterCode = (singleSession.code || "").replace(/[^A-Za-z]/g, "").toUpperCase()
      const singleLetterChar = singleLetterCode[0]
      
      // Get double-letter sessions that match the single-letter session's first letter
      const matchingDoubleLetter = doubleLetterByFirstLetter.get(singleLetterChar) || []
      
      // If matching double-letter sessions exist, we must select one
      if (matchingDoubleLetter.length > 0) {
        // Try each matching double-letter session
        for (const doubleSession of matchingDoubleLetter) {
          courseSessions.push(doubleSession)
          
          // Check if all sessions in this combination conflict with fixed sessions or already assigned sessions
          const allCurrentSessions = [
            ...fixedSessions,
            ...Array.from(currentAssignments.values()).flat()
          ]
          
          const hasConflict = courseSessions.some((s) =>
            hasTimeConflict(s, allCurrentSessions)
          )
          
          if (!hasConflict) {
            currentAssignments.set(courseCode, [...courseSessions])
            backtrack(index + 1, currentAssignments)
            currentAssignments.delete(courseCode)
          }
          
          // Remove double-letter session for next iteration
          courseSessions.pop()
        }
      } else {
        // No matching double-letter sessions, just use the single-letter session
        const allCurrentSessions = [
          ...fixedSessions,
          ...Array.from(currentAssignments.values()).flat()
        ]
        
        const hasConflict = hasTimeConflict(singleSession, allCurrentSessions)
        
        if (!hasConflict) {
          currentAssignments.set(courseCode, [...courseSessions])
          backtrack(index + 1, currentAssignments)
          currentAssignments.delete(courseCode)
        }
      }
    }
  }
  
  backtrack(0, new Map())
  
  return variants
}

