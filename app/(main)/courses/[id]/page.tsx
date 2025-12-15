import { Suspense } from "react"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { DOMAIN } from "@/config/site"
import { getConvexClient } from "@/lib/convex-client"
import { CourseDetailPage } from "@/components/pages/course-detail-page"
import { CourseDetailPageSkeleton } from "@/components/pages/course-detail/course-detail-page-skeleton"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id: courseCode } = await params
  const course = await fetchQuery(api.courses.getByCourseCodeBrief, {
    courseCode: decodeURIComponent(courseCode).toUpperCase(),
  })

  if (!course) {
    return notFound()
  }

  const title = `${course.courseCode} - ${course.title} | University of Washington`
  const description =
    course.description ||
    `Learn about ${course.courseCode} (${course.title}) at the University of Washington. View course details, prerequisites, schedules, and student evaluations.`

  return {
    title,
    description,
    keywords: [
      course.courseCode,
      course.title,
      "University of Washington",
      "UW course",
      "course details",
      "course schedule",
      "prerequisites",
      "university course",
      course.courseCode.replace(/\s+/g, ""),
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Husky Search",
      url: `https://${DOMAIN}/courses/${encodeURIComponent(course.courseCode)}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://${DOMAIN}/courses/${encodeURIComponent(
        course.courseCode
      )}`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseCode } = await params

  const normalizedCourseCode = decodeURIComponent(courseCode).toUpperCase()

  return (
    <Suspense fallback={<CourseDetailPageSkeleton />}>
      <CourseDetailPageAsync courseCode={normalizedCourseCode} />
    </Suspense>
  )
}

async function fetchCourseDetail(courseCode: string) {
  const convexClient = await getConvexClient()
  return await convexClient.query(api.courses.getByCourseCode, {
    courseCode: courseCode,
  })
}

async function CourseDetailPageAsync({ courseCode }: { courseCode: string }) {
  const fetchDetail = fetchCourseDetail(courseCode)
  const fetchSubjectArea = fetchQuery(api.myplan1.subjectAreas.getByCode, {
    code: courseCode.replace(/\d+$/, "").trim(),
  })
  const fetchBriefCourse = fetchQuery(api.courses.getByCourseCodeBrief, {
    courseCode: courseCode,
  })

  const [detail, subjectArea, briefCourse] = await Promise.all([
    fetchDetail,
    fetchSubjectArea,
    fetchBriefCourse,
  ])

  if (!detail.myplanCourse || !subjectArea || !briefCourse) {
    throw notFound()
  }

  return (
    <CourseDetailPage
      courseCode={courseCode}
      courseDetail={detail}
      subjectArea={subjectArea}
    />
  )
}
