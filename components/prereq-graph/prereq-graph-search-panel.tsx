"use client"

import { useMemo, useState } from "react"
import { Panel, useReactFlow } from "@xyflow/react"
import { Check } from "lucide-react"

import type {
  PrereqGraphCourseNodeData,
  PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import { useCourseSearch } from "@/hooks/use-course-search"
import { usePrereqGraphUrlParams } from "@/hooks/use-prereq-graph-url-params"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// import { RIGHT_PANEL_WIDTH } from "./prereq-graph-config"
import { useNodeSelectAndCenter } from "./use-node-select-and-center"

interface PrereqGraphSearchPanelProps {
  nodes: PrereqGraphNodeUnion[]
}

interface CourseOption {
  courseCode: string
  courseTitle: string
  nodeId: string
}

export function PrereqGraphSearchPanel({ nodes }: PrereqGraphSearchPanelProps) {
  const [searchInGraphOpen, setSearchInGraphOpen] = useState(false)
  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const [searchInGraphValue, setSearchInGraphValue] = useState("")

  // Hook for URL params management
  const { isCourseAdded, isMajorAdded, addCourse, addMajor } =
    usePrereqGraphUrlParams()

  // Hook for course search (add courses)
  const {
    query: addCourseQuery,
    courses,
    majors,
    loading,
    showResults,
    setShowResults,
    handleChange,
  } = useCourseSearch({
    maxCourses: 50,
    maxMajors: 10,
    autoNavigate: false,
  })

  // Hook for searching within graph
  const { getNode } = useReactFlow()
  const centerNode = useNodeSelectAndCenter()

  // Extract course codes from nodes that are course nodes
  const courseOptions = useMemo<CourseOption[]>(() => {
    return nodes
      .filter(
        (node): node is typeof node & { data: PrereqGraphCourseNodeData } => {
          return (
            node.type === "courseNode" &&
            "courseCode" in node.data &&
            typeof node.data.courseCode === "string"
          )
        }
      )
      .map((node) => ({
        courseCode: node.data.courseCode,
        courseTitle: node.data.courseTitle || "",
        nodeId: node.id,
      }))
      .sort((a, b) => a.courseCode.localeCompare(b.courseCode))
  }, [nodes])

  // Filter courses within graph based on search value
  const filteredCoursesInGraph = useMemo(() => {
    if (!searchInGraphValue.trim()) {
      return courseOptions
    }

    const query = searchInGraphValue.trim().toUpperCase()
    return courseOptions.filter(
      (course) =>
        course.courseCode.toUpperCase().includes(query) ||
        course.courseTitle.toUpperCase().includes(query)
    )
  }, [courseOptions, searchInGraphValue])

  // Handle course selection within graph
  const handleSelectInGraph = (courseCode: string) => {
    const course = courseOptions.find((c) => c.courseCode === courseCode)
    if (!course) return

    const node = getNode(course.nodeId)
    if (!node) return

    centerNode(node.id)

    // Reset search
    setSearchInGraphValue("")
    setSearchInGraphOpen(false)
  }

  // Handle course selection - update URL with new course code
  const handleCourseSelect = (courseCode: string) => {
    addCourse(courseCode)

    // Reset search
    setShowResults(false)
    setAddCourseOpen(false)
  }

  // Handle major selection - update URL with new subject area
  const handleMajorSelect = (majorCode: string) => {
    addMajor(majorCode)

    // Reset search
    setShowResults(false)
    setAddCourseOpen(false)
  }

  const handleAddCourseInputChange = (value: string) => {
    handleChange(value)
    setAddCourseOpen(true)
  }

  const PANEL_WIDTH = "min(300px, 90vw)"

  return (
    <Panel position="top-left" className="pointer-events-auto">
      <div className="flex flex-col gap-2" style={{ width: PANEL_WIDTH }}>
        {/* Search courses within graph */}
        <div>
          <Command
            shouldFilter={false}
            className="rounded-lg border shadow-md bg-background/95 backdrop-blur-sm"
          >
            <CommandInput
              placeholder="Search courses in graph..."
              value={searchInGraphValue}
              onValueChange={(value) => {
                setSearchInGraphValue(value.toUpperCase())
                setSearchInGraphOpen(true)
              }}
              onFocus={() => setSearchInGraphOpen(true)}
              onBlur={() => {
                // Close dropdown after a short delay to allow clicks to register
                setTimeout(() => setSearchInGraphOpen(false), 200)
              }}
              className="border-0 focus:ring-0"
            />
            {searchInGraphOpen && searchInGraphValue.trim() && (
              <CommandList className="max-h-[300px]">
                <CommandEmpty>No courses found.</CommandEmpty>
                <CommandGroup>
                  {filteredCoursesInGraph.map((course) => (
                    <CommandItem
                      key={course.nodeId}
                      value={course.courseCode}
                      onSelect={() => handleSelectInGraph(course.courseCode)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col gap-1 py-1">
                        <span className="font-semibold text-sm">
                          {course.courseCode}
                        </span>
                        {course.courseTitle && (
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {course.courseTitle}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>

        {/* Add course or major */}
        <div>
          <Command
            shouldFilter={false}
            className="rounded-lg border shadow-md bg-background/95 backdrop-blur-sm"
          >
            <CommandInput
              placeholder="Add course or major to graph..."
              value={addCourseQuery}
              onValueChange={handleAddCourseInputChange}
              onFocus={() => {
                setAddCourseOpen(true)
                setShowResults(true)
              }}
              onBlur={() => {
                // Close dropdown after a short delay to allow clicks to register
                setTimeout(() => {
                  setAddCourseOpen(false)
                  setShowResults(false)
                }, 200)
              }}
              className="border-0 focus:ring-0"
            />
            {addCourseOpen && showResults && addCourseQuery.trim() && (
              <CommandList className="max-h-[400px]">
                {loading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Searching...
                  </div>
                ) : courses.length === 0 && majors.length === 0 ? (
                  <CommandEmpty>No courses or majors found.</CommandEmpty>
                ) : (
                  <>
                    {majors.length > 0 && (
                      <CommandGroup heading="Majors">
                        {majors.map((major) => {
                          const added = isMajorAdded(major.code)
                          return (
                            <CommandItem
                              key={`major-${major.code}`}
                              value={major.code}
                              onSelect={() => {
                                if (!added) {
                                  handleMajorSelect(major.code)
                                }
                              }}
                              className={`cursor-pointer ${
                                added
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-accent"
                              }`}
                              disabled={added}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col gap-1 py-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">
                                      {major.code}
                                    </span>
                                    {added && (
                                      <Check className="h-3 w-3 text-green-500" />
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground line-clamp-1">
                                    {major.title}
                                  </span>
                                </div>
                                {added && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Added
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    )}
                    {courses.length > 0 && (
                      <CommandGroup heading="Courses">
                        {courses.map((course) => {
                          const added = isCourseAdded(course)
                          return (
                            <CommandItem
                              key={`course-${course}`}
                              value={course}
                              onSelect={() => {
                                if (!added) {
                                  handleCourseSelect(course)
                                }
                              }}
                              className={`cursor-pointer ${
                                added
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-accent"
                              }`}
                              disabled={added}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-semibold text-sm">
                                  {course}
                                </span>
                                {added && (
                                  <div className="flex items-center gap-2 ml-2">
                                    <Check className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-muted-foreground">
                                      Added
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
            )}
          </Command>
        </div>
      </div>
    </Panel>
  )
}
