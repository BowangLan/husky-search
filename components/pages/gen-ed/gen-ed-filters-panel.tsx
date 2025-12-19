"use client"

import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import {
  FilterCheckboxGroup,
  FilterCheckboxItem,
  FilterCountPill,
  FilterSection,
  FilterSections,
} from "@/components/ui/filter-primitives"

import {
  ENROLL_STATUS_OPTIONS,
  EnrollStatusOption,
  FilterOptions,
} from "./types"

interface GenEdFiltersPanelProps {
  // Enrollment status
  selectedEnrollStatuses: Set<EnrollStatusOption>
  onToggleEnrollStatus: (status: EnrollStatusOption) => void

  // Has prerequisite
  hasPrereqFilter: boolean | null
  onHasPrereqChange: (value: boolean | null) => void

  // Filter options
  filterOptions: FilterOptions

  // Selected filters
  selectedMajors: Set<string>
  selectedCredits: Set<string>
  selectedLevels: Set<string>

  // Toggle callbacks
  onToggleMajor: (major: string) => void
  onToggleCredit: (credit: string) => void
  onToggleLevel: (level: string) => void

  // Clear filters
  activeFilterCount: number
  onClearFilters: () => void
}

export function GenEdFiltersPanel({
  selectedEnrollStatuses,
  onToggleEnrollStatus,
  hasPrereqFilter,
  onHasPrereqChange,
  filterOptions,
  selectedMajors,
  selectedCredits,
  selectedLevels,
  onToggleMajor,
  onToggleCredit,
  onToggleLevel,
  activeFilterCount,
  onClearFilters,
}: GenEdFiltersPanelProps) {
  const majorsSortedByCountDesc = useMemo(() => {
    const counts = filterOptions.counts.majors
    return [...filterOptions.majors].sort((a, b) => {
      const countDiff = (counts[b] ?? 0) - (counts[a] ?? 0)
      if (countDiff !== 0) return countDiff
      return a.localeCompare(b)
    })
  }, [filterOptions.majors, filterOptions.counts.majors])

  return (
    <aside className="lg:w-72 lg:flex-none border-r h-full lg:overflow-y-auto">
      <div className="">
        <div className="space-y-4 py-4 px-4">
          <div className="mb-4 flex items-center justify-between pl-3">
            <div>
              <h3 className="font-semibold text-sm">Filters</h3>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
          </div>

          <FilterSections
            defaultValue={[
              "enrollment",
              "prereqs",
              "level",
              "credits",
              "major",
            ]}
          >
            {/* Enrollment Status */}
            <FilterSection
              value="enrollment"
              title="Enrollment Status"
              right={
                selectedEnrollStatuses.size > 0 ? (
                  <FilterCountPill>
                    {selectedEnrollStatuses.size}
                  </FilterCountPill>
                ) : null
              }
            >
              <FilterCheckboxGroup>
                {ENROLL_STATUS_OPTIONS.map((option) => (
                  <FilterCheckboxItem
                    key={option.value}
                    id={`enroll-${option.value}`}
                    checked={selectedEnrollStatuses.has(option.value)}
                    onCheckedChange={() => onToggleEnrollStatus(option.value)}
                    label={option.label}
                    count={
                      filterOptions.counts.enrollStatuses[option.value] ?? 0
                    }
                  />
                ))}
              </FilterCheckboxGroup>
            </FilterSection>

            {/* Prerequisites */}
            <FilterSection
              value="prereqs"
              title="Prerequisites"
              right={
                hasPrereqFilter !== null ? (
                  <FilterCountPill>1</FilterCountPill>
                ) : null
              }
            >
              <FilterCheckboxGroup>
                <FilterCheckboxItem
                  id="has-prereq"
                  checked={hasPrereqFilter === true}
                  onCheckedChange={() =>
                    onHasPrereqChange(hasPrereqFilter === true ? null : true)
                  }
                  label="Has prerequisites"
                  count={filterOptions.counts.hasPrereq ?? 0}
                />
              </FilterCheckboxGroup>
            </FilterSection>

            {/* Level Filter */}
            <FilterSection
              value="level"
              title="Level"
              right={
                selectedLevels.size > 0 ? (
                  <FilterCountPill>{selectedLevels.size}</FilterCountPill>
                ) : null
              }
            >
              <FilterCheckboxGroup className="max-h-64 overflow-auto">
                {filterOptions.levels.map((level) => (
                  <FilterCheckboxItem
                    key={level}
                    id={`level-${level}`}
                    checked={selectedLevels.has(level)}
                    onCheckedChange={() => onToggleLevel(level)}
                    label={level}
                    count={filterOptions.counts.levels[level] ?? 0}
                  />
                ))}
              </FilterCheckboxGroup>
            </FilterSection>

            {/* Credit Filter */}
            <FilterSection
              value="credits"
              title="Credits"
              right={
                selectedCredits.size > 0 ? (
                  <FilterCountPill>{selectedCredits.size}</FilterCountPill>
                ) : null
              }
            >
              <FilterCheckboxGroup className="max-h-64 overflow-auto">
                {filterOptions.credits.map((credit) => (
                  <FilterCheckboxItem
                    key={credit}
                    id={`credit-${credit}`}
                    checked={selectedCredits.has(credit)}
                    onCheckedChange={() => onToggleCredit(credit)}
                    label={credit}
                    count={filterOptions.counts.credits[credit] ?? 0}
                  />
                ))}
              </FilterCheckboxGroup>
            </FilterSection>

            {/* Major Filter */}
            <FilterSection
              value="major"
              title="Major"
              right={
                selectedMajors.size > 0 ? (
                  <FilterCountPill>{selectedMajors.size}</FilterCountPill>
                ) : null
              }
            >
              <FilterCheckboxGroup className="max-h-72 overflow-auto">
                {majorsSortedByCountDesc.map((major) => (
                  <FilterCheckboxItem
                    key={major}
                    id={`major-${major}`}
                    checked={selectedMajors.has(major)}
                    onCheckedChange={() => onToggleMajor(major)}
                    label={major}
                    count={filterOptions.counts.majors[major] ?? 0}
                  />
                ))}
              </FilterCheckboxGroup>
            </FilterSection>
          </FilterSections>
        </div>
      </div>
    </aside>
  )
}
