import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type BigStatTrend = {
  value: number | string
  direction?: "up" | "down" | "neutral"
  ariaLabel?: string
}

export type BigStatProps = {
  label: string
  value: string | number
  total?: string | number
  icon?: React.ReactNode
  helperText?: string
  formatValue?: (value: string | number) => string | number
  loading?: boolean
  className?: string
  onClick?: () => void
  prefix?: string
  suffix?: string
  compact?: boolean
  trend?: BigStatTrend
  color?: BigStatColor
}

export type BigStatColor =
  | "primary"
  | "emerald"
  | "sky"
  | "violet"
  | "rose"
  | "amber"

export const BigStat = ({
  label,
  value,
  total,
  icon,
  helperText,
  formatValue,
  loading = false,
  className,
  onClick,
  prefix,
  suffix,
  compact = false,
  trend,
  color = "primary",
}: BigStatProps) => {
  const colorStyles: Record<
    BigStatColor,
    {
      valueGradient: string
      glowBg: string
      divider: string
    }
  > = {
    primary: {
      valueGradient:
        "bg-gradient-to-r from-primary to-violet-500 dark:to-violet-600 bg-clip-text text-transparent",
      glowBg: "bg-primary/10",
      divider: "via-primary/20",
    },
    emerald: {
      valueGradient:
        "bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent",
      glowBg: "bg-emerald-500/10",
      divider: "via-emerald-500/20",
    },
    sky: {
      valueGradient:
        "bg-gradient-to-r from-sky-500 to-sky-400 bg-clip-text text-transparent",
      glowBg: "bg-sky-500/10",
      divider: "via-sky-500/20",
    },
    violet: {
      valueGradient:
        "bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent",
      glowBg: "bg-violet-500/10",
      divider: "via-violet-500/20",
    },
    rose: {
      valueGradient:
        "bg-gradient-to-r from-rose-500 to-rose-400 bg-clip-text text-transparent",
      glowBg: "bg-rose-500/10",
      divider: "via-rose-500/20",
    },
    amber: {
      valueGradient:
        "bg-gradient-to-r from-amber-500 to-amber-400 bg-clip-text text-transparent",
      glowBg: "bg-amber-500/10",
      divider: "via-amber-500/20",
    },
  }
  const formattedValue = formatValue ? formatValue(value) : value
  const content = (
    <div className={cn("flex flex-col gap-2", compact && "gap-1")}>
      <div className={cn("flex items-center gap-2", compact && "gap-1")}>
        {icon ? (
          <div
            className={cn("size-5 text-muted-foreground", compact && "size-4")}
          >
            {icon}
          </div>
        ) : null}
        {helperText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-sm text-muted-foreground cursor-help">
                {label}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{helperText}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-sm text-muted-foreground">{label}</span>
        )}
      </div>
      <div className={cn("flex items-baseline gap-2", compact && "gap-1")}>
        {prefix ? (
          <span
            className={cn(
              "text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {prefix}
          </span>
        ) : null}
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight md:text-3xl drop-shadow-sm transition-transform duration-300 group-hover:-translate-y-0.5",
            colorStyles[color].valueGradient,
            compact && "text-xl md:text-2xl"
          )}
        >
          {formattedValue}
        </span>
        {total !== undefined && total !== null && total !== "" ? (
          <span className="text-sm text-muted-foreground">/ {total}</span>
        ) : null}
        {suffix ? (
          <span
            className={cn(
              "ml-1 text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {suffix}
          </span>
        ) : null}
        {trend ? (
          <span
            aria-label={trend.ariaLabel}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ring-1 ring-inset",
              trend.direction === "up" &&
                "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
              trend.direction === "down" &&
                "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
              (trend.direction === "neutral" || !trend.direction) &&
                "bg-muted text-muted-foreground ring-border/50"
            )}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className={cn("size-3.5")} />
            ) : trend.direction === "down" ? (
              <ArrowDownRight className={cn("size-3.5")} />
            ) : (
              <Minus className={cn("size-3.5")} />
            )}
            {trend.value}
          </span>
        ) : null}
      </div>
    </div>
  )

  return (
    <Card
      hoverInteraction={onClick ? true : false}
      className={cn(
        "group flex-1 relative",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* soft glow accents */}
      <div className={cn("pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full blur-2xl", colorStyles[color].glowBg)} />
      <div className={cn("pointer-events-none absolute -left-10 -bottom-10 h-24 w-24 rounded-full blur-2xl", colorStyles[color].glowBg)} />
      <div className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent", colorStyles[color].divider)} />
      <CardContent className="relative z-10">
        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-32" />
          </div>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  )
}
