"use client"

/**
 * @legacy This component is deprecated and kept for reference only.
 * It was previously used to add courses or majors to the graph.
 * This functionality has been replaced by the current implementation.
 */

import { Check } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import type { SubjectArea } from "@/hooks/use-static-course-data"

interface LegacyAddCourseOrMajorProps {
  addCourseQuery: string
  addCourseOpen: boolean
  showResults: boolean
  loading: boolean
  courses: string[]
  majors: SubjectArea[]
  primarySubjectArea: string | null
  primaryCourseCodes: Set<string>
  loadingCourseCodes: Set<string>
  onValueChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onShowResultsChange: (show: boolean) => void
  onCourseSelect: (courseCode: string) => void
  onMajorSelect: (majorCode: string) => void
}

/**
 * @legacy Legacy component for adding courses or majors to the graph.
 * This component is no longer used but kept for reference.
 */
export function LegacyAddCourseOrMajor({
  addCourseQuery,
  addCourseOpen,
  showResults,
  loading,
  courses,
  majors,
  primarySubjectArea,
  primaryCourseCodes,
  loadingCourseCodes,
  onValueChange,
  onOpenChange,
  onShowResultsChange,
  onCourseSelect,
  onMajorSelect,
}: LegacyAddCourseOrMajorProps) {
  const handleAddCourseInputChange = (value: string) => {
    onValueChange(value)
    onOpenChange(true)
  }

  return (
    <div>
      <Command
        shouldFilter={false}
        className="rounded-lg border shadow-md bg-background/95 backdrop-blur-sm"
      >
        <CommandInput
          placeholder="Add course or major to graph..."
          value={addCourseQuery}
          onValueChange={handleAddCourseInputChange}
          onFocus={() => {
            onOpenChange(true)
            onShowResultsChange(true)
          }}
          onBlur={() => {
            // Close dropdown after a short delay to allow clicks to register
            setTimeout(() => {
              onOpenChange(false)
              onShowResultsChange(false)
            }, 200)
          }}
          className="border-0 focus:ring-0"
        />
        {addCourseOpen && showResults && addCourseQuery.trim() && (
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
                              onMajorSelect(major.code)
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
                      const added = primaryCourseCodes.has(course)
                      const isLoading = loadingCourseCodes.has(
                        course.replace(/\s+/g, "").toUpperCase()
                      )
                      return (
                        <CommandItem
                          key={`course-${course}`}
                          value={course}
                          onSelect={() => {
                            if (!added && !isLoading) {
                              onCourseSelect(course)
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
    </div>
  )
}

