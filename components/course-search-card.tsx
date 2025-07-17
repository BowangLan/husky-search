import Link from "next/link"
import { CourseSearchResultItem } from "@/services/course-service"
import { BookOpen } from "lucide-react"

interface CourseSearchCardProps {
  course: CourseSearchResultItem
  index: number
  onSelect: (courseCode: string) => void
}

export function CourseSearchCard({
  course,
  index,
  onSelect,
}: CourseSearchCardProps) {
  return (
    <Link
      href={`/courses/${course.code}`}
      className="block group"
      prefetch
      onClick={() => onSelect(course.code)}
    >
      <div className="py-2 flex items-center flex-row gap-3">
        <BookOpen className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-sm text-foreground">{course.code}</h3>
      </div>
    </Link>
  )
}
