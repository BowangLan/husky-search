import Link from "next/link"
import { ArrowLeft, BookOpen, Clock, Tag, Users } from "lucide-react"

import { DatabaseCourse } from "@/types/course"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function CourseDetailPage({ course }: { course: DatabaseCourse }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="py-4 sticky top-16 bg-background backdrop-blur-sm">
          <Link href="/">
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:opacity-80 px-0 has-[>svg]:px-0"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            >
              {`${course.subject} ${course.number}`}
            </Badge>
            <Badge
              variant="outline"
              className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            >
              {course.credit} Credits
            </Badge>
          </div>

          <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl lg:text-5xl mb-4">
            {course.title}
          </h1>

          <p className="text-muted-foreground leading-loose max-w-4xl text-sm md:text-base font-light">
            {course.description}
          </p>
        </div>
      </div>
    </div>
  )
}
