"use client"

import { type HTMLAttributes } from "react"
import { usePrereqGraphHighlightedNodesStore } from "@/store/prereq-graph-highlighted-nodes.store"
import { NodeProps } from "@xyflow/react"

import { cn } from "@/lib/utils"

type NodeStyleVariant = "default" | "current" | "secondary-selected"

interface PrereqGraphNodeWrapperProps extends HTMLAttributes<HTMLDivElement> {
  styleVariant?: NodeStyleVariant
  nodeProps: NodeProps
}

export function PrereqGraphNodeWrapper({
  styleVariant = "default",
  className,
  children,
  nodeProps,
  ...rest
}: PrereqGraphNodeWrapperProps) {
  const isHighlighted = usePrereqGraphHighlightedNodesStore((state) =>
    state.isHighlighted(nodeProps.id)
  )
  const shouldApplyHighlight = nodeProps.type === "courseNode" && isHighlighted

  return (
    <div
      className={cn(
        "rounded-lg border-2 shadow-md bg-card text-card-foreground transition-all group/node",
        "border border-border",
        styleVariant === "current" && "border-primary shadow-lg bg-primary/10",
        nodeProps.selected &&
          "border-primary shadow-lg bg-primary/20 border backdrop-blur-md ring ring-primary/50",
        styleVariant === "secondary-selected" &&
          "border-secondary shadow-lg bg-secondary/20 border",
        shouldApplyHighlight && "ring ring-primary/50 border-primary/60",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
