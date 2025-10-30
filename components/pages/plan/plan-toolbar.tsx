"use client"

import { useTotalCredits } from "@/store/course-plan.store"
import { Calendar, Plus, Search, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichButton } from "@/components/ui/rich-button"

type PlanToolbarProps = {
  onAddTerm: () => void
  onSearchCourse: () => void
}

export function PlanToolbar({ onAddTerm, onSearchCourse }: PlanToolbarProps) {
  const totalCredits = useTotalCredits()

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
