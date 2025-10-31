import { Suspense } from "react"
import { ProgramService } from "@/services/program-service"

import { MajorsPage, MajorsPageSkeleton } from "@/components/pages/majors-page"

export default async function Page() {
  const programs = ProgramService.getAllPrograms()

  return (
    <Suspense fallback={<MajorsPageSkeleton />}>
      <MajorsPage programs={programs} />
    </Suspense>
  )
}
