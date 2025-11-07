"use client"

import { useState } from "react"
import Link from "next/link"
import {
  useIsMajorPinned,
  useToggleMajorPin,
} from "@/store/pinned-majors.store"
import { Pin } from "lucide-react"

import { ProgramInfo } from "@/types/program"
import { capitalize, cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { RichButton } from "@/components/ui/rich-button"

// ViewTransition wrapper - falls back to fragment if unstable_ViewTransition is not available
function ViewTransition({
  children,
}: {
  children: React.ReactNode
  name?: string
}) {
  return <>{children}</>
}

export function ProgramCardLink({
  program,
  className,
}: {
  program: ProgramInfo
  className?: string
}) {
  const isPinned = useIsMajorPinned(program.code)
  const togglePin = useToggleMajorPin()

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    togglePin(program.code)
  }

  return (
    <Card className={cn("relative h-full hover:scale-100 group", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <Link
        href={`/majors/${program.code}`}
        className="group absolute inset-0 cursor-pointer z-10"
        prefetch
        // scroll={false}
      ></Link>

      {/* Pin button */}
      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <RichButton
          tooltip={isPinned ? "Unpin major" : "Pin major"}
          variant="ghost"
          className="size-7 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={handlePinClick}
        >
          <Pin
            className={cn(
              "size-3.5 transition-colors",
              isPinned && "fill-primary text-primary"
            )}
          />
        </RichButton>
      </div>

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
        <div className="h-16 md:h-20 flex flex-col justify-center items-center gap-1">
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

          <div className="text-xs font-light text-muted-foreground text-center truncate max-w-full">
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
