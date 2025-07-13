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

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BackButton } from "@/components/back-button"

import {
  CourseCreditBadge,
  CourseGenEdRequirements,
  CourseLevelBadge,
} from "../course-modules"
import { ExternalLink } from "../ui/external-link"
import { ValueLabelPairRow } from "../ui/value-label-pair-row"

export function CourseDetailPage({ course }: { course: CourseDetail }) {
  const genEdReqs = course.myplanData?.genEduReqs || []

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="bg-background">
          <BackButton />
        </div>

        {/* Course Header */}
        <div className="mb-12">
          <section className="my-4 md:my-8 space-y-2 md:space-y-4">
            <div className="flex items-center gap-3">
              {/* <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {`${course.subject} ${course.number}`}
            </Badge> */}
              <Link
                href={`/majors/${course.programCode}`}
                prefetch
                scroll={false}
              >
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
                >
                  {course.programName || "No program"}
                </Badge>
              </Link>
              {/* <CourseCreditBadge course={course} /> */}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {course.code}
              </h1>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-normal text-foreground sm:text-xl lg:text-2xl opacity-60">
                  {course.title}
                </h2>
              </div>
            </div>
            <div className="flex flex-col items-start md:flex-row md:items-center gap-2">
              <div className="flex items-center gap-2">
                <CourseLevelBadge course={course} />
                <CourseCreditBadge course={course} />
                <CourseGenEdRequirements course={course} />
              </div>
              <div className="flex-1"></div>
              <div className="flex items-center gap-6">
                <ExternalLink
                  href={`https://myplan.uw.edu/course/#/courses/${course.subject} ${course.number}`}
                >
                  View on MyPlan
                </ExternalLink>
                <ExternalLink
                  href={`https://dawgpath.uw.edu/course?id=${course.subject} ${course.number}&campus=seattle`}
                >
                  View on DawgPath
                </ExternalLink>
              </div>
            </div>
            <div className="items-center gap-2 hidden">
              {/* Program */}
              <Link
                href={`/majors/${course.programCode}`}
                prefetch
                scroll={false}
              >
                <Badge
                  size="lg"
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 cursor-pointer hover:opacity-80 trans"
                >
                  <GraduationCap className="h-5 w-5 mr-2" />
                  {course.programName || "No program"}
                </Badge>
              </Link>
            </div>
          </section>

          <section>
            <p className="text-muted-foreground leading-loose max-w-4xl text-sm md:text-base font-light">
              {course.description}
            </p>
          </section>
        </div>

        {/* General Education Requirements */}
        {course.myplanData && (
          <div className="mb-12 hidden">
            <Card className="border-muted/50 bg-muted/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {/* <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" /> */}
                  Course Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ValueLabelPairRow
                  label="Gen Edu Req"
                  value={
                    genEdReqs.length > 0 ? (
                      <CourseGenEdRequirements course={course} />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No general education requirements found for this course.
                      </p>
                    )
                  }
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
