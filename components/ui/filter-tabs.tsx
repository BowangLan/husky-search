import { cn } from "@/lib/utils"

export const FilterTabList = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div
      className={cn(
        "p-1 rounded-lg border border-foreground/10 h-10 flex items-center gap-1",
        className
      )}
    >
      {children}
    </div>
  )
}

export const FilterTabItem = ({
  children,
  className,
  active,
  onClick,
  square = false,
}: {
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
  square?: boolean
}) => {
  return (
    <div
      className={cn(
        "text-sm h-full flex items-center justify-center cursor-pointer rounded-md trans select-none",
        active
          ? "bg-button-accent-hover-active"
          : "bg-button-ghost-hover-active",
        square ? "aspect-square" : "px-2.5",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
