"use client"

import { api } from "@/convex/_generated/api"
import { ConvexCourseOverview } from "@/types/convex-courses"
import { useQuery } from "convex/react"
import { useEffect } from "react"
import { create } from "zustand"

export type CourseData = ConvexCourseOverview

export type CourseDataStore = {
  courseMap: Map<string, CourseData> // key is the course code, value is the course data
  setCourseData: (courses: CourseData[]) => void
  getCourseData: (courseCode: string) => CourseData | undefined
  clearCourseData: () => void
}

export const useCourseDataStore = create<CourseDataStore>(
  (set, get) => ({
    courseMap: new Map(),
    setCourseData: (courses: CourseData[]) => {
      const courseData = new Map<string, CourseData>()
      courses.forEach((course) => {
        courseData.set(course.courseCode, course)
      })
      set({ courseMap: courseData })
    },
    getCourseData: (courseCode: string) => {
      const courseData = get().courseMap
      return courseData.get(courseCode) ?? undefined
    },
    clearCourseData: () => {
      set({ courseMap: new Map() })
    },
  })
)

export const useCourseDataBySubjectAreaLoader = (subjectArea: string) => {
  const query = useQuery(api.courses.listOverviewBySubjectArea, {
    subjectArea,
  })

  useEffect(() => {
    if (query) {
      useCourseDataStore.getState().setCourseData(query)
    }
  }, [query])

  return {
    data: query,
    isLoading: query === undefined,
  }
}

