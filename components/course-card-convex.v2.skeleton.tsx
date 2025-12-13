import { cn } from "@/lib/utils"

import { Skeleton } from "./ui/skeleton"

export function ConvexCourseCardLinkV2Skeleton({
  className,
}: {
  className?: string
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading course"
      className={cn(
        "flex h-full flex-col justify-between rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-zinc-900/20",
        className
      )}
    >
      <div>
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-baseline gap-2 min-w-0">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>

          <div className="flex gap-1.5 flex-wrap justify-end">
            <Skeleton className="h-4 w-8 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-4 w-7 rounded" />
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="mb-2 flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-xs dark:border-zinc-800/50">
        <div className="flex items-center gap-2 min-w-0">
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-1 w-16 rounded-full" />
      </div>
    </div>
  )
}
