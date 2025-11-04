"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { DawgpathCourseDetail } from "@/convex/dawgpath"
import {
  Edge,
  ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react"
import { Maximize2, Network } from "lucide-react"
import { useTheme } from "next-themes"

import {
  PrereqGraphCourseNodeData,
  PrereqGraphNodeUnion,
  convertPrereqGraphToReactFlow,
} from "@/lib/prereq-graph-utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { RichButton } from "@/components/ui/rich-button"
import { Skeleton } from "@/components/ui/skeleton"
import { GraphContent } from "@/components/prereq-graph/prereq-graph"

interface CourseDetailPrereqGraphProps {
  prereqGraph: DawgpathCourseDetail["prereq_graph"] | null | undefined
  currentCourseCode: string
  isLoading?: boolean
}

export function CourseDetailPrereqGraph({
  prereqGraph,
  currentCourseCode,
  isLoading = false,
}: CourseDetailPrereqGraphProps) {
  const initialNodes = prereqGraph
    ? convertPrereqGraphToReactFlow(prereqGraph, currentCourseCode).nodes
    : []
  const initialEdges = prereqGraph
    ? convertPrereqGraphToReactFlow(prereqGraph, currentCourseCode).edges
    : []

  const [nodes, setNodes, onNodesChangeBase] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes and edges when prereqGraph or currentCourseCode changes
  useEffect(() => {
    if (!prereqGraph) {
      setNodes([])
      setEdges([])
      return
    }
    const { nodes: newNodes, edges: newEdges } = convertPrereqGraphToReactFlow(
      prereqGraph,
      currentCourseCode
    )
    setNodes(newNodes)
    setEdges(newEdges)
  }, [prereqGraph, currentCourseCode, setNodes, setEdges])

  const reactFlowInstance = useRef<ReactFlowInstance<
    PrereqGraphNodeUnion,
    Edge
  > | null>(null)
  const fullscreenReactFlowInstance = useRef<ReactFlowInstance<
    PrereqGraphNodeUnion,
    Edge
  > | null>(null)
  const { theme } = useTheme()
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false)

  const onInit = useCallback(
    (instance: ReactFlowInstance<PrereqGraphNodeUnion, Edge>) => {
      reactFlowInstance.current = instance
    },
    []
  )

  const onFullscreenInit = useCallback(
    (instance: ReactFlowInstance<PrereqGraphNodeUnion, Edge>) => {
      fullscreenReactFlowInstance.current = instance
    },
    []
  )

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[400px] w-full" />
      </Card>
    )
  }

  if (!prereqGraph || nodes.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium mb-2">
            No Prerequisite Graph Available
          </p>
          <p className="text-sm">
            Prerequisite information is not available for this course.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 overflow-hidden relative" hoverInteraction={false}>
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <div className="absolute top-6 right-6 z-10 flex flex-row items-center gap-2">
          <DialogTrigger asChild>
            <RichButton
              tooltip="View fullscreen"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
              }}
            >
              <Maximize2 className="h-4 w-4" />
              <span className="sr-only">View fullscreen</span>
            </RichButton>
          </DialogTrigger>

          {/* Button for open in prereq graph page */}
          <Link
            href={`/prereq-graph?courseCodes=${currentCourseCode}`}
            // target="_blank"
          >
            <RichButton
              tooltip="Open in prereq graph"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
            >
              <Network className="h-4 w-4" />
              <span className="sr-only">Open in prereq graph page</span>
            </RichButton>
          </Link>
        </div>
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] w-full h-full p-0">
          <div className="h-full w-full">
            <GraphContent
              nodes={nodes}
              edges={edges}
              setEdges={setEdges}
              setNodes={setNodes}
              onNodesChangeBase={onNodesChangeBase}
              onEdgesChange={onEdgesChange}
              onInitCallback={onFullscreenInit}
              currentCourseCode={currentCourseCode}
            />
          </div>
        </DialogContent>
      </Dialog>
      <div className="h-[500px] w-full">
        <GraphContent
          nodes={nodes}
          edges={edges}
          setEdges={setEdges}
          setNodes={setNodes}
          onNodesChangeBase={onNodesChangeBase}
          onEdgesChange={onEdgesChange}
          onInitCallback={onInit}
          currentCourseCode={currentCourseCode}
        />
      </div>
    </Card>
  )
}
