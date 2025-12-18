"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

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

import { Icons } from "./icons"

interface CourseSearchCommandProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AUTO_NAVIGATE_DELAY = 200
const DIALOG_CLOSE_ANIMATION_DURATION = 150

const SEARCH_SUGGESTIONS = [
  { query: "CSE 122", label: "Intro to Programming" },
  { query: "MATH 124", label: "Calculus I" },
  { query: "PSYCH 101", label: "Intro to Psychology" },
]

interface SearchEmptyStateProps {
  onSelect?: (path: string) => void
}

export const SearchEmptyState = ({ onSelect }: SearchEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {/* Icon */}
      <div className="relative mb-6">
        <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/70 to-primary/20 border border-primary/10">
          <Search className="w-5 h-5 text-primary-foreground/70" />
        </div>
      </div>

      {/* Text */}
      <p className="text-sm text-muted-foreground/80 mb-8 text-center max-w-[240px]">
        Search by course code or major
      </p>

      {/* Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {SEARCH_SUGGESTIONS.map((suggestion, i) => (
          <button
            key={suggestion.query}
            type="button"
            onClick={() => onSelect?.(`/courses/${suggestion.query}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-foreground/[0.03] border border-foreground/[0.06] text-muted-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/80"
            style={{
              animationDelay: `${i * 50}ms`,
            }}
          >
            <span className="font-medium text-foreground/60">
              {suggestion.query}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

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

  // Reset search when dialog closes (after animation completes)
  React.useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(() => {
        clearSearch()
      }, DIALOG_CLOSE_ANIMATION_DURATION)

      return () => clearTimeout(timeoutId)
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
      className="sm:max-w-2xl border-white/20 bg-white/90 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-900/80 shadow-2xl shadow-black/10"
    >
      <CommandInput
        placeholder="Search courses or majors..."
        value={query}
        onValueChange={handleChange}
        className="bg-transparent"
      />
      <div className="sm:h-[50vh] border-t dark:border-white/10 flex flex-col">
        <CommandList className="flex-1 min-h-0 overflow-y-auto max-h-none border-none">
          <CommandEmpty>
            {loading ? (
              "Searching..."
            ) : query.length === 0 ? (
              <SearchEmptyState onSelect={handleSelect} />
            ) : (
              "No courses or majors found."
            )}
          </CommandEmpty>
          {majors.length > 0 && (
            <CommandGroup
              heading="Majors"
              className="[&_[cmdk-group-heading]]:px-4 py-3"
            >
              {majors.map((major) => (
                <CommandItem
                  key={`major-${major.code}`}
                  value={`${major.code} ${major.title}`}
                  onSelect={() => handleSelect(`/majors/${major.code}`)}
                >
                  <div className="flex flex-col px-1.5">
                    <div className="flex items-center gap-2.5">
                      <Icons.subjectArea />
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
              <CommandGroup
                heading="Courses"
                className="[&_[cmdk-group-heading]]:px-4 py-3"
              >
                {courses.map((course) => (
                  <CommandItem
                    key={`course-${course}`}
                    value={course}
                    onSelect={() => handleSelect(`/courses/${course}`)}
                  >
                    <div className="flex items-center gap-2.5 px-1.5">
                      <Icons.course />
                      <span className="font-medium">{course}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </div>
    </CommandDialog>
  )
}
