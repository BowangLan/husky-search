"use client"

import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import { visitCacheStore } from "@/store/visit-cache.store"
import { useQuery } from "convex/react"
import { MoreHorizontal, Search, X } from "lucide-react"
import { useStore } from "zustand"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  ConvexCourseCardGrid,
  ConvexCourseCardGridSkeleton,
  ConvexCourseCardGridWithSuspense,
} from "@/components/course-card-convex.grid"
import { MajorFilterChip } from "@/components/pages/home/major-filter-chip"
import { Section, SectionContent, SectionHeader } from "@/components/section"

const MAX_VISIBLE_FILTERS = 8

export const PopularCourses = () => {
  const [selectedSubjectArea, setSelectedSubjectArea] = useState<string | null>(
    null
  )
  const [searchQuery, setSearchQuery] = useState("")
  const courses = useQuery(api.courses.listOverviewByStatsEnrollMax, {
    limit: 20,
    subjectArea: selectedSubjectArea ?? undefined,
  })
  const topMajors = useQuery(api.myplan1.subjectAreas.getTopMajors, {
    limit: 100,
  })
  const isCourseLoading = courses === undefined
  const getRecentMajors = useStore(visitCacheStore, (s) => s.getRecentMajors)

  const sortedMajors = useMemo(() => {
    if (!topMajors) return []
    return topMajors.toSorted((a, b) => a.code.localeCompare(b.code))
  }, [topMajors])

  const filteredMajors = useMemo(() => {
    if (searchQuery.trim() === "") return sortedMajors
    return sortedMajors.filter((major) =>
      major.code.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sortedMajors, searchQuery])

  const { firstFewMajors, firstFewMajorSet } = useMemo(() => {
    if (!sortedMajors)
      return { firstFewMajors: [], firstFewMajorSet: new Set() }

    // Get recent majors from visit cache
    const recentMajors = getRecentMajors(MAX_VISIBLE_FILTERS)
    const recentMajorCodes = new Set(recentMajors.map((m) => m.code))

    // Start with recent majors that exist in topMajors
    const validRecentMajors = recentMajors
      .map((recentMajor) =>
        sortedMajors.find((m) => m.code === recentMajor.code)
      )
      .filter((m): m is NonNullable<typeof m> => m !== undefined)

    // Fill remaining slots with top majors that aren't already included
    const remainingSlots = MAX_VISIBLE_FILTERS - validRecentMajors.length
    const fillMajors = sortedMajors
      .filter((major) => !recentMajorCodes.has(major.code))
      .slice(0, remainingSlots)

    const firstFewMajors = [...validRecentMajors, ...fillMajors]
    const firstFewMajorSet = new Set(firstFewMajors.map((major) => major.code))
    return { firstFewMajors, firstFewMajorSet }
  }, [sortedMajors, getRecentMajors])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Section withPadding>
      <SectionHeader
        title="Popular Courses"
        subtitle="Most popular courses at UW by seat count"
        className="pb-0 lg:pb-0"
      />
      <div className="flex flex-row gap-3 py-4 z-[21] w-full overflow-x-auto isolate sticky top-0 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {firstFewMajors.map((major) => (
          <MajorFilterChip
            key={major.code}
            code={major.code}
            selected={selectedSubjectArea === major.code}
            onClick={() => setSelectedSubjectArea(major.code)}
            href={`/majors/${major.code}`}
          />
        ))}
        {selectedSubjectArea && !firstFewMajorSet.has(selectedSubjectArea) && (
          <MajorFilterChip
            onClick={() => setSelectedSubjectArea(null)}
            code={selectedSubjectArea}
            selected
            href={`/majors/${selectedSubjectArea}`}
          />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="More subject areas"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 h-[70vh] md:h-[400px] flex flex-col"
            side="bottom"
            align="end"
            style={{ zIndex: 99 }}
          >
            <div
              className="px-1 pt-1 pb-2 flex-none"
              onKeyDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subject areas..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value.toUpperCase())}
                  className="pl-8 h-8 rounded-md"
                  onKeyDown={(e) => e.stopPropagation()}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-1 pb-2">
              {filteredMajors.map((major) => (
                <DropdownMenuItem
                  key={major.code}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSearchQuery("")
                    setSelectedSubjectArea(major.code)
                  }}
                  className={
                    selectedSubjectArea === major.code ? "bg-accent" : ""
                  }
                >
                  {major.code}
                </DropdownMenuItem>
              ))}
              {filteredMajors.length === 0 && searchQuery && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No subject areas found
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        {selectedSubjectArea && (
          <Button
            onClick={() => setSelectedSubjectArea(null)}
            variant="ghost"
            size="sm"
            className="aspect-square"
          >
            <X />
          </Button>
        )}
      </div>
      <SectionContent className="pt-0 lg:pt-0">
        {/* <ConvexCourseCardGridWithSuspense courses={courses} /> */}

        {isCourseLoading ? (
          <ConvexCourseCardGridSkeleton />
        ) : (
          <ConvexCourseCardGrid courses={courses?.data ?? []} />
        )}
      </SectionContent>
    </Section>
  )
}
