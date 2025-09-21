"use client"

import {
  // @ts-ignore
  unstable_ViewTransition as ViewTransition,
} from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { ProgramDetail } from "@/services/program-service"
import { useQuery } from "convex/react"
import { Loader, TrendingUp } from "lucide-react"

import { TOUGHEST_COURSES_LIMIT } from "@/config/site"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { CourseLeaderboard } from "../course-leaderboard"
import { PageTitle, PageWithHeaderLayout } from "../page-wrapper"
import {
  Section,
  SectionContent,
  SectionHeader,
  SectionTitle,
} from "../section"

// Structured data for course listings
const generateStructuredData = (program: ProgramDetail, courses: any[]) => {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Toughest ${program.title} Courses`,
    description: `A ranked list of the most challenging ${program.title} courses at University of Washington based on GPA distribution data`,
    url: `https://huskysearch.fyi/majors/${program.code}/toughest`,
    numberOfItems: courses.length,
    itemListElement: courses.slice(0, 10).map((course, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Course",
        name: course.title,
        courseCode: course.courseCode,
        description: course.description,
        provider: {
          "@type": "Organization",
          name: "University of Washington",
          url: "https://www.washington.edu",
        },
        educationalLevel: "UndergraduateLevel",
        subject: program.title,
        learningResourceType: "Course",
        inLanguage: "en-US",
      },
    })),
  }
}

export function ToughestCoursesPage({ program }: { program: ProgramDetail }) {
  const subjectArea = program.code
  const toughestCourses = useQuery(api.myplan.getToughestCoursesByMajor, {
    subjectArea: subjectArea ?? "",
  })

  const isLoading = toughestCourses === undefined

  return (
    <>
      {/* Structured Data */}
      {toughestCourses && toughestCourses.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateStructuredData(program, toughestCourses)
            ),
          }}
        />
      )}

      <PageWithHeaderLayout
        titleTop={
          <div className="flex items-center gap-2">
            <Badge variant={"secondary"} size="default">
              Major
            </Badge>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </div>
        }
        title={
          <ViewTransition>
            <PageTitle>
              {TOUGHEST_COURSES_LIMIT} Toughest {capitalize(program.title)}{" "}
              Courses
            </PageTitle>
          </ViewTransition>
        }
        subtitle={
          <div>
            Most difficult courses ranked by easiness score based on GPA
            distribution data
          </div>
        }
        topToolbar={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/majors/${program.code}`}>All Courses</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/majors/${program.code}/easiest`}>Easiest</Link>
            </Button>
          </div>
        }
      >
        <div>
          {isLoading ? (
            <div className="px-page mx-page flex justify-center items-center">
              <Loader size={40} className="animate-spin" />
            </div>
          ) : (toughestCourses?.length ?? 0) === 0 ? (
            <section className="px-page mx-page">
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">
                  No course data available for this program. Check back later.
                </div>
              </div>
            </section>
          ) : (
            <div className="px-page mx-page">
              <Section>
                {/* <SectionHeader>
                  <SectionTitle>Most Competitive Courses</SectionTitle>
                </SectionHeader> */}
                <SectionContent>
                  {/* <div className="mb-6 text-sm text-muted-foreground">
                    Courses are ranked by easiness score calculated from GPA
                    distribution. Lower scores mean more difficult courses.
                  </div> */}
                  <CourseLeaderboard
                    courses={toughestCourses ?? []}
                    type="toughest"
                    showRanking={true}
                  />
                </SectionContent>
              </Section>
            </div>
          )}
        </div>
      </PageWithHeaderLayout>
    </>
  )
}
