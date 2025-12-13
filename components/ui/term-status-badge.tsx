import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Zap } from "lucide-react"
import { TermStatus } from "@/lib/plan/get-term-status"

type TermStatusBadgeProps = {
  status: TermStatus
  className?: string
}

export function TermStatusBadge({ status, className }: TermStatusBadgeProps) {
  const config = {
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    },
    active: {
      label: "Active",
      icon: Zap,
      variant: "default" as const,
      className: "bg-blue-600 text-white",
    },
    planned: {
      label: "Planned",
      icon: Circle,
      variant: "outline" as const,
      className: "text-muted-foreground",
    },
  }

  const { label, icon: Icon, variant, className: statusClass } = config[status]

  return (
    <Badge variant={variant} className={`${statusClass} ${className || ""}`}>
      <Icon className="size-3 mr-1" />
      {label}
    </Badge>
  )
}
