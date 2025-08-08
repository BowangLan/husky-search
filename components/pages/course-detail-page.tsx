// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"
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
import { capitalize, capitalizeSingle } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { BackButton } from "@/components/back-button"
import { Section, SectionContent, SectionHeader } from "@/components/section"

import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
} from "../course-modules"
import { Page, PageTopToolbar } from "../page-wrapper"
import { ExternalLink } from "../ui/external-link"

const CourseDetailPageContentMobile = ({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) => {
  return (
    <div>
      {/* Course Header */}
      <section className="my-4 md:my-8 space-y-2 md:space-y-4">
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
              <h2 className="text-base font-normal text-foreground sm:text-xl lg:text-2xl opacity-60">
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
      </section>

      <Section>
        <SectionHeader border>
          <div className="flex items-center gap-2">
            {/* <GraduationCap className="h-4 w-4 text-muted-foreground" /> */}
            <h3 className="text-sm text-muted-foreground font-medium">
              Prerequisites
            </h3>
          </div>
        </SectionHeader>
        <SectionContent>
          <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
            {course.data[0]!.data.prereqs
              ? capitalizeSingle(course.data[0]!.data.prereqs)
              : "No prerequisites"}
          </p>
        </SectionContent>
      </Section>

      <Section>
        <SectionHeader border>
          <div className="flex items-center gap-2">
            {/* <GraduationCap className="h-4 w-4 text-muted-foreground" /> */}
            <h3 className="text-sm text-muted-foreground font-medium">
              Description
            </h3>
          </div>
        </SectionHeader>
        <SectionContent>
          <p className="leading-relaxed max-w-4xl text-sm md:text-base font-light">
            {course.detail?.courseSummaryDetails.courseDescription}
          </p>
        </SectionContent>
      </Section>

      {/* CEC Data */}
      <div className="w-[300px] flex-none">
        <Section>
          <SectionHeader>
            <div className="flex items-center gap-2">
              <h3 className="text-base text-muted-foreground font-medium">
                CEC Data
              </h3>
            </div>
          </SectionHeader>
          <SectionContent>
            <p className="text-muted-foreground leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {JSON.stringify(course.cecData)}
            </p>
          </SectionContent>
        </Section>
      </div>

      <section className="space-y-4">
        <iframe
          src={`https://myplan.uw.edu/course/#/courses/${course.code}`}
          className="w-full aspect-video overflow-hidden rounded-xl md:block hidden"
        ></iframe>

        {/* DawgPath */}
        {/* <iframe
              src={`https://dawgpath.uw.edu/course?id=${course.code}&${
                course.data[0]!.data.campus
              }`}
              className="w-full aspect-video overflow-hidden rounded-xl"
            ></iframe> */}
      </section>
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

      {/* CEC Data */}
      <div className="w-[300px] flex-none">
        <Section>
          <SectionHeader>
            <div className="flex items-center gap-2">
              <h3 className="text-base text-muted-foreground font-medium">
                CEC Data
              </h3>
            </div>
          </SectionHeader>
          <SectionContent>
            <p className="text-muted-foreground leading-relaxed max-w-4xl text-sm md:text-base font-light">
              {JSON.stringify(course.cecData)}
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

export function CourseDetailPage({
  course,
}: {
  course: MyPlanCourseCodeGroupWithDetail
}) {
  return (
    <Page className="mx-page px-page py-0">
      <PageTopToolbar>
        <BackButton url={`/majors/${course.subjectAreaCode}`} />
      </PageTopToolbar>
      {/* <div className="hidden md:block">
        <CourseDetailPageContentDesktop course={course} />
      </div> */}
      <div className="">
        <CourseDetailPageContentMobile course={course} />
      </div>
    </Page>
  )
}
