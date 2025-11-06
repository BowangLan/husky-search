"use client"

/**
 * @legacy This component is deprecated and kept for reference only.
 * It was previously used to search for courses within the graph.
 * This functionality has been replaced by the current search implementation.
 */

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

interface CourseOption {
  courseCode: string
  courseTitle: string
  nodeId: string
}

interface LegacySearchInGraphProps {
  searchInGraphValue: string
  searchInGraphOpen: boolean
  filteredCoursesInGraph: CourseOption[]
  onValueChange: (value: string) => void
  onOpenChange: (open: boolean) => void
  onSelect: (courseCode: string) => void
}

/**
 * @legacy Legacy component for searching courses within the graph.
 * This component is no longer used but kept for reference.
 */
export function LegacySearchInGraph({
  searchInGraphValue,
  searchInGraphOpen,
  filteredCoursesInGraph,
  onValueChange,
  onOpenChange,
  onSelect,
}: LegacySearchInGraphProps) {
  return (
    <div>
      <Command
        shouldFilter={false}
        className="rounded-lg border shadow-md bg-background/95 backdrop-blur-sm"
      >
        <CommandInput
          placeholder="Search courses in graph..."
          value={searchInGraphValue}
          onValueChange={(value) => {
            onValueChange(value.toUpperCase())
            onOpenChange(true)
          }}
          onFocus={() => onOpenChange(true)}
          onBlur={() => {
            // Close dropdown after a short delay to allow clicks to register
            setTimeout(() => onOpenChange(false), 200)
          }}
          className="border-0 focus:ring-0"
        />
        {searchInGraphOpen && searchInGraphValue.trim() && (
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No courses found.</CommandEmpty>
            <CommandGroup>
              {filteredCoursesInGraph.map((course) => (
                <CommandItem
                  key={course.nodeId}
                  value={course.courseCode}
                  onSelect={() => onSelect(course.courseCode)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1 py-1">
                    <span className="font-semibold text-sm">
                      {course.courseCode}
                    </span>
                    {course.courseTitle && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {course.courseTitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  )
}

