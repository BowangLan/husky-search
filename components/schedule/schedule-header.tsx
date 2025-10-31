"use client"

import { useState } from "react"
import { Calendar, Check, Copy, X } from "lucide-react"
import { toast } from "sonner"

import { useClearSchedule, useScheduledCourses } from "@/store/schedule.store"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useGeneratedSchedules } from "@/store/generated-schedules.store"

export function ScheduleHeader() {
  const courses = useScheduledCourses()
  const clear = useClearSchedule()
  const { variants } = useGeneratedSchedules()
  const [copied, setCopied] = useState(false)

  const handleCopySLNs = async () => {
    // Get all SLN codes (registrationCode), filter out undefined/null, and join with commas
    const slnCodes = courses
      .flatMap((c) => c.sessions)
      .map((s) => s.registrationCode)
      .filter((code) => code !== undefined && code !== null && code !== "")
      .join(",")

    if (slnCodes) {
      try {
        await navigator.clipboard.writeText(slnCodes)
        setCopied(true)
        const count = slnCodes.split(",").length
        toast.success(`Copied ${count} SLN code${count > 1 ? "s" : ""}`, {
          description: slnCodes,
          duration: 3000,
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast.error("Failed to copy SLN codes", {
          description: "Please try again or copy manually",
        })
      }
    } else {
      toast.error("No SLN codes to copy", {
        description: "Add sessions with registration codes first",
      })
    }
  }

  return (
    <div className="flex-none border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-6 py-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
            <Calendar className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">My Schedule</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your course schedule and generate variants
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-4">
          <TabsList className="h-9">
            <TabsTrigger value="schedule" className="relative px-4">
              Schedule
            </TabsTrigger>
            <TabsTrigger value="generation" className="relative px-4">
              Generation
              {variants.length > 0 && (
                <Badge 
                  variant="secondary" 
                  size="flat-sm"
                  className="ml-2 h-4 px-1.5 text-[10px] font-medium"
                >
                  {variants.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleCopySLNs}
                  disabled={courses.length === 0}
                  className="h-8"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 mr-1.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 mr-1.5" />
                      Copy SLN Codes
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Copy all registration codes to paste into Register.UW
                  {courses.length > 0 &&
                    (() => {
                      const count = courses
                        .flatMap((c) => c.sessions)
                        .filter((s) => s.registrationCode).length
                      return ` (${count} code${count !== 1 ? "s" : ""})`
                    })()}
                </p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clear()}
              disabled={courses.length === 0}
              className="h-8"
            >
              <X className="size-3.5" />
              Clear all
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

