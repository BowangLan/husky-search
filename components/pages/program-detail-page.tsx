import { unstable_ViewTransition as ViewTransition } from "react"
import { notFound } from "next/navigation"
import { CourseService } from "@/services/course-service"
import { ProgramService } from "@/services/program-service"

import { Course, DatabaseCourse } from "@/types/course"
import { Program } from "@/types/program"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnimatedList } from "@/components/animated-list"
import { CourseCardGrid, CourseCardLink } from "@/components/course-card"

export function ProgramDetailPage({
  program,
  courses,
}: {
  program: Program
  courses: DatabaseCourse[]
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <ViewTransition name={`program-title-${program.id}`}>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                {program.name}
              </h1>
            </ViewTransition>
            <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
              Explore courses and curriculum for the {program.name} program at
              the University of Washington.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{program.courseCount} courses available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Program Details */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl mb-4">
              Available Courses
            </h2>
            <p className="text-muted-foreground mb-8">
              Browse through the courses offered in the {program.name} program.
            </p>

            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground text-lg">
                  No courses found for this program. Please check back later.
                </div>
              </div>
            ) : (
              <CourseCardGrid courses={courses} />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
