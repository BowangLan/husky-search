"use client"

import * as React from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

const storageKey = "globalDisclaimerBannerDismissed"

export function GlobalDisclaimerBanner() {
  const [isDismissed, setIsDismissed] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const stored = window.localStorage.getItem(storageKey)
      setIsDismissed(stored === "true")
    } catch (error) {
      console.warn("GlobalDisclaimerBanner: unable to read localStorage", error)
      setIsDismissed(false)
    }
  }, [])

  const handleDismiss = React.useCallback(() => {
    setIsDismissed(true)

    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(storageKey, "true")
    } catch (error) {
      console.warn("GlobalDisclaimerBanner: unable to write localStorage", error)
    }
  }, [])

  if (isDismissed || isDismissed === null) {
    return null
  }

  return (
    <div className="w-full border-b border-border/60 bg-muted/40 text-foreground">
      <div className="relative mx-auto max-w-7xl px-4 py-2 text-center text-xs font-semibold tracking-wide sm:text-sm">
        Not affiliated with the University of Washington (UW).
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <X className="size-3.5" />
          <span className="sr-only">Dismiss banner</span>
        </Button>
      </div>
    </div>
  )
}
