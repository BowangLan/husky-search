"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { ProgramInfo } from "@/types/program"
import { cn } from "@/lib/utils"

const ACCENT_HOVER_TEXT_CLASSES = [
  "group-hover:text-primary",
  "group-hover:text-emerald-400",
  "group-hover:text-amber-400",
  "group-hover:text-purple-400",
  "group-hover:text-sky-400",
] as const

type Accent = "auto" | "indigo" | "emerald" | "amber" | "purple" | "sky"

function hashStringToIndex(input: string, mod: number) {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0
  }
  return h % mod
}

function getAccentHoverTextClass(code: string, accent: Accent) {
  if (accent === "indigo") return "group-hover:text-primary"
  if (accent === "emerald") return "group-hover:text-emerald-400"
  if (accent === "amber") return "group-hover:text-amber-400"
  if (accent === "purple") return "group-hover:text-purple-400"
  if (accent === "sky") return "group-hover:text-sky-400"

  return ACCENT_HOVER_TEXT_CLASSES[
    hashStringToIndex(code, ACCENT_HOVER_TEXT_CLASSES.length)
  ]
}

export function ProgramCardLinkV2({
  program,
  className,
  accent = "auto",
}: {
  program: ProgramInfo
  className?: string
  accent?: Accent
}) {
  const hoverTextClass = getAccentHoverTextClass(program.code, accent)

  return (
    <Link
      href={`/majors/${program.code}`}
      prefetch
      className={cn(
        "group relative flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
        className
      )}
    >
      <span
        className={cn(
          "text-2xl font-medium tracking-tight text-zinc-900 transition-colors dark:text-zinc-200",
          hoverTextClass
        )}
      >
        {program.code}
      </span>
      <span className="text-xs font-normal truncate text-zinc-600 transition-colors group-hover:text-zinc-700 dark:text-zinc-500 dark:group-hover:text-zinc-400">
        {program.title}
      </span>

      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4 text-zinc-600 dark:text-zinc-500" />
      </div>
    </Link>
  )
}
