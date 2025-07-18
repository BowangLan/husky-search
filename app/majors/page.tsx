import { ProgramService } from "@/services/program-service"

import { MajorsPage } from "@/components/pages/majors-page"

export default async function Page() {
  const programs = await ProgramService.getAllPrograms()

  return <MajorsPage programs={programs} />
}
