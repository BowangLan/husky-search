"use client"

import { useCallback, useMemo, useState } from "react"
import { Panel, useReactFlow } from "@xyflow/react"

import type {
  PrereqGraphCourseNodeData,
  PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { RIGHT_PANEL_WIDTH } from "./prereq-graph-config"
import { useNodeSelectAndCenter } from "./use-node-select-and-center"

interface CourseSearchPanelProps {
  nodes: PrereqGraphNodeUnion[]
}

interface CourseOption {
  courseCode: string
  courseTitle: string
  nodeId: string
}

export function CourseSearchPanel({ nodes }: CourseSearchPanelProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const { getNode, setNodes } = useReactFlow()
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

  // Filter courses based on search value
  const filteredCourses = useMemo(() => {
    if (!searchValue.trim()) {
      return courseOptions
    }

    const query = searchValue.trim().toUpperCase()
    return courseOptions.filter(
      (course) =>
        course.courseCode.toUpperCase().includes(query) ||
        course.courseTitle.toUpperCase().includes(query)
    )
  }, [courseOptions, searchValue])

  const handleSelect = useCallback(
    (courseCode: string) => {
      const course = courseOptions.find((c) => c.courseCode === courseCode)
      if (!course) return

      const node = getNode(course.nodeId)
      if (!node) return

      centerNode(node.id)

      // Reset search
      setSearchValue("")
      setIsOpen(false)
    },
    [courseOptions, getNode, setNodes, centerNode]
  )

  return (
    <Panel position="top-center" className="pointer-events-auto">
      <div style={{ width: RIGHT_PANEL_WIDTH }}>
        <Command
          shouldFilter={false}
          className="rounded-lg border shadow-md bg-background/95 backdrop-blur-sm"
        >
          <CommandInput
            placeholder="Search courses in graph..."
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value.toUpperCase())
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => {
              // Close dropdown after a short delay to allow clicks to register
              setTimeout(() => setIsOpen(false), 200)
            }}
            className="border-0 focus:ring-0"
          />
          {isOpen && searchValue.trim() && (
            <CommandList className="max-h-[300px]">
              <CommandEmpty>No courses found.</CommandEmpty>
              <CommandGroup>
                {filteredCourses.map((course) => (
                  <CommandItem
                    key={course.nodeId}
                    value={course.courseCode}
                    onSelect={() => handleSelect(course.courseCode)}
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
    </Panel>
  )
}
