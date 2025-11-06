"use client"

import { PrereqGraphNodeUnion, type PrereqGraphCourseNodeData } from "@/lib/prereq-graph-utils"
import { Edge, NodeChange } from "@xyflow/react"
import { create } from "zustand"

type RichCourseNodeData = {
  nodeData: PrereqGraphCourseNodeData
  leftNodeIdMap: Map<string, string> // key is the node id, value is the edge id
  rightNodeIdMap: Map<string, string> // key is the node id, value is the edge id
}

export type NodeMapStore = {
  nodeMap: Map<string, RichCourseNodeData>

  setNodesAndEdges: (nodes: PrereqGraphNodeUnion[], edges: Edge[]) => void
  applyNodeChanges: (changes: NodeChange<PrereqGraphNodeUnion>[]) => void
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

    applyNodeChanges: (changes: NodeChange<PrereqGraphNodeUnion>[]) => {
      const nodeMap = new Map(get().nodeMap)

      changes.forEach((change) => {
        if (change.type === "add") {
          // Add new node to the map
          const node = change.item
          if (node.type === "courseNode" && node.data) {
            nodeMap.set(node.id, {
              nodeData: node.data as PrereqGraphCourseNodeData,
              leftNodeIdMap: new Map(),
              rightNodeIdMap: new Map(),
            })
          }
        } else if (change.type === "remove") {
          // Remove node from the map
          nodeMap.delete(change.id)

          // Clean up edge references in other nodes
          nodeMap.forEach((richData) => {
            richData.leftNodeIdMap.delete(change.id)
            richData.rightNodeIdMap.delete(change.id)
          })
        } else if (change.type === "replace") {
          // Replace node in the map (handles data updates as well)
          const node = change.item
          if (node.type === "courseNode" && node.data) {
            const existingData = nodeMap.get(node.id)
            nodeMap.set(node.id, {
              nodeData: node.data as PrereqGraphCourseNodeData,
              leftNodeIdMap: existingData?.leftNodeIdMap ?? new Map(),
              rightNodeIdMap: existingData?.rightNodeIdMap ?? new Map(),
            })
          }
        }
        // Note: position, dimensions, and select changes don't affect the node map structure
      })

      set({ nodeMap })
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