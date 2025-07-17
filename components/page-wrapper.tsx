// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"

import { cn } from "@/lib/utils"

export const PageWithHeaderLayout = ({
  titleTop,
  title,
  subtitle,
  children,
  className,
}: {
  titleTop?: React.ReactNode
  title: React.ReactNode
  subtitle: React.ReactNode
  children: React.ReactNode
  className?: string
}) => {
  return (
    <Page className={className}>
      <section className="px-page mx-page">
        <div className="w-full mb-16 flex flex-col gap-2">
          {titleTop}
          {typeof title === "string" ? (
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
              {title}
            </h1>
          ) : (
            title
          )}
          <div className="flex items-center gap-2 text-base text-muted-foreground font-light">
            {subtitle}
          </div>
        </div>
      </section>
      {children}
    </Page>
  )
}

export const Page = ({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) => {
  return (
    <ViewTransition enter="page-enter" exit="page-exit">
      <div
        className={cn(
          "bg-gradient-to-br from-background via-background to-muted/20 py-16",
          className
        )}
      >
        {children}
      </div>
    </ViewTransition>
  )
}

export const PageTitle = ({ children }: { children: React.ReactNode }) => {
  return (
    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
      {children}
    </h1>
  )
}
