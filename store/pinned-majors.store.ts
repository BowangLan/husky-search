"use client"

import { useMemo } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type PinnedMajorsState = {
  pinned: Set<string>
  hydrated: boolean
  add: (code: string) => void
  remove: (code: string) => void
  toggle: (code: string) => void
  clear: () => void
  isPinned: (code: string) => boolean
  getAll: () => string[]
}

type TaggedSet = { __type: "Set"; value: string[] }

function isTaggedSet(value: unknown): value is TaggedSet {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { __type?: unknown }).__type === "Set" &&
    Array.isArray((value as { value?: unknown }).value)
  )
}

const ssrSafeStorage = createJSONStorage(() => {
  if (typeof window === "undefined") {
    return {
      getItem: () => null,
      setItem: () => { },
      removeItem: () => { },
      clear: () => { },
      key: () => null,
      length: 0,
    } as Storage
  }
  return window.localStorage
}, {
  replacer: (_key, value) => {
    if (value instanceof Set) {
      return { __type: "Set", value: Array.from(value.values()) }
    }
    return value
  },
  reviver: (_key, value) => {
    if (isTaggedSet(value)) return new Set(value.value)
    return value
  },
})

export const pinnedMajorsStore = createStore<PinnedMajorsState>()(
  persist(
    (set, get) => ({
      pinned: new Set<string>(),
      hydrated: false,
      add: (code: string) =>
        set((state) => {
          const next = new Set(state.pinned)
          next.add(code)
          return { pinned: next }
        }),
      remove: (code: string) =>
        set((state) => {
          if (!state.pinned.has(code)) return {}
          const next = new Set(state.pinned)
          next.delete(code)
          return { pinned: next }
        }),
      toggle: (code: string) => {
        const { isPinned, add, remove } = get()
        if (isPinned(code)) remove(code)
        else add(code)
      },
      clear: () => set({ pinned: new Set() }),
      isPinned: (code: string) => get().pinned.has(code),
      getAll: () => Array.from(get().pinned.values()),
    }),
    {
      name: "pinned-majors",
      version: 1,
      storage: ssrSafeStorage,
      partialize: (state) => ({ pinned: state.pinned }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.hydrated = true
      },
    }
  )
)

// Hooks
export function usePinnedMajors() {
  return useStore(pinnedMajorsStore, (s) => s)
}

export function useIsMajorPinned(code?: string | null) {
  const pinned = useStore(pinnedMajorsStore, (s) => s.pinned)
  return useMemo(() => {
    if (!code) return false
    return pinned.has(code)
  }, [pinned, code])
}

export function useToggleMajorPin(): (code: string) => void {
  const toggle = useStore(pinnedMajorsStore, (s) => s.toggle)
  return toggle
}

export function useAddMajorPin(): (code: string) => void {
  const add = useStore(pinnedMajorsStore, (s) => s.add)
  return add
}

export function useRemoveMajorPin(): (code: string) => void {
  const remove = useStore(pinnedMajorsStore, (s) => s.remove)
  return remove
}

export function usePinnedMajorCodes(): string[] {
  const pinned = useStore(pinnedMajorsStore, (s) => s.pinned)
  const hydrated = useStore(pinnedMajorsStore, (s) => s.hydrated)
  return useMemo(() => (hydrated ? Array.from(pinned.values()) : []), [pinned, hydrated])
}

