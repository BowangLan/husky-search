import { MyPlanCourseDetail } from "@/types/myplan"
import { MyplanDataPoint } from "./myplanDataPoints"
import { MyplanCourseTermData, MyplanCourseTermSession } from "./schema"

export function getSessionsGroupedByTerm(
  courseDetail: any
): Record<string, any[]> {
  const sessions: Record<string, any[]> = {}

  for (const ins of courseDetail.courseOfferingInstitutionList) {
    for (const termList of ins.courseOfferingTermList) {
      const termKey = `${termList.yearTerm.value}`
      for (const offering of termList.activityOfferingItemList) {
        if (!sessions[termKey]) {
          sessions[termKey] = []
        }
        sessions[termKey].push(offering)
      }
    }
  }

  return sessions
}

export function getSessionsExtractedGroupedByTerm(
  courseDetail: any
): Record<string, MyplanCourseTermSession[]> {
  const sessions: Record<string, any[]> = {}

  for (const ins of courseDetail.courseOfferingInstitutionList) {
    for (const termList of ins.courseOfferingTermList) {
      const termKey = `${termList.yearTerm.value}`
      for (const offering of termList.activityOfferingItemList) {
        if (!sessions[termKey]) {
          sessions[termKey] = []
        }
        sessions[termKey].push({
          id: offering.activityId,
          code: offering.code,
          enrollMaximum: offering.enrollMaximum,
          enrollCount: offering.enrollCount,
          registrationCode: offering.registrationCode,
          newThisYear: offering.newThisYear,
          stateKey: offering.stateKey,
          type: offering.activityOfferingType,
          meetingDetailsList: offering.meetingDetailsList,
          instructor: offering.instructor,
          addCodeRequired: offering.addCodeRequired,
          enrollStatus: offering.enrollStatus,
          sectionComments: offering.sectionComments,
          qtryr: offering.qtryr,
        })
      }
    }
  }

  return sessions
}



type TermEnrollCount = {
  enroll_total_count: number,
  enroll_available_count: number,
}

type CourseSession = {
  code: string
  enrollMaximum: string
  enrollCount: string
}

export function getCourseEnrollCount(
  courseDetail: any
): Record<string, TermEnrollCount> {
  const termSessionMap = getSessionsGroupedByTerm(courseDetail)
  const termEnrollCountMap: Record<string, TermEnrollCount> = {}

  Object.entries(termSessionMap).forEach(([term, sessions]) => {
    let termEnrollCount = 0
    let termEnrollAvailableCount = 0

    sessions.forEach((session: CourseSession) => {
      if (session.code.length === 1) {
        // only count session with single letter code
        // e.g. A, B, C, D, etc.
        // ignore sessions with multiple letter code
        // e.g. AA, AB, etc.
        termEnrollCount += parseInt(session.enrollMaximum)
        termEnrollAvailableCount += parseInt(session.enrollCount)
      }
    })

    termEnrollCountMap[term] = {
      enroll_total_count: termEnrollCount,
      enroll_available_count: termEnrollAvailableCount,
    }
  })

  return termEnrollCountMap
}



export const getLatestEnrollCount = (courseDetail: any) => {
  const termEnrollCountMap = getCourseEnrollCount(courseDetail)
  const latestTerm = Object.keys(termEnrollCountMap).sort().pop()
  if (!latestTerm) {
    return {
      enroll_total_count: 0,
      enroll_available_count: 0,
    }
  }
  return termEnrollCountMap[latestTerm]
}

export type ProcessedCourseDetail = {
  termId: string
  courseId: string
  description: string
  subjectArea: string
  courseNumber: string
  title: string
  credit: string
  genEdRequirements: string[]
  termsOffered: string[]
  genEdRequirementsAbbr: string[]
  termEnrollCountMap: Record<string, TermEnrollCount>
  termSessionMap: Record<string, MyplanCourseTermSession[]>
  campus: string
  prereqs: string[]
}

function extractCourseCode(input: string) {
  const regex = /data-text="([A-Z]+\s\d+)"/;
  const match = input.match(regex);
  return match ? match[1] : null;
}

export const processCourseDetail = (courseDetail: MyPlanCourseDetail): ProcessedCourseDetail | null => {
  try {

    const termId = courseDetail['courseSummaryDetails'].version.termId
    const courseId = courseDetail['courseSummaryDetails'].version.courseId
    const description = courseDetail['courseSummaryDetails']['courseDescription']
    const subjectArea = courseDetail['courseSummaryDetails']['subjectArea']
    const courseNumber = courseDetail['courseSummaryDetails']['courseNumber']
    const title = courseDetail['courseSummaryDetails']['courseTitle']
    const credit = courseDetail['courseSummaryDetails']['credit']
    const genEdRequirements = courseDetail['courseSummaryDetails']['genEdRequirements']
    const termsOffered = courseDetail['courseSummaryDetails']['termsOffered']
    const campus = courseDetail['courseSummaryDetails']['campusLocations'][0]?.toLowerCase() ?? ""
    const prereqs = courseDetail['courseSummaryDetails']['requisites'].map(extractCourseCode).filter((code: string | null) => code !== null)
    const genEdRequirementsAbbr = courseDetail['courseSummaryDetails']['abbrGenEdRequirements']

    const termEnrollCountMap = getCourseEnrollCount(courseDetail)
    const termSessionMap = getSessionsExtractedGroupedByTerm(courseDetail)

    return {
      termId,
      courseId,
      description,
      subjectArea,
      courseNumber,
      title,
      credit,
      genEdRequirements,
      termsOffered,
      genEdRequirementsAbbr,
      termEnrollCountMap,
      termSessionMap,
      campus,
      prereqs,
    }
  } catch (error) {
    console.error(`Error processing course detail:`, error);
    return null;
  }
}

export const migrateEnrollData = (termsData: MyplanCourseTermData[], courseCode: string): MyplanDataPoint[] => {
  return termsData.map((termData) => {
    return termData.enrollData?.map((enrollData) => {
      return {
        termId: termData.termId,
        enrollCount: enrollData.c,
        enrollMax: enrollData.m,
        courseCode,
        timestamp: enrollData.t,
      }
    }) ?? []
  }).flat()
}

export const mergeTermData = (processedCourseDetail: ProcessedCourseDetail, oldTermsData?: MyplanCourseTermData[]): [MyplanCourseTermData[], MyplanCourseTermData[]] => {
  const newTermIdSet = new Set(Object.keys(processedCourseDetail.termEnrollCountMap))

  const newTermsData: MyplanCourseTermData[] = Object.entries(processedCourseDetail.termEnrollCountMap).map(([termId, termEnrollCount]) => {
    const oldTermData = oldTermsData?.find((termData) => termData.termId === termId)

    return {
      termId,
      enrollCount: termEnrollCount.enroll_available_count,
      enrollMax: termEnrollCount.enroll_total_count,
      // enrollData: oldTermData?.enrollData ? [...oldTermData.enrollData, {
      //   t: Date.now(),
      //   c: termEnrollCount.enroll_available_count,
      //   m: termEnrollCount.enroll_total_count,
      // }] : [{
      //   t: Date.now(),
      //   c: termEnrollCount.enroll_available_count,
      //   m: termEnrollCount.enroll_total_count,
      // }],
      sessions: processedCourseDetail.termSessionMap[termId],
    }
  })

  const outdatedTermData = oldTermsData?.filter((termData) => !newTermIdSet.has(termData.termId)) ?? []

  return [newTermsData, outdatedTermData]
}

export const getDataPointFromCourseDetail = (courseDetail: ProcessedCourseDetail, courseCode: string): MyplanDataPoint[] => {
  return Object.entries(courseDetail.termEnrollCountMap).map(([termId, termEnrollCount]) => {
    return {
      termId,
      enrollCount: termEnrollCount.enroll_available_count,
      enrollMax: termEnrollCount.enroll_total_count,
      courseCode,
      timestamp: Date.now(),
    }
  }).flat()
}