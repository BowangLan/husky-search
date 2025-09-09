"use client"

import type { ComponentProps } from "react"
import ReactMarkdown from "react-markdown"

import { cn } from "@/lib/utils"

export type ResponseProps = ComponentProps<"div"> & {
  children: string
}

export const Response = ({ className, children, ...props }: ResponseProps) => (
  <div className={cn("text-sm leading-6 markdown", className)} {...props}>
    <ReactMarkdown
      components={{
        a: ({ node, ...anchorProps }) => (
          <a {...anchorProps} target="_blank" rel="noreferrer" />
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  </div>
)

Response.displayName = "Response"
