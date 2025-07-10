import * as React from "react"

import { cn } from "@/lib/utils"

interface MarqueeProps {
  className?: string
  items: string[]
}

export default function Marquee({ className, items }: MarqueeProps) {
  return (
    <div className={cn("relative flex w-full overflow-x-hidden", className)}>
      <div className="animate-marquee whitespace-nowrap py-4">
        {items.map((item, index) => (
          <span key={index} className="mx-4 text-sm">
            {item}
          </span>
        ))}
      </div>
      <div className="absolute top-0 animate-marquee2 whitespace-nowrap py-4">
        {items.map((item, index) => (
          <span key={index} className="mx-4 text-sm">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
