"use client"

import { useState } from "react"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { Check, Plus } from "lucide-react"

import { useCourseSearch } from "@/hooks/use-course-search"
import { usePrereqGraphAddCourse } from "@/hooks/use-prereq-graph-course-operations"
import { usePrereqGraphUrlParams } from "@/hooks/use-prereq-graph-url-params"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function AddCourseOrMajorPopover() {
  const [open, setOpen] = useState(false)
  const { addCourse, loadingCourseCodes } = usePrereqGraphAddCourse()
  const { addMajor, isMajorAdded } = usePrereqGraphUrlParams()
  const primarySubjectArea = useInteractivePrereqGraphState(
    (state) => state.primarySubjectArea
  )
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )

  const {
    query,
    courses,
    majors,
    loading,
    showResults,
    handleChange,
    setShowResults,
  } = useCourseSearch({ maxCourses: 50, maxMajors: 10, autoNavigate: false })

  const handleCourseSelect = (courseCode: string) => {
    const normalized = courseCode.replace(/\s+/g, " ").toUpperCase()
    if (!primaryCourseCodes.has(normalized)) {
      addCourse(normalized)
    }
    setShowResults(false)
    setOpen(false)
  }

  const handleMajorSelect = (majorCode: string) => {
    if (!isMajorAdded(majorCode)) {
      addMajor(majorCode)
    }
    setShowResults(false)
    setOpen(false)
  }

  const handleInputChange = (value: string) => {
    handleChange(value)
    setShowResults(true)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" className="h-9 w-9">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false} className="rounded-lg border-0">
          <CommandInput
            placeholder="Add course or major to graph..."
            value={query}
            onValueChange={handleInputChange}
            onFocus={() => {
              setShowResults(true)
            }}
            onBlur={() => {
              // Close dropdown after a short delay to allow clicks to register
              setTimeout(() => {
                setShowResults(false)
              }, 200)
            }}
            className="border-0 focus:ring-0"
          />
          {showResults && query.trim() && (
            <CommandList className="max-h-[400px]">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              ) : courses.length === 0 && majors.length === 0 ? (
                <CommandEmpty>No courses or majors found.</CommandEmpty>
              ) : (
                <>
                  {majors.length > 0 && (
                    <CommandGroup heading="Majors">
                      {majors.map((major) => {
                        const added = primarySubjectArea === major.code
                        return (
                          <CommandItem
                            key={`major-${major.code}`}
                            value={major.code}
                            onSelect={() => {
                              if (!added) {
                                handleMajorSelect(major.code)
                              }
                            }}
                            className={`cursor-pointer ${
                              added
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-accent"
                            }`}
                            disabled={added}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex flex-col gap-1 py-1 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {major.code}
                                  </span>
                                  {added && (
                                    <Check className="h-3 w-3 text-green-500" />
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {major.title}
                                </span>
                              </div>
                              {added && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  Added
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                  {courses.length > 0 && (
                    <CommandGroup heading="Courses">
                      {courses.map((course) => {
                        const normalized = course
                          .replace(/\s+/g, " ")
                          .toUpperCase()
                        const added = primaryCourseCodes.has(normalized)
                        const isLoading = loadingCourseCodes.has(normalized)
                        return (
                          <CommandItem
                            key={`course-${course}`}
                            value={course}
                            onSelect={() => {
                              if (!added && !isLoading) {
                                handleCourseSelect(course)
                              }
                            }}
                            className={`cursor-pointer ${
                              added || isLoading
                                ? "opacity-60 cursor-not-allowed"
                                : "hover:bg-accent"
                            }`}
                            disabled={added || isLoading}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-semibold text-sm">
                                {course}
                              </span>
                              {added && (
                                <div className="flex items-center gap-2 ml-2">
                                  <Check className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-muted-foreground">
                                    Added
                                  </span>
                                </div>
                              )}
                              {isLoading && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  Adding...
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        )
                      })}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
