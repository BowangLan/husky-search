"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { CourseSearchResultItem } from "@/services/course-service"
import { useQuery } from "convex/react"
import { Command, Search, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CourseSearchCard } from "@/components/course-search-card"
import { CourseSearchEmptyState } from "@/components/course-search-empty-state"
import { CourseSearchLoadingSkeleton } from "@/components/course-search-loading-skeleton"

export function CourseSearchMobile() {
  const [query, setQuery] = useState("")
  const [courses, setCourses] = useState<string[]>([])
  const [majors, setMajors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const allCourseCodes = useQuery(api.courses.getAllCourseCodes, {})
  const allSubjectAreas = useQuery(api.courses.getAllSubjectAreas, {})
  const navigate = useRouter()

  useEffect(() => {
    if (isOpen) {
      // Focus the input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      // Reset state when dialog closes
      setQuery("")
      setCourses([])
      setMajors([])
      setLoading(false)
    }
  }, [isOpen])

  const handleClear = () => {
    setQuery("")
    setCourses([])
    setMajors([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      return
    }

    if (e.key === "Enter") {
      if (courses.length === 1 && majors.length === 0) {
        navigate.push(`/courses/${courses[0]}`)
        setIsOpen(false)
        setCourses([])
        setMajors([])
        inputRef.current?.blur()
      } else if (
        majors.length === 1 &&
        majors[0] === query.trim().toUpperCase()
      ) {
        navigate.push(`/majors/${majors[0]}`)
        setIsOpen(false)
        setCourses([])
        setMajors([])
        inputRef.current?.blur()
      }
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setQuery(value)

    if (value.trim() === "") {
      setCourses([])
      setMajors([])
      return
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

  const handleCourseSelect = (courseCode: string) => {
    setQuery(courseCode)
    setCourses([])
    setMajors([])
    setIsOpen(false)
  }

  const handleMajorSelect = (majorCode: string) => {
    navigate.push(`/majors/${majorCode}`)
    setQuery(majorCode)
    setCourses([])
    setMajors([])
    setIsOpen(false)
  }

  return (
    <div className="block md:hidden">
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-muted/50"
            aria-label="Search courses"
          >
            <Search className="h-4 w-4" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-0 gap-0 border-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 h-[80vh]">
          <DrawerHeader className="px-page">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <DrawerTitle className="text-base font-normal">
                    Search Courses
                  </DrawerTitle>
                </div>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-page pb-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                ref={inputRef}
                placeholder="Type course or major code (e.g., CSE 142)..."
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 placeholder:text-sm placeholder:leading-[1] text-base"
              />
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 p-0 hover:bg-muted/50"
                  onClick={handleClear}
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-border/50" />

          <ScrollArea className="max-h-[80vh]">
            <div className="px-page space-y-3">
              {loading ? (
                <CourseSearchLoadingSkeleton />
              ) : courses.length === 0 &&
                majors.length === 0 &&
                query.trim() !== "" ? (
                <CourseSearchEmptyState
                  title="No courses or majors found"
                  description="Try searching with a different course code or major abbreviation"
                  icon="graduation-cap"
                />
              ) : courses.length > 0 || majors.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {courses.length + majors.length} result
                        {courses.length + majors.length !== 1 ? "s" : ""} for "
                        {query}"
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {majors.length > 0 && (
                      <div className="space-y-1">
                        <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Majors
                        </div>
                        {majors.map((major, index) => (
                          <button
                            key={`major-${major}`}
                            onClick={() => handleMajorSelect(major)}
                            className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 hover:text-accent-foreground trans cursor-pointer border border-transparent hover:border-border"
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{major}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {courses.length > 0 && (
                      <div className="space-y-1">
                        {majors.length > 0 && (
                          <div className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Courses
                          </div>
                        )}
                        {courses.map((course, index) => (
                          <CourseSearchCard
                            key={`course-${course}`}
                            course={
                              {
                                code: course,
                                title: "",
                              } as unknown as CourseSearchResultItem
                            }
                            index={index}
                            onSelect={handleCourseSelect}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <CourseSearchEmptyState
                  title="Start your search"
                  description="Type a course code like CSE 142, MATH 124, or a major like CSE, MATH"
                  icon="book-open"
                />
              )}
            </div>
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
