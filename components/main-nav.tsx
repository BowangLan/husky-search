"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface MainNavProps {
  items?: NavItem[]
}

const isPathActive = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === href
  }

  return pathname.startsWith(href)
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex gap-8 md:gap-12">
      <Link href="/" className="flex items-center space-x-2 group">
        <div className="relative">
          <Icons.logo
            size={28}
            className="transition-transform duration-200 group-hover:scale-110"
          />
          {/* <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" /> */}
        </div>
        <span className="font-semibold hidden md:block text-lg tracking-tight bg-gradient-to-r from-foreground to-purple-500 bg-clip-text text-transparent">
          {siteConfig.name}
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden md:flex gap-6">
          {items?.map(
            (item, index) =>
              item.href && (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "relative flex items-center text-sm font-medium transition-colors duration-200 hover:text-foreground",
                    isPathActive(pathname, item.href)
                      ? "text-foreground"
                      : "text-muted-foreground",
                    item.disabled && "cursor-not-allowed opacity-60"
                  )}
                >
                  {item.title}
                  {isPathActive(pathname, item.href) && (
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full" />
                  )}
                </Link>
              )
          )}
        </nav>
      ) : null}
    </div>
  )
}
