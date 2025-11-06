"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useNodeMap } from "@/store/prereq-graph-node-map.store"
import { Edge, Panel, useReactFlow } from "@xyflow/react"
import { ChevronRight, Eye, EyeOff, Plus, Search, X } from "lucide-react"

import { ConvexCourseOverview } from "@/types/convex-courses"
import type { PrereqGraphNodeUnion } from "@/lib/prereq-graph-utils"
import { cn } from "@/lib/utils"
import {
  usePrereqGraphAddCourse,
  usePrereqGraphRemoveCourse,
} from "@/hooks/use-prereq-graph-course-operations"

import { Icons } from "../icons"
import { buttonVariants } from "../ui/button"
import { Input } from "../ui/input"
import { RichButton } from "../ui/rich-button"
import { AddCourseOrMajorPopover } from "./add-course-or-major-popover"
import { CourseSmallBlock } from "./course-small-block"
import { PanelContainer, Section } from "./panel-section"
import { PrereqGraphFilterBar } from "./prereq-graph-filter-bar"
// import { RIGHT_PANEL_WIDTH } from "./prereq-graph-config"
import { useNodeSelectAndCenter } from "./use-node-select-and-center"
import { useReactFlowNode } from "./use-react-flow-node"

interface PrereqGraphSearchPanelProps {
  nodes: PrereqGraphNodeUnion[]
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
  const courseDependencies = useInteractivePrereqGraphState((state) =>
    state.courseDependenciesMap.get(courseCode)
  )
  const centerNode = useNodeSelectAndCenter()
  const rfNode = useReactFlowNode(courseCode)
  const isSelected = rfNode?.selected ?? false
  const isInGraph = rfNode !== undefined
  const isPrimaryCourse = useInteractivePrereqGraphState((state) =>
    state.primaryCourseCodes.has(courseCode)
  )
  const rf = useReactFlow()

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
          isSelected && "border-primary bg-primary text-primary-foreground",
          !isInGraph && "opacity-50"
        )}
      />

      <div className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity z-20 flex flex-row">
        <div className="opacity-0 group-hover:opacity-100 flex flex-row">
          <AddCourseButton courseCode={courseCode} />
        </div>
        {!isInGraph && (
          <RichButton
            tooltip="Show course in graph"
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              rf.addNodes([
                {
                  id: courseCode,
                  type: "courseNode",
                  data: { courseCode },
                  position: { x: 0, y: 0 },
                },
              ])
              const edges: Edge[] = []
              for (const dependency of courseDependencies?.rightCourseCodes ??
                new Set()) {
                edges.push({
                  id: `${courseCode}-${dependency}`,
                  source: courseCode,
                  target: dependency,
                })
              }
              for (const dependency of courseDependencies?.leftCourseCodes ??
                new Set()) {
                edges.push({
                  id: `${dependency}-${courseCode}`,
                  source: dependency,
                  target: courseCode,
                })
              }
              rf.addEdges(edges)
            }}
          >
            <EyeOff className="size-4" />
          </RichButton>
        )}
      </div>
    </div>
  )
}

const CurrentCourseListGroupedByMajor = () => {
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
    <>
      <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
        {Array.from(primaryCourseCodes)
          .sort((a, b) => a.localeCompare(b))
          .map((courseCode) => (
            <CourseSmallBlockWithState
              key={courseCode}
              courseCode={courseCode}
            />
          ))}
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
    </>
  )
}

const CurrentCourseList = ({ query }: { query: string }) => {
  const courseMap = useInteractivePrereqGraphState((state) => state.coursesMap)
  const courseCodes = useInteractivePrereqGraphState(
    (state) => state.courseCodes
  )
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )

  const courses = useMemo(() => {
    const primaryCourses: ConvexCourseOverview[] = []
    const courses: ConvexCourseOverview[] = []

    Array.from(courseCodes).forEach((courseCode) => {
      const course = courseMap.get(courseCode)
      if (!course) return
      if (
        query.trim().length > 0 &&
        !course.courseCode.toUpperCase().includes(query.trim().toUpperCase()) &&
        !course.title.toUpperCase().includes(query.trim().toUpperCase())
      ) {
        return
      }
      if (primaryCourseCodes.has(course.courseCode)) {
        primaryCourses.push(course)
      } else {
        courses.push(course)
      }
    })

    primaryCourses.sort((a, b) => a.courseCode.localeCompare(b.courseCode))
    courses.sort((a, b) => a.courseCode.localeCompare(b.courseCode))

    return [...primaryCourses, ...courses]
  }, [courseMap, courseCodes, primaryCourseCodes, query])

  return (
    <div className="flex flex-col gap-1">
      {courses.map((course) => (
        <CourseSmallBlockWithState
          key={course.courseCode}
          courseCode={course.courseCode}
        />
      ))}
    </div>
  )
}

export function PrereqGraphSearchPanel() {
  const [searchInGraphValue, setSearchInGraphValue] = useState("")

  const PANEL_WIDTH = "min(300px, 90vw)"

  return (
    <Panel position="top-left" className="pointer-events-auto">
      <div className="flex flex-col gap-2" style={{ width: PANEL_WIDTH }}>
        <PanelContainer>
          <Section>
            {/* Header */}
            <div className="flex flex-row items-center gap-1 mb-4">
              <div className="relative flex-1">
                <Input
                  placeholder="Search courses"
                  value={searchInGraphValue}
                  onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchInGraphValue(e.target.value.toUpperCase())
                  }
                  className="border-0 focus:ring-0 focus-visible:ring-0 rounded-md pl-10 h-9"
                />
                <X
                  className="size-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer"
                  onClick={() => setSearchInGraphValue("")}
                />
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer" />
              </div>

              {/* Add button */}
              <AddCourseOrMajorPopover />
            </div>
            {/* Filter bar */}
            <PrereqGraphFilterBar />
            <div className="max-h-[50vh] overflow-y-auto">
              {searchInGraphValue.trim().length > 0 ? (
                <CurrentCourseList query={searchInGraphValue} />
              ) : (
                <CurrentCourseListGroupedByMajor />
              )}
            </div>
          </Section>
        </PanelContainer>
      </div>
    </Panel>
  )
}
