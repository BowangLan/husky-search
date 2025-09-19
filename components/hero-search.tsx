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

export function HeroSearch() {
  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const allCourseCodes = useQuery(api.courses.getAllCourseCodes, {})
  const navigate = useRouter()

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus()
    }
  }, [isFocused])

  const handleClear = () => {
    setQuery("")
    setCourses([])
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowResults(false)
    }

    // Only navigate on Enter if there's an exact course code match
    if (e.key === "Enter") {
      if (courses.length === 1) {
        navigate.push(`/courses/${courses[0]}`)
        setShowResults(false)
        setCourses([])
        inputRef.current?.blur()
      } else if (isExactMatch(query)) {
        const exactMatch = allCourseCodes?.find(
          (code) => code.replace(/\s+/g, "") === query.replace(/\s+/g, "")
        )
        if (exactMatch) {
          navigate.push(`/courses/${exactMatch}`)
          setShowResults(false)
          setCourses([])
          inputRef.current?.blur()
        }
      }
      // For non-exact matches, do nothing (leave for future todo)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setQuery(value)
    setShowResults(true)
    if (value.trim() === "") {
      setCourses([])
      setShowResults(false)
    }
  }

  useEffect(() => {
    if (query.trim() === "") {
      setCourses([])
      setLoading(false)
      return
    }
    if (!allCourseCodes) {
      setLoading(true)
      return
    }
    setLoading(false)
    const normalized = query.replace(/\s+/g, "")
    const filtered = allCourseCodes
      .filter((code) => code.replace(/\s+/g, "").startsWith(normalized))
      .slice(0, 50)
    setCourses(filtered)
  }, [query, allCourseCodes])

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 opacity-50 z-10" />
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: isFocused ? 1.02 : 1 }}
          transition={{ duration: 0.2, ease: EASE_OUT_CUBIC }}
          className="relative"
        >
          <Input
            ref={inputRef}
            placeholder="Search for courses (e.g. CSE 142, MATH 126)..."
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
            className="pl-12 pr-12 h-14 text-lg border-2 rounded-xl shadow-lg"
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
        </motion.div>

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
                  Searching courses...
                </div>
              ) : courses.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No courses found for "{query}"
                </div>
              ) : (
                <div className="space-y-1">
                  {courses.map((course) => (
                    <Link
                      key={course}
                      href={`/courses/${course}`}
                      className="w-full flex items-center rounded-lg px-4 py-3 text-left hover:bg-foreground/5 hover:text-accent-foreground transition-colors cursor-pointer"
                      prefetch
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowResults(false)
                        setQuery(course)
                        setCourses([])
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
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
