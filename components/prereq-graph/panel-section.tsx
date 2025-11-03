export const SectionTitle = ({ children }: { children: React.ReactNode }) => {
  return <h3 className="text-sm text-foreground font-semibold">{children}</h3>
}

export const Section = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-2 px-4">{children}</div>
}

export const TextCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="markdown text-sm/loose rounded-md p-4 bg-muted/30 h-fit text-foreground/80">
      {children}
    </div>
  )
}
