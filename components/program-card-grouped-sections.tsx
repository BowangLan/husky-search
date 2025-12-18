"use client"

// @ts-ignore
import { unstable_ViewTransition as ViewTransition, useState } from "react"
import Link from "next/link"
import { Grid, List } from "lucide-react"

import { ProgramInfo } from "@/types/program"
import { capitalize, cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

import { AnimatedProgramCardGrid, ProgramCardGrid } from "./program-card-grid"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"

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
        <ProgramCardGrid
          programs={programs.sort((a, b) => a.code.localeCompare(b.code))}
        />
      )}
    </div>
  )
}
