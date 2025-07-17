import { BookOpen, GraduationCap } from "lucide-react"

interface CourseSearchEmptyStateProps {
  title: string
  description: string
  icon: "book-open" | "graduation-cap"
}

const iconMap = {
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
}

export function CourseSearchEmptyState({ 
  title, 
  description, 
  icon 
}: CourseSearchEmptyStateProps) {
  const Icon = iconMap[icon]
  
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted/50 p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
    </div>
  )
} 