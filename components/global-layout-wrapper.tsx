"use client"

import { AnimatePresence } from "motion/react"

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return <AnimatePresence>{children}</AnimatePresence>
}
