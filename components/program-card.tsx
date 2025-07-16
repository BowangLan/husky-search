"use client"

// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"
import Link from "next/link"
import { ProgramInfo } from "@/services/program-service"

import { Program } from "@/types/program"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedList } from "./animated-list"

export function ProgramCardLink({ program }: { program: ProgramInfo }) {
  return (
    <Card className="relative h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/majors/${program.code}`}
        className="group absolute inset-0 cursor-pointer z-10"
        prefetch
        // scroll={false}
      ></Link>

      {/* <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
        <div className="flex h-full items-center justify-center">
          <ViewTransition name={`program-code-${program.id}`}>
            <div className="text-4xl font-medium text-muted-foreground/30">
              {program.code.toUpperCase()}
            </div>
          </ViewTransition>
        </div>
      </div> */}

      <CardContent>
        <div className="h-12 md:h-20 flex flex-col justify-center items-center gap-2">
          <ViewTransition name={`program-title-${program.id}`}>
            <h3 className="font-medium text-center text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {/* {program.name} */}
              {/* {program.myplanSubjectArea?.title ?? program.name} */}
              {decodeURIComponent(program.code.toUpperCase())}
            </h3>
          </ViewTransition>

          {/* {program.myplanSubjectArea && (
            <div className="text-xs text-muted-foreground">
              {program.myplanSubjectArea.collegeTitle}
            </div>
          )} */}

          <div className="text-xs text-muted-foreground text-center">
            {program.name}
          </div>

          {/* <div className="flex items-center justify-between">
            <div className="text-sm subtext">{program.courseCount} courses</div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  )
}
export const ProgramCardGrid = ({ programs }: { programs: ProgramInfo[] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatedList
        data={programs}
        getItemKey={({ item }) => item.code}
        itemDelay={0.01}
        renderItem={({ item }) => (
          <ProgramCardLink key={item.id} program={item} />
        )}
      />
    </div>
  )
}
