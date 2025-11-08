"use client"

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import type { DawgpathCourseDetail } from "@/convex/dawgpath"
import { useInteractivePrereqGraphState } from "@/store/interactive-prereq-graph-state"
import { useNodeMap } from "@/store/prereq-graph-node-map.store"
import { usePrereqGraphSelectedCourseStore } from "@/store/prereq-graph-selected-course.store"
import {
  Background,
  Controls,
  MiniMap,
  OnEdgesChange,
  OnSelectionChangeParams,
  Panel,
  ReactFlow,
  useEdges,
  useEdgesState,
  useNodes,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from "@xyflow/react"
import { Maximize2 } from "lucide-react"
import { useTheme } from "next-themes"

import {
  type PrereqGraphCourseNodeData,
  type PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"

import { edgeTypes, nodeTypes } from "./prereq-graph-config"
import { PrereqGraphSearchPanel } from "./prereq-graph-search-panel"
import { SelectedCoursePanel } from "./selected-course-panel"
import { useAutoLayout } from "./use-auto-layout"

export interface GraphContentProps {
  nodes: PrereqGraphNodeUnion[]
  edges: Edge[]
  setEdges: ReactFlowInstance["setEdges"]
  setNodes: Dispatch<SetStateAction<PrereqGraphNodeUnion[]>>
  onNodesChangeBase: OnNodesChange<PrereqGraphNodeUnion>
  onEdgesChange: (changes: any[]) => void
  onInitCallback?: (
    instance: ReactFlowInstance<PrereqGraphNodeUnion, Edge>
  ) => void
  currentCourseCode?: string
  miniMapNodeColor?: (node: Node) => string
  panelContent?: React.ReactNode
}

// Component that uses auto-layout hook (must be inside ReactFlow context)
// This component is rendered as a child of ReactFlow to access useReactFlow hook
export function AutoLayoutHandler({
  currentCourseCode,
  nodesLength,
  edgesLength,
}: {
  currentCourseCode: string
  nodesLength: number
  edgesLength: number
}) {
  const selectedCourse = usePrereqGraphSelectedCourseStore(
    (state) => state.selectedCourse
  )
  const selectedCourseCode = selectedCourse?.courseCode

  const { resetLayout, applyLayout, handleNodesChange } = useAutoLayout({
    currentCourseCode,
    selectedCourseCode,
    enabled: true,
  })
  const { getNodes } = useReactFlow()
  const nodes = useNodes()

  // Watch for node dimension changes and trigger layout
  useEffect(() => {
    const nodes = getNodes()
    if (nodes.length === 0) return

    const visibleNodes = nodes.filter((node) => !node.hidden)
    const allMeasured = visibleNodes.every(
      (node) => node.measured?.width && node.measured?.height
    )

    if (allMeasured && visibleNodes.length > 0) {
      // Small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        applyLayout()
      }, 50)

      return () => clearTimeout(timeoutId)
    }
  }, [nodesLength, edgesLength, getNodes, applyLayout])

  // Watch for node data changes (e.g., expand/collapse) by checking node data hash
  const prevDataHashRef = useRef<string>("")
  useEffect(() => {
    if (nodes.length === 0) return

    // Create a hash of node data to detect changes
    const nodeDataHash = nodes
      .map((node) => {
        if (node.type === "subjectAreaGroupNode") {
          const data = node.data as { isExpanded?: boolean }
          return `${node.id}:${data.isExpanded ? "expanded" : "collapsed"}`
        }
        return `${node.id}:${node.measured?.height || 0}`
      })
      .join("|")

    // Only reset layout when node data actually changes
    if (nodeDataHash !== prevDataHashRef.current) {
      prevDataHashRef.current = nodeDataHash
      resetLayout()
    }
  }, [nodesLength, nodes, resetLayout])

  return null
}

// Graph content component
export function GraphContent({
  nodes,
  edges,
  setEdges,
  setNodes,
  onNodesChangeBase,
  onEdgesChange,
  onInitCallback,
  currentCourseCode = "",
  miniMapNodeColor,
  panelContent,
}: GraphContentProps) {
  // Combined handler that processes both base changes and layout changes
  // We'll use useAutoLayout inside AutoLayoutHandler to handle layout
  const handleNodesChangeCombined = useCallback<
    OnNodesChange<PrereqGraphNodeUnion>
  >(
    (changes) => {
      console.log("Handling node changes in GraphContent", changes)
      onNodesChangeBase(changes)
      // useNodeMap.getState().applyNodeChanges(changes)
      // Layout will be handled by AutoLayoutHandler via useAutoLayout hook
    },
    [onNodesChangeBase, nodes, edges]
  )

  const { theme } = useTheme()
  const primaryCourseCodes = useInteractivePrereqGraphState(
    (state) => state.primaryCourseCodes
  )

  const handleEdgesChangeCombined = useCallback<OnEdgesChange<Edge>>(
    (changes) => {
      console.log("Handling edge changes in GraphContent", changes)
      onEdgesChange(changes)
      useNodeMap.getState().setNodesAndEdges(nodes, edges)
    },
    [onEdgesChange, nodes, edges]
  )

  // Default MiniMap node color function
  const defaultMiniMapNodeColor = (node: Node) => {
    const data = node.data as
      | PrereqGraphCourseNodeData
      | { subjectArea?: string; courses?: string[] }
    if (node.type === "courseNode") {
      if (
        node.data.courseCode === currentCourseCode ||
        (typeof node.data.courseCode === "string" &&
          primaryCourseCodes.has(node.data.courseCode))
      ) {
        return "var(--color-primary)"
      } else if (node.data.isOfferedNow) {
        return "var(--color-emerald-500)"
      } else {
        return "var(--color-muted-foreground)"
      }
    } else if (node.type === "subjectAreaGroupNode") {
      return "#10b981" // Green for group nodes
    } else {
      return "var(--color-muted-foreground)"
    }
  }

  const onSelectionChange = useCallback(
    (selection: OnSelectionChangeParams) => {
      console.log("Selection changed in GraphContent", selection)
      const selectedNodeIds = new Set(selection.nodes.map((n) => n.id))

      // Set selected course node in zustand store if a course node is selected
      const selectedNode = selection.nodes[0]
      if (selectedNode && selectedNode.type === "courseNode") {
        const nodeData = selectedNode.data as PrereqGraphCourseNodeData
        usePrereqGraphSelectedCourseStore.getState().setSelectedCourse(nodeData)
      } else {
        usePrereqGraphSelectedCourseStore.getState().setSelectedCourse(null)
      }

      setEdges((prevEdges) =>
        prevEdges.map((edge) => {
          return {
            ...edge,
            animated:
              selectedNodeIds.has(edge.source) ||
              selectedNodeIds.has(edge.target),
            // Or use a custom class for styling
            className:
              selectedNodeIds.has(edge.source) ||
              selectedNodeIds.has(edge.target)
                ? "highlighted-edge"
                : "",
          }
        })
      )
    },
    [nodes, setEdges]
  )

  // Default panel content
  // const defaultPanelContent = (
  //   <div className="space-y-1">
  //     <div className="flex items-center gap-2">
  //       <div className="w-3 h-3 rounded-full bg-purple-500" />
  //       <span>Current course</span>
  //     </div>
  //     <div className="flex items-center gap-2">
  //       <div className="w-3 h-3 rounded-full bg-green-500" />
  //       <span>Subject area group</span>
  //     </div>
  //     <div className="flex items-center gap-2">
  //       <div className="w-3 h-3 rounded-full bg-gray-500" />
  //       <span>Prerequisite course</span>
  //     </div>
  //   </div>
  // )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChangeCombined}
      onEdgesChange={handleEdgesChangeCombined}
      onSelectionChange={onSelectionChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInitCallback}
      minZoom={0.2}
      maxZoom={2}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      // nodesDraggable={false}
      nodesDraggable={true}
      nodesConnectable={false}
      edgesFocusable={false}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
      colorMode={theme === "dark" ? "dark" : "light"}
      panOnScroll={true}
      multiSelectionKeyCode={null}
    >
      <Background />
      <Controls />
      <AutoLayoutHandler
        currentCourseCode={currentCourseCode}
        nodesLength={nodes.length}
        edgesLength={edges.length}
      />
      <MiniMap
        nodeColor={miniMapNodeColor || defaultMiniMapNodeColor}
        maskColor="rgba(0, 0, 0, 0.1)"
        pannable
      />
      {/* <Panel
        position="top-left"
        className="text-xs text-muted-foreground bg-background/80 backdrop-blur-sm p-2 rounded"
      >
        {panelContent ?? defaultPanelContent}
      </Panel> */}
      <PrereqGraphSearchPanel />
      <SelectedCoursePanel />
    </ReactFlow>
  )
}
