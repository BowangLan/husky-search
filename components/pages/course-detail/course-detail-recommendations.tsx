"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { CourseDetail } from "@/convex/courses"
import {
  CourseRecommendationItem,
  RecommendationGroup,
  RecommendationGroupId,
  RecommendationSource,
  buildCourseRecommendations,
} from "@/lib/course-recommendations"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const groupMeta: Record<
  RecommendationGroupId,
  { title: string; description: string }
> = {
  preparation: {
    title: "Build your foundation",
    description:
      "Courses that appear directly in the prerequisite graph before this class.",
  },
  corequisites: {
    title: "Plan corequisites",
    description:
      "Prerequisites that DawgPath marks as eligible for concurrent enrollment.",
  },
  pairs: {
    title: "Popular pairings",
    description:
      "Courses DawgPath students most often take in the same term as this one.",
  },
  followOn: {
    title: "Unlocks next steps",
    description:
      "Courses that list this class as a prerequisite or requirement.",
  },
}

const confidenceBadge = (score: number) => {
  if (score >= 0.85) {
    return { label: "High confidence", variant: "green-outline" as const }
  }
  if (score >= 0.7) {
    return { label: "Likely fit", variant: "yellow-outline" as const }
  }
  return { label: "Supporting option", variant: "gray-outline" as const }
}

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined) {
    return null
  }
  const percent = Math.round(value * 100)
  if (!Number.isFinite(percent)) {
    return null
  }
  return `${percent}%`
}

const summarizeSource = (
  source: RecommendationSource,
  currentCourseCode: string
) => {
  if (source.type === "graph") {
    const trimmedAndOr = source.rawAndOr?.trim().toUpperCase()
    if (source.relation === "incoming") {
      const concurrencyNote = source.allowsConcurrency
        ? " (can be taken concurrently)"
        : ""
      let summary = `Listed as a prerequisite for ${currentCourseCode}${concurrencyNote}.`
      if (trimmedAndOr === "O") {
        summary = `${summary} You can satisfy this requirement with one of several options.`
      }
      if (source.minGrade && source.minGrade.trim()) {
        summary = `${summary} Minimum grade: ${source.minGrade.trim()}.`
      }
      return summary
    }

    let summary = `${currentCourseCode} unlocks this course in the DawgPath graph.`
    if (trimmedAndOr === "O") {
      summary = `${summary} It is one of multiple possible follow-on options.`
    }
    return summary
  }

  const percentLabel = formatPercent(source.percent)
  const parts = []
  if (percentLabel) {
    parts.push(`${percentLabel} of DawgPath students took it alongside ${currentCourseCode}.`)
  } else {
    parts.push(`Frequently paired with ${currentCourseCode} in DawgPath data.`)
  }
  if (source.isGateway) {
    parts.push("Flagged as a gateway course.")
  }
  if (source.isBottleneck) {
    parts.push("Marked as a bottleneck course.")
  }
  return parts.join(" ")
}

const badgeKey = (badge: { label: string; variant: string }) =>
  `${badge.variant}-${badge.label}`

const deriveBadges = (
  item: CourseRecommendationItem,
  currentCourseCode: string
) => {
  const badges = new Map<string, { label: string; variant: Parameters<
    typeof Badge
  >[0]["variant"] }>()

  const confidence = confidenceBadge(item.score)
  badges.set(badgeKey(confidence), confidence)

  item.sources.forEach((source) => {
    if (source.type === "graph") {
      const trimmed = source.rawAndOr?.trim().toUpperCase()
      if (source.relation === "incoming") {
        if (source.allowsConcurrency) {
          badges.set("coreq", {
            label: "Can take concurrently",
            variant: "blue-outline",
          })
        } else if (trimmed === "O") {
          badges.set("alt-prereq", {
            label: "Alternate prerequisite",
            variant: "yellow-outline",
          })
        } else {
          badges.set("required-prereq", {
            label: "Required prerequisite",
            variant: "green-outline",
          })
        }
      } else {
        badges.set("follow-on", {
          label: "Unlocks progression",
          variant: "purple-outline",
        })
      }

      if (source.minGrade && source.minGrade.trim()) {
        badges.set(`grade-${source.minGrade.trim()}`, {
          label: `Min grade ${source.minGrade.trim()}`,
          variant: "gray-outline",
        })
      }
    } else {
      const percentLabel = formatPercent(source.percent)
      if (percentLabel) {
        badges.set("pair-percent", {
          label: `${percentLabel} paired`,
          variant: "blue-outline",
        })
      }
      if (source.isGateway) {
        badges.set("gateway", {
          label: "Gateway course",
          variant: "green-outline",
        })
      }
      if (source.isBottleneck) {
        badges.set("bottleneck", {
          label: "Bottleneck risk",
          variant: "red-outline",
        })
      }
    }
  })

  return Array.from(badges.values())
}

const groupHasData = (group: RecommendationGroup) =>
  group.items && group.items.length > 0

type CourseRecommendationProps = {
  courseCode: string
  courseDetail: CourseDetail | undefined
}

export function CourseDetailRecommendations({
  courseCode,
  courseDetail,
}: CourseRecommendationProps) {
  const recommendationData = useMemo(() => {
    if (!courseDetail?.dp) {
      return null
    }

    return buildCourseRecommendations(courseDetail.dp, courseCode)
  }, [courseDetail?.dp, courseCode])

  const recommendedCodes = recommendationData?.courseCodes ?? []

  const overviewMap = useQuery(
    recommendedCodes.length > 0
      ? api.courses.listOverviewByCourseCodes
      : undefined,
    recommendedCodes.length > 0
      ? { courseCodes: recommendedCodes }
      : undefined
  )

  const isLoading =
    courseDetail === undefined ||
    (recommendedCodes.length > 0 && overviewMap === undefined)

  if (courseDetail === undefined || isLoading) {
    return (
      <Card hoverInteraction={false}>
        <CardHeader>
          <CardTitle>Course recommendations</CardTitle>
          <CardDescription>
            Building personalized suggestions from DawgPath data&hellip;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!courseDetail?.dp) {
    return null
  }

  const groups = recommendationData?.groups?.filter(groupHasData) ?? []

  if (!groups.length) {
    return (
      <Card hoverInteraction={false}>
        <CardHeader>
          <CardTitle>Course recommendations</CardTitle>
          <CardDescription>
            DawgPath doesn&apos;t list prerequisite or pairing data for this
            course yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <section className="space-y-4">
      {groups.map((group) => {
        const meta = groupMeta[group.id]
        return (
          <Card key={group.id} hoverInteraction={false}>
            <CardHeader>
              <CardTitle>{meta?.title ?? "Related courses"}</CardTitle>
              <CardDescription>{meta?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {group.items.map((item) => {
                const overview = overviewMap?.[item.courseCode]
                const title =
                  overview?.title ?? item.fallbackTitle ?? item.courseCode
                const description = overview?.description
                const badges = deriveBadges(item, courseCode)
                const summaries = new Set<string>()

                item.sources.forEach((source) => {
                  summaries.add(summarizeSource(source, courseCode))
                })

                return (
                  <div
                    key={item.courseCode}
                    className="rounded-lg border border-border bg-card/50 p-4 transition hover:border-primary/50 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          {item.courseCode}
                        </p>
                        <h4 className="text-base font-semibold leading-tight text-foreground">
                          {title}
                        </h4>
                      </div>
                      <Link
                        href={`/courses/${encodeURIComponent(item.courseCode)}`}
                        className={cn(
                          "inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
                        )}
                      >
                        View
                        <ArrowUpRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {badges.map((badge) => (
                        <Badge
                          key={badgeKey(badge)}
                          variant={badge.variant}
                          size="sm"
                        >
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                    {description ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                    {summaries.size > 0 ? (
                      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {Array.from(summaries).map((summary) => (
                          <li key={summary}>• {summary}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
