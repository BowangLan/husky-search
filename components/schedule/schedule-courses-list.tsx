"use client"

import { useEffect, useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCoursesByActiveTerm,
} from "@/store/schedule.store"
import { useActiveTermIds, useSetActiveTermIds, useTerms, useAddTerm } from "@/store/course-plan.store"
import { toast } from "sonner"
import { ChevronDown, ChevronRight } from "lucide-react"

import { CourseCardDetailed } from "./schedule-course-card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

type ScheduleCoursesListProps = {
  sessionDataMap: Map<string, any>
  isLoadingSessionData: boolean
}

// Helper to convert MyPlan termId (e.g. "20254") to internal format (e.g. "2025-Autumn")
function parseMyPlanTermId(myplanTermId: string): { year: number; quarter: "Winter" | "Spring" | "Summer" | "Autumn" } | null {
  // Handle formats like "20254" (year + quarter code)
  if (/^\d{5}$/.test(myplanTermId)) {
    // Format: "20254" -> year=2025, quarter code=4
    const year = parseInt(myplanTermId.substring(0, 4), 10)
    const quarterCode = parseInt(myplanTermId.substring(4), 10)
    const quarterMap: Record<number, "Winter" | "Spring" | "Summer" | "Autumn"> = {
      1: "Winter",
      2: "Spring",
      3: "Summer",
      4: "Autumn",
    }
    const quarter = quarterMap[quarterCode]
    if (quarter) {
      return { year, quarter }
    }
  } else if (/^(WIN|SPR|SUM|AUT)\s+\d{4}$/.test(myplanTermId.toUpperCase())) {
    // Format: "WIN 2025"
    const [quarterStr, yearStr] = myplanTermId.toUpperCase().split(/\s+/)
    const year = parseInt(yearStr, 10)
    const quarterMap: Record<string, "Winter" | "Spring" | "Summer" | "Autumn"> = {
      WIN: "Winter",
      SPR: "Spring",
      SUM: "Summer",
      AUT: "Autumn",
    }
    const quarter = quarterMap[quarterStr]
    if (quarter) {
      return { year, quarter }
    }
  }
  return null
}

function createTermId(year: number, quarter: "Winter" | "Spring" | "Summer" | "Autumn"): string {
  return `${year}-${quarter}`
}

export function ScheduleCoursesList({
  sessionDataMap,
  isLoadingSessionData,
}: ScheduleCoursesListProps) {
  const coursesByActiveTerm = useScheduledCoursesByActiveTerm()
  const remove = useRemoveFromSchedule()
  const removeCourse = useRemoveCourse()
  const terms = useTerms()
  const activeTermIds = useActiveTermIds()
  const setActiveTermIds = useSetActiveTermIds()
  const addTerm = useAddTerm()
  
  // Fetch current terms from convex kvStore
  const currentTermsFromConvex = useQuery(api.kvStore.getCurrentTerms)
  
  // Sync active terms from convex to store
  useEffect(() => {
    if (currentTermsFromConvex && currentTermsFromConvex.length > 0) {
      // Convert MyPlan term IDs to internal term IDs
      const internalTermIds = currentTermsFromConvex
        .map((myplanTermId) => {
          const parsed = parseMyPlanTermId(myplanTermId)
          if (!parsed) return null
          return createTermId(parsed.year, parsed.quarter)
        })
        .filter((id): id is string => id !== null)
      
      // Ensure all terms exist in the store
      internalTermIds.forEach((internalTermId) => {
        const term = terms.find((t) => t.id === internalTermId)
        if (!term) {
          const parsed = parseMyPlanTermId(
            currentTermsFromConvex.find((myplanTermId) => {
              const p = parseMyPlanTermId(myplanTermId)
              return p && createTermId(p.year, p.quarter) === internalTermId
            }) || ""
          )
          if (parsed) {
            addTerm(parsed.year, parsed.quarter)
          }
        }
      })
      
      // Update active term IDs if they've changed
      const currentActiveTermIds = [...activeTermIds].sort().join(",")
      const newActiveTermIds = [...internalTermIds].sort().join(",")
      if (currentActiveTermIds !== newActiveTermIds) {
        setActiveTermIds(internalTermIds)
      }
    }
  }, [currentTermsFromConvex, terms, activeTermIds, setActiveTermIds, addTerm])

  // Create a map of termId -> term for lookup
  const termMap = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>()
    terms.forEach((term) => {
      map.set(term.id, { id: term.id, label: term.label })
    })
    // Also add terms from activeTermIds that might not be in terms yet
    activeTermIds.forEach((termId) => {
      if (!map.has(termId)) {
        // Try to parse the termId to create a label
        const [year, quarter] = termId.split("-")
        if (year && quarter) {
          map.set(termId, { id: termId, label: `${quarter} ${year}` })
        } else {
          map.set(termId, { id: termId, label: termId })
        }
      }
    })
    return map
  }, [terms, activeTermIds])

  // Track which terms are expanded (default to all expanded)
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set(activeTermIds))

  // Update expanded terms when active terms change
  useEffect(() => {
    setExpandedTerms(new Set(activeTermIds))
  }, [activeTermIds])

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev)
      if (next.has(termId)) {
        next.delete(termId)
      } else {
        next.add(termId)
      }
      return next
    })
  }

  // Get all courses across all active terms for the empty state check
  const allCoursesCount = useMemo(() => {
    let count = 0
    coursesByActiveTerm.forEach((courses) => {
      count += courses.length
    })
    return count
  }, [coursesByActiveTerm])

  if (activeTermIds.length === 0) {
    return (
      <div className="flex flex-col h-full border-r flex-shrink-0">
        <div className="px-3 py-3">
          <div className="text-xs text-muted-foreground">
            No active terms. Active terms are synced from the server.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full border-r flex-shrink-0">
      <div className="px-3 space-y-2 flex-1 overflow-y-auto py-3">
        {allCoursesCount === 0 ? (
          <div className="text-xs text-muted-foreground">
            No courses yet. Add sessions from course pages or the calendar view.
          </div>
        ) : (
          activeTermIds.map((termId) => {
            const courses = coursesByActiveTerm.get(termId) || []
            const term = termMap.get(termId)
            const isExpanded = expandedTerms.has(termId)

            if (courses.length === 0 && term) {
              return (
                <Collapsible
                  key={termId}
                  open={isExpanded}
                  onOpenChange={() => toggleTerm(termId)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between p-2 h-auto font-normal"
                    >
                      <span className="text-xs font-medium">{term.label}</span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      No courses in this term
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Collapsible
                key={termId}
                open={isExpanded}
                onOpenChange={() => toggleTerm(termId)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto font-normal"
                  >
                    <span className="text-xs font-medium">
                      {term?.label || termId} ({courses.length})
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-2.5 px-2 py-2">
                    {courses.map((c) => (
                      <CourseCardDetailed
                        key={c.id}
                        course={c}
                        sessionDataMap={sessionDataMap}
                        isLoadingSessionData={isLoadingSessionData}
                        onRemoveSession={(sessionId: string) =>
                          remove(c.courseCode, sessionId, termId)
                        }
                        onRemoveCourse={() => {
                          removeCourse(c.id)
                          toast.success(`Removed ${c.courseCode} from schedule`)
                        }}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })
        )}
      </div>
    </div>
  )
}
