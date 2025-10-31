import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { ProgramService } from "@/services/program-service"

import { DOMAIN } from "@/config/site"
import { capitalize } from "@/lib/utils"
import { ToughestCoursesPage } from "@/components/pages/toughest-courses-page"

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

  const title = `Toughest ${capitalize(
    program.title
  )} Courses | University of Washington`
  const description = `Find the most challenging ${program.title} courses at UW ranked by GPA distribution data. Academic difficulty analysis for ${code} major students.`
  const url = `https://${DOMAIN}/majors/${code}/toughest`

  return {
    title,
    description,
    keywords: [
      `toughest ${program.title} courses`,
      `${code} difficult classes UW`,
      `University of Washington ${program.title}`,
      `UW ${code} course difficulty`,
      `${program.title} challenging courses`,
      `hard ${code} classes`,
      "academic planning UW",
      "course selection strategy",
    ],
    authors: [{ name: "Husky Search" }],
    creator: "Husky Search",
    publisher: "Husky Search",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      title,
      description,
      siteName: "Husky Search",
      images: [
        {
          url: "/og-toughest-courses.png",
          width: 1200,
          height: 630,
          alt: `Toughest ${program.title} Courses at UW`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-toughest-courses.png"],
      creator: "@huskysearch",
    },
    alternates: {
      canonical: url,
    },
    category: "Education",
  }
}

export default async function ToughestCoursesPageRoute({
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
    { revalidate: 1, tags: ["program-detail"] }
  )()

  if (!program) {
    notFound()
  }

  return <ToughestCoursesPage program={program} />
}
