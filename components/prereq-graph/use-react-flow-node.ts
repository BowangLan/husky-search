"use client"

import { useReactFlow, useStore, type Node } from "@xyflow/react"
import { useEffect, useRef } from "react"

export const useReactFlowNode = (nodeId: string) => {
  const node = useStore(s => s.nodeLookup.get(nodeId))
  return node
}
