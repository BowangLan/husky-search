import Link from "next/link"

import { Course } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function CourseCardLink({ course }: { course: Course }) {
  return (
    <Link href={`/courses/${course.code}`} className="group">
      <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/80 hover:shadow-lg hover:shadow-purple-500/5">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30">
          {/* Placeholder for course image */}
          <div className="flex h-full items-center justify-center">
            <div className="text-4xl font-bold text-muted-foreground/30">
              {course.code}
            </div>
          </div>
        </div>
        
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge 
              variant="secondary" 
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {course.level}
            </Badge>
            <div className="text-sm text-muted-foreground">
              {course.credits} credits
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg leading-tight tracking-tight text-foreground group-hover:text-foreground/90 transition-colors duration-200 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {course.description}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {course.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs border-border/50 bg-background/50 hover:bg-background/80 transition-colors duration-200"
              >
                {tag}
              </Badge>
            ))}
            {course.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs border-border/50 bg-background/50"
              >
                +{course.tags.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
