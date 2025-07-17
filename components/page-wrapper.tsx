// @ts-ignore
import { unstable_ViewTransition as ViewTransition } from "react"

import { cn } from "@/lib/utils"

export const PageWithHeaderLayout = ({
  titleTop,
  title,
  subtitle,
  children,
  className,
  topToolbar,
}: {
  titleTop?: React.ReactNode
  title: React.ReactNode
  subtitle: React.ReactNode
  children: React.ReactNode
  className?: string
  topToolbar?: React.ReactNode
}) => {
  return (
    <Page className={className}>
      {topToolbar && (
        <div className="mx-page px-page">
          <PageTopToolbar>{topToolbar}</PageTopToolbar>
        </div>
      )}
      <section
        className={cn("px-page mx-page", !topToolbar ? "my-12" : "mt-8 mb-12")}
      >
        <div className="w-full flex flex-col gap-2">
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
  pagePadding = false,
}: {
  className?: string
  children: React.ReactNode
  pagePadding?: boolean
}) => {
  return (
    <ViewTransition enter="page-enter" exit="page-exit">
      <div
        className={cn(
          "bg-gradient-to-br from-background via-background to-muted/20 pb-16",
          className,
          pagePadding ? "px-page mx-page" : ""
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

export const PageTopToolbar = ({ children }: { children: React.ReactNode }) => {
  return <div className="bg-background my-4">{children}</div>
}
