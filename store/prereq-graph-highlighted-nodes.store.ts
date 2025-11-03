"use client"

import { create } from "zustand"

export type PrereqGraphHighlightedNodesStore = {
  highlightedNodeIds: Set<string>
  setHighlightedNodeIds: (ids: Iterable<string>) => void
  clearHighlightedNodeIds: () => void
  isHighlighted: (id: string) => boolean
}

export const usePrereqGraphHighlightedNodesStore = create<PrereqGraphHighlightedNodesStore>(
  (set, get) => ({
    highlightedNodeIds: new Set<string>(),
    setHighlightedNodeIds: (ids: Iterable<string>) =>
      set({ highlightedNodeIds: new Set(ids) }),
    clearHighlightedNodeIds: () => set({ highlightedNodeIds: new Set() }),
    isHighlighted: (id: string) => get().highlightedNodeIds.has(id),
  })
)


