"use client"

// @ts-ignore
import { unstable_ViewTransition as ViewTransition, useState } from "react"
import Link from "next/link"
import { ProgramInfo } from "@/services/program-service"
import { Grid, List } from "lucide-react"

import { Program } from "@/types/program"
import { capitalize, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedList } from "./animated-list"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"

export function ProgramCardLink({
  program,
  className,
}: {
  program: ProgramInfo
  className?: string
}) {
  return (
    <Card className={cn("relative h-full hover:scale-100", className)}>
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
        <div className="h-12 md:h-20 flex flex-col justify-center items-center gap-1">
          <ViewTransition>
            <h3 className="font-medium text-center text-base md:text-lg lg:text-xl text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {/* {program.name} */}
              {program.code}
              {/* {decodeURIComponent(program.code.toUpperCase())} */}
            </h3>
          </ViewTransition>

          {/* {program.myplanSubjectArea && (
            <div className="text-xs text-muted-foreground">
              {program.myplanSubjectArea.collegeTitle}
            </div>
          )} */}

          <div className="text-xs text-muted-foreground text-center truncate w-[200px]">
            {/* {program.name} */}
            {capitalize(program.title)}
          </div>

          {/* <div className="flex items-center justify-between">
            <div className="text-sm subtext">{program.courseCount} courses</div>
          </div> */}
        </div>
      </CardContent>
    </Card>
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

export const ProgramCardGrid = ({ programs }: { programs: ProgramInfo[] }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {programs.map((program) => (
        <ProgramCardLink key={program.id} program={program} />
      ))}
    </div>
  )
}

export const AnimatedProgramCardRow = ({
  programs,
}: {
  programs: ProgramInfo[]
}) => {
  return (
    <div className="w-full flex flex-row gap-4 overflow-x-auto scrollbar-hide pb-2">
      {/* <AnimatedList
        data={programs}
        getItemKey={({ item }) => item.code}
        itemDelay={0.01}
        // itemDuration={0.5}
        animateLayout={false}
        renderItem={({ item }) => (
          <ProgramCardLink key={item.id} program={item} className="w-[240px]" />
        )}
      /> */}
      {programs.map((program) => (
        <ProgramCardLink
          key={program.id}
          program={program}
          className="w-[240px] flex-shrink-0"
        />
      ))}
    </div>
  )
}

export const GroupedProgramCardSections = ({
  programs,
}: {
  programs: ProgramInfo[]
}) => {
  const [isGrouped, setIsGrouped] = useState(true)

  // Group programs by departmentCode
  const groupedPrograms = programs.reduce((acc, program) => {
    const departmentCode = program.collegeCode
    if (!acc[departmentCode]) {
      acc[departmentCode] = {
        collegeTitle: program.collegeTitle,
        programs: [],
      }
    }
    acc[departmentCode].programs.push(program)
    return acc
  }, {} as Record<string, { collegeTitle: string; programs: ProgramInfo[] }>)

  // Sort departments alphabetically by title
  const sortedDepartments = Object.entries(groupedPrograms).sort(
    ([, a], [, b]) => a.collegeTitle.localeCompare(b.collegeTitle)
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
          <Button
            variant={isGrouped ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsGrouped(true)}
            className="h-8 px-3"
          >
            <List className="h-4 w-4 mr-2" />
            Grouped
          </Button>
          <Button
            variant={!isGrouped ? "default" : "ghost"}
            size="sm"
            onClick={() => setIsGrouped(false)}
            className="h-8 px-3"
          >
            <Grid className="h-4 w-4 mr-2" />
            Grid
          </Button>
        </div>
      </div>

      {isGrouped ? (
        <div className="space-y-8 md:space-y-12">
          <Accordion type="multiple">
            {sortedDepartments.map(
              ([departmentCode, { collegeTitle, programs }]) => {
                const sortedPrograms = programs.sort((a, b) =>
                  a.code.localeCompare(b.code)
                )
                return (
                  <AccordionItem value={departmentCode} key={departmentCode}>
                    <AccordionTrigger className="hover:no-underline hover:cursor-pointer hover:opacity-80 trans">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-lg md:text-xl font-semibold text-foreground">
                          {collegeTitle}
                        </h2>
                        <div className="text-sm text-muted-foreground">
                          {programs.length} programs
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {/* <AnimatedProgramCardRow programs={sortedPrograms} /> */}
                      <ProgramCardGrid programs={sortedPrograms} />
                      <div className="h-4"></div>
                    </AccordionContent>
                  </AccordionItem>
                )
              }
            )}
          </Accordion>
        </div>
      ) : (
        <AnimatedProgramCardGrid
          programs={programs.sort((a, b) => a.code.localeCompare(b.code))}
        />
      )}
    </div>
  )
}
