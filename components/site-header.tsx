import { siteConfig } from "@/config/site"
import { CourseSearch } from "@/components/course-search"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="px-page mx-page flex h-16 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center gap-4">
          <CourseSearch />
          <nav className="flex items-center gap-1">
            {/* <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
                className: "h-9 w-9 p-0 hover:bg-accent/50 transition-colors duration-200",
              })}
            >
              <Icons.gitHub className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Link>
            <Link
              href={siteConfig.links.twitter}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({
                size: "sm",
                variant: "ghost",
                className: "h-9 w-9 p-0 hover:bg-accent/50 transition-colors duration-200",
              })}
            >
              <Icons.twitter className="h-4 w-4 fill-current" />
              <span className="sr-only">Twitter</span>
            </Link> */}
            <div className="ml-2">
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}
