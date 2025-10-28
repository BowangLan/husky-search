"use client"

// @ts-ignore
import { useState } from "react"
import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import {
  useTrackCourseVisit,
  useTrackMajorVisit,
} from "@/store/visit-cache.store"
import { useQuery } from "convex/react"

import { cn } from "@/lib/utils"

import { Page } from "../page-wrapper"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import CECEvaluations from "./course-detail/cec-evaluations"
import { CourseDetailHeader } from "./course-detail/course-detail-header"
import { CourseSessionsSection } from "./course-detail/course-sessions-section"
import { CourseDetailStatsSection } from "./course-detail/course-stats-section"

const PageTab = ({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) => {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "relative overflow-hidden group border-b-2 border-transparent bg-transparent rounded-none trans p-0 h-auto",
        active
          ? "border-b-foreground hover:border-b-violet-500"
          : "border-b-transparent"
      )}
    >
      <div
        className={cn(
          "rounded-md trans px-3 h-8 flex items-center mb-2",
          active
            ? "bg-button-accent-hover-active"
            : "bg-button-ghost-hover-active"
        )}
      >
        {children}
      </div>
    </Button>
  )
}

const CourseDetailPageContent = ({ courseCode }: { courseCode: string }) => {
  const c = useQuery(api.courses.getByCourseCode, { courseCode })
  const hasCurrentTermData =
    c?.myplanCourse?.currentTermData &&
    c.myplanCourse.currentTermData.length > 0 &&
    c.myplanCourse.currentTermData[0]?.sessions &&
    c.myplanCourse.currentTermData[0].sessions.length > 0

  const [tab, setTab] = useState<"sessions" | "cec">(
    hasCurrentTermData ? "sessions" : "cec"
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <CourseDetailHeader courseCode={courseCode} />
      <CourseDetailStatsSection courseCode={courseCode} />

      <div className="flex items-center gap-2 my-6">
        {hasCurrentTermData && (
          <PageTab
            active={tab === "sessions"}
            onClick={() => setTab("sessions")}
          >
            Sessions
          </PageTab>
        )}
        <PageTab active={tab === "cec"} onClick={() => setTab("cec")}>
          CEC Evaluations
        </PageTab>
      </div>

      {tab === "sessions" && hasCurrentTermData && (
        <CourseSessionsSection courseCode={courseCode} />
      )}
      {tab === "cec" && <CECEvaluations courseCode={courseCode} />}

      {/* {gpaDistro && gpaDistro.length > 0 ? (
        <EasinessPieChart data={gpaDistro} />
      ) : null} */}

      {/* <section className="space-y-4">
        <iframe
          src={`https://myplan.uw.edu/course/#/courses/${courseCode}`}
          className="w-full aspect-video overflow-hidden rounded-xl md:block hidden"
        ></iframe>
      </section> */}

      {/* <section>
        <iframe
          src={
            "https://sdb.admin.uw.edu/timeschd/uwnetid/sln.asp?QTRYR=WIN+2026&SLN=15893"
          }
          className="w-full aspect-video overflow-hidden rounded-xl md:block hidden"
        ></iframe>
      </section> */}
    </div>
  )
}

const CourseDetailPageSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <section className="my-4 md:my-8 space-y-2 md:space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[30px] w-[90px]" />
        </div>
        <div className="space-y-2">
          <div className="flex items-end gap-2 mb-2">
            <Skeleton className="h-[36px] sm:h-[40px] lg:h-[48px] w-[240px]" />
            <Skeleton className="h-[28px] w-[36px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[32px] w-[350px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-[30px] w-[40px]" />
          <Skeleton className="h-[30px] w-[50px]" />
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[30px] w-[128px]" />
            <Skeleton className="h-[30px] w-[148px]" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:col-span-7">
          <Skeleton className="h-[114px]" />
          <Skeleton className="h-[114px]" />
          <Skeleton className="h-[114px]" />
        </div>
        <Skeleton className="lg:col-span-7 space-y-4 min-w-0 lg:row-start-2 h-[256px]" />
        <Skeleton className="lg:col-span-5 space-y-4 min-w-0 lg:row-start-1 lg:col-start-8 lg:row-span-2" />
      </section>

      {/* Tabs skeleton */}
      <div className="flex items-center my-6 gap-4">
        <Skeleton className="h-8 w-24 rounded-none" />
        <Skeleton className="h-8 w-36 rounded-none" />
      </div>

      {/* Sessions skeleton */}
      <Card className="overflow-hidden" hoverInteraction={false}>
        <CardContent className="px-0">
          <div className="my-4 mx-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-0">
                <div className="border-t" />
                <div
                  className="px-4 py-4 md:px-6 grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(160px,240px)",
                  }}
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function CourseDetailPage({ courseCode }: { courseCode: string }) {
  const c = useQuery(api.courses.getByCourseCode, { courseCode })

  // Extract subject area code from course code (e.g., "CSE 142" -> "CSE")
  const subjectAreaCode = courseCode?.replace(/\d+$/, "").trim() || ""
  const subjectArea = useQuery(
    api.myplan1.subjectAreas.getByCode,
    subjectAreaCode ? { code: subjectAreaCode } : "skip"
  )
  // const c = useQuery(api.courses.getByCourseCodeDev, {
  //   courseCode: course.code,
  // })

  useTrackCourseVisit(courseCode)
  useTrackMajorVisit({
    id: 0,
    code: subjectArea?.code || subjectAreaCode,
    title: subjectArea?.title || subjectAreaCode,
    campus: "",
    collegeCode: "",
    collegeTitle: "",
    departmentCode: "",
    departmentTitle: "",
    codeNoSpaces: "",
    quotedCode: "",
    courseDuplicate: false,
  })

  const isLoading = c === undefined

  // console.log(c)

  if (c?.myplanCourse === null) {
    // should be detected by generateMetadata
    return notFound()
  }

  return (
    <Page className="mx-page px-page">
      {/* <PageTopToolbar>
        <BackButton url={`/majors/${course.subjectAreaCode}`} />
      </PageTopToolbar> */}
      <div className="pb-12">
        {isLoading ? (
          <CourseDetailPageSkeleton />
        ) : (
          <CourseDetailPageContent courseCode={courseCode} />
        )}
        {/* <CECEvaluations items={(c as any)?.cecCourse} /> */}
      </div>
    </Page>
  )
}
