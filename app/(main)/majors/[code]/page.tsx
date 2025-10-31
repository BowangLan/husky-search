import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { ProgramService } from "@/services/program-service"

import { DOMAIN } from "@/config/site"
import { capitalize } from "@/lib/utils"
import { ProgramDetailPage } from "@/components/pages/program-detail-page"

const ALL_COURSES_LIMIT = 200

export const dynamic = 'force-dynamic'

export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ code: string }>
}) => {
  const { code: codeParam } = await params
  const code = decodeURIComponent(codeParam).toUpperCase()

  const program = await ProgramService.getProgramByCode(code)

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
  const code = decodeURIComponent(codeParam).toUpperCase()

  const program = await unstable_cache(
    async () => {
      return await ProgramService.getProgramByCode(code)
    },
    ["program-detail", code],
    // { revalidate: 60 * 60 * 24, tags: ["program-detail"] } // 1 day
    { revalidate: 1, tags: ["program-detail"] } // 1 day
  )()

  if (!program) {
    notFound()
  }

  return <ProgramDetailPage program={program} />
}
