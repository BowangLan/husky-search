"use client"

import { useUserStore } from "@/store/user.store"

export const useIsStudent = () => {
  return useUserStore((state) => state.isUserStudent)
}