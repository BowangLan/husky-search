"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/convex/_generated/api"
import { useScheduleCount } from "@/store/schedule.store"
import { useQuery } from "convex/react"
import { Calendar, MessageCircle } from "lucide-react"

import { externalLinks, siteConfig } from "@/config/site"
import { CourseSearch } from "@/components/course-search"
import { MainNav } from "@/components/main-nav"
import { ThemeToggle } from "@/components/theme-toggle"

import { isScheduleFeatureEnabled } from "@/config/features"

import { CourseSearchMobile } from "./course-search-mobile"
import HeaderUser from "./header-user"
import { MainNavMobile } from "./main-nav-mobile"
import { ScheduleSheet } from "./schedule/schedule-sheet"
import { Button } from "./ui/button"

export function SiteHeader() {
  const [open, setOpen] = useState(false)
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
              onClick={() => setOpen(true)}
              aria-label={`Schedule${scheduleCount ? ` (${scheduleCount})` : ""}`}
              className="size-9 p-0 md:size-auto md:px-3 md:h-9"
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden md:inline">
                Schedule{scheduleCount ? ` (${scheduleCount})` : ""}
              </span>
            </Button>
          )}

          <Link href={externalLinks.feedback} target="_blank">
            <Button
              variant="outline"
              className="size-9 p-0 md:size-auto md:px-3 md:h-9"
              aria-label="Feedback"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden md:inline">Feedback</span>
            </Button>
          </Link>

          <HeaderUser />
        </div>
      </div>
      {scheduleEnabled && <ScheduleSheet open={open} onOpenChange={setOpen} />}
    </header>
  )
}
