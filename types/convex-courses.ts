export type ConvexCourseOverviewEnroll = {
  termId: string
  enrollMax: number
  enrollCount?: number
  stateKey?: string
  enrollStatus?: string
  openSessionCount?: number
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
}


