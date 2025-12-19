import { ConvexCourseOverview } from "@/types/convex-courses"

export type EnrollStatusOption = "open" | "closed" | "not-offered"
export type SortOption = "course-code" | "popularity"

export const ENROLL_STATUS_OPTIONS: {
  value: EnrollStatusOption
  label: string
}[] = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "not-offered", label: "Not Currently Offered" },
]

export interface FilterOptions {
  majors: string[]
  credits: string[]
  levels: string[]
  counts: {
    majors: Record<string, number>
    credits: Record<string, number>
    levels: Record<string, number>
    enrollStatuses: Record<EnrollStatusOption, number>
    hasPrereq: number
  }
}

export interface FilterState {
  searchQuery: string
  selectedEnrollStatuses: Set<EnrollStatusOption>
  selectedMajors: Set<string>
  selectedCredits: Set<string>
  selectedLevels: Set<string>
  hasPrereqFilter: boolean | null
}

export interface CourseAvailability {
  open: number
  closed: number
  notOffered: number
  total: number
}

export interface GenEdCourseFiltersReturn {
  // Filter state
  searchQuery: string
  setSearchQuery: (value: string) => void
  selectedEnrollStatuses: Set<EnrollStatusOption>
  toggleEnrollStatus: (status: EnrollStatusOption) => void
  selectedMajors: Set<string>
  selectedCredits: Set<string>
  selectedLevels: Set<string>
  hasPrereqFilter: boolean | null
  setHasPrereqFilter: (value: boolean | null) => void

  // Toggle functions
  toggleMajor: (major: string) => void
  toggleCredit: (credit: string) => void
  toggleLevel: (level: string) => void
  clearFilters: () => void

  // Computed values
  filterOptions: FilterOptions
  filteredCourses: ConvexCourseOverview[]
  sortedCourses: ConvexCourseOverview[]
  displayedCourses: ConvexCourseOverview[]
  courseAvailability: CourseAvailability
  activeFilterCount: number

  // Sorting
  sortBy: SortOption
  setSortBy: (value: SortOption) => void
}

