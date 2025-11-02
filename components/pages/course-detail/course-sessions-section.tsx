import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const { viewType, availableTerms, selectedTermId, setSelectedTermId } =
    useCourseSessions()

  const content = (
    <>
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
    </>
  )

  if (availableTerms.length === 0) {
    return (
      <>
        <Card className="overflow-hidden py-0 md:py-0" hoverInteraction={false}>
          <CardContent className="px-0 md:px-0">
            <CourseSessionsToolbar />
          </CardContent>
        </Card>
        <Card
          className="py-0 md:py-0 min-h-screen overflow-visible"
          hoverInteraction={false}
        >
          <CardContent className="px-0 md:px-0">{content}</CardContent>
        </Card>
      </>
    )
  }

  return (
    <Tabs value={selectedTermId || undefined} onValueChange={setSelectedTermId}>
      <Card className="overflow-hidden py-0 md:py-0" hoverInteraction={false}>
        <CardContent className="px-0 md:px-0">
          <div className="px-4 pt-4 pb-4">
            <TabsList>
              {availableTerms.map((term) => (
                <TabsTrigger key={term.termId} value={term.termId}>
                  {term.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden py-0 md:py-0" hoverInteraction={false}>
        <CardContent className="px-0 md:px-0">
          <CourseSessionsToolbar />
        </CardContent>
      </Card>
      <Card
        className="py-0 md:py-0 min-h-screen overflow-visible"
        hoverInteraction={false}
      >
        <CardContent className="px-0 md:px-0">
          {availableTerms.map((term) => (
            <TabsContent key={term.termId} value={term.termId}>
              {content}
            </TabsContent>
          ))}
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
