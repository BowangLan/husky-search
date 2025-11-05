"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useNode } from "@/store/prereq-graph-node-map.store"
import {
  Panel,
  ReactFlowStore,
  useNodesState,
  useReactFlow,
  useStore,
} from "@xyflow/react"
import { Check, ChevronRight, Plus, X } from "lucide-react"

import type {
  PrereqGraphCourseNodeData,
  PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import { cn } from "@/lib/utils"
import { useCourseSearch } from "@/hooks/use-course-search"
import {
  usePrereqGraphAddCourse,
  usePrereqGraphRemoveCourse,
} from "@/hooks/use-prereq-graph-course-operations"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { Icons } from "../icons"
import { Button, buttonVariants } from "../ui/button"
import { RichButton } from "../ui/rich-button"
import { CourseSmallBlock } from "./course-small-block"
import { Section, SectionTitle } from "./panel-section"
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

function useIsNodeSelected(nodeId: string) {
  const { getNode } = useReactFlow()
  const node = getNode(nodeId)
  const selectedRef = useRef<boolean>(false)

  useEffect(() => {
    if (node?.selected) {
      selectedRef.current = true
    } else {
      selectedRef.current = false
    }
  }, [node?.selected])

  return selectedRef.current ?? false
}

const AddCourseButton = ({ courseCode }: { courseCode: string }) => {
  const { addCourse, loadingCourseCodes } = usePrereqGraphAddCourse()
  const isPrimaryCourse = useInteractivePrereqGraphState((state) =>
    state.primaryCourseCodes.has(courseCode)
  )
  const { removeCourse } = usePrereqGraphRemoveCourse({ isPrimaryCourse })

  if (isPrimaryCourse) {
    return (
      <RichButton
        tooltip="Remove course and all associated courses from graph"
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          removeCourse(courseCode)
        }}
      >
        <X className="size-4" />
      </RichButton>
    )
  }

  return (
    <>
      <RichButton
        tooltip="Remove this course only from graph"
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          removeCourse(courseCode)
        }}
        disabled={loadingCourseCodes.has(courseCode)}
      >
        <X className="size-3.5" />
      </RichButton>
      <RichButton
        tooltip="Add course and all associated courses to graph"
        variant="ghost"
        size="icon-xs"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          addCourse(courseCode)
        }}
        loading={loadingCourseCodes.has(courseCode)}
      >
        <Plus className="size-4" />
      </RichButton>
    </>
  )
}

const CourseSmallBlockWithState = ({ courseCode }: { courseCode: string }) => {
  const course = useInteractivePrereqGraphState((state) =>
    state.coursesMap.get(courseCode)
  )
  const centerNode = useNodeSelectAndCenter()
  const isSelected = useIsNodeSelected(courseCode)
  const isPrimaryCourse = useInteractivePrereqGraphState((state) =>
    state.primaryCourseCodes.has(courseCode)
  )

  if (!course) return null

  return (
    <div className="relative group w-full">
      <CourseSmallBlock
        courseCode={courseCode}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          centerNode(courseCode)
        }}
        className={cn(
          isPrimaryCourse &&
            "dark:bg-primary/50 bg-primary/30 hover:dark:bg-primary/70 hover:bg-primary/60",
          isSelected && "border-primary bg-primary text-primary-foreground"
        )}
      />

      <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <AddCourseButton courseCode={courseCode} />
      </div>
    </div>
  )
}

const CurrentCourseList = () => {
  const courseMap = useInteractivePrereqGraphState((state) => state.coursesMap)
  const courseCodes = useInteractivePrereqGraphState(
    (state) => state.courseCodes
  )
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )

  // Group courses by subjectArea using useMemo
  const groupedCourses = useMemo(() => {
    const groups: Record<string, { subjectArea: string; courses: any[] }> = {}

    Array.from(courseCodes)
      .map((courseCode) => courseMap.get(courseCode))
      .filter(
        (course) =>
          course !== undefined && !primaryCourseCodes.has(course.courseCode)
      )
      .forEach((course) => {
        const subjectArea = course!.subjectArea || "Other"
        if (!groups[subjectArea]) {
          groups[subjectArea] = { subjectArea, courses: [] }
        }
        groups[subjectArea].courses.push(course)
      })

    // Sort subjectAreas alphabetically, and within, sort courses alphabetically by courseCode
    return Object.values(groups)
      .sort((a, b) => a.subjectArea.localeCompare(b.subjectArea))
      .map(({ subjectArea, courses }) => ({
        subjectArea,
        courses: courses.sort((a, b) =>
          a.courseCode.localeCompare(b.courseCode)
        ),
      }))
  }, [courseMap, courseCodes])

  const [expandedSubjectAreas, setExpandedSubjectAreas] = useState<Set<string>>(
    new Set()
  )

  const handleSubjectAreaExpandToggle = (subjectArea: string) => {
    setExpandedSubjectAreas((prev) => {
      const newSet = new Set(prev)
      if (prev.has(subjectArea)) {
        newSet.delete(subjectArea)
      } else {
        newSet.add(subjectArea)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-1 py-4 bg-background rounded-lg border shadow-md backdrop-blur-sm">
      <Section>
        {/* <SectionTitle>Primary Courses</SectionTitle> */}
        <div className="flex flex-col gap-1">
          {Array.from(primaryCourseCodes)
            .sort((a, b) => a.localeCompare(b))
            .map((courseCode) => (
              <CourseSmallBlockWithState
                key={courseCode}
                courseCode={courseCode}
              />
            ))}
        </div>
      </Section>
      <Section>
        {/* <SectionTitle>Associated Courses</SectionTitle> */}
        <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
          {groupedCourses.map((group) => (
            <div key={group.subjectArea} className="flex flex-col gap-1">
              <div
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "h-9 justify-start gap-2 select-none text-xs"
                )}
                onClick={() => handleSubjectAreaExpandToggle(group.subjectArea)}
              >
                <Icons.subjectArea className="size-3.5" />
                <div className="flex-1 flex flex-row items-center gap-2">
                  {group.subjectArea}
                </div>

                <div className="text-xs text-muted-foreground">
                  {group.courses.length} courses
                </div>

                {/* chevron right */}
                <ChevronRight
                  className={cn(
                    "size-3.5 trans",
                    expandedSubjectAreas.has(group.subjectArea) && "rotate-90"
                    // isExpanded && "rotate-90"
                  )}
                />
              </div>
              {expandedSubjectAreas.has(group.subjectArea) && (
                <div className="flex flex-col gap-1">
                  {group.courses.map((course) => (
                    <CourseSmallBlockWithState
                      key={course.courseCode}
                      courseCode={course.courseCode}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

export function PrereqGraphSearchPanel({ nodes }: PrereqGraphSearchPanelProps) {
  const [searchInGraphOpen, setSearchInGraphOpen] = useState(false)
  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const [searchInGraphValue, setSearchInGraphValue] = useState("")

  // Hooks for course operations
  const { addCourse, loadingCourseCodes } = usePrereqGraphAddCourse()
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )
  const primarySubjectArea = useInteractivePrereqGraphState(
    (state) => state.primarySubjectArea
  )

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
    // TODO:
    // addMajor(majorCode)

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
        <CurrentCourseList />

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
                          const added = primarySubjectArea === major.code
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
                          const added = primaryCourseCodes.has(course)
                          const isLoading = loadingCourseCodes.has(
                            course.replace(/\s+/g, "").toUpperCase()
                          )
                          return (
                            <CommandItem
                              key={`course-${course}`}
                              value={course}
                              onSelect={() => {
                                if (!added && !isLoading) {
                                  handleCourseSelect(course)
                                }
                              }}
                              className={`cursor-pointer ${
                                added || isLoading
                                  ? "opacity-60 cursor-not-allowed"
                                  : "hover:bg-accent"
                              }`}
                              disabled={added || isLoading}
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
                                {isLoading && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    Adding...
                                  </span>
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
