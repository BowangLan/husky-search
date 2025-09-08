import { Calendar, Check, List, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn, weekDays } from "@/lib/utils"
import { FilterTabItem, FilterTabList } from "@/components/ui/filter-tabs"

import { SessionChips } from "./course-session-chips"
import { useCourseSessions } from "./course-sessions-context"

const ShowOpenOnlyButton = () => {
  const { showOpenOnly, setShowOpenOnly } = useCourseSessions()
  return (
    <motion.div
      layout
      role="button"
      transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
      className={cn(
        "flex items-center rounded-md px-3 h-10 border trans cursor-pointer",
        showOpenOnly
          ? "bg-foreground/10 hover:bg-foreground/15 active:bg-foreground/20 border-foreground/10 hover:border-foreground/15 active:border-foreground/20"
          : "hover:bg-foreground/10 active:bg-foreground/10 border-foreground/10 hover:border-foreground/10 active:border-foreground/15"
      )}
      onClick={() => setShowOpenOnly(!showOpenOnly)}
    >
      <AnimatePresence mode="wait">
        {showOpenOnly && (
          <motion.div
            initial={{ opacity: 0, scale: 0, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: "auto" }}
            exit={{ opacity: 0, scale: 0, width: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
          >
            <Check className="size-4 mr-2" />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="text-sm">Show open sessions only</div>
    </motion.div>
  )
}

const ViewTabs = () => {
  const { viewType, setViewType } = useCourseSessions()
  return (
    <FilterTabList>
      <FilterTabItem
        square={true}
        active={viewType === "list"}
        onClick={() => setViewType("list")}
      >
        <List className="size-4" />
      </FilterTabItem>
      <FilterTabItem
        square={true}
        active={viewType === "calendar"}
        onClick={() => setViewType("calendar")}
      >
        <Calendar className="size-4" />
      </FilterTabItem>
    </FilterTabList>
  )
}

const WeekDaySelector = () => {
  const { selectedWeekDaySet, setSelectedWeekDaySet } = useCourseSessions()

  return (
    <div className="relative flex items-center">
      <AnimatePresence mode="wait">
        {selectedWeekDaySet.size > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0, width: 0 }}
            animate={{ opacity: 1, scale: 1, width: "auto" }}
            exit={{ opacity: 0, scale: 0, width: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="bg-button-ghost-hover-active rounded-md h-8 aspect-square flex items-center justify-center cursor-pointer mr-1"
            onClick={() => setSelectedWeekDaySet(new Set())}
          >
            <X className="size-4" />
          </motion.div>
        )}
      </AnimatePresence>
      <FilterTabList>
        {weekDays.map((day) => (
          <FilterTabItem
            key={day}
            square={true}
            active={selectedWeekDaySet.has(day)}
            onClick={() => {
              const newSet = new Set(selectedWeekDaySet)
              if (selectedWeekDaySet.has(day)) {
                newSet.delete(day)
              } else {
                newSet.add(day)
              }
              setSelectedWeekDaySet(newSet)
            }}
          >
            {day}
          </FilterTabItem>
        ))}
      </FilterTabList>
    </div>
  )
}

export const CourseSessionsToolbar = () => {
  const { setSelectedSessionIds } = useCourseSessions()

  return (
    <div className="my-4 mx-4 md:mx-6 md:my-6 flex flex-col gap-4 md:gap-6">
      {/* Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-4">
        {/* Mobile */}
        <div className="flex w-full justify-between items-center gap-2 sm:hidden">
          <ShowOpenOnlyButton />
          <ViewTabs />
        </div>
        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <ViewTabs />
          <ShowOpenOnlyButton />
        </div>
        <div className="flex-1"></div>
        <WeekDaySelector />
      </div>

      {/* Row */}
      <div onMouseLeave={() => setSelectedSessionIds([])}>
        <SessionChips />
      </div>

      {/* Row */}
      <div>
        <p className="text-xs text-muted-foreground">
          Data source: MyPlan. Updates range from every few minutes to every few
          hours.
        </p>
      </div>
    </div>
  )
}
