import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const CourseDetailPageSkeleton = () => {
  return (
    <div className="space-y-4 px-page">
      {/* Header skeleton */}
      <section className="my-4 md:my-8 space-y-2 md:space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-[30px] w-[90px]" />
        </div>
        <div className="space-y-2">
          <div className="flex items-end gap-2 mb-2">
            <Skeleton className="h-[36px] sm:h-[40px] lg:h-[48px] w-[240px]" />
            <Skeleton className="h-[28px] w-[36px]" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[32px] w-[350px]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-[30px] w-[40px]" />
          <Skeleton className="h-[30px] w-[50px]" />
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-[30px] w-[128px]" />
            <Skeleton className="h-[30px] w-[148px]" />
          </div>
        </div>
      </section>

      {/* Stats skeleton */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:col-span-7">
          <Skeleton className="h-[114px]" />
          <Skeleton className="h-[114px]" />
          <Skeleton className="h-[114px]" />
        </div>
        <Skeleton className="lg:col-span-7 space-y-4 min-w-0 lg:row-start-2 h-[256px]" />
        <Skeleton className="lg:col-span-5 space-y-4 min-w-0 lg:row-start-1 lg:col-start-8 lg:row-span-2" />
      </section>

      {/* Tabs skeleton */}
      <div className="flex items-center my-6 gap-4">
        <Skeleton className="h-8 w-24 rounded-none" />
        <Skeleton className="h-8 w-36 rounded-none" />
      </div>

      {/* Sessions skeleton */}
      <Card className="overflow-hidden" hoverInteraction={false}>
        <CardContent className="px-0">
          <div className="my-4 mx-4 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-0">
                <div className="border-t" />
                <div
                  className="px-4 py-4 md:px-6 grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "minmax(96px,108px) minmax(96px,160px) 1.5fr auto minmax(160px,240px)",
                  }}
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
