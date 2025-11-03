"use client"

import { memo } from "react"
import Link from "next/link"
import { useCourseDataStore } from "@/store/course-data.store"
import { useNode, useNodeMap } from "@/store/prereq-graph-node-map.store"
import {
  Handle,
  NodeToolbar,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { ArrowRightIcon, EyeIcon } from "lucide-react"

import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type PrereqGraphCourseNodeData,
} from "@/lib/prereq-graph-utils"
import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "../ui/button"
import { RichButton } from "../ui/rich-button"
import { CourseSmallBlock } from "./course-small-block"
import { PrereqGraphNodeWrapper } from "./node-wrapper"
import { Section, SectionTitle } from "./panel-section"
import { useNodeSelectAndCenter } from "./use-node-select-and-center"

const SelectedCoursePrereqPanelLeft = ({
  courseCode,
}: {
  courseCode: string
}) => {
  const nodeMap = useNodeMap((state) => state.nodeMap)
  const richNodeData = nodeMap.get(courseCode)
  const centerNode = useNodeSelectAndCenter()

  if (!richNodeData || richNodeData.leftNodeIdMap.size === 0) {
    return null
  }

  return (
    <div
      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full pr-2"
      style={{
        width: "12rem",
      }}
    >
      <div className="bg-background border rounded-lg shadow-lg p-3 flex flex-col">
        <div className="flex flex-col gap-1">
          {Array.from(richNodeData.leftNodeIdMap.entries()).map(
            ([leftNodeId, edgeId]) => (
              <CourseSmallBlock
                key={edgeId}
                courseCode={leftNodeId}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  centerNode(leftNodeId)
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

const SelectedCoursePrereqPanelRight = ({
  courseCode,
}: {
  courseCode: string
}) => {
  const nodeMap = useNodeMap((state) => state.nodeMap)
  const richNodeData = nodeMap.get(courseCode)
  const centerNode = useNodeSelectAndCenter()

  if (!richNodeData || richNodeData.rightNodeIdMap.size === 0) {
    return null
  }

  return (
    <div
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-2"
      style={{
        width: "12rem",
      }}
    >
      <div className="bg-background border rounded-lg shadow-lg p-3 flex flex-col">
        <div className="flex flex-col gap-1">
          {Array.from(richNodeData.rightNodeIdMap.entries()).map(
            ([rightNodeId, edgeId]) => (
              <CourseSmallBlock
                key={edgeId}
                courseCode={rightNodeId}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  centerNode(rightNodeId)
                }}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
}

export const CourseNode = memo(function CourseNode({
  ...props
}: NodeProps<Node<PrereqGraphCourseNodeData>>) {
  const { data, selected } = props
  const { courseCode, isOfferedNow } = data
  const courseData = useCourseDataStore((state) =>
    state.getCourseData(courseCode)
  )
  // const richNodeData = useNode(courseCode)
  const nodeMap = useNodeMap((state) => state.nodeMap)
  const richNodeData = nodeMap.get(courseCode)

  if (!courseData) {
    return null
  }

  // const isOpen = courseData.enroll.some(
  //   (enroll) => enroll.stateKey === "active"
  // )

  const isOpen = data.isOfferedNow

  const courseLevel = parseInt(courseCode.at(-3) + "00", 10)

  return (
    <PrereqGraphNodeWrapper
      styleVariant={data.styleVariant}
      className={selected ? "border-primary shadow-lg" : undefined}
      style={{ width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }}
      nodeProps={props}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div className="w-full px-2 py-2 gap-1.5 flex flex-row items-center group-hover/node:opacity-100 opacity-0 transition-opacity absolute top-0 right-0">
        <div className="flex-1"></div>
        <Link href={`/courses/${courseCode}`}>
          <RichButton
            tooltip="Go to course page"
            variant="ghost"
            size="icon-xs"
          >
            <ArrowRightIcon className="size-4" />
          </RichButton>
        </Link>
      </div>

      <div className="p-3 flex flex-col h-full">
        <div className="flex-1">
          <div className="font-semibold text-sm mb-1">{courseCode}</div>
          {courseData.title && (
            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {courseData.title}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between flex-none">
          {courseLevel > 0 && (
            <div className="text-xs text-muted-foreground">
              Level {courseLevel}
            </div>
          )}
          <div className="flex-1"></div>
          {isOpen ? (
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Offered now
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Not offered</div>
          )}
        </div>
      </div>

      {selected && (
        <>
          <SelectedCoursePrereqPanelLeft courseCode={courseCode} />
          <SelectedCoursePrereqPanelRight courseCode={courseCode} />
        </>
      )}

      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </PrereqGraphNodeWrapper>
  )
})
