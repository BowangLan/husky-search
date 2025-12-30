import { Doc } from "@/convex/_generated/dataModel"
import { DawgpathCourseDetail } from "@/convex/dawgpath"
import { MyplanCourseTermData, MyplanCourseTermSession } from "@/convex/schema"

export type ConvexCourseOverviewEnroll = {
  termId: string
  enrollMax: number
  enrollCount?: number
  stateKey?: string
  enrollStatus?: string
  openSessionCount?: number
  totalSessionCount?: number
  sessions?: MyplanCourseTermSession[]
}

export type ConvexCourseOverview = {
  courseCode: string
  title: string
  description: string
  credit: string
  subjectArea: string
  courseNumber: string
  enroll: ConvexCourseOverviewEnroll[]
  genEdReqs?: string[]
  prereqs?: string[]
  lastUpdated?: number
  prereqMap?: Pick<DawgpathCourseDetail["prereq_graph"]["x"], "edges" | "nodes">
}

export type ConvexCourseDetail = {
  myplanCourse: Doc<"myplanCourses"> & { currentTermData?: MyplanCourseTermData[] }
  dp: DawgpathCourseDetail | null
  cecCourse: Doc<"cecCourses">[]
}
