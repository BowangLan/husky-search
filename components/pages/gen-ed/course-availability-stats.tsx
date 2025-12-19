import { CourseAvailability } from "./types"

interface CourseAvailabilityStatsProps {
  availability: CourseAvailability
}

export function CourseAvailabilityStats({
  availability,
}: CourseAvailabilityStatsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground font-light">
      <div className="inline-flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>
          <span className="tabular-nums text-foreground font-medium">
            {availability.open}
          </span>{" "}
          open
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span>
          <span className="tabular-nums text-foreground font-medium">
            {availability.closed}
          </span>{" "}
          closed
        </span>
      </div>

      <div className="inline-flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-gray-400" />
        <span>
          <span className="tabular-nums text-foreground font-medium">
            {availability.notOffered}
          </span>{" "}
          not currently offered
        </span>
      </div>
    </div>
  )
}

