"use client"

import { X } from "lucide-react"

import { CourseFilterOptions, parseTermId } from "@/lib/course-utils"
import { cn } from "@/lib/utils"

import { badgeVariants } from "./ui/badge"

const Pill = ({
  children,
  onClick,
  active,
  count,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  count: number
}) => {
  return (
    <div
      role="listitem"
      className={cn(
        badgeVariants({
          variant: active ? "default" : "outline",
          size: "default",
        }),
        "cursor-pointer py-1.5 px-2.5 text-sm transition-all hover:bg-foreground/5 dark:hover:bg-foreground/10",
        "flex flex-row items-center gap-1",
        active && "hover:opacity-80"
      )}
      onClick={onClick}
    >
      {children}
      {count > 0 && (
        <span className="text-xs font-mono text-muted-foreground leading-[1] inline-flex ml-1 mt-[1px]">
          ({count})
        </span>
      )}
    </div>
  )
}

const ClearButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <div
      role="listitem"
      className={cn(
        badgeVariants({
          variant: "ghost",
        }),
        "cursor-pointer py-1.5 px-2.5 text-sm transition-all text-muted-foreground hover:bg-foreground/5 dark:hover:bg-foreground/10"
      )}
      onClick={() => {
        onClick()
      }}
    >
      <X className="w-4 h-4 mr-1" />
      Clear
    </div>
  )
}

export type CourseFilterState = {
  credits: Set<string>
  genEduReqs: Set<string>
  terms: Set<string>
  levels: Set<string>
}

export const CourseFilters = ({
  filterOptions,
  filterState,
  setFilterState,
}: {
  filterOptions: CourseFilterOptions
  filterState: CourseFilterState
  setFilterState: (state: CourseFilterState) => void
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Credits */}
      <div className="flex flex-row items-center gap-2 flex-wrap">
        {filterOptions.credits.map((credit) => (
          <Pill
            key={credit.value}
            active={filterState.credits.has(credit.value)}
            onClick={() => {
              const newState = new Set(filterState.credits)
              if (newState.has(credit.value)) {
                newState.delete(credit.value)
              } else {
                newState.add(credit.value)
              }
              setFilterState({ ...filterState, credits: newState })
            }}
            count={credit.count}
          >
            {credit.value}
          </Pill>
        ))}
        {filterState.credits.size > 0 && (
          <ClearButton
            onClick={() => {
              setFilterState({ ...filterState, credits: new Set() })
            }}
          />
        )}
      </div>

      {/* Gen Edu Reqs */}
      <div
        className="flex flex-row items-center gap-2 flex-wrap"
        style={{
          display: filterOptions.genEduReqs.length > 0 ? "flex" : "none",
        }}
      >
        {filterOptions.genEduReqs.map((genEduReq) => (
          <Pill
            key={genEduReq.value}
            active={filterState.genEduReqs.has(genEduReq.value)}
            onClick={() => {
              const newState = new Set(filterState.genEduReqs)
              if (newState.has(genEduReq.value)) {
                newState.delete(genEduReq.value)
              } else {
                newState.add(genEduReq.value)
              }
              setFilterState({ ...filterState, genEduReqs: newState })
            }}
            count={genEduReq.count}
          >
            {genEduReq.value}
          </Pill>
        ))}
        {filterState.genEduReqs.size > 0 && (
          <ClearButton
            onClick={() => {
              setFilterState({ ...filterState, genEduReqs: new Set() })
            }}
          />
        )}
      </div>

      {/* Levels */}
      <div className="flex flex-row items-center gap-2 flex-wrap">
        {filterOptions.levels.map((level) => (
          <Pill
            key={level.value}
            active={filterState.levels.has(level.value)}
            onClick={() => {
              const newState = new Set(filterState.levels)
              if (newState.has(level.value)) {
                newState.delete(level.value)
              } else {
                newState.add(level.value)
              }
              setFilterState({ ...filterState, levels: newState })
            }}
            count={level.count}
          >
            {level.value}
          </Pill>
        ))}
        {filterState.levels.size > 0 && (
          <ClearButton
            onClick={() => {
              setFilterState({ ...filterState, levels: new Set() })
            }}
          />
        )}
      </div>

      {/* Terms */}
      <div className="flex flex-row items-center gap-2 flex-wrap">
        {filterOptions.terms.map((term) => (
          <Pill
            key={term.value}
            active={filterState.terms.has(term.value)}
            onClick={() => {
              const newState = new Set(filterState.terms)
              if (newState.has(term.value)) {
                newState.delete(term.value)
              } else {
                newState.add(term.value)
              }
              setFilterState({ ...filterState, terms: newState })
            }}
            count={term.count}
          >
            {parseTermId(term.value).label}
            {/* {term.value} */}
          </Pill>
        ))}
        {filterState.terms.size > 0 && (
          <ClearButton
            onClick={() => {
              setFilterState({ ...filterState, terms: new Set() })
            }}
          />
        )}
      </div>
    </div>
  )
}
