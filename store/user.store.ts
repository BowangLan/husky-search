"use client"

import { create } from "zustand"

export type UserStore = {
  loading: boolean
  isSignedIn: boolean
  isUserStudent: boolean
  setLoading: (loading: boolean) => void
  setIsUserStudent: (isUserStudent: boolean) => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  loading: true,
  isSignedIn: false,
  isUserStudent: false,
  setLoading: (loading: boolean) => set({ loading: loading }),
  setIsUserStudent: (isUserStudent: boolean) => set({ isUserStudent: isUserStudent }),
}))
