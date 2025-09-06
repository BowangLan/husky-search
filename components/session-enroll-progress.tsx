import { AlertCircle } from "lucide-react"

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
  session: any
  sessionRaw: any
}) => {
  const isClosed = session.enrollCount >= session.enrollMaximum
  const capacityPct = Math.min(
    100,
    (session.enrollCount / Math.max(1, session.enrollMaximum)) * 100
  )

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
            {Math.max(0, session.enrollMaximum - session.enrollCount)}
          </span>
          {" avail of "}
          <span className="font-mono">{session.enrollMaximum}</span>
        </div>
        <div className="flex-1" />
        {sessionRaw?.enrollStatus === "add code required" && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn("size-2 rounded-full bg-amber-500")} />
            </TooltipTrigger>
            <TooltipContent>This session requires an add code.</TooltipContent>
          </Tooltip>
        )}
        <div
          className={cn(
            "flex flex-row items-center gap-1.5 text-[13px] text-foreground tabular-nums leading-none",
            isClosed && "text-muted-foreground",
            sessionRaw?.enrollStatus === "add code required" ? "hidden" : ""
          )}
        >
          <div
            className={cn(
              "size-2 rounded-full",
              isClosed ? "bg-rose-500" : "bg-emerald-500"
            )}
          />
          {capitalize(sessionRaw?.enrollStatus ?? "")}
        </div>
      </div>
      <Progress
        value={capacityPct}
        className={cn("bg-foreground/5", isClosed && "bg-foreground/10")}
        style={{
          height: "6px",
        }}
        indicatorClassName={cn(
          "bg-gradient-to-r dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-600 from-emerald-300 via-emerald-400 to-emerald-500",
          sessionRaw?.enrollStatus === "add code required" &&
            "dark:from-amber-400 dark:via-amber-500 dark:to-amber-600 from-amber-400 via-amber-400 to-amber-500",
          isClosed &&
            "dark:from-rose-600 dark:via-rose-500 dark:to-rose-700 from-rose-400 via-rose-400 to-rose-500"
        )}
      />
    </div>
  )
}
