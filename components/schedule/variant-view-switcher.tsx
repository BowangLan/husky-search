"use client"

import { List, Columns } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { VariantViewType } from "./variant-view-types"

type VariantViewSwitcherProps = {
  viewType: VariantViewType
  onViewChange: (viewType: VariantViewType) => void
}

export function VariantViewSwitcher({
  viewType,
  onViewChange,
}: VariantViewSwitcherProps) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-0.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 text-xs",
          viewType === "list" && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange("list")}
      >
        <List className="size-3 mr-1.5" />
        List
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-2 text-xs",
          viewType === "columns" && "bg-background shadow-sm"
        )}
        onClick={() => onViewChange("columns")}
      >
        <Columns className="size-3 mr-1.5" />
        Columns
      </Button>
    </div>
  )
}

