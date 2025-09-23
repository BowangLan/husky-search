import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { ProgramCardHorizontalListWithSuspense } from "@/components/program-card-horizontal-list"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export const PopularMajors = () => {
  const topMajors = fetchQuery(api.myplan1.subjectAreas.getTopMajors, {
    limit: 20,
  })

  return (
    <Section withPadding>
      <SectionHeader
        title="Popular Majors"
        subtitle="Popular majors at UW by course seat count"
      />
      <SectionContent>
        <ProgramCardHorizontalListWithSuspense programs={topMajors} />
      </SectionContent>
    </Section>
  )
}
