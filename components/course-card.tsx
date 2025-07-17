"use client"

// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedList } from "./animated-list"
import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
  CourseQuarterBadges,
} from "./course-modules"

export function CourseCardLink({ course }: { course: MyPlanCourseCodeGroup }) {
  return (
    <Card className="relative group isolate">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/courses/${course.code}`}
        className="absolute inset-0 cursor-pointer z-10"
        prefetch
      ></Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30 hidden md:block">
        {/* Placeholder for course image */}
        <div className="flex h-full items-center justify-center">
          <div className="text-3xl font-medium text-muted-foreground/30">
            {course.code}
          </div>
        </div>
      </div>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="flex items-baseline">
                <h3 className="text-base md:text-lg font-medium">
                  {course.code}
                </h3>
                <span className="text-muted-foreground text-xs md:text-sm inline-block ml-2 font-mono">
                  ({course.data[0]?.data.credit ?? ""})
                </span>
              </div>
              <div className="flex-1"></div>
              {/* <div className="text-muted-foreground text-sm inline-block ml-2 font-mono">
                {course.data[0]?.data.sectionGroups.length ?? 0}
              </div> */}
              <CourseQuarterBadges course={course} />
            </div>
            <ViewTransition>
              <h3 className="text-xs md:text-sm font-normal text-foreground opacity-60 line-clamp-1">
                {course.title}
              </h3>
            </ViewTransition>
            {/* <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
              {course.description}
            </p> */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <CourseProgramBadgeLink course={course} size="sm" />
              {/* <CourseCreditBadge course={course} size="sm" /> */}
              <CourseGenEdRequirements course={course} size="sm" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const CourseCardGrid = ({
  courses,
}: {
  courses: MyPlanCourseCodeGroup[]
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatedList
        data={courses}
        getItemKey={({ item }) => item.code}
        renderItem={({ item }) => (
          <CourseCardLink key={item.code} course={item} />
        )}
      />
    </div>
  )
}
