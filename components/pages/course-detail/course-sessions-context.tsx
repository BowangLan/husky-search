import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { api } from "@/convex/_generated/api"
import { CourseDetail } from "@/convex/courses"
import { useQuery } from "convex/react"

import { MyPlanCourseDetail } from "@/types/myplan"
import { expandDays } from "@/lib/utils"

export type CourseSessionsContextValue = {
  data: CourseDetail | null
  sessions: any[]
  displayedSessions: any[]
  pinnedSessions: any[]
  isLoading: boolean

  selectedWeekDaySet: Set<string>
  setSelectedWeekDaySet: (set: Set<string>) => void
  toggleSelectedWeekDay: (day: string) => void

  viewType: "list" | "calendar"
  setViewType: (type: "list" | "calendar") => void

  selectedSessionIds: string[]
  setSelectedSessionIds: (ids: string[]) => void
  pinnedSessionIds: string[]
  setPinnedSessionIds: (ids: string[]) => void
  showOpenOnly: boolean
  setShowOpenOnly: (v: boolean) => void

  getSessionEnrollState: (session: any) => string
}

const CourseSessionsContext = createContext<CourseSessionsContextValue | null>(
  null
)

export const useCourseSessions = (): CourseSessionsContextValue => {
  const ctx = useContext(CourseSessionsContext)
  if (!ctx) {
    throw new Error(
      "useCourseSessions must be used within CourseSessionsProvider"
    )
  }
  return ctx
}

export const CourseSessionsProvider = ({
  courseCode,
  children,
}: {
  courseCode: string
  children: ReactNode
}) => {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [pinnedSessionIds, setPinnedSessionIds] = useState<string[]>([])
  const [showOpenOnly, setShowOpenOnly] = useState(false)
  const [selectedWeekDaySet, setSelectedWeekDaySet] = useState<Set<string>>(
    new Set()
  )
  const [viewType, setViewType] = useState<"list" | "calendar">("list")

  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })

  const isLoading = data === undefined
  const termData = data?.myplanCourse?.currentTermData?.[0]
  const sessions = Array.isArray(termData?.sessions) ? termData!.sessions : []

  const displayedSessions = useMemo(() => {
    let list = sessions
    if (selectedSessionIds.length > 0) {
      list = list.filter((s: any) => selectedSessionIds.includes(s.id))
    } else if (showOpenOnly) {
      list = list.filter(
        (s: any) => s.stateKey === "active" && s.enrollCount < s.enrollMaximum
      )
    }

    if (selectedWeekDaySet.size > 0) {
      list = list.filter((s: any) =>
        s.meetingDetailsList.some((m: any) =>
          expandDays(m.days).some((d: string) => selectedWeekDaySet.has(d))
        )
      )
    }

    return list
  }, [sessions, selectedSessionIds, showOpenOnly, selectedWeekDaySet])

  const pinnedSessions = useMemo(
    () => sessions.filter((s: any) => pinnedSessionIds.includes(s.id)),
    [sessions, pinnedSessionIds]
  )

  const getSessionEnrollState = (session: any) => {
    const enrollCount = Number((session as any).enrollCount ?? 0)
    const enrollMaximum = Number((session as any).enrollMaximum ?? 0)

    const sessionRaw =
      data?.myplanCourse?.detailData?.courseOfferingInstitutionList[0].courseOfferingTermList[0].activityOfferingItemList.find(
        (item: any) => item.activityId === session.id
      ) as MyPlanCourseDetail["courseOfferingInstitutionList"][0]["courseOfferingTermList"][0]["activityOfferingItemList"][0]

    if (session.stateKey !== "active") {
      return session.stateKey
    }

    if (enrollCount >= enrollMaximum) {
      return "closed"
    }

    if (
      sessionRaw.enrollStatus !== "closed" &&
      sessionRaw.enrollStatus !== "open"
    ) {
      return sessionRaw.enrollStatus
    }

    return "open"
  }

  const toggleSelectedWeekDay = (day: string) => {
    const newSet = new Set(selectedWeekDaySet)
    if (selectedWeekDaySet.has(day)) {
      newSet.delete(day)
    } else {
      newSet.add(day)
    }
    setSelectedWeekDaySet(newSet)
  }

  const value = useMemo<CourseSessionsContextValue>(
    () => ({
      data: (data as CourseDetail) ?? null,
      sessions,
      displayedSessions,
      pinnedSessions,
      isLoading,
      selectedWeekDaySet,
      setSelectedWeekDaySet,
      selectedSessionIds,
      toggleSelectedWeekDay,
      setSelectedSessionIds,
      pinnedSessionIds,
      setPinnedSessionIds,
      showOpenOnly,
      setShowOpenOnly,
      getSessionEnrollState,
      viewType,
      setViewType,
    }),
    [
      data,
      sessions,
      displayedSessions,
      pinnedSessions,
      isLoading,
      selectedWeekDaySet,
      selectedSessionIds,
      pinnedSessionIds,
      showOpenOnly,
      viewType,
    ]
  )

  return (
    <CourseSessionsContext.Provider value={value}>
      {children}
    </CourseSessionsContext.Provider>
  )
}
