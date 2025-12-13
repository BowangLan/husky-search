"use client"

import { useState } from "react"
import { MoreVertical, Plus, Trash2, X, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Term, useTermPlan, useTotalCredits, useCoursePlan, useActiveTermIds } from "@/store/course-plan.store"
import { PlannedCourseCard } from "./planned-course-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type TermCardProps = {
  term: Term
  onAddCourse: () => void
}

export function TermCard({ term, onAddCourse }: TermCardProps) {
  const termPlan = useTermPlan(term.id)
  const credits = useTotalCredits(term.id)
  const { removeTerm, clearTerm, toggleActiveTerms } = useCoursePlan()
  const activeTermIds = useActiveTermIds()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isActive = activeTermIds.includes(term.id)

  const courses = termPlan?.courses ?? []
  const courseCount = courses.length

  // Determine credit load color
  const getCreditBadgeVariant = () => {
    if (credits === 0) return "secondary"
    if (credits < 12) return "secondary" // Under full-time
    if (credits >= 12 && credits <= 18) return "default" // Normal load
    return "destructive" // Overload
  }

  const getCreditLabel = () => {
    if (credits === 0) return "No courses"
    if (credits < 12) return "Under full-time"
    if (credits >= 12 && credits <= 18) return "Full-time"
    return "Overload"
  }

  const handleDelete = () => {
    removeTerm(term.id)
    setShowDeleteDialog(false)
  }

  const handleClear = () => {
    clearTerm(term.id)
  }

  const handleToggleActive = () => {
    const newActiveTermIds = isActive
      ? activeTermIds.filter(id => id !== term.id)
      : [...activeTermIds, term.id]
    toggleActiveTerms(newActiveTermIds)
  }

  return (
    <>
      <div className="border rounded-lg bg-card shadow-sm flex flex-col h-full">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{term.label}</h3>
                {isActive && (
                  <Badge variant="default" className="bg-blue-600 text-xs h-5">
                    <Zap className="size-3 mr-1" />
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={getCreditBadgeVariant()} className="text-xs">
                  {credits} CR
                </Badge>
                {credits > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {getCreditLabel()}
                  </span>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleActive}>
                  <Zap className="size-4 mr-2" />
                  {isActive ? "Mark as Planning" : "Mark as Active"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClear} disabled={courseCount === 0}>
                  <X className="size-4 mr-2" />
                  Clear courses
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete term
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Course List */}
        <div className="flex-1 p-3 space-y-2 overflow-y-auto min-h-[200px]">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                No courses added yet
              </p>
              <Button size="sm" variant="outline" onClick={onAddCourse}>
                <Plus className="size-4 mr-2" />
                Add Course
              </Button>
            </div>
          ) : (
            <>
              {courses.map((course) => (
                <PlannedCourseCard
                  key={course.id}
                  course={course}
                  termId={term.id}
                />
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {courses.length > 0 && (
          <div className="px-4 py-2 border-t bg-muted/20">
            <Button
              size="sm"
              variant="ghost"
              onClick={onAddCourse}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <Plus className="size-4 mr-2" />
              Add Course
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {term.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this term and all {courseCount}{" "}
              {courseCount === 1 ? "course" : "courses"} in it. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
