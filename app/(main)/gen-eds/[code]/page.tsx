import { Suspense } from "react"
import type { Metadata } from "next"
import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { fetchQuery } from "convex/nextjs"

import { DOMAIN } from "@/config/site"
import { getGenEdLabel } from "@/lib/utils"
import { GenEdDetailPage } from "@/components/pages/gen-ed"
import { ProgramDetailPageSkeleton } from "@/components/pages/program-detail-page-skeleton"

CONST VALIDGENEDCODES = ["C", "DIV", "SSC", "NSC", "RSN", "A&H", "W"]

function normalizeGenEdCode(codeParam: string) {
  return decodeURIComponent(codeParam).toUpperCase()
}

async function getGenEdCoursesCached(genEdCode: string) {
  return await unstable_cache(
    async () => {
      // Fetch all pages to warm the cache
      const firstPage = await fetchQuery(api.courses.listOverviewByGenEd, {
        genEdCode,
        limit: 50,
        offset: 0,
      })

      let allCourses = [...firstPage.data]
      let offset = 50

      while (offset < firstPage.totalCount) {
        const nextPage = await fetchQuery(api.courses.listOverviewByGenEd, {
          genEdCode,
          limit: 50,
          offset,
        })
        allCourses = [...allCourses, ...nextPage.data]
        offset += 50
      }

      return {
        courses: allCourses,
        totalCount: firstPage.totalCount,
      }
    },
    ["gen-ed-courses", genEdCode],
    {
      revalidate: 60 * 60 * 24,
      tags: ["gen-ed-courses", `gen-ed-${genEdCode}`],
    }
  )()
}

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ code: string }>
}): Promise<Metadata> => {
  const { code: codeParam } = await params
  const code = normalizeGenEdCode(codeParam)

  if (!validGenEdCodes.includes(code)) {
    return notFound()
  }

  const genEdLabel = getGenEdLabel(code)
  const title = `${genEdLabel} (${code}) Courses - University of Washington`
  const description = `Browse all ${genEdLabel} general education requirement courses at the University of Washington. Search, filter, and explore courses that fulfill the ${code} gen ed requirement.`

  return {
    title,
    description,
    keywords: [
      genEdLabel,
      code,
      "gen ed",
      "general education",
      "University of Washington",
      "UW",
      "requirements",
      "courses",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Husky Search",
      url: `https://${DOMAIN}/gen-eds/${code}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://${DOMAIN}/gen-eds/${code}`,
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

export default async function GenEdPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code: codeParam } = await params
  const code = normalizeGenEdCode(codeParam)

  if (!validGenEdCodes.includes(code)) {
    notFound()
  }

  return (
    <Suspense fallback={<ProgramDetailPageSkeleton />}>
      <GenEdDetailPageAsync code={code} />
    </Suspense>
  )
}

async function GenEdDetailPageAsync({ code }: { code: string }) {
  const { courses, totalCount } = await getGenEdCoursesCached(code)

  return (
    <GenEdDetailPage
      genEdCode={code}
      initialCourses={courses}
      initialTotalCount={totalCount}
    />
  )
}
