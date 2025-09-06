import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { SessionChips } from "./course-session-chips"
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
  const {
    showOpenOnly,
    setShowOpenOnly,
    selectedSessionIds,
    setSelectedSessionIds,
  } = useCourseSessions()

  return (
    <Tabs defaultValue="list">
      <Card
        className="overflow-hidden py-0 md:py-0 min-h-screen"
        hoverInteraction={false}
      >
        <CardContent className="px-0 md:px-0">
          <CourseSessionsToolbar />
          <TabsContent value="list">
            <div>
              <PinnedSessionsList />
            </div>
            <div>
              <DisplayedSessionsList />
            </div>
          </TabsContent>
          <TabsContent value="calendar">
            <CourseSessionsCalendarView />
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
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
