"use client"

import { ReactNode, createContext, useContext, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { RichButton } from "@/components/ui/rich-button"

// Context for sharing fold state between PaneToolbar and PaneContent
const PaneFoldContext = createContext<{
  folded: boolean
  setFolded: (folded: boolean) => void
} | null>(null)

export interface PaneContainerProps {
  children: ReactNode
  className?: string
  defaultFolded?: boolean
  onFoldChange?: (folded: boolean) => void
}

export interface PaneToolbarProps {
  children: ReactNode
  className?: string
  foldable?: boolean
}

export interface PaneContentProps {
  children: ReactNode
  className?: string
}

export interface PaneToolbarItemProps {
  children: ReactNode
  className?: string
}

export function PaneContainer({
  children,
  className,
  defaultFolded = false,
  onFoldChange,
}: PaneContainerProps) {
  const [folded, setFolded] = useState(defaultFolded)

  const handleSetFolded = (newFolded: boolean) => {
    setFolded(newFolded)
    onFoldChange?.(newFolded)
  }

  return (
    <PaneFoldContext.Provider value={{ folded, setFolded: handleSetFolded }}>
      <div
        className={cn(
          "rounded-md bg-background border border-transparent flex flex-col",
          folded ? "h-fit" : "h-full overflow-hidden",
          className
        )}
      >
        {children}
      </div>
    </PaneFoldContext.Provider>
  )
}

export function PaneToolbar({
  children,
  className,
  foldable = false,
}: PaneToolbarProps) {
  const foldContext = useContext(PaneFoldContext)
  const folded = foldContext?.folded ?? false

  const handleToggleFold = () => {
    if (foldContext) {
      foldContext.setFolded(!folded)
    }
  }

  return (
    <div
      className={cn(
        "flex-none px-1 py-1 flex flex-row items-center justify-between bg-accent/50",
        // folded ? "" : "border-b",
        className
      )}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {foldable && (
        <RichButton
          size="icon-xs"
          variant="ghost"
          onClick={handleToggleFold}
          tooltip={folded ? "Expand" : "Collapse"}
          className="ml-2 shrink-0"
        >
          {folded ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronUp className="size-3.5" />
          )}
        </RichButton>
      )}
    </div>
  )
}

export function PaneToolbarItem({ children, className }: PaneToolbarItemProps) {
  return (
    <div
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "flex items-center gap-1.5 px-2 py-0 h-8 text-sm rounded-md text-foreground font-semibold",
        className
      )}
    >
      {children}
    </div>
  )
}

export function PaneContent({ children, className }: PaneContentProps) {
  const foldContext = useContext(PaneFoldContext)
  const folded = foldContext?.folded ?? false

  if (folded) {
    return null
  }

  return (
    <div className={cn("flex-1 overflow-auto p-2", className)}>{children}</div>
  )
}
