"use client"

import * as React from "react"
import Link from "next/link"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  CourseSessionsProvider,
  useCourseSessions,
} from "@/components/pages/course-detail/course-sessions-context"
import {
  SessionRowDesktop,
  SessionRowMobile,
} from "@/components/pages/course-detail/course-sessions-list-view"

type ChooseSessionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseCode: string
  courseTitle?: string
  courseCredit?: string | number
}

function ChooseSessionDialogContent({
  courseCode,
  courseTitle,
  courseCredit,
}: Omit<ChooseSessionDialogProps, "open" | "onOpenChange">) {
  const { displayedSessions, isLoading } = useCourseSessions()

  return (
    <>
      <DialogHeader className="flex-shrink-0">
        <DialogTitle>
          Choose a Session -{" "}
          <Link
            href={`/courses/${encodeURIComponent(courseCode)}`}
            className="text-blue-600 hover:underline transition-colors"
          >
            {courseCode}
          </Link>
        </DialogTitle>
        {courseTitle && (
          <DialogDescription>
            {courseTitle}
            {courseCredit !== undefined && ` • ${courseCredit} credits`}
          </DialogDescription>
        )}
      </DialogHeader>
      <div className="flex-1 overflow-y-auto min-h-0 mt-4">
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading sessions...
          </div>
        ) : displayedSessions.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No sessions available for this course.
          </div>
        ) : (
          <div>
            {displayedSessions.map((session, index) => (
              <div key={session.id}>
                <SessionRowDesktop session={session} />
                <SessionRowMobile session={session} />
                {index !== displayedSessions.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

export function ChooseSessionDialog({
  open,
  onOpenChange,
  courseCode,
  courseTitle,
  courseCredit,
}: ChooseSessionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[80vh] flex flex-col">
        <CourseSessionsProvider courseCode={courseCode}>
          <ChooseSessionDialogContent
            courseCode={courseCode}
            courseTitle={courseTitle}
            courseCredit={courseCredit}
          />
        </CourseSessionsProvider>
      </DialogContent>
    </Dialog>
  )
}
