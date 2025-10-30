"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { useCourseSearch } from "@/hooks/use-course-search"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

interface CourseSearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AUTO_NAVIGATE_DELAY = 200

export function CourseSearchCommand({
  open,
  onOpenChange,
}: CourseSearchCommandProps) {
  const router = useRouter()
  const { query, courses, majors, loading, handleChange, clearSearch } =
    useCourseSearch({
      autoNavigate: false,
    })

  const handleSelect = React.useCallback(
    (value: string) => {
      onOpenChange(false)
      router.push(value)
    },
    [router, onOpenChange]
  )

  // Reset search when dialog closes
  React.useEffect(() => {
    if (!open) {
      clearSearch()
    }
  }, [open, clearSearch])

  // Auto-navigate when query ends with 3 digits and there's only one course result
  React.useEffect(() => {
    if (
      open &&
      !loading &&
      courses.length === 1 &&
      majors.length === 0 &&
      /\d{3}$/.test(query.trim())
    ) {
      const courseCode = courses[0]
      const timeoutId = setTimeout(() => {
        handleSelect(`/courses/${courseCode}`)
      }, AUTO_NAVIGATE_DELAY)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [open, loading, courses, majors, query, handleSelect])

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Courses"
      description="Search for courses or majors..."
    >
      <CommandInput
        placeholder="Search courses or majors..."
        value={query}
        onValueChange={handleChange}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No courses or majors found."}
        </CommandEmpty>
        {majors.length > 0 && (
          <CommandGroup heading="Majors">
            {majors.map((major) => (
              <CommandItem
                key={`major-${major.code}`}
                value={`${major.code} ${major.title}`}
                onSelect={() => handleSelect(`/majors/${major.code}`)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{major.code}</span>
                    <span className="text-xs text-muted-foreground">
                      {major.title}
                    </span>
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {courses.length > 0 && (
          <>
            {majors.length > 0 && <CommandSeparator />}
            <CommandGroup heading="Courses">
              {courses.map((course) => (
                <CommandItem
                  key={`course-${course}`}
                  value={course}
                  onSelect={() => handleSelect(`/courses/${course}`)}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{course}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  )
}
