import { MyPlanCourse, MyPlanCourseCodeGroup } from "@/types/myplan"

export const groupQuarterCoursesByCode = (
  courses: {
    id: number
    code: string
    data: MyPlanCourse
    quarter: string
    myplanId: string
    subjectAreaCode: string
    subjectAreaTitle: string
  }[]
) => {
  const groupedCourses = courses.reduce((acc, course) => {
    if (!acc[course.code]) {
      acc[course.code] = {
        code: course.code,
        title: course.data.title,
        subjectAreaCode: course.subjectAreaCode,
        subjectAreaTitle: course.subjectAreaTitle,
        data: [],
      }
    }
    acc[course.code].data.push({
      data: course.data,
      quarter: course.quarter,
      subjectAreaCode: course.subjectAreaCode,
      myplanId: course.myplanId,
    })
    return acc
  }, {} as Record<string, MyPlanCourseCodeGroup>)

  return Object.values(groupedCourses)
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

export const parseTermId = (termId: string) => {
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
    labelShort: `${quarterLabelShort} ${yearShort}`,
  }

  return term
}
