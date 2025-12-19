"use client"

import { useMemo, useState } from "react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { ConvexCourseOverview, ConvexCourseOverviewEnroll } from "@/types/convex-courses"

import {
  CourseAvailability,
  EnrollStatusOption,
  FilterOptions,
  GenEdCourseFiltersReturn,
  SortOption,
} from "./types"

const COURSES_PER_PAGE = 100

/**
 * Filter enrollment data to only include current term entries
 */
function filterEnrollByCurrentTerms(
  enroll: ConvexCourseOverviewEnroll[],
  currentTerms: string[]
): ConvexCourseOverviewEnroll[] {
  if (currentTerms.length === 0) return enroll
  return enroll.filter((e) => currentTerms.includes(e.termId))
}

/**
 * Check if a course has open seats available in the current term(s)
 */
export function hasOpenSeats(
  course: ConvexCourseOverview,
  currentTerms: string[] = []
): boolean {
  const allEnroll = course.enroll ?? []
  const enroll = currentTerms.length > 0 
    ? filterEnrollByCurrentTerms(allEnroll, currentTerms)
    : allEnroll
  
  if (enroll.length === 0) return false

  return enroll.some((e) => {
    if (typeof e.openSessionCount === "number" && e.openSessionCount > 0)
      return true
    if (e.enrollStatus && e.enrollStatus.toLowerCase() === "open") return true
    if (e.stateKey && e.stateKey.toLowerCase().includes("open")) return true
    if (
      typeof e.enrollCount === "number" &&
      typeof e.enrollMax === "number" &&
      e.enrollMax > 0 &&
      e.enrollCount < e.enrollMax
    )
      return true
    return false
  })
}

/**
 * Check if a course is offered in the current term(s)
 */
function isOfferedInCurrentTerms(
  course: ConvexCourseOverview,
  currentTerms: string[]
): boolean {
  const allEnroll = course.enroll ?? []
  if (currentTerms.length === 0) return allEnroll.length > 0
  return allEnroll.some((e) => currentTerms.includes(e.termId))
}

/**
 * Custom hook for managing Gen Ed course filtering, sorting, and pagination
 */
export function useGenEdCourseFilters(
  courses: ConvexCourseOverview[]
): GenEdCourseFiltersReturn {
  // Fetch current terms from convex to filter enrollment data
  const currentTerms = useQuery(api.kvStore.getCurrentTerms) ?? []

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEnrollStatuses, setSelectedEnrollStatuses] = useState<
    Set<EnrollStatusOption>
  >(new Set())
  const [sortBy, setSortBy] = useState<SortOption>("course-code")
  const [selectedMajors, setSelectedMajors] = useState<Set<string>>(new Set())
  const [selectedCredits, setSelectedCredits] = useState<Set<string>>(new Set())
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set())
  const [hasPrereqFilter, setHasPrereqFilter] = useState<boolean | null>(null)

  // Extract filter options from courses
  const filterOptions = useMemo<FilterOptions>(() => {
    const majors = new Set<string>()
    const credits = new Set<string>()
    const levels = new Set<string>()
    const majorCounts: Record<string, number> = {}
    const creditCounts: Record<string, number> = {}
    const levelCounts: Record<string, number> = {}
    const enrollStatusCounts: Record<EnrollStatusOption, number> = {
      open: 0,
      closed: 0,
      "not-offered": 0,
    }
    let hasPrereqCount = 0

    courses.forEach((course) => {
      if (course.subjectArea) {
        majors.add(course.subjectArea)
        majorCounts[course.subjectArea] = (majorCounts[course.subjectArea] ?? 0) + 1
      }
      if (course.credit) {
        // Handle credit ranges like "3-5" by adding individual values
        const creditParts = course.credit.split("-")
        if (creditParts.length === 2) {
          const [min, max] = creditParts.map(Number)
          for (let i = min; i <= max; i++) {
            const c = String(i)
            credits.add(c)
            creditCounts[c] = (creditCounts[c] ?? 0) + 1
          }
        } else {
          credits.add(course.credit)
          creditCounts[course.credit] = (creditCounts[course.credit] ?? 0) + 1
        }
      }
      // Extract course level (100, 200, 300, etc.)
      const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
      if (level !== "?00") {
        levels.add(level)
        levelCounts[level] = (levelCounts[level] ?? 0) + 1
      }

      // Prerequisite count
      const hasPrereqs =
        (course.prereqs && course.prereqs.length > 0) ||
        (course.prereqMap &&
          course.prereqMap.nodes &&
          Array.isArray(course.prereqMap.nodes) &&
          course.prereqMap.nodes.length > 0)
      if (hasPrereqs) hasPrereqCount++

      // Enrollment status counts (current term(s) only)
      const isOffered = isOfferedInCurrentTerms(course, currentTerms)
      if (!isOffered) {
        enrollStatusCounts["not-offered"]++
      } else if (hasOpenSeats(course, currentTerms)) {
        enrollStatusCounts.open++
      } else {
        enrollStatusCounts.closed++
      }
    })

    return {
      majors: Array.from(majors).sort(),
      credits: Array.from(credits)
        .map(Number)
        .filter((n) => !isNaN(n))
        .sort((a, b) => a - b)
        .map(String),
      levels: Array.from(levels).sort(),
      counts: {
        majors: majorCounts,
        credits: creditCounts,
        levels: levelCounts,
        enrollStatuses: enrollStatusCounts,
        hasPrereq: hasPrereqCount,
      },
    }
  }, [courses, currentTerms])

  // Filter courses
  const filteredCourses = useMemo(() => {
    let result = [...courses]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (course) =>
          course.courseCode.toLowerCase().includes(query) ||
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query)
      )
    }

    // Enroll status filter (multi-select)
    // Filter based on current term enrollment data only
    if (selectedEnrollStatuses.size > 0) {
      result = result.filter((course) => {
        const isOffered = isOfferedInCurrentTerms(course, currentTerms)
        const isOpen = hasOpenSeats(course, currentTerms)

        // Check if course matches any of the selected statuses
        if (selectedEnrollStatuses.has("open") && isOffered && isOpen)
          return true
        if (selectedEnrollStatuses.has("closed") && isOffered && !isOpen)
          return true
        if (selectedEnrollStatuses.has("not-offered") && !isOffered)
          return true
        return false
      })
    }

    // Major filter
    if (selectedMajors.size > 0) {
      result = result.filter((course) => selectedMajors.has(course.subjectArea))
    }

    // Credit filter
    if (selectedCredits.size > 0) {
      result = result.filter((course) => {
        if (!course.credit) return false
        const creditParts = course.credit.split("-")
        if (creditParts.length === 2) {
          const [min, max] = creditParts.map(Number)
          return Array.from(selectedCredits).some((c) => {
            const credit = Number(c)
            return credit >= min && credit <= max
          })
        }
        return selectedCredits.has(course.credit)
      })
    }

    // Level filter
    if (selectedLevels.size > 0) {
      result = result.filter((course) => {
        const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
        return selectedLevels.has(level)
      })
    }

    // Prerequisite filter
    if (hasPrereqFilter !== null) {
      result = result.filter((course) => {
        const hasPrereqs =
          (course.prereqs && course.prereqs.length > 0) ||
          (course.prereqMap &&
            course.prereqMap.nodes &&
            Array.isArray(course.prereqMap.nodes) &&
            course.prereqMap.nodes.length > 0)
        return hasPrereqFilter ? hasPrereqs : !hasPrereqs
      })
    }

    return result
  }, [
    courses,
    searchQuery,
    selectedEnrollStatuses,
    selectedMajors,
    selectedCredits,
    selectedLevels,
    hasPrereqFilter,
    currentTerms,
  ])

  // Sort courses
  const sortedCourses = useMemo(() => {
    const result = [...filteredCourses]

    if (sortBy === "course-code") {
      result.sort((a, b) => a.courseCode.localeCompare(b.courseCode))
    } else if (sortBy === "popularity") {
      result.sort((a, b) => {
        const maxEnrollA = Math.max(
          ...(a.enroll?.map((e) => e.enrollMax ?? 0) ?? [0]),
          0
        )
        const maxEnrollB = Math.max(
          ...(b.enroll?.map((e) => e.enrollMax ?? 0) ?? [0]),
          0
        )
        return maxEnrollB - maxEnrollA
      })
    }

    return result
  }, [filteredCourses, sortBy])

  // Paginated courses
  const displayedCourses = useMemo(() => {
    return sortedCourses.slice(0, COURSES_PER_PAGE)
  }, [sortedCourses])

  // Course availability stats (based on current term data only)
  const courseAvailability = useMemo<CourseAvailability>(() => {
    let open = 0
    let closed = 0
    let notOffered = 0

    for (const course of courses) {
      const isOffered = isOfferedInCurrentTerms(course, currentTerms)
      if (!isOffered) {
        notOffered++
        continue
      }

      if (hasOpenSeats(course, currentTerms)) open++
      else closed++
    }

    return { open, closed, notOffered, total: courses.length }
  }, [courses, currentTerms])

  // Toggle functions
  const toggleMajor = (major: string) => {
    setSelectedMajors((prev) => {
      const next = new Set(prev)
      if (next.has(major)) next.delete(major)
      else next.add(major)
      return next
    })
  }

  const toggleCredit = (credit: string) => {
    setSelectedCredits((prev) => {
      const next = new Set(prev)
      if (next.has(credit)) next.delete(credit)
      else next.add(credit)
      return next
    })
  }

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const toggleEnrollStatus = (status: EnrollStatusOption) => {
    setSelectedEnrollStatuses((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedEnrollStatuses(new Set())
    setSelectedMajors(new Set())
    setSelectedCredits(new Set())
    setSelectedLevels(new Set())
    setHasPrereqFilter(null)
  }

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    selectedEnrollStatuses.size +
    selectedMajors.size +
    selectedCredits.size +
    selectedLevels.size +
    (hasPrereqFilter !== null ? 1 : 0)

  return {
    // Filter state
    searchQuery,
    setSearchQuery,
    selectedEnrollStatuses,
    toggleEnrollStatus,
    selectedMajors,
    selectedCredits,
    selectedLevels,
    hasPrereqFilter,
    setHasPrereqFilter,

    // Toggle functions
    toggleMajor,
    toggleCredit,
    toggleLevel,
    clearFilters,

    // Computed values
    filterOptions,
    filteredCourses,
    sortedCourses,
    displayedCourses,
    courseAvailability,
    activeFilterCount,

    // Sorting
    sortBy,
    setSortBy,
  }
}

