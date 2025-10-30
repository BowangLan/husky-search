"use client"

import { MyplanCourseTermSession } from "@/convex/schema"
import { Check, Copy } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const CopySLNButton = ({
  session,
  className,
  iconClassName,
}: {
  session: MyplanCourseTermSession
  className?: string
  iconClassName?: string
}) => {
  const { copyToClipboard, isCopied } = useCopyToClipboard()

  const handleCopy = () => {
    copyToClipboard(session.registrationCode, session.id, {
      successMessage: `Copied SLN ${session.registrationCode}`,
    })
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
              "relative h-8 px-2 gap-1 text-foreground group active:scale-[0.98] transition-transform",
              className
            )}
            onClick={handleCopy}
          >
            <AnimatePresence>
              {isCopied(session.id) ? (
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
              {isCopied(session.id) ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Check
                    className={cn(
                      "text-green-500 size-4 transition-transform duration-200 ease-out scale-110",
                      iconClassName
                    )}
                  />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Copy
                    className={cn(
                      "opacity-70 size-4 transition-transform duration-200 ease-out group-active:scale-95",
                      iconClassName
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="sr-only">Copy SLN</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isCopied(session.id) ? "Copied!" : "Click to copy"}
        </TooltipContent>
      </Tooltip>
      <div aria-live="polite" className="sr-only">
        {isCopied(session.id) ? "SLN copied to clipboard" : undefined}
      </div>
    </div>
  )
}
