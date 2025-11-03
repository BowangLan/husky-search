"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  useReactFlow,
  type Edge,
  type NodeChange,
  type NodeDimensionChange,
} from "@xyflow/react"

import {
  // applyDagreLayout,
  type PrereqGraphNodeUnion,
} from "@/lib/prereq-graph-utils"
import { applyDagreLayout } from "@/lib/prereq-layout-utils"

interface UseAutoLayoutOptions {
  currentCourseCode: string
  selectedCourseCode?: string
  enabled?: boolean
}

const SHOULD_LAYOUT_ON_SELECT = false

/**
 * Hook to automatically apply Dagre layout after nodes are measured
 * Handles dynamic height nodes by waiting for ReactFlow to measure node dimensions
 */
export function useAutoLayout({
  currentCourseCode,
  selectedCourseCode,
  enabled = true,
}: UseAutoLayoutOptions) {
  const { getNodes, setNodes, getEdges, fitView } = useReactFlow()
  const [needsLayout, setNeedsLayout] = useState(true)
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const applyLayout = useCallback(() => {
    if (!enabled) return

    console.log("Applying auto layout", { selectedCourseCode })

    const nodes = getNodes() as PrereqGraphNodeUnion[]
    const edges = getEdges() as Edge[]

    if (nodes.length === 0) {
      return
    }

    // Check if all visible nodes have been measured
    const visibleNodes = nodes.filter((node) => !node.hidden)
    const allMeasured = visibleNodes.every(
      (node) => node.measured?.width && node.measured?.height
    )

    if (allMeasured && needsLayout) {
      const layoutedNodes = applyDagreLayout(nodes, edges, currentCourseCode, selectedCourseCode)
      setNodes(layoutedNodes)
      setNeedsLayout(false)

      // Fit view after layout with a small delay
      // setTimeout(() => {
      //   fitView({ padding: 0.2, duration: 0 })
      // }, 50)
    }
  }, [getNodes, getEdges, setNodes, needsLayout, fitView, currentCourseCode, selectedCourseCode, enabled])

  // Debounced layout application to avoid excessive re-layouts
  const debouncedLayout = useCallback(() => {
    // Cancel previous layout request
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current)
    }

    // Schedule new layout
    layoutTimeoutRef.current = setTimeout(() => {
      applyLayout()
    }, 50)
  }, [applyLayout])

  // Handle node changes and trigger layout when dimensions change
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      console.log("Handling node changes", changes)
      // Check if any change affects dimensions or adds nodes
      const needsRelayout = changes.some(
        (change) =>
          change.type === "dimensions" ||
          change.type === "add" ||
          (change.type === "replace" && change.item.data !== undefined)
      )

      if (needsRelayout) {
        setNeedsLayout(true)
        // Small delay to ensure DOM updates
        debouncedLayout()
      }
    },
    [debouncedLayout]
  )

  // Reset layout flag when nodes or edges change externally
  const resetLayout = useCallback(() => {
    setNeedsLayout(true)
    debouncedLayout()
  }, [debouncedLayout])

  // Trigger layout only when a course is selected or changes; do nothing on deselect
  useEffect(() => {
    if (!SHOULD_LAYOUT_ON_SELECT) {
      return
    }

    if (selectedCourseCode) {
      setNeedsLayout(true)
      debouncedLayout()
    }
  }, [selectedCourseCode, debouncedLayout])

  return {
    handleNodesChange,
    applyLayout,
    resetLayout,
    setNeedsLayout,
  }
}

