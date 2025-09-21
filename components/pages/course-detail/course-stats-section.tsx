"use client"

import { api } from "@/convex/_generated/api"
import { CourseDetail } from "@/convex/courses"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { Activity, Gauge, GraduationCap, Scale } from "lucide-react"

import { COMPONENTS, useHasComponentAccess } from "@/config/permissions"
import {
  easinessScore,
  medianGPA,
  standardDeviationGPA,
  weightedMeanGPA,
} from "@/lib/gpa-utils"
import { getColor4, getColor100 } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BigStat } from "@/components/big-stat"
import { GPADistroChart } from "@/components/gpa-distro-chart"
import {
  StudentRequiredCard,
  StudentRequiredCardContent,
} from "@/components/student-required-card"

import {
  CourseMetadataSection,
  CourseMetadataSectionCard,
} from "./course-metadata-section"

export const EasinessStat = ({ data }: { data: CourseDetail }) => {
  const gpaDistro = data?.dp?.gpa_distro

  const easiness =
    gpaDistro && gpaDistro.length > 0 ? easinessScore(gpaDistro) : undefined

  return (
    <BigStat
      label="Easiness"
      value={easiness ?? "-"}
      total={100}
      // suffix="%"
      formatValue={(v) => (typeof v === "number" ? v.toFixed(0) : "-")}
      // icon={<Gauge />}
      helperText="How easy a class tends to be based on GPA distribution (higher is easier)."
      color={getColor100(easiness ?? 0)}
    />
  )
}

export const MeanGPAStat = ({ data }: { data: CourseDetail }) => {
  const gpaDistro = data?.dp?.gpa_distro

  const meanGPA =
    gpaDistro && gpaDistro.length > 0 ? medianGPA(gpaDistro) / 10 : undefined

  const meanColor = getColor4(meanGPA ?? 0)

  return (
    <BigStat
      label="Mean GPA"
      value={meanGPA?.toFixed(1) ?? "-"}
      total={4.0}
      // icon={<GraduationCap />}
      helperText="Average GPA across offerings over the last 5 years."
      color={meanColor}
    />
  )
}

export const WeightedGPAStat = ({ data }: { data: CourseDetail }) => {
  const gpaDistro = data?.dp?.gpa_distro

  const weightedGPA =
    gpaDistro && gpaDistro.length > 0
      ? weightedMeanGPA(gpaDistro) / 10
      : undefined

  const weightedColor = getColor4(weightedGPA ?? 0)

  return (
    <BigStat
      label="Weighted GPA"
      value={weightedGPA?.toFixed(1) ?? "-"}
      total={4.0}
      // icon={<Scale />}
      helperText="GPA weighted by section enrollments to reflect class size."
      color={weightedColor}
    />
  )
}

export const StdDevGPAStat = ({ data }: { data: CourseDetail }) => {
  const gpaDistro = data?.dp?.gpa_distro

  const stdDevGPA =
    gpaDistro && gpaDistro.length > 0
      ? standardDeviationGPA(gpaDistro)
      : undefined

  if (typeof stdDevGPA !== "number") return null

  return (
    <BigStat
      label="Std. Deviation"
      value={stdDevGPA.toFixed(2)}
      // icon={<Activity />}
      helperText="Spread of GPAs; lower values indicate more consistency across sections."
    />
  )
}

export const GPADistroChartCard = ({
  data,
  courseCode,
}: {
  data: CourseDetail
  courseCode: string
}) => {
  const gpaDistro = data?.dp?.gpa_distro
  const hasGPAPermission = useHasComponentAccess(COMPONENTS.GPA_DISTRIBUTION)

  return (
    <Card hoverInteraction={false}>
      <CardHeader>
        <CardTitle>GPA distribution</CardTitle>
      </CardHeader>
      {hasGPAPermission ? (
        <>
          <CardContent>
            {gpaDistro && gpaDistro.length > 0 ? (
              <GPADistroChart data={gpaDistro} />
            ) : (
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="text-muted-foreground">
                  No GPA distribution data available
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex flex-col gap-2">
              <span className="text-muted-foreground">
                This graph represents the distribution of grades for every
                student who completed{" "}
                <span className="text-foreground text-sm">{courseCode}</span>{" "}
                over the past 5 years.
              </span>
              <div className="text-muted-foreground leading-none">
                Number of grades in this sample:{" "}
                <span className="text-foreground font-semibold">
                  {gpaDistro?.reduce(
                    (acc: number, curr: { count: number }) => acc + curr.count,
                    0
                  ) ?? 0}
                </span>{" "}
                (5 years).
              </div>
            </div>
          </CardFooter>
        </>
      ) : (
        <StudentRequiredCardContent featureName="GPA Distribution" />
      )}
    </Card>
  )
}

export const CourseDetailStatsSection = ({
  courseCode,
}: {
  courseCode: string
}) => {
  const data = useQuery(api.courses.getByCourseCode, {
    courseCode,
  })
  const hasStatsPermission = useHasComponentAccess(
    COMPONENTS.COURSE_DETAIL_STATS
  )

  // dev
  // const data = useQuery(api.courses.getByCourseCodeDev, {
  //   courseCode,
  // })

  if (!data) return null

  if (!hasStatsPermission) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        <div className="lg:col-span-7 space-y-4 min-w-0 lg:row-start-1">
          <CourseMetadataSectionCard course={data} />
        </div>
        <aside className="lg:col-span-5 space-y-4 min-w-0 lg:row-start-1 lg:col-start-8">
          <GPADistroChartCard data={data} courseCode={courseCode} />
        </aside>
      </section>
    )
  }

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-7">
        <EasinessStat data={data} />
        <MeanGPAStat data={data} />
        <WeightedGPAStat data={data} />
        {/* <StdDevGPAStat data={data} /> */}
      </div>
      <div className="lg:col-span-7 space-y-4 min-w-0 lg:row-start-2">
        <CourseMetadataSectionCard course={data} />
      </div>
      <aside className="lg:col-span-5 space-y-4 min-w-0 lg:row-start-1 lg:col-start-8 lg:row-span-2">
        <GPADistroChartCard data={data} courseCode={courseCode} />
        {/* <CourseEnrollTrendSection courseCode={courseCode} /> */}
      </aside>
    </section>
  )
}
