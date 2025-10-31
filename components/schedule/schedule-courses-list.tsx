"use client"

import Link from "next/link"
import { MoreVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
  type ScheduleCourse,
} from "@/store/schedule.store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScheduledSessionCard } from "./scheduled-session-card"

type ScheduleCoursesListProps = {
  sessionDataMap: Map<string, any>
  isLoadingSessionData: boolean
}

export function ScheduleCoursesList({
  sessionDataMap,
  isLoadingSessionData,
}: ScheduleCoursesListProps) {
  const courses = useScheduledCourses()
  const remove = useRemoveFromSchedule()
  const removeCourse = useRemoveCourse()

  return (
    <div className="flex flex-col h-full border-r flex-shrink-0">
      <div className="flex items-center justify-between flex-none px-3 py-1.5 border-b">
        <h3 className="font-semibold text-xs">Courses</h3>
      </div>

      <div className="px-3 space-y-2.5 flex-1 overflow-y-auto py-3">
        {courses.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            No courses yet. Add sessions from course pages or the calendar view.
          </div>
        ) : (
          courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              sessionDataMap={sessionDataMap}
              isLoadingSessionData={isLoadingSessionData}
              onRemoveSession={(courseCode, sessionId) => remove(courseCode, sessionId)}
              onRemoveCourse={() => {
                removeCourse(c.id)
                toast.success(`Removed ${c.courseCode} from schedule`)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function CourseCard({
  course,
  sessionDataMap,
  isLoadingSessionData,
  onRemoveSession,
  onRemoveCourse,
}: {
  course: ScheduleCourse
  sessionDataMap: Map<string, any>
  isLoadingSessionData: boolean
  onRemoveSession: (courseCode: string, sessionId: string) => void
  onRemoveCourse: () => void
}) {
  return (
    <div className="border-l-2 border-l-purple-600 border border-border bg-card shadow-sm">
      {/* Course header */}
      <div className="px-3 py-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Link
              href={`/courses/${encodeURIComponent(course.courseCode)}`}
              className="font-semibold text-base text-blue-600 dark:text-blue-400 hover:underline"
            >
              {course.courseCode}
            </Link>
            {course.courseCredit !== undefined ? (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                {String(course.courseCredit)} CR
              </Badge>
            ) : null}
          </div>
          {course.courseTitle ? (
            <div className="text-xs text-foreground">{course.courseTitle}</div>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-6 shrink-0">
              <MoreVertical className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onRemoveCourse}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 />
              Remove course
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sessions under course */}
      {course.sessions.length > 0 ? (
        <div className="border-t divide-y">
          {course.sessions.map((s) => (
            <ScheduledSessionCard
              key={s.id}
              session={s}
              sessionData={sessionDataMap.get(s.id)}
              isLoading={isLoadingSessionData}
              onRemove={() => onRemoveSession(course.courseCode, s.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border-t px-3 py-2 text-xs text-muted-foreground">
          No sessions selected
        </div>
      )}
    </div>
  )
}

