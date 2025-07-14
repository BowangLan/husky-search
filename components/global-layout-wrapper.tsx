"use client"

// import { unstable_ViewTransition as ViewTransition } from "react"
import { unstable_ViewTransition as ViewTransition } from "react"
import { AnimatePresence } from "motion/react"

export const GlobalLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode
}) => {
  return (
    <AnimatePresence>
      <ViewTransition>{children}</ViewTransition>
      {/* {children} */}
    </AnimatePresence>
  )
}
