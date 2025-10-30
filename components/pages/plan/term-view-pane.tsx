"use client"

import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTerms } from "@/store/course-plan.store"
import { TermCard } from "./term-card"
import { PaneContainer, PaneToolbar, PaneToolbarItem, PaneContent } from "./pane-container"

type TermViewPaneProps = {
  onAddTerm: () => void
  onAddCourseToTerm: (termId: string) => void
}

export function TermViewPane({
  onAddTerm,
  onAddCourseToTerm,
}: TermViewPaneProps) {
  const terms = useTerms()

  if (terms.length === 0) {
    return (
      <PaneContainer>
        <div className="flex flex-col items-center justify-center h-full px-4 text-center">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-4 mb-4">
            <Calendar className="size-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Start Planning Your Courses</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your personalized course plan by adding terms and selecting
            courses. Track credits, visualize your schedule, and plan ahead.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onAddTerm} size="lg">
              <Plus className="size-4 mr-2" />
              Add Your First Term
            </Button>
            <Button variant="outline" size="lg">
              <Calendar className="size-4 mr-2" />
              Quick Add 4 Quarters
            </Button>
          </div>
        </div>
      </PaneContainer>
    )
  }

  return (
    <PaneContainer>
      <PaneToolbar foldable>
        <div className="flex items-center justify-between">
          <PaneToolbarItem>
            My Terms ({terms.length})
          </PaneToolbarItem>
          <Button onClick={onAddTerm} size="sm" variant="ghost" className="shrink-0">
            <Plus className="size-4 mr-2" />
            Add Term
          </Button>
        </div>
      </PaneToolbar>

      <PaneContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {terms.map((term) => (
            <TermCard
              key={term.id}
              term={term}
              onAddCourse={() => onAddCourseToTerm(term.id)}
            />
          ))}
        </div>
      </PaneContent>
    </PaneContainer>
  )
}
