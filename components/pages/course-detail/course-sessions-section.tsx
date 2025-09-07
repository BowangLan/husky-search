import { Card, CardContent } from "@/components/ui/card"

import { CourseSessionsCalendarView } from "./course-sessions-calendar-view"
import {
  CourseSessionsProvider,
  useCourseSessions,
} from "./course-sessions-context"
import {
  DisplayedSessionsList,
  PinnedSessionsList,
} from "./course-sessions-list-view"
import { CourseSessionsToolbar } from "./course-sessions-toolbar"

export const CourseSessionsSectionInner = () => {
  const { viewType } = useCourseSessions()
  return (
    <>
      <Card className="overflow-hidden py-0 md:py-0" hoverInteraction={false}>
        <CardContent className="px-0 md:px-0">
          <CourseSessionsToolbar />
        </CardContent>
      </Card>
      <Card
        className="overflow-hidden py-0 md:py-0 min-h-screen"
        hoverInteraction={false}
      >
        <CardContent className="px-0 md:px-0">
          <div style={{ display: viewType === "list" ? "block" : "none" }}>
            <div>
              <PinnedSessionsList />
            </div>
            <div>
              <DisplayedSessionsList />
            </div>
          </div>
          <div style={{ display: viewType === "calendar" ? "block" : "none" }}>
            <CourseSessionsCalendarView />
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export const CourseSessionsSection = ({
  courseCode,
}: {
  courseCode: string
}) => {
  return (
    <CourseSessionsProvider courseCode={courseCode}>
      <CourseSessionsSectionInner />
    </CourseSessionsProvider>
  )
}
