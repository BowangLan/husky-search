"use client"

import {
  // @ts-ignore
  unstable_ViewTransition as ViewTransition,
  useMemo,
} from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { ProgramDetail } from "@/services/program-service"
import { useTrackMajorVisit } from "@/store/visit-cache.store"
import { useQuery } from "convex/react"
import { Loader, TrendingDown, TrendingUp } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { ConvexCourseCardHorizontalList } from "../course-card-convex"
import { PageTitle, PageWithHeaderLayout } from "../page-wrapper"
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "../section"

export function ProgramDetailPage({ program }: { program: ProgramDetail }) {
  useTrackMajorVisit(program)

  const subjectArea = program.code
  const convexCourses = useQuery(api.courses.listOverviewBySubjectArea, {
    subjectArea: subjectArea ?? "",
    limit: 200,
  })

  const groupedCoursesByLevel = useMemo(() => {
    const courses = convexCourses ?? []
    return courses.reduce((acc, course) => {
      const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
      if (!acc[level]) acc[level] = []
      acc[level].push(course)
      return acc
    }, {} as Record<string, ConvexCourseOverview[]>)
  }, [convexCourses])

  const courseAvailability = useMemo(() => {
    const courses = convexCourses ?? []
    let open = 0
    let closed = 0
    let notOffered = 0

    for (const course of courses) {
      const enroll = course.enroll ?? []
      if (enroll.length === 0) {
        notOffered++
        continue
      }

      const hasOpen = enroll.some((e) => {
        if (typeof e.openSessionCount === "number" && e.openSessionCount > 0)
          return true
        if (e.enrollStatus && e.enrollStatus.toLowerCase() === "open")
          return true
        if (e.stateKey && e.stateKey.toLowerCase().includes("open")) return true
        if (
          typeof e.enrollCount === "number" &&
          typeof e.enrollMax === "number" &&
          e.enrollMax > 0 &&
          e.enrollCount < e.enrollMax
        )
          return true
        return false
      })

      if (hasOpen) open++
      else closed++
    }

    return { open, closed, notOffered, total: courses.length }
  }, [convexCourses])

  const isLoading = convexCourses === undefined

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
        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground font-light">
          <div className="inline-flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>
              <span className="tabular-nums text-foreground font-medium">
                {courseAvailability.open}
              </span>{" "}
              open
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>
              <span className="tabular-nums text-foreground font-medium">
                {courseAvailability.closed}
              </span>{" "}
              closed
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-gray-400" />
            <span>
              <span className="tabular-nums text-foreground font-medium">
                {courseAvailability.notOffered}
              </span>{" "}
              not listed
            </span>
          </div>
        </div>
      }
      // topToolbar={<BackButton url={`/majors`} />}
    >
      <div>
        {isLoading ? (
          <div className="px-page mx-page flex justify-center items-center">
            <Loader size={40} className="animate-spin" />
          </div>
        ) : (convexCourses?.length ?? 0) === 0 ? (
          <section className="px-page mx-page">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found for this program. Please check back later.
              </div>
            </div>
          </section>
        ) : (
          <>
            <div className="px-page mx-page">
              {/* <div className="hidden md:block"> */}
              {/* <div className="sticky top-16 z-10 bg-background/50 backdrop-blur-md py-4">
                <CourseFilters
                  filterOptions={filterOptions}
                  filterState={filterState}
                  setFilterState={handleFilterStateChange}
                />
              </div> */}

              {/* Quick Access Navigation */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Course Categories</SectionTitle>
                </SectionHeader>
                <SectionContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto p-3 sm:p-4 flex flex-col items-start gap-1.5 sm:gap-2"
                    >
                      <Link href={`/majors/${program.code}/easiest`}>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                          <span className="font-medium text-sm sm:text-base">
                            Easiest Courses
                          </span>
                        </div>
                        <span className="text-xs hidden sm:block sm:text-sm text-muted-foreground text-left">
                          Courses ranked by easiness score based on GPA
                          distribution data
                        </span>
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="h-auto p-3 sm:p-4 flex flex-col items-start gap-1.5 sm:gap-2"
                    >
                      <Link href={`/majors/${program.code}/toughest`}>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                          <span className="font-medium text-sm sm:text-base">
                            Toughest Courses
                          </span>
                        </div>
                        <span className="text-xs hidden sm:block sm:text-sm text-muted-foreground text-left">
                          Most challenging courses ranked by GPA distribution
                          analysis
                        </span>
                      </Link>
                    </Button>
                  </div>
                </SectionContent>
              </Section>

              {/* Popular Courses */}
              <Section>
                <SectionHeader>
                  <SectionTitle>Popular Courses</SectionTitle>
                </SectionHeader>
                <SectionContent>
                  <ConvexCourseCardHorizontalList
                    courses={(convexCourses ?? []).slice(0, 10)}
                  />
                </SectionContent>
              </Section>

              {Object.entries(groupedCoursesByLevel).map(([level, courses]) => {
                const sortedCourses = courses.sort((a, b) => {
                  return a.courseCode.localeCompare(b.courseCode)
                })
                return (
                  <Section key={level}>
                    <SectionHeader
                      title={`${level} Level`}
                      subtitle={`${sortedCourses.length} courses`}
                    />
                    <SectionContent>
                      <ConvexCourseCardHorizontalList courses={sortedCourses} />
                    </SectionContent>
                  </Section>
                )
              })}
            </div>
            {/* <div className="md:hidden flex">
                <div className="w-[256px] sticky flex-none top-16 z-10 hidden">
                  <CourseFiltersVertical
                    filterOptions={filterOptions}
                    filterState={filterState}
                    setFilterState={handleFilterStateChange}
                  />
                </div>
                <div className="min-h-screen py-4">
                  <CourseCardGridView courses={displayedCourses} />
                </div>
              </div> */}
          </>
        )}
      </div>
    </PageWithHeaderLayout>
  )
}
