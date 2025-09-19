"use client"

import { HelpCircle } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function ScoreHelpTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="size-3 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-lg">
        <div className="text-sm space-y-2">
          <p>
            Easiness score is calculated based on GPA distribution data using
            statistical measures.
          </p>
          <div className="font-mono text-xs bg-muted/50 p-2 rounded space-y-1">
            <div>meanNorm = (mean - 0) / (40 - 0)</div>
            <div>modeNorm = (mode - 0) / (40 - 0)</div>
            <div>stdNorm = min(stdDev / 10, 1)</div>
            <div>
              Score = (0.5×meanNorm + 0.3×(1-stdNorm) + 0.2×modeNorm) × 100
            </div>
          </div>
          <p className="text-xs">
            Higher scores indicate easier courses based on GPA patterns (0-100
            scale)
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
