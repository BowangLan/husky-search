"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { isEmailFromUW } from "@/constants"
import { useScheduledCourses } from "@/store/schedule.store"
import { useUserStore } from "@/store/user.store"
import { useClerk, useUser } from "@clerk/nextjs"
import {
  Calendar,
  ChevronUp,
  Home,
  Info,
  Layers,
  LogOut,
  MessageSquare,
  Moon,
  Search,
  Sun,
  User2,
} from "lucide-react"
import { useTheme } from "next-themes"

import { externalLinks, siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { AppMainHeader } from "@/components/app-main-header"
import {
  RightSidebar,
  RightSidebarProvider,
} from "@/components/app-right-sidebar"
import { CourseSearchCommand } from "@/components/course-search-command"
import { Icons } from "@/components/icons"

function isPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === href
  return pathname.startsWith(href)
}

function SidebarSearchInput({ onSearchClick }: { onSearchClick: () => void }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const isMobile = useIsMobile()

  if (isCollapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={onSearchClick} tooltip="Search courses">
            <Search className="size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <div className="group relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/70 transition-colors group-hover:text-foreground/60 pointer-events-none" />
      <SidebarInput
        placeholder="Search courses..."
        aria-label="Search courses"
        readOnly
        onClick={onSearchClick}
        onFocus={isMobile ? undefined : onSearchClick}
        className="h-9 pl-10 pr-12 rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/40 border border-border/60 hover:border-border/80 focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-border/80 placeholder:text-muted-foreground/70 transition-colors"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-6 select-none items-center justify-center rounded-md border border-border/60 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/80 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </div>
  )
}

function ScheduleBadge({ count }: { count: number }) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  if (count === 0) return null

  return (
    <Badge
      size="sm"
      className={cn(
        "absolute leading-none shadow-lg z-20 pointer-events-none",
        "top-1.5 right-1 h-5 min-w-4 px-1 text-[10px]",
        // isCollapsed &&
        //   "top-0 right-0 translate-x-1/2 -translate-y-1/2 h-4 min-w-1 px-0.5 text-[8px]"
      )}
    >
      {count}
    </Badge>
  )
}

export function AppSidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { isLoaded, isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const { setTheme, theme } = useTheme()
  const [searchOpen, setSearchOpen] = React.useState(false)
  const scheduleCount = useScheduledCourses().length

  const handleThemeToggle = () => {
    setTheme(theme === "light" ? "dark" : "light")
  }

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/" })
  }

  const getUserDisplayName = (
    firstName?: string | null,
    lastName?: string | null,
    email?: string | null
  ) => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    }
    if (firstName) {
      return firstName
    }
    if (email) {
      return email
    }
    return "User"
  }

  React.useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn || !user) {
        useUserStore.setState({
          isUserStudent: false,
          loading: false,
          isSignedIn: false,
        })
      } else {
        useUserStore.setState({
          isUserStudent:
            isSignedIn &&
            user.emailAddresses.some((email) =>
              isEmailFromUW(email.emailAddress)
            ),
          loading: false,
          isSignedIn: isSignedIn,
        })
      }
    }
  }, [isLoaded, isSignedIn, user])

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navWithIcons = siteConfig.mainNav.map((item) => {
    let IconComp: React.ComponentType<{ className?: string }>
    if (item.href === "/") IconComp = Home
    else if (item.href?.includes("majors")) IconComp = Layers
    else if (item.href?.includes("schedule")) IconComp = Calendar
    else IconComp = Info
    return { ...item, IconComp }
  })

  const firstName = user?.firstName ?? null
  const lastName = user?.lastName ?? null
  const email = user?.primaryEmailAddress?.emailAddress ?? null
  const displayName = getUserDisplayName(firstName, lastName, email)

  return (
    <RightSidebarProvider>
      <SidebarProvider>
        <Sidebar
          collapsible="icon"
          className="!bg-transparent !border-r-0 [&_[data-slot=sidebar-inner]]:!bg-transparent"
        >
          <SidebarHeader className="px-2 flex-row items-center h-14 !bg-transparent">
            <Link href="/" className="flex items-center justify-center size-8">
              <Icons.logo className="size-4" />
            </Link>
          </SidebarHeader>
          <SidebarContent className="!bg-transparent">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarSearchInput onSearchClick={() => setSearchOpen(true)} />
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navWithIcons.map((item) => {
                    const isActive = isPathActive(pathname, item.href!)
                    const isScheduleItem = item.href?.includes("schedule")
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link
                            href={item.href!}
                            className={cn(
                              "flex items-center gap-2",
                              !isActive && "opacity-50 hover:opacity-100"
                            )}
                          >
                            <item.IconComp className="size-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                        {isScheduleItem && (
                          <ScheduleBadge count={scheduleCount} />
                        )}
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="!bg-transparent">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleThemeToggle}
                  tooltip="Toggle theme"
                >
                  <Sun className="size-4 dark:hidden" />
                  <Moon className="hidden size-4 dark:block" />
                  <span>Theme</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="About">
                  <Link href="/about">
                    <Info className="size-4" />
                    <span>About</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Feedback">
                  <a
                    href={externalLinks.feedback}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="size-4" />
                    <span>Feedback</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isLoaded && isSignedIn && user ? (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton size="lg">
                        <User2 className="size-4 mx-1" />
                        <div>
                          <span>{displayName}</span>
                          {email && (
                            <p className="text-xs leading-none text-muted-foreground">
                              {email}
                            </p>
                          )}
                        </div>
                        <ChevronUp className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-64"
                      align="start"
                      forceMount
                    >
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {getUserDisplayName(firstName, lastName, email)}
                          </p>
                          {email && (
                            <p className="text-xs leading-none text-muted-foreground">
                              {email}
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onSelect={handleSignOut}>
                        <LogOut />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/sign-in">
                      <span>Sign In</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-1 min-w-0">
          <SidebarInset className="flex flex-col h-screen flex-1 min-w-0">
            <AppMainHeader />
            <main
              className={cn(
                "flex-1 min-h-0 w-full overflow-x-hidden px-2 pb-2"
              )}
            >
              <div id="app-main-content" className="w-full h-full rounded-lg bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm dark:shadow-lg dark:shadow-black/20 border overflow-hidden flex flex-col overflow-y-auto">
                {children}
              </div>
            </main>
          </SidebarInset>
          <RightSidebar />
        </div>
        <CourseSearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
      </SidebarProvider>
    </RightSidebarProvider>
  )
}
