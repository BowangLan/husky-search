"use client"

import { useEffect, useState } from "react"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { AnimatePresence, motion } from "motion/react"

import { EASE_OUT_CUBIC } from "@/config/animation"
import { cn } from "@/lib/utils"
import { ExternalLink } from "@/components/ui/external-link"
import { Badge } from "@/components/ui/badge"

export function StickyCourseHeader({
  courseCode,
  className,
}: {
  courseCode: string
  className?: string
}) {
  const courseData = useQuery(api.courses.getByCourseCode, { courseCode })
  const [show, setShow] = useState(false)

  useEffect(() => {
    const headerEl = document.getElementById("course-detail-main-header")
    const containerEl = document.getElementById("app-main-content")

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShow(!entry.isIntersecting)
      },
      { root: containerEl || null, threshold: 0 }
    )

    if (headerEl) {
      observer.observe(headerEl)
    }
    return () => observer.disconnect()
  }, [courseData?.myplanCourse, courseCode])

  const title = courseData?.myplanCourse?.title ?? ""
  const credits = courseData?.myplanCourse?.credit
  const genEds = (courseData?.myplanCourse?.genEdReqs as string[] | undefined) || []
  const shownGenEds = genEds.slice(0, 2)
  const moreGenEdsCount = genEds.length - shownGenEds.length

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_CUBIC }}
          className={cn(
            "sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70",
            className
          )}
        >
          <div className="py-1 mx-page">
            <div className="flex items-center justify-between gap-4 py-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-col leading-tight">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-base font-medium text-foreground">
                      {courseCode.slice(0, -3)}
                      <span className="font-semibold text-primary">
                        {courseCode.slice(-3, -2)}
                      </span>
                      {courseCode.slice(-2)}
                    </div>
                    {shownGenEds.length > 0 && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        {shownGenEds.join(", ")}
                        {moreGenEdsCount > 0 ? ` +${moreGenEdsCount}` : ""}
                      </Badge>
                    )}
                    {credits ? (
                      <span className="text-xs text-muted-foreground font-mono">({credits})</span>
                    ) : null}
                  </div>
                  {title ? (
                    <div className="text-sm text-muted-foreground truncate">
                      {title}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-4">
                <ExternalLink
                  href={`https://myplan.uw.edu/course/#/courses/${courseCode}`}
                >
                  MyPlan
                </ExternalLink>
                <ExternalLink
                  href={`https://dawgpath.uw.edu/course?id=${courseCode}&campus=seattle`}
                >
                  DawgPath
                </ExternalLink>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
