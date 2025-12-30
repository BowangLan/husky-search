"use client"

import { BookOpen, Calendar, Link2, Plus, X } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { isScheduleFeatureEnabled } from "@/config/features"
import { parseDescription } from "@/lib/course-utils"
import { Button } from "@/components/ui/button"
import { ClickableSessionPill } from "@/components/course-popover-wrapper"

import { RichButton } from "./ui/rich-button"

interface CoursePopoverContentProps {
  course: ConvexCourseOverview
  isCourseScheduled: boolean
  toggleCourseInSchedule: () => void
  hasPrereqs: boolean
  sessions: any[]
  primaryEnroll: any
  cancelClose: () => void
  closePopover: () => void
}

export function CoursePopoverContent({
  course,
  isCourseScheduled,
  toggleCourseInSchedule,
  hasPrereqs,
  sessions,
  primaryEnroll,
  cancelClose,
  closePopover,
}: CoursePopoverContentProps) {
  return (
    <div className="space-y-5">
      {/* Course Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {course.courseCode}
            </h3>
            <p className="text-sm font-normal text-foreground/80">
              {course.title}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {course.credit} credits
            </span>
          </div>
        </div>
      </div>

      {/* Course Action Button */}
      {isScheduleFeatureEnabled() && (
        <div className="flex justify-center">
          <RichButton
            onClick={toggleCourseInSchedule}
            variant={isCourseScheduled ? "secondary" : "default"}
            size="sm"
            className="w-full"
            tooltip={
              isCourseScheduled
                ? "Remove course from schedule"
                : "Add course to schedule without selecting sessions"
            }
          >
            {isCourseScheduled ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Remove Course
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Course
              </>
            )}
          </RichButton>
        </div>
      )}

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Description
        </p>
        <div
          className="mt-3 text-sm/relaxed font-normal text-zinc-700 dark:text-zinc-300 p-4 rounded-md border border-zinc-200 dark:border-zinc-800/50 bg-zinc-100 dark:bg-zinc-900/80"
          dangerouslySetInnerHTML={{
            __html:
              parseDescription(course.description) ||
              "No description available.",
          }}
        />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-primary" />
          Prerequisites
        </p>
        {hasPrereqs ? (
          <ul className="mt-3 ml-2 space-y-1 text-sm font-normal text-zinc-700 dark:text-zinc-300">
            {course.prereqs?.map((prereq) => (
              <li key={prereq} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                <span>{prereq}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm font-normal text-zinc-500">
            No prerequisites listed.
          </p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-primary" />
          Sessions
        </p>
        {sessions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {sessions
              .slice()
              .sort((a, b) => a.code.localeCompare(b.code))
              .map((session) => (
                <ClickableSessionPill
                  key={session.id}
                  session={session}
                  course={course}
                  termId={primaryEnroll?.termId}
                />
              ))}
          </div>
        ) : (
          <p className="mt-2 text-sm font-normal text-zinc-500">
            No sessions available.
          </p>
        )}
      </div>
    </div>
  )
}
