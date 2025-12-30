import { MyPlanCourseCodeGroup, MyPlanCourseDetail } from "@/types/myplan"

export const groupCoursesByLevel = (courses: MyPlanCourseCodeGroup[]) => {
  return courses.reduce((acc, course) => {
    course
    const level = course.number.slice(0, 1) + "00"
    if (!acc[level]) {
      acc[level] = []
    }
    acc[level].push(course)
    return acc
  }, {} as Record<string, MyPlanCourseCodeGroup[]>)
}

export type CourseFilterOptions = {
  credits: {
    value: string
    count: number
  }[]
  genEduReqs: {
    value: string
    count: number
  }[]
  terms: {
    value: string
    count: number
  }[]
  levels: {
    value: string
    count: number
  }[]
}

export const generateFilterOptions = (
  courses: MyPlanCourseCodeGroup[]
): CourseFilterOptions => {
  const options: CourseFilterOptions = {
    credits: [],
    genEduReqs: [],
    terms: [],
    levels: [],
  }

  const creditSets = new Map<string, number>()
  const genEduReqSets = new Map<string, number>()
  const termSets = new Map<string, number>()
  const levelSets = new Map<string, number>()

  const myPlanDataList = courses
    .map((course) => course.data.map((data) => data.data))
    .flat()

  myPlanDataList.forEach((data) => {
    data.allCredits.forEach((credit) =>
      creditSets.set(credit, (creditSets.get(credit) ?? 0) + 1)
    )
    data.genEduReqs.forEach((genEduReq) =>
      genEduReqSets.set(genEduReq, (genEduReqSets.get(genEduReq) ?? 0) + 1)
    )
    termSets.set(data.termId, (termSets.get(data.termId) ?? 0) + 1)
    levelSets.set(data.level, (levelSets.get(data.level) ?? 0) + 1)
  })

  options.credits = Array.from(creditSets.entries())
    .toSorted((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, count]) => ({ value, count }))
  options.genEduReqs = Array.from(genEduReqSets.entries())
    .toSorted((a, b) => a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, count }))
  options.terms = Array.from(termSets.entries())
    .toSorted((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, count]) => ({ value, count }))
  options.levels = Array.from(levelSets.entries())
    .toSorted((a, b) => Number(a[0]) - Number(b[0]))
    .map(([value, count]) => ({ value, count }))

  return options
}

export type Term = {
  year: number
  quarter: number
  label: string
  labelShort: string
}

export const parseTermId = (termId: string): Term => {
  // termId is in the format of "20251"
  // 2025 is the year
  // 1 is the quarter
  // 1 - Winter; 2 - Spring; 3 - Summer; 4 - Autumn

  const year = Number(termId.slice(0, 4))
  const quarter = Number(termId.slice(4, 5))

  let optionalSuffix = termId.slice(5) ?? ""
  if (optionalSuffix) {
    optionalSuffix = ` ${optionalSuffix}`
  }

  const quarterMap = {
    1: "Winter",
    2: "Spring",
    3: "Summer",
    4: "Autumn",
  } as const

  const quarterLabel = quarterMap[quarter as keyof typeof quarterMap]
  const quarterLabelShort = quarterMap[
    quarter as keyof typeof quarterMap
  ].slice(0, 2)
  const yearShort = year.toString().slice(-2)

  const term: Term = {
    year,
    quarter,
    label: `${year} ${quarterLabel}${optionalSuffix}`,
    labelShort: `${quarterLabelShort}${optionalSuffix} ${yearShort}`,
  }

  return term
}

export const parseQtryr = (qtryr: string): Term => {
  // qtryr is in the format of "WIN+2026"
  // WIN - Winter, SPR - Spring, SUM - Summer, AUT - Autumn

  const parts = qtryr.split("+")
  const quarterStr = parts[0]
  const year = Number(parts[1])

  const quarterMap = {
    "WIN": 1,
    "SPR": 2,
    "SUM": 3,
    "AUT": 4,
  } as const

  const quarter = quarterMap[quarterStr as keyof typeof quarterMap]

  const quarterLabelMap = {
    "WIN": "Winter",
    "SPR": "Spring",
    "SUM": "Summer",
    "AUT": "Autumn",
  } as const

  const quarterLabel = quarterLabelMap[quarterStr as keyof typeof quarterLabelMap]
  const quarterLabelShort = quarterStr.slice(0, 2)
  const yearShort = year.toString().slice(-2)

  const term: Term = {
    year,
    quarter,
    label: `${year} ${quarterLabel}`,
    labelShort: `${quarterLabelShort} ${yearShort}`,
  }

  return term
}

type CourseSession = {
  code: string
  enrollMaximum: string
  enrollCount: string
}

type TermEnrollCount = {
  enroll_total_count: number
  enroll_available_count: number
}

export const getSessions = (courseDetail: any) => {
  const sessions: any[] = []

  for (const ins of courseDetail.courseOfferingInstitutionList) {
    for (const termList of ins.courseOfferingTermList) {
      for (const offering of termList.activityOfferingItemList) {
        sessions.push({
          term: termList.term,
          ...offering,
        })
      }
    }
  }

  return sessions
}

export function getSessionsGroupedByTerm(
  courseDetail: any
): Record<string, any[]> {
  const sessions: Record<string, any[]> = {}

  for (const ins of courseDetail.courseOfferingInstitutionList) {
    for (const termList of ins.courseOfferingTermList) {
      for (const offering of termList.activityOfferingItemList) {
        if (!sessions[termList.term]) {
          sessions[termList.term] = []
        }
        sessions[termList.term].push(offering)
      }
    }
  }

  return sessions
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

export function getCourseLatestEnrollCount(courseDetail: MyPlanCourseDetail): {
  enrollMax: number
  enrollCount: number
} {
  let enrollMax = 0
  let enrollCount = 0
  for (const ins of courseDetail.courseOfferingInstitutionList) {
    for (const termList of ins.courseOfferingTermList) {
      for (const offering of termList.activityOfferingItemList) {
        if (offering.code.length !== 1) {
          // ignore non-lecture sessions
          continue
        }

        enrollMax += parseInt(offering.enrollMaximum)
        enrollCount += parseInt(offering.enrollCount)
      }

      // only get the latest term
      break
    }
  }
  return {
    enrollMax,
    enrollCount,
  }
}

export const isRequisitesEmpty = (requisites: any): boolean => {
  if (typeof requisites === "string") {
    if (requisites.toLowerCase() === "null" || requisites === "") {
      return true
    }
    return false
  }
  if (Array.isArray(requisites)) {
    if (requisites[0]?.toLowerCase() === "null" || requisites[0] === "") {
      return true
    }
    return false
  }
  return true

}

export const parseDescription = (description: string) => {
  // Parse HTML tags and extract course codes from linkified spans
  return description
    .replace(/<span[^>]*data-text="([^"]*)"[^>]*\/>/g, "$1")
    .replace(/<[^>]*>/g, "")
}