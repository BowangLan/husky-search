"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { useCourseDataStore } from "@/store/course-data.store"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import {
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from "@xyflow/react"
import { useTheme } from "next-themes"

import { type PrereqGraphNodeUnion } from "@/lib/prereq-graph-utils"

import { GraphContent } from "./prereq-graph"

export function InteractivePrereqGraph({
  nodes: nodesProvided,
  edges: edgesProvided,
}: {
  nodes: PrereqGraphNodeUnion[]
  edges: Edge[]
}) {
  // Local state for React Flow (allows for drag/selection changes)
  const [nodes, setNodes, onNodesChangeBase] = useNodesState(
    [] as PrereqGraphNodeUnion[]
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])

  const reactFlowInstance = useRef<ReactFlowInstance<
    PrereqGraphNodeUnion,
    Edge
  > | null>(null)

  // Sync store nodes/edges to local state
  useEffect(() => {
    setNodes(nodesProvided)
    setEdges(edgesProvided)
    console.log("[full-size-prereq-graph] useEffect", {
      nodesCount: nodesProvided.length,
      edgesCount: edgesProvided.length,
    })
  }, [nodesProvided, edgesProvided, setNodes, setEdges])

  const onInit = useCallback(
    (instance: ReactFlowInstance<PrereqGraphNodeUnion, Edge>) => {
      reactFlowInstance.current = instance
    },
    []
  )

  // Custom MiniMap node color for full-size graph (no current course highlighting)
  const miniMapNodeColor = (node: Node) => {
    const data = node.data as
      | { courseCode?: string }
      | { subjectArea?: string; courses?: string[] }
    if ("subjectArea" in data) {
      return "#10b981" // Green for group nodes
    }
    return "#6b7280" // Gray for other courses
  }

  // Custom panel content for full-size graph
  return (
    <div className="h-full w-full">
      <GraphContent
        nodes={nodes}
        edges={edges}
        setEdges={setEdges}
        setNodes={setNodes}
        onNodesChangeBase={onNodesChangeBase}
        onEdgesChange={onEdgesChange}
        onInitCallback={onInit}
        currentCourseCode=""
        // miniMapNodeColor={miniMapNodeColor}
        panelContent={null}
      />
    </div>
  )
}
