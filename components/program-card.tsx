import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"

import { Program } from "@/types/program"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedList } from "./animated-list"

export function ProgramCardLink({ program }: { program: Program }) {
  return (
    <Card className="relative h-full overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-purple-500/5">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/majors/${program.code}`}
        className="group absolute inset-0 cursor-pointer z-10"
        prefetch
        scroll={false}
      ></Link>

      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
        {/* Placeholder for program image */}
        <div className="flex h-full items-center justify-center">
          <ViewTransition name={`program-code-${program.id}`}>
            <div className="text-4xl font-medium text-muted-foreground/30">
              {program.code.toUpperCase()}
            </div>
          </ViewTransition>
        </div>
      </div>

      <CardContent>
        <div className="space-y-2">
          <ViewTransition name={`program-title-${program.id}`}>
            <h3 className="font-semibold text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {program.name}
            </h3>
          </ViewTransition>
          <p className="text-sm text-muted-foreground opacity-60 font-light line-clamp-2">
            Explore courses in the {program.name} program at the University of
            Washington.
          </p>
          <div className="flex items-center justify-between">
            <div className="text-sm">{program.courseCount} courses</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
export const ProgramCardGrid = ({ programs }: { programs: Program[] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatedList
        data={programs}
        getItemKey={({ item }) => item.code}
        renderItem={({ item }) => (
          <ProgramCardLink key={item.id} program={item} />
        )}
      />
    </div>
  )
}
