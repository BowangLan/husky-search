"use client"

import * as React from "react"
import { useMemo } from "react"
import { useAddTerm, useActiveTermIds } from "@/store/course-plan.store"
import { useTerms } from "@/store/course-plan.store"
import type { Quarter } from "@/store/course-plan.store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ChooseTermDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTerm: (termId: string) => void
}

const quarterOrder: Record<Quarter, number> = {
  Winter: 1,
  Spring: 2,
  Summer: 3,
  Autumn: 4,
}

const quarters: Quarter[] = ["Winter", "Spring", "Summer", "Autumn"]

function createTermId(year: number, quarter: Quarter): string {
  return `${year}-${quarter}`
}

function createTermLabel(year: number, quarter: Quarter): string {
  return `${quarter} ${year}`
}

export function ChooseTermDialog({
  open,
  onOpenChange,
  onSelectTerm,
}: ChooseTermDialogProps) {
  const addTerm = useAddTerm()
  const existingTerms = useTerms()
  const activeTermIds = useActiveTermIds()

  // Generate terms for the next 4 years
  const availableTerms = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Determine current quarter to start from
    let startQuarter: Quarter
    if (currentMonth >= 1 && currentMonth <= 3) startQuarter = "Winter"
    else if (currentMonth >= 4 && currentMonth <= 6) startQuarter = "Spring"
    else if (currentMonth >= 7 && currentMonth <= 9) startQuarter = "Summer"
    else startQuarter = "Autumn"

    const terms: Array<{ termId: string; year: number; quarter: Quarter; label: string; exists: boolean }> = []

    // Start from current quarter
    let quarterIndex = quarters.indexOf(startQuarter)
    let year = currentYear

    // Generate 16 terms (4 years * 4 quarters)
    for (let i = 0; i < 16; i++) {
      const quarter = quarters[quarterIndex]
      const termId = createTermId(year, quarter)

      // Check if term exists
      const existingTerm = existingTerms.find((t) => t.id === termId)

      terms.push({
        termId,
        year,
        quarter,
        label: createTermLabel(year, quarter),
        exists: !!existingTerm,
      })

      // Move to next quarter
      quarterIndex++
      if (quarterIndex >= quarters.length) {
        quarterIndex = 0
        year++
      }
    }

    // Sort terms ascendingly
    return terms.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return quarterOrder[a.quarter] - quarterOrder[b.quarter]
    })
  }, [existingTerms])

  const handleSelectTerm = (termId: string, year: number, quarter: Quarter, exists: boolean) => {
    // Create term if it doesn't exist
    if (!exists) {
      addTerm(year, quarter)
    }
    onSelectTerm(termId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Term</DialogTitle>
          <DialogDescription>
            Select which term you want to add this course to.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto py-4">
          {availableTerms.map((term) => {
            const isActive = activeTermIds.includes(term.termId)
            return (
              <Button
                key={term.termId}
                variant="outline"
                className={cn(
                  "justify-between h-auto py-2 px-3 w-full",
                  isActive && "border-primary/50 bg-primary/5 hover:bg-primary/10 hover:border-primary/70"
                )}
                onClick={() => handleSelectTerm(term.termId, term.year, term.quarter, term.exists)}
              >
                <span className="text-sm">{term.label}</span>
                {isActive && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

