"use client"

import { PrereqGraphNodeUnion, type PrereqGraphCourseNodeData } from "@/lib/prereq-graph-utils"
import { Edge } from "@xyflow/react"
import { create } from "zustand"

type RichCourseNodeData = {
  nodeData: PrereqGraphCourseNodeData
  leftNodeIdMap: Map<string, string> // key is the node id, value is the edge id
  rightNodeIdMap: Map<string, string> // key is the node id, value is the edge id
}

export type NodeMapStore = {
  nodeMap: Map<string, RichCourseNodeData>

  setNodesAndEdges: (nodes: PrereqGraphNodeUnion[], edges: Edge[]) => void
  getNode: (nodeId: string) => RichCourseNodeData | undefined
  clear: () => void
}

export const useNodeMap = create<NodeMapStore>(
  (set, get) => ({
    nodeMap: new Map(),

    setNodesAndEdges: (nodes: PrereqGraphNodeUnion[], edges: Edge[]) => {
      const nodeMap = new Map<string, RichCourseNodeData>()
      nodes.forEach((node) => {
        nodeMap.set(node.id, {
          nodeData: node.data as PrereqGraphCourseNodeData,
          leftNodeIdMap: new Map(),
          rightNodeIdMap: new Map(),
        })
      })
      edges.forEach((edge) => {
        const leftNode = nodeMap.get(edge.source)
        const rightNode = nodeMap.get(edge.target)
        if (leftNode) {
          leftNode.rightNodeIdMap.set(edge.target, edge.id)
        }
        if (rightNode) {
          rightNode.leftNodeIdMap.set(edge.source, edge.id!)
        }
      })
      console.log("[prereq-graph-node-map.store] nodeMap created", nodeMap)
      set({ nodeMap: nodeMap })
    },
    getNode: (nodeId: string) => {
      const nodeMap = get().nodeMap
      return nodeMap.get(nodeId) ?? undefined
    },
    clear: () => {
      set({ nodeMap: new Map() })
    },
  })
)

export const useNode = (nodeId: string) => {
  const node = useNodeMap((state) => state.getNode(nodeId))
  return node
}