"use client"

import { useMemo } from "react"
import { api } from "@/convex/_generated/api"
import { type GeneratedScheduleVariant } from "@/store/schedule.store"
import { useQuery } from "convex/react"

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

import { CourseCardDetailed } from "./schedule-course-card"

type GeneratedScheduleVariantDetailDialogProps = {
  variant: GeneratedScheduleVariant
  variantIndex: number
  variantColor: string
}

export function GeneratedScheduleVariantDetailDialog({
  variant,
  variantIndex,
  variantColor,
}: GeneratedScheduleVariantDetailDialogProps) {
  // Get all session IDs from the variant
  const sessionIds = useMemo(() => {
    return variant.courses.flatMap((course) => course.sessions.map((s) => s.id))
  }, [variant])

  // Fetch session data from Convex
  const sessionDataList = useQuery(
    api.courses.getSessionsByIds,
    sessionIds.length > 0 ? { sessionIds } : "skip"
  )
  const isLoadingSessionData =
    sessionDataList === undefined && sessionIds.length > 0

  // Create a map of sessionId -> sessionData for quick lookup
  const sessionDataMap = useMemo(() => {
    const map = new Map<string, any>()
    if (sessionDataList) {
      sessionDataList.forEach((data: any) => {
        map.set(data.id, data)
      })
    }
    return map
  }, [sessionDataList])

  return (
    <DialogContent className="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <div
            className="size-3 rounded-full shrink-0"
            style={{
              background: variantColor,
            }}
          />
          <DialogTitle>Schedule Variant {variantIndex + 1} Details</DialogTitle>
        </div>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(80vh-120px)] pr-4">
        <div className="space-y-3">
          {variant.courses.map((course) => {
            // Convert variant course to ScheduledCourse format for CourseCardDetailed
            const scheduledCourse = {
              id: `variant-${variant.id}-${course.courseCode}`,
              courseCode: course.courseCode,
              courseTitle: course.courseTitle,
              courseCredit: course.courseCredit,
              sessions: course.sessions,
            }

            return (
              <CourseCardDetailed
                key={course.courseCode}
                course={scheduledCourse}
                sessionDataMap={sessionDataMap}
                isLoadingSessionData={isLoadingSessionData}
              />
            )
          })}
        </div>
      </ScrollArea>
    </DialogContent>
  )
}
