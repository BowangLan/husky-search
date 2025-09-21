import { ExternalLinkIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex-inline flex flex-row items-center text-sm/tight gap-2 trans hover:text-purple-500",
        className
      )}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5 md:h-4 md:w-4" />
      <span>{children}</span>
    </a>
  )
}

export function ExternalLinkSmall({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex-inline flex flex-row items-center text-xs gap-2 trans hover:text-purple-500",
        className
      )}
    >
      <ExternalLinkIcon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </a>
  )
}
