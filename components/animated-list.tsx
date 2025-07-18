"use client"

import { AnimatePresence, motion } from "motion/react"

import { EASE_OUT_CUBIC } from "@/config/animation"
import { cn } from "@/lib/utils"

export const AnimatedList = <T,>({
  data,
  renderItem,
  getItemKey,
  itemStyle,
  itemClassName,
  itemDelay = 0.05,
  itemDuration = 0.8,
  animateLayout = true,
}: {
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode
  getItemKey?: ({ item, index }: { item: T; index: number }) => string
  itemStyle?: React.CSSProperties
  itemClassName?: string
  itemDelay?: number
  itemDuration?: number
  animateLayout?: boolean
}) => {
  return (
    <>
      {data.map((item, index) => (
        <motion.div
          key={getItemKey ? getItemKey({ item, index }) : index}
          layoutId={
            animateLayout
              ? `${getItemKey ? getItemKey({ item, index }) : index}`
              : undefined
          }
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            duration: itemDuration,
            ease: EASE_OUT_CUBIC,
            delay: index * itemDelay,
          }}
          style={
            {
              ...itemStyle,
              "--motion-delay": `${index * itemDelay}s`,
            } as React.CSSProperties
          }
          className={cn("", itemClassName)}
          // className={cn("motion-opacity-in-0", itemClassName)}
        >
          {renderItem({ item, index })}
        </motion.div>
      ))}
    </>
  )
}
