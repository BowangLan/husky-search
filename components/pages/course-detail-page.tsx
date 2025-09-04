"use client"

// @ts-ignore
import { unstable_ViewTransition as ViewTransition, useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Tag,
  Users,
} from "lucide-react"

import {
  MyPlanCourseCodeGroup,
  MyPlanCourseCodeGroupWithDetail,
} from "@/types/myplan"
import {
  calculateEasiness,
  capitalize,
  capitalizeSingle,
  cn,
} from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BackButton } from "@/components/back-button"
import { Section, SectionContent, SectionHeader } from "@/components/section"

import CECEvaluations from "./course-detail/cec-evaluations"
import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
} from "../course-modules"
import { Page, PageTopToolbar } from "../page-wrapper"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"
import { ExternalLink } from "../ui/external-link"
import { Skeleton } from "../ui/skeleton"
import { CourseDetailHeader } from "./course-detail/course-detail-header"
import { CourseMetadataSection } from "./course-detail/course-metadata-section"
import { CourseSessionsSection } from "./course-detail/course-sessions-section"
import { CourseDetailStatsSection } from "./course-detail/course-stats-section"

const BigStat = ({
  label,
  value,
  total,
}: {
  label: string
  value: string | number
  total?: string | number
}) => {
  return (
    <Card hoverInteraction={false} className="flex-1">
      <CardContent>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-2xl font-semibold tracking-tight md:text-3xl">
            {value}
            {total && (
              <span className="text-sm text-muted-foreground"> / {total}</span>
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

const CourseDetailPageContentMobile = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  const [tab, setTab] = useState<"sessions" | "cec">("sessions")
  return (
    <div className="space-y-4">
      {/* Course Header */}
      <CourseDetailHeader course={course} />
      <CourseDetailStatsSection courseCode={course.code} />

      <div className="flex items-center my-6">
        <Button
          variant="ghost"
          onClick={() => setTab("sessions")}
          className={cn(
            "relative overflow-hidden transition-all duration-300 border-b-2 rounded-none hover:bg-muted/50 active:bg-muted trans",
            tab === "sessions"
              ? "border-b-foreground hover:border-b-violet-500 bg-transparent hover:bg-foreground/10 active:bg-foreground/15"
              : "border-b-transparent hover:bg-foreground/10 active:bg-foreground/15"
          )}
        >
          Sessions
        </Button>
        <Button
          variant="ghost"
          onClick={() => setTab("cec")}
          className={cn(
            "relative overflow-hidden transition-all duration-300 border-b-2 rounded-none hover:bg-muted/50 active:bg-muted trans",
            tab === "cec"
              ? "border-b-foreground hover:border-b-violet-500 bg-transparent hover:bg-foreground/10 active:bg-foreground/15"
              : "border-b-transparent hover:bg-foreground/10 active:bg-foreground/15"
          )}
        >
          CEC Evaluations
        </Button>
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

const CourseDetailPageContentDesktop = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  return (
    <div className="flex flex-row gap-4">
      {/* Course Header */}
      <div className="my-4 md:my-8 space-y-2 md:space-y-4 w-[300px] flex-none">
        <div className="flex items-center gap-2">
          {/* <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {`${course.subject} ${course.number}`}
            </Badge> */}
          <CourseProgramBadgeLink course={course} />
          {/* <CourseLevelBadge course={course} /> */}
          {/* <CourseCreditBadge course={course} /> */}
        </div>
        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <ViewTransition>
              <h1 className="text-3xl font-medium text-foreground sm:text-4xl lg:text-5xl">
                {course.code.slice(0, -3)}
                <span className="font-semibold text-primary">
                  {course.code.slice(-3, -2)}
                </span>
                {course.code.slice(-2)}
              </h1>
            </ViewTransition>
            <Tooltip>
              <TooltipTrigger>
                <span className="text-muted-foreground text-base md:text-lg lg:text-xl inline-block ml-2 font-mono">
                  ({course.data[0]!.data.credit})
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>
                  This course is worth {course.data[0]!.data.credit} credits.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            <ViewTransition>
              <h2 className="text-base font-normal text-foreground sm:text-xl opacity-60">
                {course.title}
              </h2>
            </ViewTransition>
          </div>
        </div>
        <div className="flex flex-col items-start md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            {/* <CourseLevelBadge course={course} /> */}
            {/* <CourseCreditBadge course={course} /> */}
            <CourseGenEdRequirements course={course} />
          </div>
          <div className="flex-1"></div>
        </div>

        <div className="flex items-center gap-6">
          <ExternalLink
            href={`https://myplan.uw.edu/course/#/courses/${course.code}`}
          >
            View on MyPlan
          </ExternalLink>
          <ExternalLink
            href={`https://dawgpath.uw.edu/course?id=${course.code}&campus=seattle`}
          >
            View on DawgPath
          </ExternalLink>
        </div>

        <div className="items-center gap-2 hidden">
          {/* Program */}
          <Link
            href={`/majors/${course.subjectAreaCode}`}
            prefetch
            scroll={false}
          >
            <Badge
              size="lg"
              variant="outline"
              className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
            >
              <GraduationCap className="h-5 w-5 mr-2" />
              {capitalize(course.subjectAreaTitle)}
            </Badge>
          </Link>
        </div>

        <Section>
          {/* Section header */}
          <SectionHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-base text-muted-foreground font-medium">
                Prerequisites
              </h3>
            </div>
          </SectionHeader>
          <SectionContent>
            <p className="text-muted-foreground leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {course.data[0]!.data.prereqs
                ? capitalizeSingle(course.data[0]!.data.prereqs)
                : "No prerequisites"}
            </p>
          </SectionContent>
        </Section>
      </div>

      <div className="flex-1">
        <section className="space-y-4">
          <iframe
            src={`https://myplan.uw.edu/course/#/courses/${course.code}`}
            className="w-full aspect-video overflow-hidden rounded-xl md:block hidden"
          ></iframe>
        </section>
      </div>
    </div>
  )
}

const CourseDetailPageSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <section className="my-4 md:my-8 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-28 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-6 w-64 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-24 rounded-md" />
        </div>
        <div className="flex items-center gap-6">
          <Skeleton className="h-4 w-28 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="grid grid-cols-1 gap-4">
        <Card hoverInteraction={false} className="flex-1">
          <CardContent className="py-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card hoverInteraction={false} className="flex-1">
          <CardContent className="py-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
        <Card hoverInteraction={false} className="flex-1">
          <CardContent className="py-4">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </CardContent>
        </Card>
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
                <div className="px-4 py-4 md:px-6 grid gap-3" style={{ gridTemplateColumns: "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(160px,240px)" }}>
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

  console.log(c)

  return (
    <Page className="mx-page px-page py-0">
      <PageTopToolbar>
        <BackButton url={`/majors/${course.subjectAreaCode}`} />
      </PageTopToolbar>
      {/* <div className="hidden md:block">
        <CourseDetailPageContentDesktop course={course} />
      </div> */}
      <div className="pb-12">
        {c ? (
          <CourseDetailPageContentMobile course={course} />
        ) : (
          <CourseDetailPageSkeleton />
        )}
        {/* <CECEvaluations items={(c as any)?.cecCourse} /> */}
      </div>
    </Page>
  )
}
