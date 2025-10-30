"use client"

import Link from "next/link"
import { useScheduleCount } from "@/store/schedule.store"
import { Calendar } from "lucide-react"

import { siteConfig } from "@/config/site"
import { CourseSearch } from "@/components/course-search"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

import { isScheduleFeatureEnabled } from "@/config/features"

import { CourseSearchMobile } from "./course-search-mobile"
import HeaderUser from "./header-user"
import { MainNavMobile } from "./main-nav-mobile"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"

export function SiteHeader() {
  const scheduleEnabled = isScheduleFeatureEnabled()
  const scheduleCount = useScheduleCount()
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="px-page mx-page flex h-16 items-center justify-between">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center gap-2 md:gap-3">
          <CourseSearchMobile />
          <CourseSearch />
          <ThemeToggle />
          <MainNavMobile items={siteConfig.mainNav} />

          {scheduleEnabled && (
            <Button
              variant="outline"
              asChild
              aria-label={`Schedule${scheduleCount ? ` (${scheduleCount})` : ""}`}
              className="size-9 p-0 md:size-auto md:px-3 md:h-9 relative"
            >
              <Link href="/schedule">
                <Calendar className="h-4 w-4" />
                <span className="hidden md:inline">Schedule</span>
                {scheduleCount > 0 && (
                  <Badge
                    size="sm"
                    variant="default"
                    className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] leading-none"
                  >
                    {scheduleCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}

          <HeaderUser />
        </div>
      </div>
    </header>
  )
}
