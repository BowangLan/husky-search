"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SubjectArea, useStaticCourseCodes, useStaticSubjectAreas } from "@/hooks/use-static-course-data"

export interface CourseSearchOptions {
  maxCourses?: number
  maxMajors?: number
  autoNavigate?: boolean
}

export function useCourseSearch(options: CourseSearchOptions = {}) {
  const { maxCourses = 50, maxMajors = 10, autoNavigate = true } = options

  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<string[]>([])
  const [majors, setMajors] = useState<SubjectArea[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const { data: allCourseCodes } = useStaticCourseCodes()
  const { data: allSubjectAreas } = useStaticSubjectAreas()
  const router = useRouter()

  const isExactMatch = (searchQuery: string) => {
    if (!allCourseCodes) return false
    const normalized = searchQuery.replace(/\s+/g, "")
    return allCourseCodes.some(
      (code) => code.replace(/\s+/g, "") === normalized
    )
  }

  const isExactMajorMatch = (searchQuery: string) => {
    if (!allSubjectAreas) return false
    const normalized = searchQuery.replace(/\s+/g, "")
    return allSubjectAreas.some(
      (area) => area.code.replace(/\s+/g, "") === normalized
    )
  }

  const clearSearch = useCallback(() => {
    setQuery("")
    setCourses([])
    setMajors([])
    setShowResults(false)
  }, [])

  const handleChange = (value: string) => {
    const upperValue = value.toUpperCase()
    setQuery(upperValue)
    setShowResults(true)

    if (upperValue.trim() === "") {
      setCourses([])
      setMajors([])
      setShowResults(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
      return
    }

    if (e.key === "Enter" && autoNavigate) {
      if (courses.length === 1 && majors.length === 0) {
        router.push(`/courses/${courses[0]}`)
        setShowResults(false)
      } else if (
        majors.length === 1 &&
        majors[0].code === query.trim().toUpperCase()
      ) {
        router.push(`/majors/${majors[0].code}`)
        setShowResults(false)
      } else if (isExactMatch(query)) {
        const exactMatch = allCourseCodes?.find(
          (code) => code.replace(/\s+/g, "") === query.replace(/\s+/g, "")
        )
        if (exactMatch) {
          router.push(`/courses/${exactMatch}`)
          setShowResults(false)
        }
      } else if (isExactMajorMatch(query)) {
        const exactMatch = allSubjectAreas?.find(
          (area) => area.code.replace(/\s+/g, "") === query.replace(/\s+/g, "")
        )
        if (exactMatch) {
          router.push(`/majors/${exactMatch.code}`)
          setShowResults(false)
        }
      }
    }
  }

  const handleCourseSelect = (courseCode: string) => {
    if (autoNavigate) {
      router.push(`/courses/${courseCode}`)
    }
    setQuery(courseCode)
    setCourses([])
    setMajors([])
    setShowResults(false)
  }

  const handleMajorSelect = (major: SubjectArea) => {
    if (autoNavigate) {
      router.push(`/majors/${major.code}`)
    }
    setQuery(major.code)
    setCourses([])
    setMajors([])
    setShowResults(false)
  }

  useEffect(() => {
    if (query.trim() === "") {
      setCourses([])
      setMajors([])
      setLoading(false)
      return
    }

    if (!allCourseCodes || !allSubjectAreas) {
      setLoading(true)
      return
    }

    setLoading(false)
    const normalized = query.replace(/\s+/g, "")

    const filteredCourses = allCourseCodes
      .filter((code) => code.replace(/\s+/g, "").startsWith(normalized))
      .slice(0, maxCourses)
    setCourses(filteredCourses)

    const filteredMajors = allSubjectAreas
      .filter((area) => {
        const codeMatch = area.code.replace(/\s+/g, "").startsWith(normalized)
        const titleMatch = area.title.toLowerCase().includes(query.toLowerCase())
        return codeMatch || titleMatch
      })
      .slice(0, maxMajors)
    setMajors(filteredMajors)
  }, [query, allCourseCodes, allSubjectAreas, maxCourses, maxMajors])

  return {
    query,
    courses,
    majors,
    loading,
    showResults,
    setQuery,
    setShowResults,
    clearSearch,
    handleChange,
    handleKeyDown,
    handleCourseSelect,
    handleMajorSelect,
    isExactMatch,
    isExactMajorMatch,
  }
}