"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { visitCacheStore } from "@/store/visit-cache.store"
import { fetchQuery } from "convex/nextjs"
import { useQueries, useQuery } from "convex/react"
import { ExternalLink, MoreHorizontal, Search, X } from "lucide-react"
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ConvexCourseCardGrid,
  ConvexCourseCardGridSkeleton,
  ConvexCourseCardGridWithSuspense,
} from "@/components/course-card-convex.grid"
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
          <Button
            key={major.code}
            onClick={() => setSelectedSubjectArea(major.code)}
            variant={selectedSubjectArea === major.code ? "default" : "outline"}
            size="sm"
          >
            {major.code}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/majors/${major.code}`}
                  prefetch
                  className="text-muted-foreground group inline-flex"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink
                    className="group-hover:text-foreground trans"
                    style={{ height: "14px", width: "14px" }}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to major page</p>
              </TooltipContent>
            </Tooltip>
          </Button>
        ))}
        {selectedSubjectArea && !firstFewMajorSet.has(selectedSubjectArea) && (
          <Button
            onClick={() => setSelectedSubjectArea(null)}
            variant="default"
            size="sm"
          >
            {selectedSubjectArea}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={`/majors/${selectedSubjectArea}`}
                  prefetch
                  className="text-muted-foreground hover:text-foreground inline-flex"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink style={{ height: "14px", width: "14px" }} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to major page</p>
              </TooltipContent>
            </Tooltip>
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
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
