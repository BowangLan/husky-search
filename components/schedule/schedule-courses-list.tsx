"use client"

import {
  useRemoveCourse,
  useRemoveFromSchedule,
  useScheduledCourses,
} from "@/store/schedule.store"
import { toast } from "sonner"

import { CourseCardDetailed } from "./schedule-course-card"

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
            <CourseCardDetailed
              key={c.id}
              course={c}
              sessionDataMap={sessionDataMap}
              isLoadingSessionData={isLoadingSessionData}
              onRemoveSession={(sessionId: string) =>
                remove(c.courseCode, sessionId)
              }
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
