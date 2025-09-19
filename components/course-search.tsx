"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Search, X } from "lucide-react"
import { motion } from "motion/react"

import { EASE_OUT_CUBIC } from "@/config/animation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const WIDTH = "300px"
const WIDTH_FOCUSED = "400px"

export function CourseSearch() {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setIsFocused(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleClear = () => {
    setQuery("")
    setCourses([])
    setMajors([])
    setShowResults(false)
    inputRef.current?.focus()
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
    <div className="relative hidden md:block">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 z-10" />
      <motion.div
        initial={{ width: WIDTH }}
        animate={{
          width: isFocused ? WIDTH_FOCUSED : WIDTH,
        }}
        transition={{ duration: 0.8, ease: EASE_OUT_CUBIC }}
        className="relative"
      >
        <Input
          ref={inputRef}
          placeholder="Search courses or majors..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true)
            // setShowResults(true)
          }}
          onBlur={() => {
            setIsFocused(false)
            // setShowResults(false)
          }}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent trans opacity-50"
            onClick={handleClear}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </motion.div>

      {showResults && (
        <div className="absolute top-full z-50 w-full rounded-xl border bg-background shadow-md mt-2">
          <div className="max-h-80 overflow-y-auto p-1">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : courses.length === 0 && majors.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No courses or majors found.
              </div>
            ) : (
              <div className="space-y-1">
                {majors.length > 0 && (
                  <>
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Majors
                    </div>
                    {majors.map((major) => (
                      <Link
                        key={`major-${major}`}
                        href={`/majors/${major}`}
                        className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 hover:text-accent-foreground trans cursor-pointer z-20"
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
                            <span className="font-medium">{major}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
                {courses.length > 0 && (
                  <>
                    {majors.length > 0 && <div className="border-t mx-2" />}
                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Courses
                    </div>
                    {courses.map((course) => (
                      <Link
                        key={`course-${course}`}
                        href={`/courses/${course}`}
                        className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 hover:text-accent-foreground trans cursor-pointer z-20"
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
                            <span className="font-medium">{course}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
