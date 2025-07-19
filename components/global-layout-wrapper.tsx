"use client"

// @ts-ignore
import { AuthKitProvider } from "@workos-inc/authkit-nextjs/components"
import { AnimatePresence } from "motion/react"

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <AuthKitProvider>
      <AnimatePresence>{children}</AnimatePresence>
    </AuthKitProvider>
  )
}
