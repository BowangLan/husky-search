import { Suspense } from "react"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { ProgramService } from "@/services/program-service"
import { fetchQuery } from "convex/nextjs"

import type { ConvexCourseOverview } from "@/types/convex-courses"
import { DOMAIN } from "@/config/site"
import { capitalize } from "@/lib/utils"
import { ProgramDetailPage } from "@/components/pages/program-detail-page"
import { ProgramDetailPageSkeleton } from "@/components/pages/program-detail-page-skeleton"

function normalizeProgramCode(codeParam: string) {
  return decodeURIComponent(codeParam).toUpperCase()
}

async function getProgramCached(code: string) {
  return await unstable_cache(
    async () => {
      return await ProgramService.getProgramByCode(code)
    },
    ["program-detail", code],
    { revalidate: 60 * 60 * 24, tags: ["program-detail"] }
  )()
}

async function getProgramCoursesCached(subjectArea: string) {
  return await unstable_cache(
    async () => {
      return await fetchQuery(api.courses.listOverviewBySubjectArea, {
        subjectArea,
      })
    },
    ["program-courses", subjectArea],
    {
      revalidate: 60 * 60 * 24,
      tags: ["program-courses", `program-${subjectArea}`],
    }
  )()
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> => {
  const { code: codeParam } = await params
  const code = normalizeProgramCode(codeParam)

  const program = await getProgramCached(code)

  if (!program) {
    return notFound()
  }

  const title = `${capitalize(program.title)} Major - University of Washington`
  const description = `Explore the ${program.title} major at UW. Find courses, requirements, and program details for ${program.title} students at the University of Washington.`

  return {
    title,
    description,
    keywords: [
      program.title,
      `${program.title} major`,
      "University of Washington",
      "UW",
      "degree program",
      "college major",
      "academic program",
      program.code,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Husky Search",
      url: `https://${DOMAIN}/majors/${code}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://${DOMAIN}/majors/${code}`,
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

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: codeParam } = await params
  const code = normalizeProgramCode(codeParam)

  return (
    <Suspense fallback={<ProgramDetailPageSkeleton />}>
      <ProgramDetailPageAsync code={code} />
    </Suspense>
  )
}

async function ProgramDetailPageAsync({ code }: { code: string }) {
  const program = await getProgramCached(code)

  if (!program) {
    notFound()
  }

  const initialCourses: ConvexCourseOverview[] = await getProgramCoursesCached(
    program.code
  )

  return <ProgramDetailPage program={program} initialCourses={initialCourses} />
}
