"use client"

import { X } from "lucide-react"

import { CourseFilterOptions, parseTermId } from "@/lib/course-utils"
import { cn } from "@/lib/utils"

import { badgeVariants } from "./ui/badge"
import { Button } from "./ui/button"
import { Checkbox } from "./ui/checkbox"

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

const MultiCheckboxList = ({
  activeValues,
  options,
  onToggle,
  onClear,
  title,
}: {
  activeValues: Set<string>
  options: {
    label: string
    value: string
  }[]
  onToggle: (value: string) => void
  onClear: () => void
  title: string
}) => {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium py-2">{title}</div>
      <div className="rounded-lg border border-border">
        {options.map((option, i) => (
          <div
            key={option.value}
            className={cn(
              "flex flex-row items-center gap-3 px-3 py-2 trans cursor-pointer",
              i !== 0 && "border-t border-border",
              activeValues.has(option.value)
                ? "text-foreground"
                : "text-foreground/60 hover:text-foreground"
            )}
            onClick={() => {
              onToggle(option.value)
            }}
          >
            <div className="flex-none">
              <Checkbox
                checked={activeValues.has(option.value)}
                onCheckedChange={() => {
                  onToggle(option.value)
                }}
              />
            </div>
            <div className="flex-1 text-sm font-normal">{option.label}</div>
          </div>
        ))}
      </div>
      {activeValues.size > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full opacity-60"
          onClick={onClear}
        >
          <X className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}
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

export const CourseFiltersVertical = ({
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
      <MultiCheckboxList
        activeValues={filterState.credits}
        options={filterOptions.credits.map((credit) => ({
          label: credit.value,
          value: credit.value,
        }))}
        onToggle={(value) => {
          setFilterState({ ...filterState, credits: new Set(value) })
        }}
        onClear={() => {
          setFilterState({ ...filterState, credits: new Set() })
        }}
        title="Credits"
      />

      {/* Gen Edu Reqs */}
      <MultiCheckboxList
        activeValues={filterState.genEduReqs}
        options={filterOptions.genEduReqs.map((genEduReq) => ({
          label: genEduReq.value,
          value: genEduReq.value,
        }))}
        onToggle={(value) => {
          setFilterState({ ...filterState, genEduReqs: new Set(value) })
        }}
        onClear={() => {
          setFilterState({ ...filterState, genEduReqs: new Set() })
        }}
        title="Gen Ed Requirements"
      />

      {/* <div
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
      </div> */}

      {/* Levels */}
      <MultiCheckboxList
        activeValues={filterState.levels}
        options={filterOptions.levels.map((level) => ({
          label: level.value,
          value: level.value,
        }))}
        onToggle={(value) => {
          setFilterState({ ...filterState, levels: new Set(value) })
        }}
        onClear={() => {
          setFilterState({ ...filterState, levels: new Set() })
        }}
        title="Levels"
      />
      {/* 
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
      </div> */}

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
