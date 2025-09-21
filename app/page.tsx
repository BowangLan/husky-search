import { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { CourseService } from "@/services/course-service"
import { sql } from "drizzle-orm"

import { ProgramInfo } from "@/types/program"
import {
  CurrentAcademicTermTable,
  MyPlanQuarterCoursesTable,
  MyPlanSubjectAreasTable,
  db,
} from "@/lib/db/schema"
import { CourseCardGridViewWithSuspense } from "@/components/course-card"
import { HeroSection } from "@/components/hero-section"
import { Page } from "@/components/page-wrapper"
import { ProgramCardGridWithSuspense } from "@/components/program-card-grid"
import { RecentMajorsSection } from "@/components/recent-majors-section"
import { Section, SectionContent, SectionHeader } from "@/components/section"

export const experimental_ppr = true

export const metadata: Metadata = {
  title: "Husky Search - Discover University of Washington Courses and Majors",
  description:
    "Explore UW courses, majors, and academic programs. Find detailed course information, prerequisites, credits, and enrollment data for University of Washington students.",
  keywords: [
    "UW courses",
    "University of Washington",
    "UW majors",
    "course search",
    "academic programs",
    "course catalog",
    "UW students",
    "Seattle university",
    "course prerequisites",
    "course credits",
  ],
  openGraph: {
    title: "Husky Search - University of Washington Course Discovery",
    description:
      "Discover and explore UW courses with detailed information about credits, prerequisites, enrollment data, and course content. Find your perfect courses and majors at the University of Washington.",
    url: "https://huskysearch.com",
    siteName: "Husky Search",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Husky Search - UW Course Discovery Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Husky Search - Discover UW Courses and Majors",
    description:
      "Explore University of Washington courses, majors, and academic programs with detailed enrollment data and course information.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://huskysearch.com",
  },
}

async function getTopMajors({
  limit,
}: {
  limit: number
}): Promise<ProgramInfo[]> {
  // get top 5 courses by enroll count
  // for each major, get the top 5 courses by enroll max and sum the to get the major's enroll count for major sorting

  const result: any = await db.execute(
    sql<any[]>`
      with current as (
        select ${CurrentAcademicTermTable.name} as name from ${CurrentAcademicTermTable}
      ),
      ranked as (
        select
          ${MyPlanQuarterCoursesTable.subjectAreaCode} as "subjectAreaCode",
          ${MyPlanQuarterCoursesTable.code} as "code",
          ${MyPlanQuarterCoursesTable.enrollMax} as "enrollMax",
          ${MyPlanQuarterCoursesTable.enrollCount} as "enrollCount",
          (${MyPlanQuarterCoursesTable.data}->>'title') as "courseTitle",
          row_number() over (
            partition by ${MyPlanQuarterCoursesTable.subjectAreaCode}
            order by ${MyPlanQuarterCoursesTable.enrollMax} desc
          ) as rn
        from ${MyPlanQuarterCoursesTable}
        inner join current on current.name = ${MyPlanQuarterCoursesTable.quarter}
      ),
      counts as (
        select
          ${MyPlanQuarterCoursesTable.subjectAreaCode} as "subjectAreaCode",
          count(distinct ${MyPlanQuarterCoursesTable.code})::int as "courseCount"
        from ${MyPlanQuarterCoursesTable}
        inner join current on current.name = ${MyPlanQuarterCoursesTable.quarter}
        group by ${MyPlanQuarterCoursesTable.subjectAreaCode}
      )
      select
        ${MyPlanSubjectAreasTable.id} as id,
        ranked."subjectAreaCode",
        ${MyPlanSubjectAreasTable.title} as title,
        ${MyPlanSubjectAreasTable.campus} as campus,
        ${MyPlanSubjectAreasTable.collegeCode} as "collegeCode",
        ${MyPlanSubjectAreasTable.collegeTitle} as "collegeTitle",
        coalesce(max(counts."courseCount"), 0) as "courseCount",
        sum(ranked."enrollMax")::int as "totalEnrollMaxTop5",
        json_agg(jsonb_build_object(
          'code', ranked."code",
          'enrollMax', ranked."enrollMax",
          'enrollCount', ranked."enrollCount",
          'title', ranked."courseTitle"
        ) order by ranked."enrollMax" desc) as "topCourses"
      from ranked
      inner join ${MyPlanSubjectAreasTable}
        on ${MyPlanSubjectAreasTable.code} = ranked."subjectAreaCode"
      left join counts on counts."subjectAreaCode" = ranked."subjectAreaCode"
      where ranked.rn <= 5
      group by ${MyPlanSubjectAreasTable.id}, ranked."subjectAreaCode", ${MyPlanSubjectAreasTable.title}, ${MyPlanSubjectAreasTable.campus}, ${MyPlanSubjectAreasTable.collegeCode}, ${MyPlanSubjectAreasTable.collegeTitle}
      order by "totalEnrollMaxTop5" desc
      limit ${limit}
    `
  )

  const rows: any[] = result?.rows ?? result ?? []
  return rows.map((r) => {
    return {
      id: Number(r.id),
      code: r.subjectAreaCode,
      title: r.title,
      courseCount: Number(r.courseCount ?? 0),
      collegeCode: r.collegeCode,
      collegeTitle: r.collegeTitle,
      campus: r.campus,
    } satisfies ProgramInfo
  })
}

export default async function IndexPage() {
  const courses = CourseService.getCourses({
    limit: 40,
    sortBy: "popular",
    withEnrollData: false,
  })
  const topMajors = await unstable_cache(
    async () => {
      return await getTopMajors({ limit: 20 })
    },
    ["top-majors"],
    { revalidate: 60 * 60 * 24 } // 1 day
    // { revalidate: 1, tags: ["top-majors"] } // 1 day
  )()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Husky Search",
    description:
      "Discover and explore University of Washington courses with detailed information about credits, prerequisites, and course content.",
    url: "https://huskysearch.com",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://huskysearch.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    about: {
      "@type": "EducationalOrganization",
      name: "University of Washington",
      url: "https://www.washington.edu",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Page>
        <HeroSection />
        <RecentMajorsSection />
        <Section withPadding>
          <SectionHeader
            title="Top Majors"
            subtitle="Popular majors at UW by course seat count"
          />
          <SectionContent>
            <ProgramCardGridWithSuspense programs={topMajors} />
          </SectionContent>
        </Section>
        <Section withPadding>
          <SectionHeader
            title="Top Courses"
            subtitle="Most popular courses at UW by seat count"
          />
          <SectionContent>
            <CourseCardGridViewWithSuspense courses={courses} />
          </SectionContent>
        </Section>
      </Page>
    </>
  )
}
