import { ProgramService } from "@/services/program-service"

import { ProgramCardLink } from "@/components/program-card"

export default async function MajorsPage() {
  const programs = await ProgramService.getAllPrograms()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40 flex flex-col items-center py-16">
      {/* Header */}
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-10 flex flex-col gap-2">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
          Academic Programs at UW
        </h2>
        <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span>{programs.length} programs available</span>
        </div>
      </div>

      {/* Programs Grid */}
      <section className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="">
          {programs.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-muted-foreground text-lg">
                No programs found. Please check back later.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {programs.map((program) => (
                <ProgramCardLink key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
