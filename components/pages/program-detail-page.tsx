"use client"

import {
  // @ts-ignore
  unstable_ViewTransition as ViewTransition,
  useEffect,
  useMemo,
  useState,
} from "react"
import { ProgramDetail } from "@/services/program-service"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { generateFilterOptions } from "@/lib/course-utils"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { CourseCardGrid } from "@/components/course-card"

import { BackButton } from "../back-button"
import { CourseFilterState, CourseFilters } from "../course-filters"
import { PageTitle, PageWithHeaderLayout } from "../page-wrapper"

export function ProgramDetailPage({
  program,
  courses,
}: {
  program: ProgramDetail
  courses: MyPlanCourseCodeGroup[]
}) {
  const [filterState, setFilterState] = useState<CourseFilterState>({
    credits: new Set(),
    genEduReqs: new Set(),
    terms: new Set(),
    levels: new Set(),
  })
  const allFilterOptions = useMemo(
    () => generateFilterOptions(courses),
    [courses]
  )

  const [displayedCourses, setDisplayedCourses] =
    useState<MyPlanCourseCodeGroup[]>(courses)

  useEffect(() => {
    setDisplayedCourses(courses)
    setFilterState({
      credits: new Set(),
      genEduReqs: new Set(),
      terms: new Set(),
      levels: new Set(),
    })
  }, [courses])

  const filterOptions = generateFilterOptions(displayedCourses)

  const handleFilterStateChange = (state: CourseFilterState) => {
    setFilterState(state)
    setDisplayedCourses(
      courses.filter((course) => {
        // Check credits filter
        if (state.credits.size > 0) {
          let hasMatchingCredit = false
          for (const cData of course.data) {
            for (const credit of cData.data.allCredits) {
              if (state.credits.has(credit)) {
                hasMatchingCredit = true
                break
              }
            }
            if (hasMatchingCredit) break
          }
          if (!hasMatchingCredit) return false
        }

        // Check genEduReqs filter
        if (state.genEduReqs.size > 0) {
          let hasMatchingGenEduReq = false
          for (const cData of course.data) {
            for (const genEduReq of cData.data.genEduReqs) {
              if (state.genEduReqs.has(genEduReq)) {
                hasMatchingGenEduReq = true
                break
              }
            }
            if (hasMatchingGenEduReq) break
          }
          if (!hasMatchingGenEduReq) return false
        }

        // Check terms filter (using quarter property)
        if (state.terms.size > 0) {
          let hasMatchingTerm = false
          for (const cData of course.data) {
            if (state.terms.has(cData.quarter)) {
              hasMatchingTerm = true
              break
            }
          }
          if (!hasMatchingTerm) return false
        }

        // Check levels filter
        if (state.levels.size > 0) {
          let hasMatchingLevel = false
          for (const cData of course.data) {
            if (state.levels.has(cData.data.level)) {
              hasMatchingLevel = true
              break
            }
          }
          if (!hasMatchingLevel) return false
        }

        return true
      })
    )
  }

  return (
    <PageWithHeaderLayout
      titleTop={
        <Badge variant={"secondary"} size="default">
          Major
        </Badge>
      }
      title={
        <ViewTransition>
          <PageTitle>{capitalize(program.title)}</PageTitle>
        </ViewTransition>
      }
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{courses.length} courses available</span>
        </div>
      }
      topToolbar={<BackButton url={`/majors`} />}
    >
      <section className="px-page mx-page">
        <div className="mx-auto max-w-7xl">
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found for this program. Please check back later.
              </div>
            </div>
          ) : (
            <>
              <div className="sticky top-16 z-10 bg-background/50 backdrop-blur-md py-4">
                <CourseFilters
                  filterOptions={filterOptions}
                  filterState={filterState}
                  setFilterState={handleFilterStateChange}
                />
              </div>
              <div className="min-h-screen py-4">
                <CourseCardGrid courses={displayedCourses} />
              </div>
            </>
          )}
        </div>
      </section>
    </PageWithHeaderLayout>
  )
}
