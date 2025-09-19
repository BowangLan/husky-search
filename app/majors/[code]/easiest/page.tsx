import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { ProgramService } from "@/services/program-service"

import { capitalize } from "@/lib/utils"
import { EasiestCoursesPage } from "@/components/pages/easiest-courses-page"

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

  const title = `Easiest ${capitalize(
    program.title
  )} Courses | University of Washington`
  const description = `Find the easiest ${program.title} courses at UW ranked by GPA distribution data. Academic difficulty analysis for ${code} major students.`
  const url = `https://huskysearch.com/majors/${code}/easiest`

  return {
    title,
    description,
    keywords: [
      `easiest ${program.title} courses`,
      `${code} easy classes UW`,
      `University of Washington ${program.title}`,
      `UW ${code} course difficulty`,
      `${program.title} GPA distribution`,
      "course selection help",
      "academic planning UW",
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
          url: "/og-easiest-courses.png",
          width: 1200,
          height: 630,
          alt: `Easiest ${program.title} Courses at UW`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-easiest-courses.png"],
      creator: "@huskysearch",
    },
    alternates: {
      canonical: url,
    },
    category: "Education",
  }
}

export default async function EasiestCoursesPageRoute({
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

  return <EasiestCoursesPage program={program} />
}
