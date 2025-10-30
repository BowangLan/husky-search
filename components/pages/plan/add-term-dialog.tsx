"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Quarter, useAddTerm } from "@/store/course-plan.store"
import { toast } from "sonner"

type AddTermDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTermDialog({ open, onOpenChange }: AddTermDialogProps) {
  const addTerm = useAddTerm()
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Determine default quarter based on current month
  const getDefaultQuarter = (): Quarter => {
    if (currentMonth >= 0 && currentMonth <= 2) return "Winter"
    if (currentMonth >= 3 && currentMonth <= 5) return "Spring"
    if (currentMonth >= 6 && currentMonth <= 8) return "Summer"
    return "Autumn"
  }

  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(getDefaultQuarter())

  // Generate year options (current year - 1 to current year + 5)
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 1 + i)

  const handleAdd = () => {
    const year = parseInt(selectedYear)
    addTerm(year, selectedQuarter)
    toast.success("Term added", {
      description: `${selectedQuarter} ${year} has been added to your plan`,
    })
    onOpenChange(false)
  }

  const handleQuickAdd = () => {
    const year = parseInt(selectedYear)
    const quarters: Quarter[] = ["Autumn", "Winter", "Spring", "Summer"]

    // Add 4 consecutive quarters starting from selected
    const startIndex = quarters.indexOf(selectedQuarter)
    let currentYear = year

    for (let i = 0; i < 4; i++) {
      const quarterIndex = (startIndex + i) % 4
      const quarter = quarters[quarterIndex]

      // Increment year when we wrap around to Autumn
      if (i > 0 && quarter === "Autumn") {
        currentYear++
      }

      addTerm(currentYear, quarter)
    }

    toast.success("4 terms added", {
      description: "Added 4 consecutive quarters to your plan",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Term</DialogTitle>
          <DialogDescription>
            Select a quarter and year to add to your course plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quarter">Quarter</Label>
            <Select
              value={selectedQuarter}
              onValueChange={(value) => setSelectedQuarter(value as Quarter)}
            >
              <SelectTrigger id="quarter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Winter">Winter</SelectItem>
                <SelectItem value="Spring">Spring</SelectItem>
                <SelectItem value="Summer">Summer</SelectItem>
                <SelectItem value="Autumn">Autumn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleQuickAdd} className="sm:mr-auto">
            Quick Add 4 Quarters
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button onClick={handleAdd} className="flex-1 sm:flex-initial">Add Term</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
