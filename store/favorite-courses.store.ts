"use client"

import { useEffect, useMemo } from "react"
import { createStore, useStore } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type FavoriteCoursesState = {
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

export const favoriteCoursesStore = createStore<FavoriteCoursesState>()(
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
      name: "favorite-courses",
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
export function useFavoriteCourses() {
  return useStore(favoriteCoursesStore, (s) => s)
}

export function useIsCourseFavorite(code?: string | null) {
  const select = useStore(favoriteCoursesStore, (s) => ({ hydrated: s.hydrated, favorites: s.favorites }))
  return useMemo(() => {
    if (!code) return false
    return select.favorites.has(code)
  }, [select.favorites, code])
}

export function useToggleCourseFavorite(): (code: string) => void {
  const toggle = useStore(favoriteCoursesStore, (s) => s.toggle)
  return toggle
}

export function useAddCourseFavorite(): (code: string) => void {
  const add = useStore(favoriteCoursesStore, (s) => s.add)
  return add
}

export function useRemoveCourseFavorite(): (code: string) => void {
  const remove = useStore(favoriteCoursesStore, (s) => s.remove)
  return remove
}

export function useFavoriteCourseCodes(): string[] {
  const favorites = useStore(favoriteCoursesStore, (s) => s.favorites)
  const hydrated = useStore(favoriteCoursesStore, (s) => s.hydrated)
  // Force a stable array reference on each change; hide pre-hydration as empty
  return useMemo(() => (hydrated ? Array.from(favorites.values()) : []), [favorites, hydrated])
}


