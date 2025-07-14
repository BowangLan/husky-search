"use client"

import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

import { DatabaseCourse } from "@/types/course"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedList } from "./animated-list"
import {
  CourseCreditBadge,
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
} from "./course-modules"

export function CourseCardLink({ course }: { course: DatabaseCourse }) {
  return (
    <Card className="relative group isolate">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/courses/${course.code}`}
        className="absolute inset-0 cursor-pointer z-10"
        prefetch
        scroll={false}
      ></Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
        {/* Placeholder for course image */}
        <div className="flex h-full items-center justify-center">
          <ViewTransition name={`course-code-${course.id}`}>
            <div className="text-4xl font-medium text-muted-foreground/30">
              {course.code}
            </div>
          </ViewTransition>
        </div>
      </div>

      <CardContent>
        <div className="space-y-3">
          <ViewTransition name={`course-title-${course.id}`}>
            <h3 className="text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {course.title}
            </h3>
          </ViewTransition>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
            {course.description}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <CourseProgramBadgeLink course={course} size="sm" />
            <CourseCreditBadge course={course} size="sm" />
            <CourseGenEdRequirements course={course} size="sm" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const CourseCardGrid = ({ courses }: { courses: DatabaseCourse[] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatedList
        data={courses}
        getItemKey={({ item }) => item.code}
        renderItem={({ item }) => (
          <CourseCardLink key={item.id} course={item} />
        )}
      />
    </div>
  )
}
