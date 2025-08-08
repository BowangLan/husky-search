"use client"

import { use, useState } from "react"
import { ProgramInfo, ProgramService } from "@/services/program-service"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  PageWithHeaderLayout,
  PageWithHeaderLayoutSkeleton,
} from "@/components/page-wrapper"
import {
  AnimatedProgramCardGrid,
  GroupedProgramCardSections,
  ProgramCardGrid,
} from "@/components/program-card"

export function MajorsPage({
  programs: programsFromProps,
}: {
  programs: Promise<ProgramInfo[]>
}) {
  const programs = use(programsFromProps)
  const [query, setQuery] = useState("")
  const [displayPrograms, setDisplayPrograms] = useState(programs)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setDisplayPrograms(
      programs.filter((program) =>
        program.title.toLowerCase().includes(value.toLowerCase())
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
  return (
    <PageWithHeaderLayout
      title={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <Skeleton className="h-4 w-24" />
        </div>
      }
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <Skeleton className="h-4 w-24" />
        </div>
      }
    >
      <section className="w-full px-page mx-page mb-6">
        <div className="sticky top-16">
          <div className="relative max-w-xs">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </section>
      <section className="w-full px-page mx-page">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="relative">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div className="p-6">
                  <div className="h-12 md:h-20 flex flex-col justify-center items-center gap-1">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PageWithHeaderLayout>
  )
}
