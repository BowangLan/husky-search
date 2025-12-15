import { Skeleton } from "@/components/ui/skeleton"

import { PageWithHeaderLayout } from "../page-wrapper"

export function ProgramDetailPageSkeleton() {
  return (
    <PageWithHeaderLayout
      titleTop={<Skeleton className="h-6 w-16" />}
      title={
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-64" />
          <div className="flex-1" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-56 rounded-md" />
        </div>
      }
      subtitle={<Skeleton className="h-5 w-80" />}
    >
      <div className="px-page mx-page space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Skeleton className="h-[92px] w-full rounded-md" />
          <Skeleton className="h-[92px] w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-28 w-full rounded-md" />
        </div>
      </div>
    </PageWithHeaderLayout>
  )
}


