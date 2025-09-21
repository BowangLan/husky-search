"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Search, X } from "lucide-react"
import { motion } from "motion/react"

import { EASE_OUT_CUBIC } from "@/config/animation"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<string[]>([])
  const [majors, setMajors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const allCourseCodes = useQuery(api.courses.getAllCourseCodes, {})
  const allSubjectAreas = useQuery(api.courses.getAllSubjectAreas, {})
  const navigate = useRouter()

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus()
    }
  }, [isFocused])

  const handleClear = () => {
    setQuery("")
    setCourses([])
    setMajors([])
    setShowResults(false)
    inputRef.current?.focus()
  }

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
      (code) => code.replace(/\s+/g, "") === normalized
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
    }

    if (e.key === "Enter") {
      if (courses.length === 1 && majors.length === 0) {
        navigate.push(`/courses/${courses[0]}`)
        setShowResults(false)
        setCourses([])
        setMajors([])
        inputRef.current?.blur()
      } else if (
        majors.length === 1 &&
        majors[0] === query.trim().toUpperCase()
      ) {
        navigate.push(`/majors/${majors[0]}`)
        setShowResults(false)
        setCourses([])
        setMajors([])
        inputRef.current?.blur()
      } else if (isExactMatch(query)) {
        const exactMatch = allCourseCodes?.find(
          (code) => code.replace(/\s+/g, "") === query.replace(/\s+/g, "")
        )
        if (exactMatch) {
          navigate.push(`/courses/${exactMatch}`)
          setShowResults(false)
          setCourses([])
          setMajors([])
          inputRef.current?.blur()
        }
      } else if (isExactMajorMatch(query)) {
        const exactMatch = allSubjectAreas?.find(
          (code) => code.replace(/\s+/g, "") === query.replace(/\s+/g, "")
        )
        if (exactMatch) {
          navigate.push(`/majors/${exactMatch}`)
          setShowResults(false)
          setCourses([])
          setMajors([])
          inputRef.current?.blur()
        }
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setQuery(value)
    setShowResults(true)
    if (value.trim() === "") {
      setCourses([])
      setMajors([])
      setShowResults(false)
    }
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

    // Filter courses
    const filteredCourses = allCourseCodes
      .filter((code) => code.replace(/\s+/g, "").startsWith(normalized))
      .slice(0, 50)
    setCourses(filteredCourses)

    // Filter majors
    const filteredMajors = allSubjectAreas
      .filter((code) => code.replace(/\s+/g, "").startsWith(normalized))
      .slice(0, 10)
    setMajors(filteredMajors)
  }, [query, allCourseCodes, allSubjectAreas])

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50 z-10" />
        <div className="relative trans w-full md:w-xl md:focus-within:w-2xl">
          <Input
            ref={inputRef}
            placeholder="Search for courses or majors (e.g. CSE 142, MATH 126)..."
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true)
              if (query.trim()) {
                setShowResults(true)
              }
            }}
            onBlur={() => {
              setIsFocused(false)
              // Delay hiding results to allow clicks
              setTimeout(() => setShowResults(false), 150)
            }}
            className="pl-12 pr-12 h-14 text-base border focus-visible:ring-0 rounded-xl shadow-lg"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-transparent opacity-50 hover:opacity-100 transition-opacity"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full z-50 w-full rounded-xl border bg-background shadow-xl mt-2"
          >
            <div className="max-h-80 overflow-y-auto p-2">
              {loading ? (
                <div className="p-6 text-center text-muted-foreground">
                  Searching...
                </div>
              ) : courses.length === 0 && majors.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No courses or majors found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {majors.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Majors
                      </div>
                      {majors.map((major) => (
                        <Link
                          key={`major-${major}`}
                          href={`/majors/${major}`}
                          className="w-full flex items-center rounded-lg px-4 py-3 text-left hover:bg-foreground/5 hover:text-accent-foreground transition-colors cursor-pointer"
                          prefetch
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowResults(false)
                            setQuery(major)
                            setCourses([])
                            setMajors([])
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base">
                                {major}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  {courses.length > 0 && (
                    <>
                      {majors.length > 0 && <div className="border-t mx-4" />}
                      <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Courses
                      </div>
                      {courses.map((course) => (
                        <Link
                          key={`course-${course}`}
                          href={`/courses/${course}`}
                          className="w-full flex items-center rounded-lg px-4 py-3 text-left hover:bg-foreground/5 hover:text-accent-foreground transition-colors cursor-pointer"
                          prefetch
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowResults(false)
                            setQuery(course)
                            setCourses([])
                            setMajors([])
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base">
                                {course}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
