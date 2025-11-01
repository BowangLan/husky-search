"use client"

import * as React from "react"
import Link from "next/link"
import { MyplanCourseTermSession } from "@/convex/schema"
import { MoreVertical, Trash2, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScheduledSessionCard } from "@/components/schedule/scheduled-session-card"

import { RichButton } from "../ui/rich-button"

type ScheduledCourse = {
  id: string
  courseCode: string
  courseTitle?: string
  courseCredit?: string | number
  sessions: Array<{
    id: string
    [key: string]: any
  }>
}

type BaseProps = {
  course: ScheduledCourse
  sessionDataMap: Map<string, MyplanCourseTermSession | null>
  isLoadingSessionData: boolean
  onRemoveCourse?: () => void
  onRemoveSession?: (sessionId: string) => void
}

export function CourseCardDetailed({
  course,
  sessionDataMap,
  isLoadingSessionData,
  onRemoveCourse,
  onRemoveSession,
}: BaseProps) {
  return (
    <div className="border-l-2 border-l-purple-600 border border-border bg-card shadow-sm">
      <div className="px-3 py-2 flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Link
              href={`/courses/${encodeURIComponent(course.courseCode)}`}
              className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline"
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
            <div className="text-xs text-muted-foreground">
              {course.courseTitle}
            </div>
          ) : null}
        </div>
        {onRemoveCourse && (
          <>
            <RichButton
              tooltip="Remove course"
              variant="ghost"
              size="icon-sm"
              className="size-6 shrink-0"
              onClick={onRemoveCourse}
            >
              <X />
            </RichButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="size-6 shrink-0"
                >
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onRemoveCourse}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="text-destructive" />
                  Remove course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {course.sessions.length > 0 ? (
        <div className="border-t divide-y">
          {course.sessions.map((s) => (
            <ScheduledSessionCard
              key={s.id}
              session={s as any}
              sessionData={sessionDataMap.get(s.id)}
              isLoading={isLoadingSessionData}
              onRemove={
                onRemoveSession ? () => onRemoveSession(s.id) : undefined
              }
              showDetails={true}
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

export function CourseCardCompact({
  course,
  sessionDataMap,
  isLoadingSessionData,
  onRemoveCourse,
  onRemoveSession,
}: BaseProps) {
  return (
    <div className="border-l-2 border-l-purple-600 border border-border bg-card shadow-sm">
      <div className="px-3 py-2 flex items-center gap-1">
        <Link
          href={`/courses/${encodeURIComponent(course.courseCode)}`}
          className="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {course.courseCode}
        </Link>
        <div className="flex-1" />
        {onRemoveCourse && (
          <>
            <RichButton
              tooltip="Remove course"
              variant="ghost"
              size="icon-xs"
              className="size-6 shrink-0"
              onClick={onRemoveCourse}
            >
              <X />
            </RichButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="size-6 shrink-0"
                >
                  <MoreVertical className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={onRemoveCourse}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="text-destructive" />
                  Remove course
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {course.sessions.length > 0 ? (
        <div className="space-y-1 ml-3 py-1 border-l">
          {course.sessions.map((s) => (
            <ScheduledSessionCard
              key={s.id}
              session={s as any}
              sessionData={sessionDataMap.get(s.id)}
              isLoading={isLoadingSessionData}
              onRemove={() => onRemoveSession?.(s.id)}
              showDetails={false}
              compact
            />
          ))}
        </div>
      ) : (
        <div className="px-3 py-1.5 text-[11px] text-muted-foreground">
          No sessions selected
        </div>
      )}
      <div className="h-3"></div>
    </div>
  )
}
