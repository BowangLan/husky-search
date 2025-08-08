"use client"

import { use, useState } from "react"

import { ProgramInfo } from "@/types/program"
import { Input } from "@/components/ui/input"
import {
  PageWithHeaderLayout,
  PageWithHeaderLayoutSkeleton,
} from "@/components/page-wrapper"
import { ProgramCardGrid } from "@/components/program-card-grid"
import { GroupedProgramCardSections } from "@/components/program-card-grouped-sections"

export function MajorsPage({
  programs: programsFromProps,
}: {
  programs: Promise<ProgramInfo[]>
}) {
  const programs = use(programsFromProps)
  const [query, setQuery] = useState("")
  const [displayPrograms, setDisplayPrograms] = useState(programs)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase()
    setQuery(value)
    setDisplayPrograms(
      programs.filter(
        (program) =>
          program.title.toLowerCase().includes(value) ||
          program.code.toLowerCase().includes(value)
      )
    )
  }

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
      <section className="w-full px-page mx-page mb-6">
        <div className="sticky top-16">
          <div className="relative max-w-xs">
            <Input
              placeholder="Search programs"
              value={query}
              onChange={handleSearch}
            />
          </div>
        </div>
      </section>
      <section className="w-full px-page mx-page">
        <div className="">
          {displayPrograms.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg">
                No programs found. Please check back later.
              </div>
            </div>
          ) : (
            <>
              {query.length === 0 ? (
                <GroupedProgramCardSections programs={displayPrograms} />
              ) : (
                <ProgramCardGrid programs={displayPrograms} />
              )}
            </>
          )}
        </div>
      </section>
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
