"use client"

import { useTotalCredits, type CoursePlanState } from "@/store/course-plan.store"
import { Calendar, Plus, Search, Settings, Cloud, CloudOff, Loader2, CloudCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichButton } from "@/components/ui/rich-button"
type PlanToolbarProps = {
  onAddTerm: () => void
  onSearchCourse: () => void
  syncStatus: CoursePlanState["syncStatus"]
  lastSyncedAt: number | null
  manualSync: () => void | Promise<void>
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PlanToolbar({
  onAddTerm,
  onSearchCourse,
  syncStatus,
  lastSyncedAt,
  manualSync,
}: PlanToolbarProps) {
  const totalCredits = useTotalCredits()

  const getSyncIcon = () => {
    switch (syncStatus) {
      case "syncing":
        return <Loader2 className="size-4 animate-spin" />
      case "synced":
        return <CloudCheck className="size-4 text-green-600" />
      case "error":
        return <CloudOff className="size-4 text-destructive" />
      default:
        return <Cloud className="size-4" />
    }
  }

  const getSyncText = () => {
    if (syncStatus === "synced" && lastSyncedAt) {
      return `Synced ${formatTimeAgo(lastSyncedAt)}`
    }
    if (syncStatus === "syncing") return "Syncing..."
    if (syncStatus === "error") return "Sync failed"
    return "Not synced"
  }

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Calendar className="size-6 text-purple-600 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">Course Plan Studio</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                className="pl-10 h-9 w-[200px] lg:w-[300px]"
                onClick={onSearchCourse}
                readOnly
              />
            </div>

            {totalCredits > 0 && (
              <div className="text-sm text-muted-foreground hidden md:block">
                <span className="font-semibold text-foreground">
                  {totalCredits}
                </span>{" "}
                CR
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={manualSync}
              disabled={syncStatus === "syncing"}
              className="gap-2 hidden sm:flex"
            >
              {getSyncIcon()}
              <span className="text-xs text-muted-foreground">
                {getSyncText()}
              </span>
            </Button>

            <RichButton
              size="icon-sm"
              variant="outline"
              onClick={onAddTerm}
              tooltip="Add Term"
            >
              <Plus />
            </RichButton>

            <RichButton size="icon-sm" variant="outline" tooltip="Settings">
              <Settings />
            </RichButton>
          </div>
        </div>
      </div>
    </div>
  )
}
