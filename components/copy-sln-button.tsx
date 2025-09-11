"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const CopySLNButton = ({ session }: { session: any }) => {
  const [copiedId, setCopiedId] = useState<string | number | null>(null)

  const handleCopy = async (value: string | number, id: string | number) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedId(id)
      toast.success(`Copied SLN ${String(value)}`)
      setTimeout(() => {
        setCopiedId((curr) => (curr === id ? null : curr))
      }, 1500)
    } catch (err) {
      toast.error("Unable to copy. Clipboard may be blocked.")
    }
  }

  return (
    <div className="text-xs md:text-sm text-foreground/80 font-mono">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-8 px-2 gap-1 text-foreground group active:scale-[0.98] transition-transform"
            )}
            onClick={() => handleCopy(session.registrationCode, session.id)}
          >
            <AnimatePresence>
              {copiedId === session.id ? (
                <motion.span
                  key="sln-ring"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 0.6, scale: 1.05 }}
                  exit={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 rounded-md"
                />
              ) : null}
            </AnimatePresence>
            <span className="mr-1">{session.registrationCode}</span>
            <AnimatePresence>
              {copiedId === session.id ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check className="text-green-500 size-4 transition-transform duration-200 ease-out scale-110" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy className="opacity-70 size-4 transition-transform duration-200 ease-out group-active:scale-95" />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="sr-only">Copy SLN</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {copiedId === session.id ? "Copied!" : "Click to copy"}
        </TooltipContent>
      </Tooltip>
      <div aria-live="polite" className="sr-only">
        {copiedId === session.id ? "SLN copied to clipboard" : undefined}
      </div>
    </div>
  )
}
