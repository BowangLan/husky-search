"use client"

// @ts-ignore
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { AnimatePresence } from "motion/react"

import { TooltipProvider } from "./ui/tooltip"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <ConvexProvider client={convex}>
      <AuthKitProvider>
        <AnimatePresence>
          <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
        </AnimatePresence>
      </AuthKitProvider>
    </ConvexProvider>
  )
}
