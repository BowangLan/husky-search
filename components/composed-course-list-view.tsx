"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GetCourseResponseItem } from "@/services/course-service"

import { CourseCardGridView } from "./course-card"
import { CourseSubjectFilters } from "./course-subject-filters"
import { Section, SectionContent } from "./section"

export const getSubjectFacets = (courses: GetCourseResponseItem[]) => {
  const subjects = courses.map((course) => course.subjectAreaCode)
  const subjectFacets = subjects.reduce((acc, subject) => {
    acc[subject] = (acc[subject] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return subjectFacets
}

export function ComposedCourseListView({
  data,
  filters,
}: {
  data: GetCourseResponseItem[]
  filters: {
    subjects?: Set<string>
  }
}) {
  const router = useRouter()
  const subjectFacets = getSubjectFacets(data)

  const handleSubjectChange = (values: Set<string>) => {
    const pathname = window.location.pathname
    const searchParams = new URLSearchParams()
    if (values.size > 0) {
      searchParams.set("subjects", Array.from(values).join(","))
    }

    const newPath = `${pathname}?${searchParams.toString()}`

    router.push(newPath)
  }

  return (
    <Section withPadding>
      <div className="flex flex-row gap-4">
        <CourseSubjectFilters
          selectedValues={filters.subjects || new Set()}
          onChange={(values) => {
            handleSubjectChange(values)
          }}
          facets={subjectFacets}
          options={Object.entries(subjectFacets)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([subject, count]) => ({
              label: subject,
              value: subject,
            }))}
        />
      </div>
      <SectionContent>
        <CourseCardGridView courses={data} animated={false} />
      </SectionContent>
    </Section>
  )
}
