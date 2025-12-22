"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { ProgramDetail } from "@/services/program-service"
import {
  useIsMajorPinned,
  useToggleMajorPin,
} from "@/store/pinned-majors.store"
import { useTrackMajorVisit } from "@/store/visit-cache.store"
import { useQuery } from "convex/react"
import {
  LayoutGrid,
  LayoutList,
  Loader,
  Network,
  Pin,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { capitalize, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RichButton } from "@/components/ui/rich-button"

import { ConvexCourseCardGrid } from "../course-card-convex.grid"
import { ConvexCourseListView } from "../course-card-convex.list"
import { PageTitle, PageWithHeaderLayout } from "../page-wrapper"
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "../section"
import { ProgramPrereqGraphs } from "./program-prereq-graphs"

export function ProgramDetailPage({
  program,
  initialCourses,
}: {
  program: ProgramDetail
  initialCourses?: ConvexCourseOverview[]
}) {
  useTrackMajorVisit(program)

  const isPinned = useIsMajorPinned(program.code)
  const togglePin = useToggleMajorPin()
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [showOnlyOffered, setShowOnlyOffered] = useState(true)
  const [selectedLevels, setSelectedLevels] = useState<Set<string>>(new Set())
  const [selectedGenEds, setSelectedGenEds] = useState<Set<string>>(new Set())

  const handlePinClick = () => {
    togglePin(program.code)
  }

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"))
  }

  const toggleOfferedFilter = () => {
    setShowOnlyOffered((prev) => !prev)
  }

  const subjectArea = program.code
  const convexCourses = useQuery(api.courses.listOverviewBySubjectArea, {
    subjectArea: subjectArea ?? "",
  })
  const courses = convexCourses ?? initialCourses ?? []

  // Filter courses based on offering status
  const offeredFilteredCourses = useMemo(() => {
    if (!showOnlyOffered) return courses
    return courses.filter((course) => (course.enroll?.length ?? 0) > 0)
  }, [courses, showOnlyOffered])

  const filterOptions = useMemo(() => {
    const levelCounts = new Map<string, number>()
    const genEdCounts = new Map<string, number>()

    for (const course of offeredFilteredCourses) {
      const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
      if (level !== "?00") {
        levelCounts.set(level, (levelCounts.get(level) ?? 0) + 1)
      }
      for (const req of course.genEdReqs ?? []) {
        genEdCounts.set(req, (genEdCounts.get(req) ?? 0) + 1)
      }
    }

    return {
      levels: Array.from(levelCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count })),
      genEds: Array.from(genEdCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count })),
    }
  }, [offeredFilteredCourses])

  const fullyFilteredCourses = useMemo(() => {
    let result = offeredFilteredCourses

    if (selectedLevels.size > 0) {
      result = result.filter((course) => {
        const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
        return selectedLevels.has(level)
      })
    }

    if (selectedGenEds.size > 0) {
      result = result.filter((course) => {
        const reqs = course.genEdReqs ?? []
        if (reqs.length === 0) return false
        return reqs.some((r) => selectedGenEds.has(r))
      })
    }

    return result
  }, [offeredFilteredCourses, selectedGenEds, selectedLevels])

  // Popular courses sorted by max enrollment
  const popularCourses = useMemo(() => {
    return [...fullyFilteredCourses]
      .sort((a, b) => {
        const maxEnrollA = Math.max(
          ...(a.enroll?.map((e) => e.enrollMax ?? 0) ?? [0]),
          0
        )
        const maxEnrollB = Math.max(
          ...(b.enroll?.map((e) => e.enrollMax ?? 0) ?? [0]),
          0
        )
        return maxEnrollB - maxEnrollA
      })
      .slice(0, 10)
  }, [fullyFilteredCourses])

  const groupedCoursesByLevel = useMemo(() => {
    return fullyFilteredCourses.reduce((acc, course) => {
      const level = (course.courseNumber?.slice(0, 1) ?? "?") + "00"
      if (!acc[level]) acc[level] = []
      acc[level].push(course)
      return acc
    }, {} as Record<string, ConvexCourseOverview[]>)
  }, [fullyFilteredCourses])

  const toggleLevel = (level: string) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  const toggleGenEd = (genEd: string) => {
    setSelectedGenEds((prev) => {
      const next = new Set(prev)
      if (next.has(genEd)) next.delete(genEd)
      else next.add(genEd)
      return next
    })
  }

  const clearAllLocalFilters = () => {
    setSelectedLevels(new Set())
    setSelectedGenEds(new Set())
  }

  const courseAvailability = useMemo(() => {
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
  }, [courses])

  const isLoading = convexCourses === undefined && !initialCourses

  return (
    <PageWithHeaderLayout
      titleTop={
        <Badge variant={"secondary"} size="default">
          Major
        </Badge>
      }
      title={
        <div className="flex items-center gap-2">
          <PageTitle>{capitalize(program.title)}</PageTitle>
          <div className="flex-1"></div>
          <RichButton
            tooltip={isPinned ? "Unpin major" : "Pin major"}
            variant="ghost"
            className="size-9"
            onClick={handlePinClick}
          >
            <Pin
              className={cn(
                "size-4 transition-colors",
                isPinned && "fill-primary text-primary"
              )}
            />
          </RichButton>
          <Link href={`/prereq-graph?subjectArea=${program.code}`}>
            <Button variant="outline">
              <Network className="h-4 w-4" />
              View Prerequisite Graph
            </Button>
          </Link>
        </div>
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
              not currently offered
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
        ) : courses.length === 0 ? (
          <section className="px-page mx-page">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found for this program. Please check back later.
              </div>
            </div>
          </section>
        ) : offeredFilteredCourses.length === 0 ? (
          <section className="px-page mx-page">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses currently being offered. Toggle "All Courses" to see all courses.
              </div>
            </div>
          </section>
        ) : fullyFilteredCourses.length === 0 ? (
          <section className="px-page mx-page">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses match your filters. Clear filters to see more courses.
              </div>
              {(selectedLevels.size > 0 || selectedGenEds.size > 0) && (
                <div className="mt-4">
                  <Button variant="outline" onClick={clearAllLocalFilters}>
                    <X className="h-4 w-4" />
                    Clear filters
                  </Button>
                </div>
              )}
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

              {/* Toggles */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                {/* Offering Filter Toggle */}
                <div className="inline-flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={showOnlyOffered ? "default" : "ghost"}
                    size="sm"
                    onClick={toggleOfferedFilter}
                    className="gap-2"
                  >
                    <span className="text-xs sm:text-sm">Currently Offered</span>
                  </Button>
                  <Button
                    variant={!showOnlyOffered ? "default" : "ghost"}
                    size="sm"
                    onClick={toggleOfferedFilter}
                    className="gap-2"
                  >
                    <span className="text-xs sm:text-sm">All Courses</span>
                  </Button>
                </div>

                {/* View Mode Toggle */}
                <div className="inline-flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={toggleViewMode}
                    className="gap-2"
                  >
                    <LayoutList className="h-4 w-4" />
                    <span className="hidden sm:inline">List</span>
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={toggleViewMode}
                    className="gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </Button>
                </div>
              </div>

              {/* Local Filters */}
              <div className="mb-6">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {filterOptions.levels.map((opt) => (
                    <Button
                      key={`level-${opt.value}`}
                      size="sm"
                      variant={selectedLevels.has(opt.value) ? "default" : "outline"}
                      className="h-8 px-2.5 flex-none"
                      onClick={() => toggleLevel(opt.value)}
                    >
                      {opt.value}
                      <span className="ml-1 text-xs opacity-70 tabular-nums">
                        ({opt.count})
                      </span>
                    </Button>
                  ))}

                  {filterOptions.levels.length > 0 && filterOptions.genEds.length > 0 && (
                    <div className="h-5 w-px bg-border mx-1 flex-none" />
                  )}

                  {filterOptions.genEds.map((opt) => (
                    <Button
                      key={`gened-${opt.value}`}
                      size="sm"
                      variant={selectedGenEds.has(opt.value) ? "default" : "outline"}
                      className="h-8 px-2.5 flex-none"
                      onClick={() => toggleGenEd(opt.value)}
                    >
                      {opt.value}
                      <span className="ml-1 text-xs opacity-70 tabular-nums">
                        ({opt.count})
                      </span>
                    </Button>
                  ))}

                  {(selectedLevels.size > 0 || selectedGenEds.size > 0) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2.5 text-muted-foreground flex-none"
                      onClick={clearAllLocalFilters}
                    >
                      <X className="h-4 w-4" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

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
                  {viewMode === "list" ? (
                    <ConvexCourseListView courses={popularCourses} />
                  ) : (
                    <ConvexCourseCardGrid courses={popularCourses} />
                  )}
                </SectionContent>
              </Section>

              {/* Prerequisite Graphs */}
              {/* {convexCourses && convexCourses.length > 0 && (
                <ProgramPrereqGraphs
                  courses={convexCourses}
                  subjectArea={subjectArea ?? ""}
                />
              )} */}

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
                      {viewMode === "list" ? (
                        <ConvexCourseListView courses={sortedCourses} />
                      ) : (
                        <ConvexCourseCardGrid courses={sortedCourses} />
                      )}
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
