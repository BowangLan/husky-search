"use client"

import { visitCacheStore } from "@/store/visit-cache.store"
import { useStore } from "zustand"

import { ProgramCardHorizontalListWithSuspense } from "@/components/program-card-horizontal-list"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export function RecentMajorsSection() {
  const recentMajors = useStore(visitCacheStore, (s) => s.recentMajors)

  if (recentMajors.length === 0) {
    return null
  }

  return (
    <Section>
      <div className="px-page mx-page">
        <SectionHeader
          title="Recent Visited Majors"
          subtitle="Majors you have visited recently"
        />
      </div>
      <SectionContent className="px-page mx-page">
        <ProgramCardHorizontalListWithSuspense programs={recentMajors} />
      </SectionContent>
    </Section>
  )
}
