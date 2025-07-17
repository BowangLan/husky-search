import { Skeleton } from "@/components/ui/skeleton"

export function CourseSearchLoadingSkeleton() {
  return (
    <div className="space-y-3 px-page">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}
