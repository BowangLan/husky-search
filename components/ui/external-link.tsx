import { ExternalLinkIcon } from "lucide-react"

export function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-inline flex flex-row items-center gap-2 trans hover:text-purple-500"
    >
      <ExternalLinkIcon className="h-4 w-4" />
      <span>{children}</span>
    </a>
  )
}
