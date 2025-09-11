import { cn } from "@/lib/utils"

export function Section({
  children,
  className,
  withPadding = false,
}: React.ComponentProps<"section"> & { withPadding?: boolean }) {
  return (
    <section
      className={cn(
        "mb-1 lg:mb-6",
        withPadding && "px-page mx-page",
        className
      )}
    >
      {children}
    </section>
  )
}

export function SectionHeader({
  children,
  className,
  title,
  subtitle,
  border,
}: React.ComponentProps<"div"> & {
  border?: boolean
  title?: React.ReactNode
  subtitle?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "pb-1 lg:pb-3 flex items-center flex-row gap-2",
        border && "border-b border-border pb-4",
        className
      )}
    >
      {(!!title || !!subtitle) && (
        <div className="flex-1 flex flex-col lg:gap-1">
          {!!title && <SectionTitle>{title}</SectionTitle>}
          {!!subtitle && <SectionSubtitle>{subtitle}</SectionSubtitle>}
        </div>
      )}
      {children}
    </div>
  )
}

export function SectionContent({
  children,
  className,
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("py-2 flex flex-col lg:py-4", className)}>
      {children}
    </div>
  )
}

export function SectionTitle({
  children,
  className,
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-xl md:text-2xl font-medium md:font-semibold",
        className
      )}
    >
      {children}
    </h2>
  )
}

export function SectionSubtitle({
  children,
  className,
}: React.ComponentProps<"h3">) {
  return (
    <p className={cn("text-base font-light text-muted-foreground", className)}>
      {children}
    </p>
  )
}
