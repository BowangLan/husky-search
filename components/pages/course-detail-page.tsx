"use client"

// @ts-ignore
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import {
  useTrackCourseVisit,
  useTrackMajorVisit,
} from "@/store/visit-cache.store"
import { useQuery } from "convex/react"

import { MyPlanCourseCodeGroupWithDetail } from "@/types/myplan"
import { cn } from "@/lib/utils"

import { Page, PageTopToolbar } from "../page-wrapper"
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

const CourseDetailPageContentMobile = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  const [tab, setTab] = useState<"sessions" | "cec">("sessions")
  return (
    <div className="space-y-4 md:space-y-6">
      <CourseDetailHeader course={course} />
      <CourseDetailStatsSection courseCode={course.code} />

      <div className="flex items-center gap-2 my-6">
        <PageTab active={tab === "sessions"} onClick={() => setTab("sessions")}>
          Sessions
        </PageTab>
        <PageTab active={tab === "cec"} onClick={() => setTab("cec")}>
          CEC Evaluations
        </PageTab>
      </div>

      {tab === "sessions" && <CourseSessionsSection courseCode={course.code} />}
      {tab === "cec" && <CECEvaluations courseCode={course.code} />}

      {/* {gpaDistro && gpaDistro.length > 0 ? (
        <EasinessPieChart data={gpaDistro} />
      ) : null} */}

      {/* <section className="space-y-4">
        <iframe
          src={`https://myplan.uw.edu/course/#/courses/${course.code}`}
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
          <div className="flex items-end gap-2 h-[50px]">
            <Skeleton className="h-12 w-[240px]" />
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

export function CourseDetailPage({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) {
  const c = useQuery(api.courses.getByCourseCode, { courseCode: course.code })

  useTrackCourseVisit(course.code)
  useTrackMajorVisit({
    id: 0,
    code: course.subjectAreaCode,
    title: course.subjectAreaTitle,
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

  console.log(c)

  return (
    <Page className="mx-page px-page">
      {/* <PageTopToolbar>
        <BackButton url={`/majors/${course.subjectAreaCode}`} />
      </PageTopToolbar> */}
      {/* <div className="hidden md:block">
        <CourseDetailPageContentDesktop course={course} />
      </div> */}
      <div className="pb-12">
        {isLoading ? (
          <CourseDetailPageSkeleton />
        ) : (
          <CourseDetailPageContentMobile course={course} />
        )}
        {/* <CECEvaluations items={(c as any)?.cecCourse} /> */}
      </div>
    </Page>
  )
}
