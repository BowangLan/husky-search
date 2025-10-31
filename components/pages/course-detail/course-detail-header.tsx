"use client"

import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { GraduationCap } from "lucide-react"

import { capitalize, getGenEdLabel } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ExternalLink } from "@/components/ui/external-link"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getQuarterColor } from "@/components/course-modules"
import { CourseScheduleButton } from "./course-schedule-button"

export const CourseDetailHeader = ({ courseCode }: { courseCode: string }) => {
  const courseData = useQuery(api.courses.getByCourseCode, { courseCode })

  // Extract subject area code from course code (e.g., "CSE142" -> "CSE")
  const subjectAreaCode = courseCode?.replace(/\d+$/, "") || ""
  const subjectArea = useQuery(
    api.myplan1.subjectAreas.getByCode,
    subjectAreaCode ? { code: subjectAreaCode } : "skip"
  )

  if (!courseData?.myplanCourse) {
    return null
  }

  const hasCurrentTermData =
    courseData?.myplanCourse?.currentTermData &&
    courseData.myplanCourse.currentTermData.length > 0 &&
    courseData.myplanCourse.currentTermData[0]?.sessions &&
    courseData.myplanCourse.currentTermData[0].sessions.length > 0

  const termsOfferedFromConvex = (courseData.myplanCourse as any)
    ?.termsOffered as string[] | undefined
  // Note: We no longer have access to course.detail, but the main data source should be sufficient
  const termsOfferedFromDetail = undefined

  const normalizedOfferedTerms = Array.from(
    new Set(
      (termsOfferedFromConvex ?? termsOfferedFromDetail ?? [])
        .filter(Boolean)
        .map((t) => `${t}`.toLowerCase())
    )
  )

  const orderedQuarterMeta = [
    { key: "autumn", label: "Autumn", num: 4 },
    { key: "winter", label: "Winter", num: 1 },
    { key: "spring", label: "Spring", num: 2 },
    { key: "summer", label: "Summer", num: 3 },
  ] as const

  const offeredQuarterBadges = orderedQuarterMeta.filter((q) =>
    normalizedOfferedTerms.includes(q.key)
  )

  const courseTitle = courseData.myplanCourse?.title
  const courseCredit = courseData.myplanCourse?.credit

  return (
    // my should be the same as page-wrapper
    <section
      id="course-detail-main-header"
      className="my-page-header space-y-4 md:space-y-6"
    >
      <div className="flex items-center gap-2 pb-2">
        {/* <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {`${course.subject} ${course.number}`}
            </Badge> */}
        <Link href={`/majors/${subjectAreaCode}`} prefetch scroll={false}>
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
          >
            {subjectAreaCode}
          </Badge>
        </Link>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <h1 className="text-3xl font-medium text-foreground sm:text-4xl lg:text-5xl leading-6">
            {courseCode.slice(0, -3)}
            <span className="font-semibold text-primary">
              {courseCode.slice(-3, -2)}
            </span>
            {courseCode.slice(-2)}
          </h1>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-muted-foreground text-base md:text-lg lg:text-xl inline-block ml-2 font-mono">
                ({courseData.myplanCourse?.credit})
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>
                This course is worth {courseData.myplanCourse.credit} credits.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-light text-foreground sm:text-xl lg:text-2xl opacity-60">
            {courseData.myplanCourse.title}
          </h2>
          {!hasCurrentTermData && (
            <Badge
              variant="outline"
              className="bg-muted/50 text-muted-foreground border-muted-foreground/20 text-xs"
            >
              Not Currently Offered
            </Badge>
          )}
        </div>
      </div>
      <div className="flex flex-col items-start md:flex-row md:items-center gap-2">
        <div className="flex flex-col md:flex-row md:items-center mt-1 md:mt-0 gap-2">
          {/* <CourseLevelBadge course={course} /> */}
          {/* <CourseCreditBadge course={course} /> */}
          {/* Gen Ed Requirements */}
          {courseData?.myplanCourse?.genEdReqs &&
            courseData.myplanCourse.genEdReqs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {courseData.myplanCourse.genEdReqs.map(
                  (req: string, index: number) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Badge variant="blue-outline" className="z-20">
                          {req}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        {getGenEdLabel(req)}
                      </TooltipContent>
                    </Tooltip>
                  )
                )}
              </div>
            )}

          {/* Quarter Badges */}
          {offeredQuarterBadges.length > 0 && (
            <>
              {/* Desktop */}
              <div className="items-center gap-2 ml-1 hidden md:flex">
                {offeredQuarterBadges.map((q) => (
                  <Badge
                    key={q.key}
                    variant={`${getQuarterColor(q.num)}`}
                    className="text-xs px-2 h-8"
                  >
                    {q.label}
                  </Badge>
                ))}
              </div>
              {/* Mobile */}
              <div className="items-center gap-2 flex md:hidden">
                {offeredQuarterBadges.map((q) => (
                  <Badge
                    key={q.key}
                    variant={`${getQuarterColor(q.num)}`}
                    className="text-xs px-1.5 h-6"
                  >
                    {q.label}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 md:block hidden"></div>

        {/* Desktop */}
        <div className="items-center flex-row gap-6 md:flex hidden">
          <CourseScheduleButton
            courseCode={courseCode}
            courseTitle={courseTitle}
            courseCredit={courseCredit}
            variant="desktop"
          />
          <ExternalLink
            href={`https://myplan.uw.edu/course/#/courses/${courseCode}`}
          >
            View on MyPlan
          </ExternalLink>
          <ExternalLink
            // TODO: make campus dynamic, need to get the map of campus codes to names
            href={`https://dawgpath.uw.edu/course?id=${courseCode}&campus=seattle`}
          >
            View on DawgPath
          </ExternalLink>
        </div>

        {/* Mobile */}
        <div className="gap-2 md:hidden flex w-full flex-row items-center justify-around mt-4">
          <CourseScheduleButton
            courseCode={courseCode}
            courseTitle={courseTitle}
            courseCredit={courseCredit}
            variant="mobile"
          />
          <ExternalLink
            href={`https://myplan.uw.edu/course/#/courses/${courseCode}`}
            className="flex-1 text-center justify-center bg-button-accent-hover-active rounded-md py-2.5 hover:text-foreground"
          >
            MyPlan
          </ExternalLink>
          <ExternalLink
            // TODO: make campus dynamic, need to get the map of campus codes to names
            href={`https://dawgpath.uw.edu/course?id=${courseCode}&campus=seattle`}
            className="flex-1 text-center justify-center bg-button-accent-hover-active rounded-md py-2.5 hover:text-foreground"
          >
            DawgPath
          </ExternalLink>
        </div>
      </div>
      <div className="items-center gap-2 hidden">
        {/* Program */}
        <Link href={`/majors/${subjectAreaCode}`} prefetch scroll={false}>
          <Badge
            size="lg"
            variant="outline"
            className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
          >
            <GraduationCap className="h-5 w-5 mr-2" />
            {capitalize(subjectArea?.title || subjectAreaCode)}
          </Badge>
        </Link>
      </div>
    </section>
  )
}
