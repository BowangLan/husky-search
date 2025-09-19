import { HeroSearch } from "./hero-search"

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background layers */}
      {/* <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-muted/30 to-background" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.18),transparent)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,theme(colors.border)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 [mask-image:radial-gradient(closest-side,white,transparent)]" /> */}

      {/* Accent glows */}
      {/* <div className="pointer-events-none absolute -top-32 right-[-10%] h-80 w-80 rounded-full bg-primary/25 blur-3xl -z-10" />
      <div className="pointer-events-none absolute -bottom-24 left-[-10%] h-72 w-72 rounded-full bg-purple-500/20 blur-3xl -z-10" /> */}

      <div className="container mx-auto px-4 py-24 md:py-32 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              Browse{" "}
              <span className="bg-gradient-to-r from-primary via-primary/80 to-purple-500 bg-clip-text text-transparent">
                UW
              </span>{" "}
              courses with ease
            </span>
          </h1>

          <p className="mt-4 md:mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover courses, explore majors, and plan your academic journey at
            the University of Washington.
          </p>

          <div className="mt-8 md:mt-10">
            <HeroSearch />
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-xs md:text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] md:text-xs">
                ⌘
              </kbd>
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] md:text-xs">
                K
              </kbd>
              <span className="hidden sm:inline">for quick search</span>
            </span>
            {/* <span className="hidden md:inline">•</span>
            <span>Search across all UW campuses</span> */}
          </div>
        </div>
      </div>
    </section>
  )
}
