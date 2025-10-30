"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, X, Loader2, Plus, Check } from "lucide-react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStaticCourseCodes, useStaticSubjectAreas } from "@/hooks/use-static-course-data"
import { useAddCourse, useTerms } from "@/store/course-plan.store"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  PaneContainer,
  PaneToolbar,
  PaneToolbarItem,
  PaneContent,
} from "./pane-container"

export function CourseBrowsePane() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deferredQuery, setDeferredQuery] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedTermId, setSelectedTermId] = useState<string>("")
  const [addedCourses, setAddedCourses] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const terms = useTerms()
  const addCourse = useAddCourse()
  const { data: allCourseCodes } = useStaticCourseCodes()
  const { data: allSubjectAreas } = useStaticSubjectAreas()

  // Get auto-suggestions from static data
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !allCourseCodes) return { courses: [], majors: [] }

    const normalized = searchQuery.replace(/\s+/g, "").toUpperCase()

    const courses = allCourseCodes
      .filter((code) => code.replace(/\s+/g, "").toUpperCase().startsWith(normalized))
      .slice(0, 10)

    const majors = (allSubjectAreas ?? [])
      .filter((area) => {
        const codeMatch = area.code.replace(/\s+/g, "").toUpperCase().startsWith(normalized)
        const titleMatch = area.title.toLowerCase().includes(searchQuery.toLowerCase())
        return codeMatch || titleMatch
      })
      .slice(0, 5)

    return { courses, majors }
  }, [searchQuery, allCourseCodes, allSubjectAreas])

  // Debounce the search query for actual search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query Convex for full search results when user hits Enter
  const searchResults = useQuery(
    api.myplan.searchCourses,
    deferredQuery ? { query: deferredQuery } : "skip"
  )

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value.toUpperCase())
    setShowSuggestions(true)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSuggestions(false)
    setDeferredQuery(searchQuery)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearchSubmit(e)
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (courseCode: string) => {
    setSearchQuery(courseCode)
    setDeferredQuery(courseCode)
    setShowSuggestions(false)
  }

  const handleAddCourse = (courseCode: string, credits?: number) => {
    if (!selectedTermId) {
      toast.error("Please select a term first")
      return
    }

    const term = terms.find((t) => t.id === selectedTermId)
    if (!term) {
      toast.error("Invalid term selected")
      return
    }

    addCourse(selectedTermId, {
      courseCode,
      credits: credits ?? 5, // Default to 5 credits
    })

    setAddedCourses((prev) => new Set(prev).add(courseCode))

    toast.success("Course added", {
      description: `${courseCode} added to ${term.label}`,
    })
  }

  const isCourseAdded = (courseCode: string) => addedCourses.has(courseCode)

  const hasSuggestions = suggestions.courses.length > 0 || suggestions.majors.length > 0
  const isSearching = searchQuery !== deferredQuery

  return (
    <PaneContainer>
      <PaneToolbar foldable>
        <div className="flex items-center gap-2 w-full">
          <PaneToolbarItem>Browse Courses</PaneToolbarItem>
          <div className="flex-1" />
          {terms.length > 0 && (
            <Select value={selectedTermId} onValueChange={setSelectedTermId}>
              <SelectTrigger className="w-[160px] h-7 text-xs">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id} className="text-xs">
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </PaneToolbar>

      <PaneContent>
        <div className="space-y-4">
          {/* Search Bar with Auto-suggestions */}
          <div className="relative">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search by course code or subject (e.g., CSE 142, MATH)..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent opacity-50"
                    onClick={() => {
                      setSearchQuery("")
                      setDeferredQuery("")
                      setShowSuggestions(false)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </form>

            {/* Auto-suggestions Dropdown */}
            {showSuggestions && hasSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full z-50 w-full rounded-xl border bg-background shadow-md mt-2"
              >
                <div className="max-h-60 overflow-y-auto p-1">
                  {suggestions.majors.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Subject Areas
                      </div>
                      {suggestions.majors.map((major) => (
                        <button
                          key={`major-${major.code}`}
                          className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 trans"
                          onClick={() => handleSuggestionClick(major.code)}
                        >
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{major.code}</span>
                              <span className="text-xs text-muted-foreground">
                                {major.title}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  {suggestions.courses.length > 0 && (
                    <>
                      {suggestions.majors.length > 0 && <div className="border-t mx-2" />}
                      <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Courses
                      </div>
                      {suggestions.courses.map((course) => (
                        <button
                          key={`course-${course}`}
                          className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 trans"
                          onClick={() => handleSuggestionClick(course)}
                        >
                          <span className="font-medium">{course}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Results */}
          <div className="space-y-2">
            {isSearching ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin mr-2" />
                Searching...
              </div>
            ) : !deferredQuery ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <Search className="size-12 mx-auto mb-4 opacity-20" />
                <p className="font-medium">Search for courses</p>
                <p className="text-xs mt-1">
                  Start typing to search by course code or subject area
                </p>
              </div>
            ) : !searchResults ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                <Loader2 className="size-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No courses found for "{deferredQuery}"
              </div>
            ) : (
              <>
                <div className="text-xs text-muted-foreground mb-2">
                  Found {searchResults.length} course{searchResults.length !== 1 ? "s" : ""}
                </div>
                <div className="space-y-2">
                  {searchResults.map((course) => {
                    const isAdded = isCourseAdded(course.courseCode)
                    const credits = parseInt(course.credit) || 5

                    return (
                      <div
                        key={course._id}
                        className="border rounded-lg p-3 hover:border-purple-500/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/courses/${encodeURIComponent(course.courseCode)}`}
                              target="_blank"
                              className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {course.courseCode}
                            </Link>
                            <p className="text-sm font-medium text-foreground mt-1">
                              {course.title}
                            </p>
                            {course.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {course.credit} credits
                              </Badge>
                              {course.genEdReqs && course.genEdReqs.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {course.genEdReqs[0]}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isAdded ? "outline" : "default"}
                            onClick={() => handleAddCourse(course.courseCode, credits)}
                            disabled={!selectedTermId || isAdded}
                            className="shrink-0"
                          >
                            {isAdded ? (
                              <>
                                <Check className="size-4 mr-1" />
                                Added
                              </>
                            ) : (
                              <>
                                <Plus className="size-4 mr-1" />
                                Add
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {terms.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
              Add a term first before adding courses to your plan
            </div>
          )}
        </div>
      </PaneContent>
    </PaneContainer>
  )
}
