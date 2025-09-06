import { Calendar, Check, List, X } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn, weekDays } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  return (
    <TabsList className="gap-1 h-10">
      <TabsTrigger value="list" className="aspect-square px-0">
        <List className="size-4" />
        {/* List */}
      </TabsTrigger>
      <TabsTrigger value="calendar" className="aspect-square px-0">
        <Calendar className="size-4" />
        {/* Calendar */}
      </TabsTrigger>
    </TabsList>
  )
}

const TabItem = ({
  children,
  className,
  active,
  onClick,
  square = false,
}: {
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
  square?: boolean
}) => {
  return (
    <div
      className={cn(
        "text-sm h-full flex items-center justify-center cursor-pointer rounded-md trans select-none",
        active
          ? "bg-button-accent-hover-active"
          : "bg-button-ghost-hover-active",
        square ? "aspect-square" : "px-2.5",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
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
      <div className="p-1 rounded-lg border border-foreground/10 h-10 flex items-center gap-1">
        {weekDays.map((day) => (
          <TabItem
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
          </TabItem>
        ))}
      </div>
    </div>
  )
}

export const CourseSessionsToolbar = () => {
  const { setSelectedSessionIds } = useCourseSessions()

  return (
    <div className="my-4 mx-4 md:mx-6 md:my-6">
      <div>
        <div className="flex items-center gap-4 mb-4">
          <ShowOpenOnlyButton />
          <div className="flex-1"></div>
          <WeekDaySelector />
          <ViewTabs />
        </div>
      </div>
      <div className="mt-4" onMouseLeave={() => setSelectedSessionIds([])}>
        <SessionChips />
      </div>
    </div>
  )
}
