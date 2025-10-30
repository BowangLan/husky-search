"use client"

import Link from "next/link"
import { useScheduleCount } from "@/store/schedule.store"
import { Calendar } from "lucide-react"

import { isScheduleFeatureEnabled } from "@/config/features"
import { siteConfig } from "@/config/site"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { RightSidebarTrigger } from "@/components/app-right-sidebar"

export function AppMainHeader() {
  const scheduleEnabled = isScheduleFeatureEnabled()
  const scheduleCount = useScheduleCount()

  return (
    <header className="flex-none bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 w-full shrink-0">
      <div className="h-14 flex items-center gap-2 px-2">
        <SidebarTrigger />
        <div className="text-sm text-muted-foreground">{siteConfig.name}</div>
        {scheduleEnabled && (
          <div className="ml-auto flex items-center gap-2">
            <RightSidebarTrigger />
          </div>
        )}
      </div>
    </header>
  )
}
