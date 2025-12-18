import { Suspense } from "react"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { Section, SectionContent, SectionHeader } from "@/components/section"

import { PopularCoursesContent } from "./popular-courses-content"
import { PopularCoursesSkeleton } from "./popular-courses-skeleton"

async function fetchTopMajors() {
  return await fetchQuery(api.myplan1.subjectAreas.getTopMajors, {
    limit: 100,
  })
}

async function PopularCoursesAsync() {
  const topMajors = await fetchTopMajors()

  return <PopularCoursesContent topMajors={topMajors ?? []} />
}

export const PopularCourses = () => {
  return (
    <Section withPadding>
      <SectionHeader
        title="Popular Courses"
        subtitle="Most popular courses at UW by seat count"
        className="pb-0 lg:pb-0"
      />
      <Suspense fallback={<PopularCoursesSkeleton />}>
        <PopularCoursesAsync />
      </Suspense>
    </Section>
  )
}
