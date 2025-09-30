"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Search, X } from "lucide-react"
import { motion } from "motion/react"

import { EASE_OUT_CUBIC } from "@/config/animation"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCourseSearch } from "@/hooks/use-course-search"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function HeroSearch() {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    courses,
    majors,
    loading,
    showResults,
    setShowResults,
    clearSearch,
    handleChange,
    handleKeyDown,
    isExactMatch,
    isExactMajorMatch,
  } = useCourseSearch()

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus()
    }
  }, [isFocused])

  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
      return
    }

    handleKeyDown(e)

    // Close results and blur input after navigation
    if (e.key === "Enter") {
      setShowResults(false)
      inputRef.current?.blur()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value)
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50 z-10" />
        <div className="relative trans w-full md:w-xl md:focus-within:w-2xl">
          <Input
            ref={inputRef}
            placeholder="Search for courses or majors (e.g. CSE 142, MATH 126)..."
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
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
            className="absolute isolate top-full w-full rounded-xl border bg-background shadow-xl mt-2"
            style={{ zIndex: 999 }}
          >
            <div
              className="overflow-y-auto p-2"
              style={{
                maxHeight: "400px",
              }}
            >
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
                          key={`major-${major.code}`}
                          href={`/majors/${major.code}`}
                          className="w-full flex items-center rounded-lg px-4 py-3 text-left hover:bg-foreground/5 hover:text-accent-foreground transition-colors cursor-pointer"
                          prefetch
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowResults(false)
                          }}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-base">
                                {major.code}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {major.title}
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
