import { Node, useReactFlow } from "@xyflow/react"
import { useCallback } from "react"

export const useNodeSelectAndCenter = () => {
  const { setCenter, getNode, setNodes } = useReactFlow()

  const centerNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId)
    if (!node) return

    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === nodeId,
      }))
    )

    const nodeWidth = node.measured?.width ?? 240
    const nodeHeight = node.measured?.height ?? 100

    // Use setTimeout to ensure the node is fully selected before centering
    setTimeout(() => {
      setCenter(
        node.position.x + nodeWidth / 2,
        node.position.y + nodeHeight / 2,
        {
          zoom: 1,
          duration: 400,
        }
      )
    }, 0)

  }, [setCenter, getNode])

  return centerNode
}