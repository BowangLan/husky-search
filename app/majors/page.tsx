import { ProgramService } from "@/services/program-service"

import { PageWithHeaderLayout } from "@/components/page-wrapper"
import { ProgramCardGrid } from "@/components/program-card"

export default async function MajorsPage() {
  const programs = await ProgramService.getAllPrograms()

  return (
    <PageWithHeaderLayout
      title="Academic Programs at UW"
      subtitle={
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{programs.length} programs available</span>
        </div>
      }
    >
      <section className="w-full px-page mx-page">
        <div className="">
          {programs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg">
                No programs found. Please check back later.
              </div>
            </div>
          ) : (
            <ProgramCardGrid programs={programs} />
          )}
        </div>
      </section>
    </PageWithHeaderLayout>
  )
}
