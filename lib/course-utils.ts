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
    acc[course.code] = {
      code: course.code,
      title: course.data.title,
      subjectAreaCode: course.subjectAreaCode,
      subjectAreaTitle: course.subjectAreaTitle,
      data: [],
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
