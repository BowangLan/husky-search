import { Metadata } from "next"
import { fetchQuery } from "convex/nextjs"
import { CourseService } from "@/services/course-service"
import { api } from "@/convex/_generated/api"

import { ProgramInfo } from "@/types/program"
import { DOMAIN } from "@/config/site"
import { CourseCardGridViewWithSuspense } from "@/components/course-card"
import { HeroSection } from "@/components/hero-section"
import { Page } from "@/components/page-wrapper"
import { ProgramCardHorizontalListWithSuspense } from "@/components/program-card-horizontal-list"
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
    url: `https://${DOMAIN}`,
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
    canonical: `https://${DOMAIN}`,
  },
}


export default async function IndexPage() {
  const courses = CourseService.getCourses({
    limit: 40,
    sortBy: "popular",
    withEnrollData: false,
  })
  const topMajors = await fetchQuery(api.myplan1.subjectAreas.getTopMajors, {
    limit: 20,
  })

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Husky Search",
    description:
      "Discover and explore University of Washington courses with detailed information about credits, prerequisites, and course content.",
    url: `https://${DOMAIN}`,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `https://${DOMAIN}/search?q={search_term_string}`,
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
            title="Popular Majors"
            subtitle="Popular majors at UW by course seat count"
          />
          <SectionContent>
            <ProgramCardHorizontalListWithSuspense programs={topMajors} />
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
