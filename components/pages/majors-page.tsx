"use client"

import { useState } from "react"
import { ProgramInfo, ProgramService } from "@/services/program-service"

import { Input } from "@/components/ui/input"
import { PageWithHeaderLayout } from "@/components/page-wrapper"
import { ProgramCardGrid } from "@/components/program-card"

export function MajorsPage({ programs }: { programs: ProgramInfo[] }) {
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
            <ProgramCardGrid programs={displayPrograms} />
          )}
        </div>
      </section>
    </PageWithHeaderLayout>
  )
}
