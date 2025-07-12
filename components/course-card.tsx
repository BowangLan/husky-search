import Link from "next/link"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function CourseCardLink({ course }: { course: DatabaseCourse }) {
  return (
    <Link href={`/courses/${course.code}`} className="group" prefetch>
      <Card className="relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
          {/* Placeholder for course image */}
          <div className="flex h-full items-center justify-center">
            <div className="text-4xl font-bold text-muted-foreground/30">
              {`${course.subject} ${course.number}`}
            </div>
          </div>
        </div>

        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {course.subject}
            </Badge>
            <div className="text-sm text-muted-foreground">{course.credit}</div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-light">
              {course.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
