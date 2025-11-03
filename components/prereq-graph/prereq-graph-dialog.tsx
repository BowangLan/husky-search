"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { DawgpathCourseDetail } from "@/convex/dawgpath"
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useTheme } from "next-themes"

import {
  convertPrereqGraphToReactFlow,
  type PrereqGraphCourseNodeData,
  type PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

import { nodeTypes, edgeTypes } from "./prereq-graph-config"

interface PrereqGraphDialogProps {
  prereqGraph: DawgpathCourseDetail["prereq_graph"] | null | undefined
  currentCourseCode: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrereqGraphDialog({
  prereqGraph,
  currentCourseCode,
  open,
  onOpenChange,
}: PrereqGraphDialogProps) {
  const { nodes, edges } = useMemo(() => {
    if (!prereqGraph) {
      return { nodes: [], edges: [] }
    }
    return convertPrereqGraphToReactFlow(prereqGraph, currentCourseCode)
  }, [prereqGraph, currentCourseCode])

  const reactFlowInstance = useRef<ReactFlowInstance<
    PrereqGraphNodeUnion,
    Edge
  > | null>(null)
  const { theme } = useTheme()

  // Fit view for dialog when it opens
  useEffect(() => {
    if (reactFlowInstance.current && nodes.length > 0 && open) {
      const timeoutId = setTimeout(() => {
        reactFlowInstance.current?.fitView({
          padding: 0.2,
          duration: 0,
        })
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [nodes, open])

  const onInit = useCallback(
    (instance: ReactFlowInstance<PrereqGraphNodeUnion, Edge>) => {
      reactFlowInstance.current = instance
    },
    []
  )

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Type guard for node data (following guide: type safety)
      const nodeData = node.data as unknown as PrereqGraphCourseNodeData | undefined
      const courseCode = nodeData?.courseCode

      // if (courseCode && courseCode !== currentCourseCode) {
      //   window.open(`/courses/${encodeURIComponent(courseCode)}`, "_blank")
      // }
    },
    [currentCourseCode]
  )

  if (!prereqGraph || nodes.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] w-full h-full p-0">
        <div className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onInit={onInit}
            minZoom={0.2}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
            colorMode={theme === "dark" ? "dark" : "light"}
            onNodeClick={onNodeClick}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                // Type guard for node data (following guide: type safety)
                const data = node.data as PrereqGraphCourseNodeData | { subjectArea?: string; courses?: string[] }
                if ("courseCode" in data && data.courseCode === currentCourseCode) {
                  return "#8b5cf6" // Purple for current course
                }
                if ("subjectArea" in data) {
                  return "#10b981" // Green for group nodes
                }
                return "#6b7280" // Gray for other courses
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Panel
              position="top-left"
              className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm p-2 rounded"
            >
              <div className="space-y-1">
                {currentCourseCode && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span>Current course</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span>Click to view course</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}

