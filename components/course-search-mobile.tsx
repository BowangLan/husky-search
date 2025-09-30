"use client"

import { useEffect, useRef, useState } from "react"
import { CourseSearchResultItem } from "@/services/course-service"
import { Command, Search, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useCourseSearch } from "@/hooks/use-course-search"
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
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    query,
    courses,
    majors,
    loading,
    clearSearch,
    handleChange,
    handleKeyDown,
    handleCourseSelect,
    handleMajorSelect,
  } = useCourseSearch()

  useEffect(() => {
    if (isOpen) {
      // Focus the input when dialog opens
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      // Reset state when dialog closes
      clearSearch()
    }
  }, [isOpen, clearSearch])

  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      return
    }

    handleKeyDown(e)

    // Close drawer after navigation
    if (e.key === "Enter") {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e.target.value)
  }

  const handleMobileCourseSelect = (courseCode: string) => {
    handleCourseSelect(courseCode)
    setIsOpen(false)
  }

  const handleMobileMajorSelect = (major: any) => {
    handleMajorSelect(major)
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
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
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
                            key={`major-${major.code}`}
                            onClick={() => handleMobileMajorSelect(major)}
                            className="w-full flex items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/10 hover:text-accent-foreground trans cursor-pointer border border-transparent hover:border-border"
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{major.code}</span>
                                <span className="text-xs text-muted-foreground">{major.title}</span>
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
                            onSelect={handleMobileCourseSelect}
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
