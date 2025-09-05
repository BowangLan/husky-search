import { Suspense, use } from "react"

import { ProgramInfo } from "@/types/program"

import { AnimatedList } from "./animated-list"
import { ProgramCardLink } from "./program-card"

export const ProgramCardGrid = ({
  programs: programsFromProps,
}: {
  programs: ProgramInfo[] | Promise<ProgramInfo[]>
}) => {
  const programs =
    programsFromProps instanceof Promise
      ? use(programsFromProps)
      : programsFromProps
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {programs.map((program, index) => (
        <ProgramCardLink key={index} program={program} />
      ))}
    </div>
  )
}

export const AnimatedProgramCardGrid = ({
  programs,
}: {
  programs: ProgramInfo[]
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatedList
        data={programs}
        getItemKey={({ item }) => item.code}
        itemDelay={0.01}
        // itemDuration={0.5}
        animateLayout={false}
        renderItem={({ item }) => (
          <ProgramCardLink key={item.id} program={item} />
        )}
      />
    </div>
  )
}

export const ProgramCardGridWithSuspense = ({
  programs,
}: {
  programs: Promise<ProgramInfo[]> | ProgramInfo[]
}) => {
  return (
    <Suspense fallback={<ProgramCardGridSkeleton />}>
      <ProgramCardGrid programs={programs} />
    </Suspense>
  )
}

export const ProgramCardGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-lg bg-black/10 dark:bg-white/10 aspect-video"
        />
      ))}
    </div>
  )
}
