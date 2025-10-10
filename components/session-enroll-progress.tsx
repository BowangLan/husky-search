import { MyplanCourseTermSession } from "@/convex/schema"
import { AlertCircle } from "lucide-react"

import { SessionEnrollState } from "@/lib/session-utils"
import { capitalize, cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const SessionEnrollProgress = ({
  session,
  sessionRaw,
}: {
  session: MyplanCourseTermSession
  sessionRaw: any
}) => {
  const { enrollCount, enrollMaximum } = session

  if (!enrollMaximum || !enrollCount) {
    return null
  }

  const isClosed = enrollCount >= enrollMaximum
  const capacityPct = Math.min(
    100,
    (Number(enrollCount) / Math.max(1, Number(enrollMaximum))) * 100
  )

  const addCodeRequired =
    session?.enrollStatus === SessionEnrollState["ADD CODE REQUIRED"]
  const facultyCodeRequired =
    session?.enrollStatus === SessionEnrollState["FACULTY CODE REQUIRED"]
  const codeRequired = addCodeRequired || facultyCodeRequired

  if (session.stateKey !== "active") {
    return (
      <div className="text-[13px] text-muted-foreground tabular-nums flex items-center gap-1.5">
        <AlertCircle className="size-4 opacity-70" />
        {capitalize(session.stateKey)}
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="text-[13px] text-muted-foreground tabular-nums font-normal">
          <span
            className={cn(
              "font-semibold text-foreground font-mono",
              isClosed && "text-muted-foreground font-normal"
            )}
          >
            {Math.max(0, Number(enrollMaximum) - Number(enrollCount))}
          </span>
          {" avail of "}
          <span className="font-mono">{session.enrollMaximum}</span>
        </div>
        <div className="flex-1" />
        {addCodeRequired && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("size-2 rounded-full bg-amber-500")} />
            </TooltipTrigger>
            <TooltipContent>This session requires an add code.</TooltipContent>
          </Tooltip>
        )}
        {facultyCodeRequired && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("size-2 rounded-full bg-amber-500")} />
            </TooltipTrigger>
            <TooltipContent>
              This session requires a faculty code.
            </TooltipContent>
          </Tooltip>
        )}
        <div
          className={cn(
            "flex flex-row items-center gap-1.5 text-[13px] text-foreground tabular-nums leading-none",
            isClosed && "text-muted-foreground",
            codeRequired ? "hidden" : ""
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              isClosed ? "bg-rose-500" : "bg-emerald-500"
            )}
          />
          {capitalize(session?.enrollStatus ?? "")}
        </div>
      </div>
      <Progress
        value={capacityPct}
        className={cn("bg-foreground/5", isClosed && "bg-foreground/10")}
        style={{
          height: "6px",
        }}
        indicatorClassName={cn(
          codeRequired
            ? "progress-indicator-yellow"
            : isClosed
            ? "progress-indicator-red"
            : "progress-indicator-green"
        )}
      />
    </div>
  )
}
