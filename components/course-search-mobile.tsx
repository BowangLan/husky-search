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
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const allCourseCodes = useQuery(api.courses.getAllCourseCodes, {})
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
      setLoading(false)
    }
  }, [isOpen])

  const handleClear = () => {
    setQuery("")
    setCourses([])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      return
    }

    if (e.key === "Enter" && courses.length === 1) {
      navigate.push(`/courses/${courses[0]}`)
      setIsOpen(false)
      setCourses([])
      inputRef.current?.blur()
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setQuery(value)

    if (value.trim() === "") {
      setCourses([])
      return
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

  const handleCourseSelect = (courseCode: string) => {
    setQuery(courseCode)
    setCourses([])
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
                placeholder="Type course code (e.g., CSE 142)..."
                value={query}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10 text-sm placeholder:text-sm placeholder:leading-[1] text-base"
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
              ) : courses.length === 0 && query.trim() !== "" ? (
                <CourseSearchEmptyState
                  title="No courses found"
                  description="Try searching with a different course code or check your spelling"
                  icon="graduation-cap"
                />
              ) : courses.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {courses.length} result{courses.length !== 1 ? "s" : ""}{" "}
                        for "{query}"
                      </span>
                    </div>
                    {/* <span className="text-xs text-muted-foreground">
                      ESC to close
                    </span> */}
                  </div>
                  <div className="space-y-1">
                    {courses.map((course, index) => (
                      <CourseSearchCard
                        key={course}
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
                </div>
              ) : (
                <CourseSearchEmptyState
                  title="Start your search"
                  description="Type a course code like CSE 142, MATH 124, or CHEM 142 to find courses"
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
