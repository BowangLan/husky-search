"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreVertical, Trash2, Edit3, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PlannedCourse, useRemoveCourse, useUpdateCourse } from "@/store/course-plan.store"

type PlannedCourseCardProps = {
  course: PlannedCourse
  termId: string
}

export function PlannedCourseCard({ course, termId }: PlannedCourseCardProps) {
  const removeCourse = useRemoveCourse()
  const updateCourse = useUpdateCourse()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editNotes, setEditNotes] = useState(course.notes ?? "")
  const [editCredits, setEditCredits] = useState(
    course.customCredits?.toString() ?? course.credits.toString()
  )

  const displayCredits = course.customCredits ?? course.credits

  const handleSaveEdit = () => {
    updateCourse(termId, course.id, {
      notes: editNotes || undefined,
      customCredits: editCredits ? parseFloat(editCredits) : undefined,
    })
    setIsEditOpen(false)
  }

  const handleRemove = () => {
    removeCourse(termId, course.id)
  }

  return (
    <>
      <div className="border rounded-md bg-card p-3 hover:border-purple-500/50 transition-colors group">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Link
                href={`/courses/${encodeURIComponent(course.courseCode)}`}
                className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {course.courseCode}
              </Link>
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {displayCredits} CR
              </Badge>
            </div>
            {course.courseTitle && (
              <div className="text-xs text-muted-foreground line-clamp-1">
                {course.courseTitle}
              </div>
            )}
            {course.notes && (
              <div className="text-xs text-muted-foreground mt-1 flex items-start gap-1">
                <FileText className="size-3 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{course.notes}</span>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                <Edit3 className="size-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                <Trash2 className="size-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {course.courseCode}</DialogTitle>
            <DialogDescription>
              Customize credits and add notes for this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={editCredits}
                onChange={(e) => setEditCredits(e.target.value)}
                placeholder={course.credits.toString()}
              />
              <p className="text-xs text-muted-foreground">
                Default: {course.credits} credits
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add notes about this course..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
