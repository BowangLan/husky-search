"use client"

// @ts-ignore
import { Suspense, unstable_ViewTransition as ViewTransition, use } from "react"
import Link from "next/link"

import { MyPlanCourseCodeGroup } from "@/types/myplan"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import { AnimatedList } from "./animated-list"
import {
  CourseGenEdRequirements,
  CourseProgramBadgeLink,
  CourseQuarterBadges,
} from "./course-modules"
import { Progress } from "./ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"

export function CourseCardLink({
  course,
  className,
}: {
  course: MyPlanCourseCodeGroup
  className?: string
}) {
  return (
    <Card className={cn("relative group isolate", className)}>
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
              <div className="flex items-baseline flex-none">
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
            </div>
            <ViewTransition>
              <h3 className="text-xs md:text-sm font-normal text-foreground opacity-60 line-clamp-1">
                {course.title}
              </h3>
            </ViewTransition>
            {/* <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
              {course.description}
            </p> */}

            {/* Row */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <CourseProgramBadgeLink course={course} size="sm" />
              {/* <CourseCreditBadge course={course} size="sm" /> */}
              <CourseGenEdRequirements course={course} size="sm" />
            </div>

            {/* Row */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <CourseQuarterBadges course={course} />
              <div className="flex-1"></div>

              {/* Enroll max */}
              {course.enrollData && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-foreground/60 font-light z-20 cursor-default text-right">
                      <span className="font-medium text-foreground text-sm">
                        {course.enrollData.enrollMax}
                      </span>{" "}
                      seats
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="">
                      Maximum capacity: {course.enrollData.enrollMax} seats
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Row: enroll progress */}
            {course.enrollData && course.enrollData.enrollCount && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex justify-between">
                  {/* <div></div> */}
                  <span className="text-xs text-foreground/60 font-light">
                    <span className="font-medium text-foreground text-sm">
                      {course.enrollData.enrollMax -
                        course.enrollData.enrollCount}{" "}
                    </span>
                    avail of {course.enrollData.enrollMax}
                  </span>
                  {/* seats left */}
                  <span className="text-xs text-foreground/60 font-light text-right">
                    {Math.round(
                      (course.enrollData.enrollCount /
                        course.enrollData.enrollMax) *
                        100
                    )}
                    % full
                  </span>
                </div>
                <Progress
                  className="h-1.5 bg-neutral-200 dark:bg-neutral-700"
                  indicatorClassName="bg-green-400 dark:bg-green-500"
                  value={
                    (course.enrollData.enrollCount /
                      course.enrollData.enrollMax) *
                    100
                  }
                />
              </div>
            )}

            {/* Row: description */}
            <div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
                {/* {"No description available"} */}
                {/* {course.description} */}
                {/* {course.enrollCount} / {course.enrollMax} */}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const CourseCardSkeleton = ({ className }: { className?: string }) => {
  return (
    <Card className={cn("relative group isolate", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30 hidden md:block">
        <Skeleton className="h-full w-full" />
      </div>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="flex items-baseline flex-none">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-12 ml-2" />
              </div>
              <div className="flex-1"></div>
            </div>
            <Skeleton className="h-4 w-48 mt-1" />

            {/* Row */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Row */}
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>

            {/* Row: enroll progress */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>

            {/* Row: description */}
            <div>
              <Skeleton className="h-4 w-full mt-2" />
              <Skeleton className="h-4 w-3/4 mt-1" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export const CourseCardGridViewSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <CourseCardSkeleton key={index} />
      ))}
    </div>
  )
}

export const CourseCardGridView = ({
  courses: coursesFromProps,
  animated = true,
}: {
  courses: MyPlanCourseCodeGroup[] | Promise<MyPlanCourseCodeGroup[]>
  animated?: boolean
}) => {
  const courses =
    coursesFromProps instanceof Promise
      ? use(coursesFromProps)
      : coursesFromProps
  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {animated ? (
        <AnimatedList
          data={courses}
          getItemKey={({ item }) => item.code}
          renderItem={({ item }) => (
            <CourseCardLink key={item.code} course={item} />
          )}
        />
      ) : (
        courses.map((course) => (
          <CourseCardLink key={course.code} course={course} />
        ))
      )}
    </div>
  )
}

export const CourseCardGridViewWithSuspense = ({
  courses,
}: {
  courses: Promise<MyPlanCourseCodeGroup[]>
}) => {
  return (
    <Suspense fallback={<CourseCardGridViewSkeleton />}>
      <CourseCardGridView courses={courses} />
    </Suspense>
  )
}

export const CourseCardListItem = ({
  course,
}: {
  course: MyPlanCourseCodeGroup
}) => {
  return (
    <div className="flex flex-row gap-4 py-3 px-4 relative isolate hover:bg-foreground/5 dark:hover:bg-foreground/10 rounded-lg trans cursor-pointer">
      <div className="flex flex-col">
        <div className="flex items-center flex-none">
          <h3 className="text-base md:text-lg font-medium">{course.code}</h3>
          <span className="text-muted-foreground text-xs md:text-sm inline-block ml-2 font-mono mt-[1px]">
            ({course.data[0]?.data.credit ?? ""})
          </span>
          <div className="ml-3">
            <CourseQuarterBadges course={course} />
          </div>
        </div>
        <div className="flex flex-row items-center gap-2">
          <p className="text-xs md:text-sm text-muted-foreground font-normal">
            {course.title}
          </p>
          {/* <CourseGenEdRequirements course={course} size="sm" /> */}
        </div>
      </div>
      <div className="flex-1"></div>
      <div className="flex flex-col gap-2 items-end">
        <div className="flex items-center gap-2 flex-wrap">
          <CourseGenEdRequirements course={course} size="sm" />
          <CourseProgramBadgeLink course={course} size="sm" />
        </div>
        {/* <div className="flex items-center gap-2 flex-wrap">
          <CourseQuarterBadges course={course} />
        </div> */}
      </div>
    </div>
  )
}

export const CourseCardListView = ({
  courses,
}: {
  courses: MyPlanCourseCodeGroup[]
}) => {
  return (
    <div className="flex flex-col gap-1">
      {courses.map((course) => (
        <CourseCardListItem key={course.code} course={course} />
      ))}
    </div>
  )
}
