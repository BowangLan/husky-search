import { siteConfig } from "@/config/site"
import { CourseSearch } from "@/components/course-search"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

import { CourseSearchMobile } from "./course-search-mobile"
import { MainNavMobile } from "./main-nav-mobile"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="px-page mx-page flex h-16 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center gap-2">
          <CourseSearchMobile />
          <CourseSearch />
          <ThemeToggle />
          <MainNavMobile items={siteConfig.mainNav} />
        </div>
      </div>
    </header>
  )
}
