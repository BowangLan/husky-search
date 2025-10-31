"use client"

import * as React from "react"
import { type ScheduleSession } from "@/store/schedule.store"

type SchedulePreviewContextValue = {
  previewSession: {
    session: ScheduleSession
    courseCode: string
    isScheduled?: boolean
  } | null
  setPreviewSession: (
    session: {
      session: ScheduleSession
      courseCode: string
      isScheduled?: boolean
    } | null
  ) => void
}

const SchedulePreviewContext =
  React.createContext<SchedulePreviewContextValue | null>(null)

export function SchedulePreviewProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [previewSession, setPreviewSession] = React.useState<{
    session: ScheduleSession
    courseCode: string
    isScheduled?: boolean
  } | null>(null)

  return (
    <SchedulePreviewContext.Provider
      value={{ previewSession, setPreviewSession }}
    >
      {children}
    </SchedulePreviewContext.Provider>
  )
}

export function useSchedulePreview() {
  const context = React.useContext(SchedulePreviewContext)
  if (!context) {
    throw new Error(
      "useSchedulePreview must be used within SchedulePreviewProvider"
    )
  }
  return context
}
