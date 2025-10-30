"use client"

import * as React from "react"
import { Calendar, ChevronDown, Info, PanelRight } from "lucide-react"

import { isScheduleFeatureEnabled } from "@/config/features"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet"
import { ScheduledSessionListView } from "@/components/schedule/scheduled-session-list-view"

import { RichButton } from "./ui/rich-button"

const RIGHT_SIDEBAR_COOKIE_NAME = "right_sidebar_state"
const RIGHT_SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const RIGHT_SIDEBAR_DETAILS_COOKIE_NAME = "right_sidebar_details"
const RIGHT_SIDEBAR_VIEW_COOKIE_NAME = "right_sidebar_view"
const RIGHT_SIDEBAR_WIDTH = "24rem"
const RIGHT_SIDEBAR_WIDTH_MOBILE = "18rem"

type ViewType = "scheduled-session-list"

const VIEW_LABELS: Record<ViewType, string> = {
  "scheduled-session-list": "Scheduled Sessions",
}

type RightSidebarContextProps = {
  open: boolean
  setOpen: (open: boolean) => void
  toggleSidebar: () => void
  showDetails: boolean
  setShowDetails: (value: boolean | ((value: boolean) => boolean)) => void
  toggleDetails: () => void
  view: ViewType
  setView: (view: ViewType) => void
}

const RightSidebarContext =
  React.createContext<RightSidebarContextProps | null>(null)

export function useRightSidebar() {
  const context = React.useContext(RightSidebarContext)
  if (!context) {
    throw new Error(
      "useRightSidebar must be used within a RightSidebarProvider."
    )
  }
  return context
}

export function RightSidebarProvider({
  defaultOpen = false,
  open: openProp,
  onOpenChange: setOpenProp,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }
      document.cookie = `${RIGHT_SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${RIGHT_SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  const toggleSidebar = React.useCallback(() => {
    setOpen((open) => !open)
  }, [setOpen])

  // Details on/off state (persist to cookie)
  const [showDetailsState, _setShowDetailsState] = React.useState<boolean>(
    () => {
      if (typeof document === "undefined") return true
      const match = document.cookie.match(
        new RegExp(`(?:^|; )${RIGHT_SIDEBAR_DETAILS_COOKIE_NAME}=([^;]*)`)
      )
      return match ? match[1] === "true" : true
    }
  )

  const showDetails = showDetailsState

  const setShowDetails = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const next =
        typeof value === "function"
          ? (value as (v: boolean) => boolean)(showDetailsState)
          : value
      _setShowDetailsState(next)
      document.cookie = `${RIGHT_SIDEBAR_DETAILS_COOKIE_NAME}=${next}; path=/; max-age=${RIGHT_SIDEBAR_COOKIE_MAX_AGE}`
    },
    [showDetailsState]
  )

  const toggleDetails = React.useCallback(() => {
    setShowDetails((v) => !v)
  }, [setShowDetails])

  // View state (persist to cookie)
  const [viewState, _setViewState] = React.useState<ViewType>(() => {
    if (typeof document === "undefined") return "scheduled-session-list"
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${RIGHT_SIDEBAR_VIEW_COOKIE_NAME}=([^;]*)`)
    )
    return (match ? match[1] : "scheduled-session-list") as ViewType
  })

  const view = viewState

  const setView = React.useCallback(
    (value: ViewType) => {
      _setViewState(value)
      document.cookie = `${RIGHT_SIDEBAR_VIEW_COOKIE_NAME}=${value}; path=/; max-age=${RIGHT_SIDEBAR_COOKIE_MAX_AGE}`
    },
    []
  )

  // Keyboard shortcut: "/" to toggle right sidebar (ignores inputs/editable elements)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "\\") return

      const target = event.target as HTMLElement | null
      const tagName = target?.tagName?.toLowerCase()
      const isEditable =
        target?.isContentEditable ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select"

      if (isEditable) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      event.preventDefault()
      toggleSidebar()
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  const contextValue = React.useMemo<RightSidebarContextProps>(
    () => ({
      open,
      setOpen,
      toggleSidebar,
      showDetails,
      setShowDetails,
      toggleDetails,
      view,
      setView,
    }),
    [
      open,
      setOpen,
      toggleSidebar,
      showDetails,
      setShowDetails,
      toggleDetails,
      view,
      setView,
    ]
  )

  return (
    <RightSidebarContext.Provider value={contextValue}>
      {children}
    </RightSidebarContext.Provider>
  )
}

function RightSidebarContent() {
  if (!isScheduleFeatureEnabled()) return null

  const { view, showDetails } = useRightSidebar()

  switch (view) {
    case "scheduled-session-list":
      return <ScheduledSessionListView showDetails={showDetails} />
    default:
      return <ScheduledSessionListView showDetails={showDetails} />
  }
}

export function RightSidebar() {
  const { open, setOpen } = useRightSidebar()
  const isMobile = useIsMobile()

  if (!isScheduleFeatureEnabled()) return null

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[--right-sidebar-width] p-0 flex flex-col min-h-0"
          style={
            {
              "--right-sidebar-width": RIGHT_SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
        >
          <SheetHeader className="px-4 py-3">
            <ViewSelector />
          </SheetHeader>
          <RightSidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className={cn(
        "hidden md:flex flex-col h-screen min-h-0 overflow-hidden transition-all duration-200 ease-in-out"
      )}
      style={
        {
          "--right-sidebar-width": RIGHT_SIDEBAR_WIDTH,
          width: open ? RIGHT_SIDEBAR_WIDTH : "0",
        } as React.CSSProperties
      }
    >
      <div className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex h-full min-h-0 w-[--right-sidebar-width] flex-col flex-shrink-0 pb-2 pr-2">
        <div className="px-4 py-3 flex-row items-center h-14 bg-background/80 backdrop-blur flex">
          <ViewSelector />
        </div>
        <div className="flex-1 min-h-0 border border-border shadow-sm dark:shadow-lg dark:shadow-black/20 rounded-lg overflow-hidden flex flex-col">
          <RightSidebarContent />
        </div>
      </div>
    </div>
  )
}

export function RightSidebarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useRightSidebar()

  return (
    <RichButton
      tooltip={
        <>
          <span>Toggle Right Sidebar</span>
          <kbd className="ml-2">\</kbd>
        </>
      }
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={toggleSidebar}
      aria-label="Toggle Right Sidebar"
      {...props}
    >
      {/* <Calendar className="size-4" /> */}
      <PanelRight className="size-4" />
      <span className="sr-only">Toggle Schedule Sidebar</span>
    </RichButton>
  )
}

function ViewSelector() {
  const { view, setView } = useRightSidebar()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="group h-auto px-2 py-1.5 -mx-2 -my-1.5 hover:bg-accent/50 active:bg-accent rounded-md transition-colors"
          >
            <span className="flex items-center gap-2 text-base font-semibold">
              <Calendar className="size-4" />
              {VIEW_LABELS[view]}
              <ChevronDown className="size-3 ml-1 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => setView("scheduled-session-list")}
            className={cn(
              view === "scheduled-session-list" && "bg-accent"
            )}
          >
            {VIEW_LABELS["scheduled-session-list"]}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="group flex items-center gap-2 flex-1 justify-start h-auto px-2 py-1.5 -mx-2 -my-1.5 hover:bg-accent/50 active:bg-accent rounded-md transition-colors"
        >
          <Calendar className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="font-semibold text-sm">{VIEW_LABELS[view]}</span>
          <ChevronDown className="size-3 ml-auto opacity-60 group-hover:opacity-100 transition-all duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => setView("scheduled-session-list")}
          className={cn(view === "scheduled-session-list" && "bg-accent")}
        >
          {VIEW_LABELS["scheduled-session-list"]}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DetailsToggleButton() {
  const { showDetails, toggleDetails } = useRightSidebar()
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2"
      onClick={toggleDetails}
      aria-pressed={showDetails}
      aria-label="Toggle details"
    >
      <Info className="size-4 mr-1" />
      <span className="text-xs">Details</span>
      <Badge
        variant={showDetails ? "green" : "secondary"}
        size="flat-sm"
        className="ml-2"
      >
        {showDetails ? "On" : "Off"}
      </Badge>
    </Button>
  )
}
