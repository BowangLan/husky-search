import { Skeleton } from "@/components/ui/skeleton"
import { ConvexCourseCardGridSkeleton } from "@/components/course-card-convex.grid"
import { SectionContent } from "@/components/section"

export const PopularCoursesSkeleton = () => {
  return (
    <>
      {/* Filter chips skeleton */}
      <div className="flex flex-row gap-3 py-4 z-[21] w-full overflow-x-auto isolate sticky top-0 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="shrink-0 h-8 w-16 rounded-full"
          />
        ))}
        <Skeleton className="shrink-0 w-8 h-8 rounded-full" />
      </div>
      <SectionContent className="pt-0 lg:pt-0">
        <ConvexCourseCardGridSkeleton />
      </SectionContent>
    </>
  )
}

