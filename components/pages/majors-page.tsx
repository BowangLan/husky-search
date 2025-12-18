"use client"

import { use, useMemo, useState } from "react"

import { ProgramInfo } from "@/types/program"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  PageWithHeaderLayout,
  PageWithHeaderLayoutSkeleton,
} from "@/components/page-wrapper"
import { ProgramCardGrid } from "@/components/program-card-grid"
import { GroupedProgramCardSections } from "@/components/program-card-grouped-sections"

const CAMPUS_ORDER = ["seattle", "bothell", "tacoma"]

export function MajorsPage({
  programs: programsFromProps,
}: {
  programs: Promise<ProgramInfo[]>
}) {
  const programs = use(programsFromProps)
  const [query, setQuery] = useState("")

  // Get unique campuses from programs, sorted by predefined order
  const campuses = useMemo(() => {
    const uniqueCampuses = [...new Set(programs.map((p) => p.campus))]
    return CAMPUS_ORDER.filter((campus) => uniqueCampuses.includes(campus))
  }, [programs])

  // Group programs by campus
  const programsByCampus = useMemo(() => {
    const grouped: Record<string, ProgramInfo[]> = {}
    for (const campus of campuses) {
      grouped[campus] = programs.filter((p) => p.campus === campus)
    }
    return grouped
  }, [programs, campuses])

  // Filter programs by search query for a given campus
  const filterPrograms = (campusPrograms: ProgramInfo[]) => {
    if (!query) return campusPrograms
    const lowerQuery = query.toLowerCase()
    return campusPrograms.filter(
      (program) =>
        program.title.toLowerCase().includes(lowerQuery) ||
        program.code.toLowerCase().includes(lowerQuery)
    )
  }

  console.log(campuses)
  console.log(programs)

  const defaultCampus = campuses[0] || "seattle"

  return (
    <PageWithHeaderLayout
      title="Academic Programs at UW"
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{programs.length} programs available</span>
        </div>
      }
    >
      <Tabs defaultValue={defaultCampus} className="w-full">
        <section className="w-full px-page mx-page mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <TabsList>
              {campuses.map((campus) => (
                <TabsTrigger key={campus} value={campus}>
                  {campus}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {programsByCampus[campus]?.length || 0}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="relative max-w-xs">
              <Input
                placeholder="Search programs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {campuses.map((campus) => {
          const filteredPrograms = filterPrograms(
            programsByCampus[campus] || []
          )
          return (
            <TabsContent key={campus} value={campus}>
              <section className="w-full px-page mx-page">
                {filteredPrograms.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-muted-foreground text-lg">
                      No programs found{query ? " matching your search" : ""}.
                    </div>
                  </div>
                ) : (
                  <>
                    {query.length === 0 ? (
                      <GroupedProgramCardSections programs={filteredPrograms} />
                    ) : (
                      <ProgramCardGrid programs={filteredPrograms} />
                    )}
                  </>
                )}
              </section>
            </TabsContent>
          )
        })}
      </Tabs>
    </PageWithHeaderLayout>
  )
}

export const MajorsPageSkeleton = () => {
  return (
    <PageWithHeaderLayoutSkeleton>
      <div className="text-center py-16">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    </PageWithHeaderLayoutSkeleton>
  )
}
