import { cn } from "@/lib/utils"

export function Section({
  children,
  className,
}: React.ComponentProps<"section">) {
  return <section className={cn("mb-6", className)}>{children}</section>
}

export function SectionHeader({
  children,
  className,
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("border-b border-border pb-2", className)}>
      {children}
    </div>
  )
}

export function SectionContent({
  children,
  className,
}: React.ComponentProps<"div">) {
  return <div className={cn("py-3", className)}>{children}</div>
}
