"use client"

// @ts-ignore
import { useEffect, useState } from "react"
import { notFound, useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import {
  useTrackCourseVisit,
  useTrackMajorVisit,
} from "@/store/visit-cache.store"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"

import { ConvexCourseDetail } from "@/types/convex-courses"
import { ConvexSubjectArea } from "@/types/convex-subject-areas"
import { cn } from "@/lib/utils"
import { CourseDetailPrereqGraph } from "@/components/pages/course-detail/course-detail-prereq-graph-section"

import { Page } from "../page-wrapper"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import CECEvaluations from "./course-detail/cec-evaluations"
import { CourseDetailHeader } from "./course-detail/course-detail-header"
import { CourseDetailRecommendations } from "./course-detail/course-detail-recommendations"
import { CourseSessionsSection } from "./course-detail/course-sessions-section"
import { CourseDetailStatsSection } from "./course-detail/course-stats-section"
import { StickyCourseHeader } from "./course-detail/sticky-course-header"

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

const CourseDetailPageContent = ({
  courseCode,
  courseDetail: courseData,
  subjectArea,
}: {
  courseCode: string
  courseDetail: ConvexCourseDetail
  subjectArea: ConvexSubjectArea
}) => {
  const hasCurrentTermData =
    courseData.myplanCourse?.currentTermData &&
    courseData.myplanCourse.currentTermData.length > 0 &&
    courseData.myplanCourse.currentTermData[0]?.sessions &&
    courseData.myplanCourse.currentTermData[0].sessions.length > 0

  const [tab, setTab] = useState<
    "sessions" | "recommendations" | "cec" | "prereqs"
  >(hasCurrentTermData ? "sessions" : "cec")

  const prereqGraph = courseData.dp?.prereq_graph
  const hasRecommendationsTab = !!courseData.dp?.prereq_graph

  return (
    <div className="space-y-4 md:space-y-6">
      <StickyCourseHeader courseCode={courseCode} courseDetail={courseData} />

      <CourseDetailHeader
        courseCode={courseCode}
        courseDetail={courseData}
        subjectArea={subjectArea}
      />

      <CourseDetailStatsSection
        courseCode={courseCode}
        courseDetail={courseData}
      />

      <div className="flex items-center gap-2 my-6">
        {hasCurrentTermData && (
          <PageTab
            active={tab === "sessions"}
            onClick={() => setTab("sessions")}
          >
            Sessions
          </PageTab>
        )}
        {/* {hasRecommendationsTab && (
          <PageTab
            active={tab === "recommendations"}
            onClick={() => setTab("recommendations")}
          >
            Recommendations
          </PageTab>
        )} */}
        <PageTab active={tab === "cec"} onClick={() => setTab("cec")}>
          CEC Evaluations
        </PageTab>
        {!!prereqGraph?.x && (
          <PageTab active={tab === "prereqs"} onClick={() => setTab("prereqs")}>
            Prerequisites
          </PageTab>
        )}
      </div>

      {tab === "sessions" && hasCurrentTermData && (
        <CourseSessionsSection
          courseCode={courseCode}
          courseDetail={courseData}
        />
      )}
      {/* {tab === "recommendations" && hasRecommendationsTab && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Course Recommendations</h2>
            <p className="text-muted-foreground mb-4">
              Suggestions generated from DawgPath prerequisite and co-enrollment data.
            </p>
          </div>
          <CourseDetailRecommendations courseCode={courseCode} courseDetail={c} />
        </section>
      )} */}
      {tab === "cec" && <CECEvaluations courseDetail={courseData} />}
      {tab === "prereqs" && prereqGraph && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Prerequisite Graph</h2>
            <p className="text-muted-foreground mb-4">
              Visualize the prerequisite chain for this course. Click on any
              course node to view its details.
            </p>
          </div>
          <CourseDetailPrereqGraph
            prereqGraph={prereqGraph}
            currentCourseCode={courseCode}
            isLoading={false}
          />
        </section>
      )}

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

export function CourseDetailPage({
  courseCode,
  courseDetail,
  subjectArea,
}: {
  courseCode: string
  courseDetail: ConvexCourseDetail
  subjectArea: ConvexSubjectArea
}) {
  useTrackCourseVisit(courseCode)
  useTrackMajorVisit({
    id: 0,
    code: subjectArea.code,
    title: subjectArea.title,
    campus: subjectArea.campus,
    collegeCode: subjectArea.collegeCode,
    collegeTitle: subjectArea.collegeTitle,
    departmentCode: subjectArea.departmentCode,
    departmentTitle: subjectArea.departmentTitle,
    codeNoSpaces: subjectArea.codeNoSpaces,
    quotedCode: subjectArea.quotedCode,
    courseDuplicate: false,
  })

  return (
    <Page className="mx-page px-page">
      {/* <PageTopToolbar>
        <BackButton url={`/majors/${course.subjectAreaCode}`} />
      </PageTopToolbar> */}
      <div className="pb-12">
        <CourseDetailPageContent
          courseCode={courseCode}
          courseDetail={courseDetail}
          subjectArea={subjectArea}
        />
        {/* <CECEvaluations items={(c as any)?.cecCourse} /> */}
      </div>
    </Page>
  )
}
