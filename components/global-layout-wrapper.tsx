"use client"

import { ReactNode } from "react"
import { ClerkProvider, useAuth } from "@clerk/nextjs"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { AnimatePresence } from "motion/react"

import { TooltipProvider } from "@/components/ui/tooltip"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL in your .env file")
}

function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <ConvexProvider client={convex}>
      <ClerkProvider>
        <ConvexClientProvider>
          <AnimatePresence>
            <TooltipProvider delayDuration={100}>{children}</TooltipProvider>
          </AnimatePresence>
        </ConvexClientProvider>
      </ClerkProvider>
    </ConvexProvider>
  )
}
