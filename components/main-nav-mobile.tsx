"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Icons } from "@/components/icons"

interface MainNavMobileProps {
  items?: NavItem[]
}

const isPathActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === href
  }
  return pathname.startsWith(href)
}

export function MainNavMobile({ items }: MainNavMobileProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex items-center gap-4 md:hidden">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 w-9"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center space-x-2">
              <Icons.logo size={24} />
              <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-foreground to-purple-500 bg-clip-text text-transparent">
                {siteConfig.name}
              </span>
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {items?.length ? (
              <nav className="flex flex-col gap-2">
                {items?.map(
                  (item, index) =>
                    item.href && (
                      <Link
                        key={index}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md",
                          isPathActive(pathname, item.href)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent",
                          item.disabled && "cursor-not-allowed opacity-60"
                        )}
                      >
                        {item.title}
                      </Link>
                    )
                )}
              </nav>
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
