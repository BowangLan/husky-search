"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

/**
 * Filter UI primitives used by filter sidebars/panels.
 * Goal: consistent dark, segmented aesthetic (header row + grouped rows).
 */

export function FilterSections({
  className,
  defaultValue,
  children,
}: {
  className?: string
  defaultValue?: string[]
  children: React.ReactNode
}) {
  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className={cn("space-y-2", className)}
    >
      {children}
    </Accordion>
  )
}

export function FilterSection({
  value,
  title,
  right,
  children,
  className,
}: {
  value: string
  title: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "bg-transparent mb-0 px-0 py-0 overflow-hidden border-none",
        className
      )}
    >
      <AccordionTrigger className="px-3 h-10 flex items-center hover:no-underline hover:bg-accent select-none">
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-sm font-medium leading-none">{title}</div>
          {right ? (
            <div className="absolute right-9 top-1/2 -translate-y-1/2 shrink-0">
              {right}
            </div>
          ) : null}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 py-2">{children}</AccordionContent>
    </AccordionItem>
  )
}

export function FilterCheckboxGroup({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-foreground/10 bg-background/40 dark:bg-background/20 overflow-hidden",
        className
      )}
    >
      <div className="divide-y divide-foreground/10">{children}</div>
    </div>
  )
}

export function FilterCheckboxItem({
  id,
  label,
  checked,
  onCheckedChange,
  count,
  right,
  className,
  disabled,
}: {
  id: string
  label: React.ReactNode
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  count?: number
  right?: React.ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 transition-colors",
        disabled ? "opacity-60 pointer-events-none" : "",
        className
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => {
          if (v === "indeterminate") return
          onCheckedChange(Boolean(v))
        }}
      />
      <Label
        htmlFor={id}
        className="cursor-pointer text-sm font-normal text-foreground/70 group-hover:text-foreground flex-1"
      >
        {label}
      </Label>
      {right ? (
        <div className="shrink-0">{right}</div>
      ) : typeof count === "number" ? (
        <div className="shrink-0">
          <FilterCountPill>{count}</FilterCountPill>
        </div>
      ) : null}
    </div>
  )
}

export function FilterCountPill({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-foreground/10 px-2 text-xs text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}
