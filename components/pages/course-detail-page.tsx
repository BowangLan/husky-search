import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  GraduationCap,
  Tag,
  Users,
} from "lucide-react"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { ExternalLink } from "../ui/external-link"

export function CourseDetailPage({ course }: { course: DatabaseCourse }) {
  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="bg-background">
          <Link href="/">
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:opacity-80 px-0 has-[>svg]:px-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
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
              <Badge
                variant="outline"
                className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/20"
              >
                {course.credit} Credits
              </Badge>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {`${course.subject} ${course.number}`}
              </h1>
              <h2 className="text-base font-normal text-foreground sm:text-xl lg:text-2xl opacity-60">
                {course.title}
              </h2>
            </div>
            <div className="flex items-center gap-4">
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
      </div>
    </div>
  )
}
