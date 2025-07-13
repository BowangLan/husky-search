export type MyPlanCourse = {
  id: string
  courseId: string
  code: string
  subject: string
  level: string
  title: string
  credit: string | string[]
  campus: string
  termId: string
  institution: string
  allCredits: string[]
  genEduReqs: string[]
  sectionGroups: string[]
  startTime: number
  endTime: number
  score: number
  latestVersion: boolean
  expiringTermId: any
  beginningTermId: any
  prereqs: string
  onlineLearningCodes: string[]
  meetingDays: string[]
  versions: any[]
  gradingSystems: string[]
  open: boolean
  tba: boolean
  pce: boolean
  enrRestricted: boolean
}

export type MyPlanCourseDetail = {
  id: string
}
