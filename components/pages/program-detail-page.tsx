// @ts-ignore
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

import { PageTitle, PageWithHeaderLayout } from "../page-wrapper"

export function ProgramDetailPage({
  program,
  courses,
}: {
  program: Program
  courses: DatabaseCourse[]
}) {
  return (
    <PageWithHeaderLayout
      titleTop={
        <Badge variant={"secondary"} size="default">
          Major
        </Badge>
      }
      title={
        <ViewTransition name={`program-title-${program.id}`}>
          <PageTitle>{program.name}</PageTitle>
        </ViewTransition>
      }
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{program.courseCount} courses available</span>
        </div>
      }
    >
      <section className="px-page mx-page">
        <div className="mx-auto max-w-7xl">
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
      </section>
    </PageWithHeaderLayout>
  )
}
