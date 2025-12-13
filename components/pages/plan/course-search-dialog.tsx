"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAddCourse, useTerms, useCoursePlan } from "@/store/course-plan.store"
import { Check, Loader2, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import { useStaticCourseCodes } from "@/hooks/use-static-course-data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CourseSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTermId: string | null
}

export function CourseSearchDialog({
  open,
  onOpenChange,
  selectedTermId,
}: CourseSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [targetTermId, setTargetTermId] = useState<string>(selectedTermId ?? "")
  const [addedCourses, setAddedCourses] = useState<Set<string>>(new Set())

  const addCourse = useAddCourse()
  const terms = useTerms()
  const { data: allCourseCodes, isLoading } = useStaticCourseCodes()
  const activeTermIds = useCoursePlan((state) => state.activeTermIds)

  // Update target term when selectedTermId changes
  useEffect(() => {
    if (selectedTermId) {
      setTargetTermId(selectedTermId)
    }
  }, [selectedTermId])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery("")
      setAddedCourses(new Set())
    }
  }, [open])

  // Filter courses locally
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim() || !allCourseCodes) return []

    const normalized = searchQuery.replace(/\s+/g, "").toUpperCase()

    return allCourseCodes
      .filter((code) =>
        code.replace(/\s+/g, "").toUpperCase().includes(normalized)
      )
      .slice(0, 50) // Limit to 50 results
  }, [searchQuery, allCourseCodes])

  const handleAddCourse = useCallback(
    (courseCode: string) => {
      if (!targetTermId) {
        toast.error("Please select a term first")
        return
      }

      const term = terms.find((t) => t.id === targetTermId)
      if (!term) {
        toast.error("Invalid term selected")
        return
      }

      const isTargetTermActive = activeTermIds.includes(targetTermId)

      // For now, we don't have course details from the static data
      // We'll add just the course code, and the user can see full details by clicking
      addCourse(targetTermId, {
        courseCode,
        credits: 5, // Default credits, user can edit later
        sessions: [], // Empty for non-active terms
      })

      // Add to recently added set
      setAddedCourses((prev) => new Set(prev).add(courseCode))

      // Show different toast message based on term status
      toast.success(
        isTargetTermActive ? "Course added to active term" : "Course added to plan",
        {
          description: isTargetTermActive
            ? `${courseCode} added to ${term.label}. Add sessions from the course detail page.`
            : `${courseCode} added to ${term.label} for planning.`,
        }
      )
    },
    [targetTermId, terms, addCourse, activeTermIds]
  )

  const isCourseAdded = (courseCode: string) => addedCourses.has(courseCode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Courses</DialogTitle>
          <DialogDescription>
            Search for courses to add to your plan. Click on a course code to
            view details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Term Selector */}
          {terms.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Add to term:</label>
              <Select value={targetTermId} onValueChange={setTargetTermId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by course code (e.g., CSE 142, MATH)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="pl-10"
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 h-[400px] -mx-6 px-6">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Loading courses...
              </div>
            ) : !searchQuery.trim() ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Start typing to search for courses
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No courses found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCourses.map((courseCode) => {
                  const isAdded = isCourseAdded(courseCode)
                  return (
                    <div
                      key={courseCode}
                      className="border rounded-lg p-3 hover:border-purple-500/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/courses/${encodeURIComponent(courseCode)}`}
                          target="_blank"
                          className="flex-1 min-w-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            {courseCode}
                          </span>
                        </Link>
                        <Button
                          size="sm"
                          variant={isAdded ? "outline" : "default"}
                          onClick={() => handleAddCourse(courseCode)}
                          disabled={!targetTermId || isAdded}
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
            )}
          </ScrollArea>

          {terms.length === 0 && (
            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/50 rounded-lg">
              Add a term first before searching for courses
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
