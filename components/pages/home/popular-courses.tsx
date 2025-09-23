"use client"

import { useMemo, useState } from "react"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"
import { useQueries, useQuery } from "convex/react"
import { MoreHorizontal, Search, X } from "lucide-react"

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
    const firstFewMajors = sortedMajors.slice(0, MAX_VISIBLE_FILTERS)
    const firstFewMajorSet = new Set(firstFewMajors.map((major) => major.code))
    return { firstFewMajors, firstFewMajorSet }
  }, [sortedMajors, MAX_VISIBLE_FILTERS])

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
      <div className="flex flex-row gap-3 py-4 z-[51] w-full overflow-x-auto isolate sticky top-16 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {firstFewMajors.map((major) => (
          <Button
            key={major.code}
            onClick={() => setSelectedSubjectArea(major.code)}
            variant={selectedSubjectArea === major.code ? "default" : "outline"}
            size="sm"
          >
            {major.code}
          </Button>
        ))}
        {selectedSubjectArea && !firstFewMajorSet.has(selectedSubjectArea) && (
          <Button
            onClick={() => setSelectedSubjectArea(null)}
            variant="default"
            size="sm"
          >
            {selectedSubjectArea}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 max-h-[400px] flex flex-col"
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
