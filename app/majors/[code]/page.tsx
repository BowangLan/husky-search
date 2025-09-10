import { unstable_cache } from "next/cache"
import { notFound } from "next/navigation"
import { ProgramService } from "@/services/program-service"

import { capitalize } from "@/lib/utils"
import { ProgramDetailPage } from "@/components/pages/program-detail-page"

const ALL_COURSES_LIMIT = 200

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

  return {
    title: `${capitalize(program.title)} Major`,
    description: `${program.title}`,
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
