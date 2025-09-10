"use client"

import { useMemo } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type FavoriteMajorsState = {
  favorites: Set<string>
  hydrated: boolean
  add: (code: string) => void
  remove: (code: string) => void
  toggle: (code: string) => void
  clear: () => void
  isFavorite: (code: string) => boolean
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
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
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

export const favoriteMajorsStore = createStore<FavoriteMajorsState>()(
  persist(
    (set, get) => ({
      favorites: new Set<string>(),
      hydrated: false,
      add: (code: string) =>
        set((state) => {
          const next = new Set(state.favorites)
          next.add(code)
          return { favorites: next }
        }),
      remove: (code: string) =>
        set((state) => {
          if (!state.favorites.has(code)) return {}
          const next = new Set(state.favorites)
          next.delete(code)
          return { favorites: next }
        }),
      toggle: (code: string) => {
        const { isFavorite, add, remove } = get()
        if (isFavorite(code)) remove(code)
        else add(code)
      },
      clear: () => set({ favorites: new Set() }),
      isFavorite: (code: string) => get().favorites.has(code),
      getAll: () => Array.from(get().favorites.values()),
    }),
    {
      name: "favorite-majors",
      version: 1,
      storage: ssrSafeStorage,
      partialize: (state) => ({ favorites: state.favorites }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        state.hydrated = true
      },
    }
  )
)

// Hooks
export function useFavoriteMajors() {
  return useStore(favoriteMajorsStore, (s) => s)
}

export function useIsMajorFavorite(code?: string | null) {
  const select = useStore(favoriteMajorsStore, (s) => ({ hydrated: s.hydrated, favorites: s.favorites }))
  return useMemo(() => {
    if (!code) return false
    return select.favorites.has(code)
  }, [select.favorites, code])
}

export function useToggleMajorFavorite(): (code: string) => void {
  const toggle = useStore(favoriteMajorsStore, (s) => s.toggle)
  return toggle
}

export function useAddMajorFavorite(): (code: string) => void {
  const add = useStore(favoriteMajorsStore, (s) => s.add)
  return add
}

export function useRemoveMajorFavorite(): (code: string) => void {
  const remove = useStore(favoriteMajorsStore, (s) => s.remove)
  return remove
}

export function useFavoriteMajorCodes(): string[] {
  const favorites = useStore(favoriteMajorsStore, (s) => s.favorites)
  const hydrated = useStore(favoriteMajorsStore, (s) => s.hydrated)
  return useMemo(() => (hydrated ? Array.from(favorites.values()) : []), [favorites, hydrated])
}


