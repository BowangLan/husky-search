// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"
import { CourseDetail } from "@/services/course-service"
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  GraduationCap,
  Tag,
  Users,
} from "lucide-react"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { capitalize } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"

import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
} from "../course-modules"
import { ExternalLink } from "../ui/external-link"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"
import { ValueLabelPairRow } from "../ui/value-label-pair-row"

export function CourseDetailPage({
  course,
}: {
  course: MyPlanCourseCodeGroup
}) {
  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20 mx-page px-page">
      <div className="py-4">
        {/* Back Navigation */}
        {/* TODO: Replace with breadcrumbs */}
        <div className="bg-background">
          <BackButton url={`/majors/${course.subjectAreaCode}`} />
        </div>

        {/* Course Header */}
        <div className="mb-12">
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
                      This course is worth {course.data[0]!.data.credit}{" "}
                      credits.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <ViewTransition name={`course-title-${course.code}`}>
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

          {/* <section>
            <p className="text-muted-foreground leading-loose max-w-4xl text-sm md:text-base font-light">
              {course.description}
            </p>
          </section> */}
        </div>
      </div>
    </div>
  )
}
