"use client"

import { memo, useCallback } from "react"
import {
  Handle,
  Position,
  useReactFlow,
  type Node,
  type NodeProps,
} from "@xyflow/react"
import { ChevronRight } from "lucide-react"

import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type SubjectAreaGroupNodeData,
} from "@/lib/prereq-graph-utils"
import { cn } from "@/lib/utils"

import { buttonVariants } from "../ui/button"
import { CourseSmallBlock } from "./course-small-block"
import { PrereqGraphNodeWrapper } from "./node-wrapper"

interface ToggleHandleProps {
  type: "source" | "target"
  position: Position
  nodeId: string
  handleId: string
  isExpanded?: boolean
  onExpandToggle?: (nodeId: string) => void
  className?: string
}

function ToggleHandle({
  type,
  position,
  nodeId,
  handleId,
  isExpanded = false,
  onExpandToggle,
  className,
}: ToggleHandleProps) {
  const { setNodes, getEdges } = useReactFlow()

  const onHandleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()

      // Update the node's expanded state - this will trigger dimension change
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === nodeId && node.type === "subjectAreaGroupNode") {
            const currentData = node.data as SubjectAreaGroupNodeData
            const newIsExpanded = !currentData.isExpanded
            return {
              ...node,
              data: {
                ...currentData,
                isExpanded: newIsExpanded,
              },
              // Force ReactFlow to remeasure the node
              measured: undefined,
            }
          }
          return node
        })
      )

      // Handle expand/collapse callback if provided
      if (onExpandToggle) {
        onExpandToggle(nodeId)
      }

      // Toggle visibility of connected nodes
      const edges = getEdges()
      const connectedNodeIds = new Set()

      // Find nodes connected to this specific handle
      edges.forEach((edge) => {
        if (type === "source" && edge.source === nodeId) {
          connectedNodeIds.add(edge.target)
        } else if (type === "target" && edge.target === nodeId) {
          connectedNodeIds.add(edge.source)
        }
      })

      setNodes((nodes) =>
        nodes.map((node) => {
          if (connectedNodeIds.has(node.id)) {
            return {
              ...node,
              hidden: !node.hidden,
            }
          }
          return node
        })
      )
    },
    [nodeId, handleId, type, getEdges, setNodes, onExpandToggle]
  )

  return (
    <div className="relative">
      <Handle
        type={type}
        position={position}
        id={handleId}
        onClick={onHandleClick}
        className={cn("w-3 h-3", className)}
        style={{ cursor: "pointer" }}
      />
      {type === "source" && (
        <button
          onClick={onHandleClick}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 rounded-full bg-background border border-border hover:border-primary hover:bg-accent transition-colors flex items-center justify-center cursor-pointer z-10"
          aria-label={isExpanded ? "Collapse group" : "Expand group"}
          type="button"
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform text-muted-foreground",
              isExpanded && "rotate-90"
            )}
          />
        </button>
      )}
    </div>
  )
}

export const SubjectAreaGroupNode = memo(function SubjectAreaGroupNode({
  ...props
}: NodeProps<Node<SubjectAreaGroupNodeData>>) {
  const { data, id } = props
  const { subjectArea, courses, isExpanded = false, onExpandToggle } = data

  // Calculate dynamic height based on number of courses and expansion state
  // const dynamicHeight = isExpanded
  //   ? Math.max(NODE_HEIGHT, 60 + courses.length * 20)
  //   : NODE_HEIGHT

  return (
    <PrereqGraphNodeWrapper
      styleVariant={data.styleVariant}
      className="relative group"
      style={{ width: `${NODE_WIDTH}px` }}
      nodeProps={props}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3" />

      <div className="p-3 flex flex-col h-full">
        <div className="flex-1 space-y-2">
          <div className="flex items-center">
            <div className="font-semibold text-sm">{subjectArea}</div>
            <div className="flex-1"></div>
            <div className="text-xs text-muted-foreground ml-2">
              {courses.length} courses
            </div>
          </div>
          <div className="space-y-1">
            {courses.map((courseCode) => (
              <CourseSmallBlock key={courseCode} courseCode={courseCode} />
            ))}
            {courses.length === 0 && (
              <div className="text-xs text-muted-foreground italic">
                No courses
              </div>
            )}
          </div>
        </div>
      </div>

      <ToggleHandle
        type="source"
        position={Position.Right}
        nodeId={id}
        handleId="source"
        isExpanded={isExpanded}
        onExpandToggle={onExpandToggle}
      />
    </PrereqGraphNodeWrapper>
  )
})
