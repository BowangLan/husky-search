"use client"

import { visitCacheStore } from "@/store/visit-cache.store"
import { useStore } from "zustand"

import { ProgramCardLink } from "./program-card"
import { Section, SectionContent, SectionHeader } from "./section"

export function RecentMajorsSection() {
  const recentMajors = useStore(visitCacheStore, (s) => s.recentMajors)

  return (
    <Section>
      <div className="px-page mx-page">
        <SectionHeader
          title="Recent Visited Majors"
          subtitle="Majors you have visited recently"
        />
      </div>
      <SectionContent className="px-page mx-page">
        {/* <ProgramCardGrid programs={recentMajors} /> */}
        <div className="flex flex-row gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
          {recentMajors.map((major, index) => (
            // <div key={index}>{major.code}</div>
            <ProgramCardLink
              key={index}
              program={major}
              className="w-[270px]"
            />
          ))}
        </div>
      </SectionContent>
    </Section>
  )
}
