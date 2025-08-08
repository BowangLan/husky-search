"use client"

// @ts-ignore
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components"
import { AnimatePresence } from "motion/react"

import { TooltipProvider } from "./ui/tooltip"

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <AuthKitProvider>
      <AnimatePresence>
        <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
      </AnimatePresence>
    </AuthKitProvider>
  )
}
