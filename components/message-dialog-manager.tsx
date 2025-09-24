"use client"

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Sparkles,
} from "lucide-react"

import {
  MessageDialogAction,
  MessageDialogActionContext,
  MessageDialogConfig,
  MessageDialogDisplayCondition,
  MessageDialogRenderContext,
  MessageDialogTone,
  messageDialogConfigs,
} from "@/config/message-dialogs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const STORAGE_PREFIX = "husky-search:message-dialog"
const SHOWN_SUFFIX = "shown"
const OPT_OUT_SUFFIX = "opt-out"

const getShownKey = (id: string) => `${STORAGE_PREFIX}:${id}:${SHOWN_SUFFIX}`
const getOptOutKey = (id: string) => `${STORAGE_PREFIX}:${id}:${OPT_OUT_SUFFIX}`

const matchesPattern = (pathname: string, pattern: string | RegExp) => {
  if (pattern instanceof RegExp) {
    return pattern.test(pathname)
  }

  const parts = pattern
    .split("*")
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  const regex = new RegExp(`^${parts.join(".*")}$`)
  return regex.test(pathname)
}

const hasCondition = (
  config: MessageDialogConfig,
  type: MessageDialogDisplayCondition["type"]
) => config.conditions?.some((condition) => condition.type === type) ?? false

const shouldRespectOptOut = (config: MessageDialogConfig) =>
  hasCondition(config, "respectOptOut") || config.allowDontShowAgain === true

const defaultActions: MessageDialogAction[] = [
  {
    label: "Close",
    variant: "secondary",
    dismissOnClick: true,
  },
]

type ToneVisualStyle = {
  accentClassName: string
  iconWrapperClassName: string
  eyebrowClassName: string
  cardClassName: string
  glowClassName?: string
}

const toneIcons: Record<MessageDialogTone, ReactNode> = {
  default: <Sparkles className="size-6" />,
  info: <Info className="size-6" />,
  success: <CheckCircle2 className="size-6" />,
  warning: <AlertTriangle className="size-6" />,
  danger: <ShieldAlert className="size-6" />,
}

const toneStyles: Record<MessageDialogTone, ToneVisualStyle> = {
  default: {
    accentClassName: "bg-primary/70",
    iconWrapperClassName: "border-primary/20 bg-primary/10 text-primary",
    eyebrowClassName: "text-primary",
    cardClassName:
      "border-border/60 bg-background/95 shadow-xl ring-1 ring-border/40 backdrop-blur-sm dark:bg-background/80",
    glowClassName: "bg-primary/30",
  },
  info: {
    accentClassName: "bg-sky-500",
    iconWrapperClassName: "border-sky-500/20 bg-sky-500/10 text-sky-600",
    eyebrowClassName: "text-sky-600",
    cardClassName:
      "border-sky-500/25 bg-sky-50/90 shadow-xl ring-1 ring-sky-500/20 backdrop-blur-sm dark:border-sky-500/20 dark:bg-slate-900/80",
    glowClassName: "bg-sky-400/40",
  },
  success: {
    accentClassName: "bg-emerald-500",
    iconWrapperClassName:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
    eyebrowClassName: "text-emerald-600",
    cardClassName:
      "border-emerald-500/25 bg-emerald-50/90 shadow-xl ring-1 ring-emerald-500/25 backdrop-blur-sm dark:border-emerald-500/20 dark:bg-slate-900/80",
    glowClassName: "bg-emerald-400/40",
  },
  warning: {
    accentClassName: "bg-amber-500",
    iconWrapperClassName: "border-amber-500/20 bg-amber-500/10 text-amber-700",
    eyebrowClassName: "text-amber-700",
    cardClassName:
      "border-amber-500/25 bg-amber-50/95 shadow-xl ring-1 ring-amber-500/25 backdrop-blur-sm dark:border-amber-500/20 dark:bg-slate-900/80",
    glowClassName: "bg-amber-400/40",
  },
  danger: {
    accentClassName: "bg-rose-500",
    iconWrapperClassName: "border-rose-500/20 bg-rose-500/10 text-rose-600",
    eyebrowClassName: "text-rose-600",
    cardClassName:
      "border-rose-500/25 bg-rose-50/90 shadow-xl ring-1 ring-rose-500/20 backdrop-blur-sm dark:border-rose-500/20 dark:bg-slate-900/80",
    glowClassName: "bg-rose-400/40",
  },
}

type StorageHelpers = {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
}

const evaluateDisplay = async (
  config: MessageDialogConfig,
  {
    pathname,
    isSignedIn,
  }: {
    pathname: string
    isSignedIn: boolean
  },
  storage: StorageHelpers
) => {
  const shownKey = getShownKey(config.id)
  const optOutKey = getOptOutKey(config.id)

  const hasBeenShownBefore = storage.get(shownKey) === "true"
  const hasOptedOut = storage.get(optOutKey) === "true"

  const baseContext = {
    pathname,
    isSignedIn,
    hasBeenShownBefore,
    hasOptedOut,
    getStorageValue: storage.get,
  }

  if (shouldRespectOptOut(config) && hasOptedOut) {
    return false
  }

  for (const condition of config.conditions ?? []) {
    switch (condition.type) {
      case "showOnce": {
        if (hasBeenShownBefore) {
          return false
        }
        break
      }
      case "anonymousOnly": {
        if (isSignedIn) {
          return false
        }
        break
      }
      case "signedInOnly": {
        if (!isSignedIn) {
          return false
        }
        break
      }
      case "pathname": {
        const patterns = Array.isArray(condition.patterns)
          ? condition.patterns
          : [condition.patterns]
        const matches = patterns.some((pattern) =>
          matchesPattern(pathname, pattern)
        )
        if (!matches) {
          return false
        }
        break
      }
      case "respectOptOut": {
        if (hasOptedOut) {
          return false
        }
        break
      }
      case "custom": {
        const result = await condition.shouldShow(baseContext)
        if (!result) {
          return false
        }
        break
      }
      default: {
        const exhaustiveCheck: never = condition
        return exhaustiveCheck
      }
    }
  }

  return true
}

export const MessageDialogManager = () => {
  const pathname = usePathname() ?? "/"
  const { isLoaded, isSignedIn } = useUser()
  const [queue, setQueue] = useState<MessageDialogConfig[]>([])

  const getStorageItem = useCallback((key: string) => {
    if (typeof window === "undefined") {
      return null
    }

    try {
      return window.localStorage.getItem(key)
    } catch (error) {
      console.warn("MessageDialogManager: unable to read localStorage", error)
      return null
    }
  }, [])

  const setStorageItem = useCallback((key: string, value: string) => {
    if (typeof window === "undefined") {
      return
    }

    try {
      window.localStorage.setItem(key, value)
    } catch (error) {
      console.warn("MessageDialogManager: unable to write localStorage", error)
    }
  }, [])

  const storage = useMemo<StorageHelpers>(
    () => ({
      get: getStorageItem,
      set: setStorageItem,
    }),
    [getStorageItem, setStorageItem]
  )

  const activeMessage = queue[0]

  useEffect(() => {
    console.log(
      "[MessageDialogManager] state",
      JSON.stringify(
        {
          pathname,
          queue: queue.map((item) => item.id),
          isLoaded,
          isSignedIn,
        },
        null,
        2
      )
    )
  }, [pathname, queue, isLoaded, isSignedIn])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    let cancelled = false

    const evaluate = async () => {
      const matches: MessageDialogConfig[] = []

      for (const config of messageDialogConfigs) {
        const shouldShow = await evaluateDisplay(
          config,
          {
            pathname,
            isSignedIn: Boolean(isSignedIn),
          },
          storage
        )

        if (cancelled) {
          return
        }

        if (shouldShow) {
          matches.push(config)
        }
      }

      if (!cancelled) {
        setQueue(matches)
        console.log(
          "[MessageDialogManager] eligible dialogs",
          matches.map((item) => item.id)
        )
      }
    }

    evaluate()

    return () => {
      cancelled = true
    }
  }, [isLoaded, isSignedIn, pathname, storage])

  useEffect(() => {
    if (!activeMessage) {
      return
    }

    if (hasCondition(activeMessage, "showOnce")) {
      setStorageItem(getShownKey(activeMessage.id), "true")
    }
  }, [activeMessage, setStorageItem])

  const handleDismiss = useCallback(
    (options?: { dontShowAgain?: boolean }) => {
      if (!activeMessage) {
        return
      }

      if (options?.dontShowAgain) {
        setStorageItem(getOptOutKey(activeMessage.id), "true")
      }

      setQueue((prev) => prev.slice(1))
      console.log("[MessageDialogManager] dismissed", {
        id: activeMessage.id,
        dontShowAgain: options?.dontShowAgain,
      })
    },
    [activeMessage, setStorageItem]
  )

  const dismiss = useCallback(() => {
    handleDismiss()
  }, [handleDismiss])

  const dismissAndOptOut = useCallback(() => {
    handleDismiss({ dontShowAgain: true })
  }, [handleDismiss])

  const actionHandlers = useMemo(() => {
    if (!activeMessage) {
      return []
    }

    const actions = activeMessage.actions?.length
      ? activeMessage.actions
      : defaultActions

    return actions.map((action) => {
      const handle = async () => {
        const helpers: MessageDialogActionContext = {
          dismiss,
          dismissAndOptOut,
        }

        const result = action.onClick
          ? await action.onClick(helpers)
          : undefined

        if (action.dontShowAgain) {
          dismissAndOptOut()
          return
        }

        if (result === false) {
          return
        }

        const shouldDismiss = action.dismissOnClick ?? true

        if (shouldDismiss) {
          dismiss()
        }
      }

      return handle
    })
  }, [activeMessage, dismiss, dismissAndOptOut])

  if (!activeMessage) {
    return null
  }

  const renderContext: MessageDialogRenderContext = {
    config: activeMessage,
    dismiss,
    dismissAndOptOut,
  }

  const actions = activeMessage.actions?.length
    ? activeMessage.actions
    : defaultActions

  console.log("[MessageDialogManager] rendering", {
    id: activeMessage.id,
    tone: activeMessage.tone ?? "default",
    toneStyle: toneStyles[activeMessage.tone ?? "default"],
    actions: actions.length,
  })

  const defaultDialog = (
    <Dialog
      open={Boolean(activeMessage)}
      onOpenChange={(open) => {
        if (!open) {
          if (activeMessage.allowClose === false) {
            return
          }
          handleDismiss()
        }
      }}
    >
      <DialogContent
        key={activeMessage.id}
        className={cn("z-[62] sm:max-w-[680px]")}
        showCloseButton={activeMessage.allowClose ?? true}
      >
        <div
          className={
            cn()
            // "relative flex flex-col gap-6 overflow-hidden rounded-2xl p-6 sm:p-8"
            // toneStyles[activeMessage.tone ?? "default"].cardClassName,
            // activeMessage.cardClassName
          }
        >
          <div
            aria-hidden
            className={cn(
              "absolute inset-x-0 top-0 h-1"
              // toneStyles[activeMessage.tone ?? "default"].accentClassName
            )}
          />
          {toneStyles[activeMessage.tone ?? "default"].glowClassName && (
            <div
              aria-hidden
              className={
                toneStyles[activeMessage.tone ?? "default"].glowClassName
              }
            />
          )}
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
              {activeMessage.icon && <div>{activeMessage.icon}</div>}
              <DialogHeader className="gap-2 text-left">
                {activeMessage.eyebrow && (
                  <span
                    className={cn(
                      "text-xs font-semibold uppercase tracking-[0.2em]",
                      toneStyles[activeMessage.tone ?? "default"]
                        .eyebrowClassName
                    )}
                  >
                    {activeMessage.eyebrow}
                  </span>
                )}
                <DialogTitle className="text-2xl font-semibold leading-snug">
                  {activeMessage.title}
                </DialogTitle>
                {activeMessage.description && (
                  <DialogDescription className="text-base leading-relaxed text-muted-foreground">
                    {activeMessage.description}
                  </DialogDescription>
                )}
              </DialogHeader>
            </div>
            {activeMessage.renderContent && (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {activeMessage.renderContent(renderContext)}
              </div>
            )}
          </div>
          <DialogFooter className="relative z-10 flex-col gap-4 border-t border-border/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
            {activeMessage.allowDontShowAgain ? (
              <Button variant="ghost" onClick={dismissAndOptOut}>
                {activeMessage.dontShowAgainLabel ?? "Don't show this again"}
              </Button>
            ) : (
              <div></div>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              {actions.map((action, index) => {
                const handler = actionHandlers[index]
                const key = `${activeMessage.id}-${index}`
                const buttonProps = {
                  variant: action.variant ?? "default",
                  onClick: handler,
                }

                if (action.href) {
                  return (
                    <Button key={key} {...buttonProps} asChild>
                      <Link href={action.href}>{action.label}</Link>
                    </Button>
                  )
                }

                return (
                  <Button key={key} {...buttonProps}>
                    {action.label}
                  </Button>
                )
              })}
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (activeMessage.renderDialog) {
    return activeMessage.renderDialog({
      ...renderContext,
      defaultDialog,
    })
  }

  return defaultDialog
}
