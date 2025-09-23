import { Card, CardContent } from "./ui/card"
import { Skeleton } from "./ui/skeleton"

export const ConvexCourseCardSkeleton = () => {
  return (
    <Card className="relative group isolate">
      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 to-muted/30 hidden md:block">
        <div className="flex h-full items-center justify-center">
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      <CardContent>
        <div className="space-y-3">
          <div className="flex flex-col">
            <div className="flex items-center">
              <div className="flex items-baseline flex-none">
                <Skeleton className="h-5 md:h-6 w-20" />
                <Skeleton className="h-3 md:h-4 w-8 ml-2" />
              </div>
              <div className="flex-1"></div>
            </div>
            <Skeleton className="h-3 md:h-4 w-3/4 mt-1" />

            <div className="flex items-center gap-2 flex-wrap absolute top-4 right-4">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-5 w-10" />
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
