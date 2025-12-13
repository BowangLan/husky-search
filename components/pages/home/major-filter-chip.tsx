"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type MajorFilterChipProps = {
  code: string
  selected?: boolean
  onClick?: () => void
  href?: string
  className?: string
}

/**
 * Extracted from `html/home1.html` "Filter Chips" design.
 * A pill-shaped filter chip with an optional "open major page" external-link affordance.
 */
export function MajorFilterChip({
  code,
  selected = false,
  onClick,
  href,
  className,
}: MajorFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "shrink-0 group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "bg-zinc-900 text-zinc-50 border-zinc-900 shadow-sm shadow-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-950 dark:border-zinc-100 dark:shadow-zinc-900/20"
          : "bg-white border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80",
        className
      )}
    >
      <span>{code}</span>
      {href ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={href}
              prefetch
              className={cn(
                "inline-flex",
                selected
                  ? "opacity-70 hover:opacity-100"
                  : "opacity-50 group-hover:opacity-100"
              )}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${code} major page`}
            >
              <ExternalLink className="h-3 w-3" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>Go to major page</p>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </button>
  )
}


