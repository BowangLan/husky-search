import * as React from "react"

import { cn } from "@/lib/utils"

interface ImageCardProps {
  imageUrl: string
  caption: string
  className?: string
}

export default function ImageCard({ imageUrl, caption, className }: ImageCardProps) {
  return (
    <figure
      className={cn(
        "w-[250px] overflow-hidden rounded-lg border bg-card shadow-sm",
        className
      )}
    >
      <img className="w-full aspect-4/3 object-cover" src={imageUrl} alt="image" />
      <figcaption className="border-t bg-card p-4 text-sm text-muted-foreground">
        {caption}
      </figcaption>
    </figure>
  )
}
