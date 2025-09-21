"use client"

import {
  // @ts-ignore
  unstable_ViewTransition as ViewTransition,
} from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { ProgramDetail } from "@/services/program-service"
import { useQuery } from "convex/react"
import { Loader, TrendingDown } from "lucide-react"

import { DOMAIN, EASIEST_COURSES_LIMIT } from "@/config/site"
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
    name: `Easiest ${program.title} Courses`,
    description: `A ranked list of the easiest ${program.title} courses at University of Washington based on GPA distribution data`,
    url: `https://${DOMAIN}/majors/${program.code}/easiest`,
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

export function EasiestCoursesPage({ program }: { program: ProgramDetail }) {
  const subjectArea = program.code
  const easiestCourses = useQuery(api.myplan.getEasiestCoursesByMajor, {
    subjectArea: subjectArea ?? "",
  })

  const isLoading = easiestCourses === undefined

  return (
    <>
      {/* Structured Data */}
      {easiestCourses && easiestCourses.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              generateStructuredData(program, easiestCourses)
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
            <TrendingDown className="h-4 w-4 text-green-600" />
          </div>
        }
        title={
          <ViewTransition>
            <PageTitle>
              {EASIEST_COURSES_LIMIT} Easiest {capitalize(program.title)}{" "}
              Courses
            </PageTitle>
          </ViewTransition>
        }
        subtitle={
          <div>
            Courses ranked by easiness score based on GPA distribution data
          </div>
        }
        topToolbar={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/majors/${program.code}`}>All Courses</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/majors/${program.code}/toughest`}>Toughest</Link>
            </Button>
          </div>
        }
      >
        <div>
          {isLoading ? (
            <div className="px-page mx-page flex justify-center items-center">
              <Loader size={40} className="animate-spin" />
            </div>
          ) : (easiestCourses?.length ?? 0) === 0 ? (
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
                  <SectionTitle>Easiest Courses to Get Into</SectionTitle>
                </SectionHeader> */}
                <SectionContent>
                  {/* <div className="mb-6 text-sm text-muted-foreground">
                    Courses are ranked by easiness score calculated from GPA
                    distribution. Higher scores mean easier courses.
                  </div> */}
                  <CourseLeaderboard
                    courses={easiestCourses ?? []}
                    type="easiest"
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
