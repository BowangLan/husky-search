import Link from "next/link"

import { Program } from "@/types/program"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function ProgramCardLink({ program }: { program: Program }) {
  return (
    <Link href={`/majors/${program.code}`} className="group" prefetch>
      <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-purple-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
          {/* Placeholder for program image */}
          <div className="flex h-full items-center justify-center">
            <div className="text-4xl font-bold text-muted-foreground/30">
              {program.code.toUpperCase()}
            </div>
          </div>
        </div>

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              Program
            </Badge>
            <div className="text-sm text-muted-foreground">
              {program.courseCount} courses
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {program.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              Explore courses in the {program.name} program at the University of
              Washington.
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
