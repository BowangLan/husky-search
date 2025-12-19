"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Loader } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import { getGenEdLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

import { PageTitle, PageWithHeaderLayout } from "../../page-wrapper"
import { CourseAvailabilityStats } from "./course-availability-stats"
import { GenEdCoursesList } from "./gen-ed-courses-list"
import { GenEdCoursesToolbar } from "./gen-ed-courses-toolbar"
import { GenEdFiltersPanel } from "./gen-ed-filters-panel"
import { useGenEdCourseFilters } from "./use-gen-ed-course-filters"

interface GenEdDetailPageProps {
  genEdCode: string
  initialCourses?: ConvexCourseOverview[]
  initialTotalCount?: number
}

export function GenEdDetailPage({
  genEdCode,
  initialCourses,
  initialTotalCount,
}: GenEdDetailPageProps) {
  const resultsTopRef = useRef<HTMLDivElement>(null)
  const didMountRef = useRef(false)

  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [allCourses, setAllCourses] = useState<ConvexCourseOverview[]>(
    initialCourses ?? []
  )
  const [totalCount, setTotalCount] = useState<number | undefined>(
    initialTotalCount
  )

  const [offset, setOffset] = useState(0)

  // Load data with pagination
  const pageData = useQuery(api.courses.listOverviewByGenEd, {
    genEdCode,
    limit: 50,
    offset,
  })

  // Auto-load next page when current page finishes loading
  useEffect(() => {
    if (pageData) {
      setTotalCount(pageData.totalCount)

      // Append new courses to the list
      setAllCourses((prev) => {
        // Avoid duplicates by checking if we already have courses at this offset
        if (prev.length === offset) {
          return [...prev, ...pageData.data]
        }
        return prev
      })

      // Load next page if there are more courses
      if (pageData.hasMore && offset + 50 < pageData.totalCount) {
        setOffset((prev) => prev + 50)
      }
    }
  }, [pageData, offset])

  const courses = allCourses

  const {
    // Filter state
    searchQuery,
    setSearchQuery,
    selectedEnrollStatuses,
    toggleEnrollStatus,
    selectedMajors,
    selectedCredits,
    selectedLevels,
    hasPrereqFilter,
    setHasPrereqFilter,

    // Toggle functions
    toggleMajor,
    toggleCredit,
    toggleLevel,
    clearFilters,

    // Computed values
    filterOptions,
    sortedCourses,
    displayedCourses,
    courseAvailability,
    activeFilterCount,

    // Sorting
    sortBy,
    setSortBy,
  } = useGenEdCourseFilters(courses)

  // Reset scroll position when filters (non-search) change.
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    if (resultsTopRef.current) {
      resultsTopRef.current.scrollIntoView({ block: "start", behavior: "auto" })
      return
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" })
    }
  }, [
    selectedEnrollStatuses,
    selectedMajors,
    selectedCredits,
    selectedLevels,
    hasPrereqFilter,
  ])

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "list" ? "grid" : "list"))
  }

  const genEdLabel = getGenEdLabel(genEdCode)
  const isLoading = pageData === undefined && !initialCourses
  const isLoadingMore =
    pageData && pageData.hasMore && allCourses.length < (totalCount ?? 0)

  return (
    <div
      className="w-full h-full flex flex-col"
      // titleTop={
      //   <Badge variant="secondary" size="default">
      //     Gen Ed
      //   </Badge>
      // }
      // title={
      //   <div className="flex items-center gap-2">
      //     <PageTitle>
      //       {genEdLabel} ({genEdCode})
      //     </PageTitle>
      //   </div>
      // }
      // subtitle={<CourseAvailabilityStats availability={courseAvailability} />}
    >
      {/* Page Header */}
      <div className="border-r w-full flex-none border-b py-4 px-4 md:px-6 md:py-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="default">
            Gen Ed
          </Badge>
          <h1 className="text-2xl font-medium tracking-tight text-foreground">
            {genEdLabel} ({genEdCode})
          </h1>
        </div>
        <div className="flex-1"></div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-w-0 min-h-0">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center py-12">
            <Loader size={40} className="animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex-1">
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">
                No courses found for this gen ed requirement. Please check back
                later.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Sidebar - Filters */}
            <GenEdFiltersPanel
              selectedEnrollStatuses={selectedEnrollStatuses}
              onToggleEnrollStatus={toggleEnrollStatus}
              hasPrereqFilter={hasPrereqFilter}
              onHasPrereqChange={setHasPrereqFilter}
              filterOptions={filterOptions}
              selectedMajors={selectedMajors}
              selectedCredits={selectedCredits}
              selectedLevels={selectedLevels}
              onToggleMajor={toggleMajor}
              onToggleCredit={toggleCredit}
              onToggleLevel={toggleLevel}
              activeFilterCount={activeFilterCount}
              onClearFilters={clearFilters}
            />

            {/* Main Content */}
            <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col px-4">
              <div ref={resultsTopRef} className="scroll-mt-24" />
              {/* View Toggle and Results Count */}
              <GenEdCoursesToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                displayedCount={displayedCourses.length}
                filteredCount={sortedCourses.length}
                totalCount={courses.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeToggle={toggleViewMode}
              />

              {/* Course List */}
              <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
                <GenEdCoursesList
                  courses={displayedCourses}
                  sortedCount={sortedCourses.length}
                  viewMode={viewMode}
                />
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  )
}
