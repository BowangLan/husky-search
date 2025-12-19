"use client"

import { LayoutGrid, LayoutList, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { SortOption } from "./types"

interface GenEdCoursesToolbarProps {
  // Search
  searchQuery: string
  onSearchChange: (value: string) => void

  displayedCount: number
  filteredCount: number
  totalCount: number
  sortBy: SortOption
  onSortChange: (value: SortOption) => void
  viewMode: "list" | "grid"
  onViewModeToggle: () => void
}

export function GenEdCoursesToolbar({
  searchQuery,
  onSearchChange,
  displayedCount,
  filteredCount,
  totalCount,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeToggle,
}: GenEdCoursesToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-4">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Search */}
        <div className="w-full sm:w-[220px]">
          <Label htmlFor="gen-ed-search" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="gen-ed-search"
              type="search"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 rounded-md h-9"
            />
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {displayedCount} of {filteredCount}{" "}
        {filteredCount !== totalCount && `(${totalCount} total)`} courses
      </div>

      <div className="flex-1"></div>

      <div className="flex items-center gap-3">
        <div className="text-sm text-muted-foreground">Sort By:</div>

        {/* Sort By */}
        <Select
          value={sortBy}
          onValueChange={(value) => onSortChange(value as SortOption)}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="course-code">Course Code</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Mode Toggle */}
      <div className="inline-flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
        <Button
          variant={viewMode === "list" ? "default" : "ghost"}
          size="sm"
          onClick={onViewModeToggle}
          className="gap-2"
        >
          <LayoutList className="h-4 w-4" />
          <span className="hidden sm:inline">List</span>
        </Button>
        <Button
          variant={viewMode === "grid" ? "default" : "ghost"}
          size="sm"
          onClick={onViewModeToggle}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Grid</span>
        </Button>
      </div>
    </div>
  )
}
