"use client"

import {
  // @ts-ignore
  unstable_ViewTransition as ViewTransition,
  useMemo,
} from "react"
import { api } from "@/convex/_generated/api"
import { ProgramDetail } from "@/services/program-service"
import { useTrackMajorVisit } from "@/store/visit-cache.store"
import { useQuery } from "convex/react"
import { Loader } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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

  const subjectArea = program?.code
  const convexCourses = useQuery(api.myplan.listOverviewBySubjectArea, {
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
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{(convexCourses ?? []).length} courses available</span>
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
