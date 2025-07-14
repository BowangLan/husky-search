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
}: {
  data: T[]
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode
  getItemKey?: ({ item, index }: { item: T; index: number }) => string
  itemStyle?: React.CSSProperties
  itemClassName?: string
}) => {
  return (
    <>
      {data.map((item, index) => (
        <div
          key={getItemKey ? getItemKey({ item, index }) : index}
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // exit={{ opacity: 0, y: -20 }}
          // transition={{
          //   duration: 0.8,
          //   ease: EASE_OUT_CUBIC,
          //   delay: index * 0.07,
          // }}
          style={
            {
              ...itemStyle,
              "--motion-delay": `${index * 0.05}s`,
            } as React.CSSProperties
          }
          // className={cn("", itemClassName)}
          className={cn("motion-opacity-in-0", itemClassName)}
        >
          {renderItem({ item, index })}
        </div>
      ))}
    </>
  )
}
