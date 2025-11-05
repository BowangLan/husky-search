"use client"

import { useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export const parseCourseCodes = (courseCodesParam: string | null) => {
  if (!courseCodesParam) return new Set<string>()
  return new Set(
    courseCodesParam
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
      .map((c) => {
        return c.replaceAll("+", " ").replaceAll(/\s+/g, " ").toUpperCase().trim()
      })
  )
}

export const parseSubjectArea = (subjectArea: string | null) => {
  if (!subjectArea) return null
  return subjectArea.toUpperCase().trim()
}

export const usePrereqGraphUrlParams = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current params
  const subjectArea = searchParams.get("subjectArea")
  const courseCodesParam = searchParams.get("courseCodes")

  // Use useMemo to make courseCodes reactive (triggers re-renders when URL params change)
  const currentCourseCodes = useMemo(() => {
    if (!courseCodesParam) return new Set<string>()
    return new Set(
      courseCodesParam
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .map((c) => {
          return c.replaceAll("+", " ").replaceAll(/\s+/g, " ").toUpperCase().trim()
        })
    )
  }, [courseCodesParam])

  // Check if a course is already in the graph
  const isCourseAdded = (courseCode: string) => {
    // Normalize course code by removing all spaces
    const normalized = courseCode.replaceAll("+", " ").replaceAll(/\s+/g, " ").toUpperCase()
    return currentCourseCodes.has(normalized.trim())
  }

  const updateUrl = (courseCodes: Set<string>, subjectArea: string | null) => {
    const courseCodesArray = Array.from(courseCodes)
    const params = new URLSearchParams()
    params.set("courseCodes", courseCodesArray.join(","))
    if (subjectArea) {
      params.set("subjectArea", subjectArea)
    }
    router.push(`/prereq-graph?${params.toString()}`)
    // Note: currentCourseCodes will update automatically via useMemo when courseCodesParam changes
  }

  // Check if a major is already in the graph
  const isMajorAdded = (majorCode: string) => {
    return subjectArea?.toUpperCase() === majorCode.toUpperCase()
  }

  const addCourses = (courseCodes: Set<string>) => {
    const newCourseCodes = new Set(currentCourseCodes)
    for (const courseCode of courseCodes) {
      newCourseCodes.add(courseCode)
    }
    updateUrl(newCourseCodes, subjectArea)
    // Note: currentCourseCodes will update automatically via useMemo when courseCodesParam changes
  }

  const removeCourse = (courseCode: string) => {
    if (!isCourseAdded(courseCode)) {
      // Not added, don't do anything
      return
    }

    // Normalize course code for comparison
    const normalized = courseCode.replaceAll("+", " ").replaceAll(/\s+/g, " ").toUpperCase().trim()

    const newCourseCodes = new Set(currentCourseCodes)
    newCourseCodes.delete(normalized)

    updateUrl(newCourseCodes, subjectArea)
  }

  const addMajor = (majorCode: string) => {
    if (isMajorAdded(majorCode)) {
      // Already added, don't do anything
      return
    }

    // Build new URL - replace subjectArea (only one major at a time)
    const newSubjectArea = majorCode.toUpperCase()
    updateUrl(currentCourseCodes, newSubjectArea)
  }

  const removeMajor = (majorCode: string) => {
    if (!isMajorAdded(majorCode)) {
      // Not added, don't do anything
      return
    }

    const newSubjectArea = null
    updateUrl(currentCourseCodes, newSubjectArea)
  }

  return {
    courseCodes: currentCourseCodes,
    subjectArea,
    isCourseAdded,
    isMajorAdded,
    addCourses,
    removeCourse,
    addMajor,
    removeMajor,
  }
}

/**
 * Hook for managing URL search parameters on the prereq graph page
 * Handles courseCodes (comma-separated with + for spaces) and subjectArea
 */
export function usePrereqGraphUrlParams1() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get current params
  const subjectArea = searchParams.get("subjectArea")
  const courseCodesParam = searchParams.get("courseCodes")

  // Parse current course codes and normalize for comparison
  const currentCourseCodes = useMemo(() => {
    if (!courseCodesParam) return new Set<string>()
    return new Set(
      courseCodesParam
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0)
        .map((c) => {
          // Replace "+" with " " then normalize (remove spaces for comparison)
          return c.replace(/\+/g, " ").replace(/\s+/g, "").toUpperCase()
        })
    )
  }, [courseCodesParam])

  // Get raw course codes from URL (with + format)
  const rawCourseCodes = useMemo(() => {
    if (!courseCodesParam) return []
    return courseCodesParam
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
  }, [courseCodesParam])

  // Check if a course is already in the graph
  const isCourseAdded = (courseCode: string) => {
    // Normalize course code by removing all spaces
    const normalized = courseCode.replace(/\s+/g, "").toUpperCase()
    return currentCourseCodes.has(normalized)
  }

  // Check if a major is already in the graph
  const isMajorAdded = (majorCode: string) => {
    return subjectArea?.toUpperCase() === majorCode.toUpperCase()
  }

  // Add a course to the graph
  const addCourse = (courseCode: string) => {
    if (isCourseAdded(courseCode)) {
      // Already added, don't do anything
      return
    }

    // Replace spaces with "+" for URL format
    const urlFormattedCourseCode = courseCode.replace(/\s+/g, "+")

    // Add new course code to existing ones
    const newCourseCodes = [...rawCourseCodes, urlFormattedCourseCode]

    // Build new URL
    const params = new URLSearchParams(searchParams.toString())
    params.set("courseCodes", newCourseCodes.join(","))

    // Navigate to new URL
    router.push(`/prereq-graph?${params.toString()}`)
  }

  // Remove a course from the graph
  const removeCourse = (courseCode: string) => {
    if (!isCourseAdded(courseCode)) {
      // Not added, don't do anything
      return
    }

    // Normalize course code for comparison
    const normalized = courseCode.replace(/\s+/g, "").toUpperCase()

    // Remove the course code from the list
    const newCourseCodes = rawCourseCodes.filter((c) => {
      const normalizedC = c.replace(/\+/g, " ").replace(/\s+/g, "").toUpperCase()
      return normalizedC !== normalized
    })

    // Build new URL
    const params = new URLSearchParams(searchParams.toString())

    if (newCourseCodes.length > 0) {
      params.set("courseCodes", newCourseCodes.join(","))
    } else {
      // Remove the param entirely if no courses left
      params.delete("courseCodes")
    }

    // Navigate to new URL
    router.push(`/prereq-graph?${params.toString()}`)
  }

  // Add a major/subject area to the graph
  const addMajor = (majorCode: string) => {
    if (isMajorAdded(majorCode)) {
      // Already added, don't do anything
      return
    }

    // Build new URL - replace subjectArea (only one major at a time)
    const params = new URLSearchParams(searchParams.toString())
    params.set("subjectArea", majorCode.toUpperCase())

    // Navigate to new URL
    router.push(`/prereq-graph?${params.toString()}`)
  }

  return {
    subjectArea,
    courseCodesParam,
    currentCourseCodes,
    rawCourseCodes,
    isCourseAdded,
    isMajorAdded,
    addCourse,
    removeCourse,
    addMajor,
  }
}

