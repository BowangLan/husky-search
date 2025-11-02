/**
 * Configuration for schedule generation options
 * Centralizes all generation option types, defaults, and utilities
 */

import { SessionEnrollState } from "@/lib/session-utils"

export type ScheduleGenerationOptions = {
  /**
   * Whether to include closed sessions (sessions that are full or inactive)
   * Default: false
   */
  includeClosedSessions: boolean
  
  /**
   * Whether to include courses requiring faculty/add codes
   * Default: false
   */
  includeCoursesRequiringCodes: boolean
}

/**
 * Default generation options
 */
export const DEFAULT_GENERATION_OPTIONS: ScheduleGenerationOptions = {
  includeClosedSessions: false,
  includeCoursesRequiringCodes: false,
}

/**
 * Checks if a session is closed
 * A session is closed if:
 * - stateKey is not "active", OR
 * - enrollCount >= enrollMaximum
 */
export function isSessionClosed(session: any): boolean {
  if (session.stateKey !== "active") {
    return true
  }
  
  const enrollCount = Number(session.enrollCount ?? 0)
  const enrollMaximum = Number(session.enrollMaximum ?? 0)
  
  return enrollMaximum > 0 && enrollCount >= enrollMaximum
}

/**
 * Checks if a session requires a faculty or add code
 */
export function isSessionRequiringCode(session: any): boolean {
  return (
    session.enrollStatus === SessionEnrollState["ADD CODE REQUIRED"] ||
    session.enrollStatus === SessionEnrollState["FACULTY CODE REQUIRED"] ||
    session.addCodeRequired === true
  )
}

/**
 * Filters sessions based on generation options
 */
export function filterSessionsByOptions(
  sessions: any[],
  options: ScheduleGenerationOptions
): any[] {
  return sessions.filter((session) => {
    // Filter closed sessions
    if (!options.includeClosedSessions && isSessionClosed(session)) {
      return false
    }
    
    // Filter sessions requiring codes
    if (!options.includeCoursesRequiringCodes && isSessionRequiringCode(session)) {
      return false
    }
    
    return true
  })
}

