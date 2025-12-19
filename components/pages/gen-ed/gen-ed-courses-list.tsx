"use client"

import { ConvexCourseOverview } from "@/types/convex-courses"

import { ConvexCourseCardGrid } from "../../course-card-convex.grid"
import { ConvexCourseListView } from "../../course-card-convex.list"

interface GenEdCoursesListProps {
  courses: ConvexCourseOverview[]
  sortedCount: number
  viewMode: "list" | "grid"
}

export function GenEdCoursesList({
  courses,
  sortedCount,
  viewMode,
}: GenEdCoursesListProps) {
  // No filtered results
  if (sortedCount === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          No courses match your filters. Try adjusting your search criteria.
        </div>
      </div>
    )
  }

  // No displayed courses (shouldn't happen)
  if (courses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg">
          No courses to display. This should not happen.
        </div>
      </div>
    )
  }

  return (
    <>
      {viewMode === "list" ? (
        <ConvexCourseListView courses={courses} />
      ) : (
        <ConvexCourseCardGrid courses={courses} />
      )}

      {/* Show message if there are more courses */}
      {sortedCount > courses.length && (
        <div className="text-center py-8 mt-6">
          <div className="text-muted-foreground">
            Showing first {courses.length} of {sortedCount} courses
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Infinite scrolling pagination coming soon
          </div>
        </div>
      )}
    </>
  )
}
