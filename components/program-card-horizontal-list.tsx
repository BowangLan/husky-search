import { Suspense, use } from "react"

import { ProgramInfo } from "@/types/program"

import { ProgramCardLink } from "./program-card"

export const ProgramCardHorizontalList = ({
  programs: programsFromProps,
}: {
  programs: ProgramInfo[] | Promise<ProgramInfo[]>
}) => {
  const programs =
    programsFromProps instanceof Promise
      ? use(programsFromProps)
      : programsFromProps

  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full overflow-x-auto snap-x snap-start snap-mandatory py-4 -translate-y-4">
      {programs.map((program) => (
        <ProgramCardLink
          key={program.id}
          program={program}
          className="w-56 md:w-64 flex-none"
        />
      ))}
    </div>
  )
}

export const ProgramCardHorizontalListWithSuspense = ({
  programs,
}: {
  programs: Promise<ProgramInfo[]> | ProgramInfo[]
}) => {
  return (
    <Suspense fallback={<ProgramCardHorizontalListSkeleton />}>
      <ProgramCardHorizontalList programs={programs} />
    </Suspense>
  )
}

export const ProgramCardHorizontalListSkeleton = () => {
  return (
    <div className="flex flex-row gap-4 md:gap-6 w-full overflow-x-auto py-4 -translate-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg bg-black/10 dark:bg-white/10 w-72 flex-none aspect-[3/2]"
        />
      ))}
    </div>
  )
}
