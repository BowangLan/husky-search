import Link from "next/link"
import { MessageCircle } from "lucide-react"

import { externalLinks, siteConfig } from "@/config/site"
import { CourseSearch } from "@/components/course-search"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

import { CourseSearchMobile } from "./course-search-mobile"
import HeaderUser from "./header-user"
import { MainNavMobile } from "./main-nav-mobile"
import { Button } from "./ui/button"

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
          {/* <HeaderUser /> */}

          <Link href={externalLinks.feedback} target="_blank">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4" />
              <span>Feedback</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
