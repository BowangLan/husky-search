import { DawgpathCourseDetail } from "@/convex/dawgpath"

export type RecommendationGroupId =
  | "preparation"
  | "corequisites"
  | "pairs"
  | "followOn"

export type RecommendationGroup = {
  id: RecommendationGroupId
  items: CourseRecommendationItem[]
}

export type GraphRecommendationSource = {
  type: "graph"
  relation: "incoming" | "outgoing"
  allowsConcurrency: boolean
  rawAndOr?: string | null
  groupNumber?: number
  sequenceNumber?: number
  minGrade?: string | null
}

export type ConcurrentRecommendationSource = {
  type: "concurrentPair"
  percent?: number | null
  coiScore?: number | null
  isGateway: boolean
  isBottleneck: boolean
  title?: string
}

export type RecommendationSource =
  | GraphRecommendationSource
  | ConcurrentRecommendationSource

export type CourseRecommendationItem = {
  courseCode: string
  fallbackTitle?: string
  score: number
  sources: RecommendationSource[]
}

export type CourseRecommendationResult = {
  groups: RecommendationGroup[]
  courseCodes: string[]
}

type NodeInfo = {
  courseCode: string
  title?: string
  level?: number
}

const groupOrder: RecommendationGroupId[] = [
  "preparation",
  "corequisites",
  "pairs",
  "followOn",
]

const andOrScoreAdjustment = (value?: string | null) => {
  const trimmed = value?.trim().toUpperCase()
  if (trimmed === "O") {
    return -0.25
  }
  if (trimmed === "A") {
    return 0.05
  }
  return 0
}

const clampScore = (value: number) => {
  if (Number.isNaN(value)) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  if (value < 0) {
    return 0
  }
  return value
}

const computeGraphScore = ({
  base,
  andOr,
}: {
  base: number
  andOr?: string | null
}) => clampScore(base + andOrScoreAdjustment(andOr))

const computeConcurrentScore = (percent?: number | null) => {
  if (percent === null || percent === undefined) {
    return 0.55
  }
  return clampScore(0.45 + Math.min(percent, 0.55))
}

const buildNodeInfoMap = (
  nodes?: DawgpathCourseDetail["prereq_graph"]["x"]["nodes"]
) => {
  const map = new Map<string, NodeInfo>()
  if (!nodes) {
    return map
  }

  const departments = nodes.department_abbrev ?? {}
  const numbers = nodes.course_number ?? {}
  const titles = nodes.course_title ?? {}
  const levels = nodes["course.level"] ?? {}

  Object.keys(numbers).forEach((nodeId) => {
    const dept = departments?.[nodeId]
    const num = numbers?.[nodeId]
    if (!dept || num === undefined || num === null) {
      return
    }

    const normalizedNumber =
      typeof num === "number"
        ? Number.isInteger(num)
          ? `${num}`
          : `${num}`.replace(/\.0+$/, "")
        : `${num}`

    const code = `${dept} ${normalizedNumber}`.trim()
    if (!code) {
      return
    }

    if (!map.has(code)) {
      map.set(code, {
        courseCode: code,
        title: titles?.[nodeId] ?? undefined,
        level: typeof levels?.[nodeId] === "number" ? levels?.[nodeId] : undefined,
      })
    }
  })

  return map
}

export const buildCourseRecommendations = (
  detail: DawgpathCourseDetail | null | undefined,
  currentCourseCode: string
): CourseRecommendationResult => {
  const groupMaps: Record<
    RecommendationGroupId,
    Map<string, CourseRecommendationItem>
  > = {
    preparation: new Map(),
    corequisites: new Map(),
    pairs: new Map(),
    followOn: new Map(),
  }

  if (!detail) {
    return { groups: [], courseCodes: [] }
  }

  const nodeInfoMap = buildNodeInfoMap(detail.prereq_graph?.x?.nodes)

  const addToGroup = (
    groupId: RecommendationGroupId,
    courseCode: string,
    source: RecommendationSource,
    score: number,
    fallbackTitle?: string
  ) => {
    if (!courseCode || courseCode === currentCourseCode) {
      return
    }

    const map = groupMaps[groupId]
    const existing = map.get(courseCode)
    if (existing) {
      existing.sources.push(source)
      existing.score = Math.max(existing.score, score)
      if (!existing.fallbackTitle && fallbackTitle) {
        existing.fallbackTitle = fallbackTitle
      }
      return
    }

    map.set(courseCode, {
      courseCode,
      fallbackTitle:
        fallbackTitle ?? nodeInfoMap.get(courseCode)?.title ?? undefined,
      score,
      sources: [source],
    })
  }

  const edges = detail.prereq_graph?.x?.edges
  if (edges?.from && edges.to) {
    Object.keys(edges.from).forEach((edgeId) => {
      const fromCourse = edges.from?.[edgeId]
      const toCourse = edges.to?.[edgeId]
      if (!fromCourse || !toCourse) {
        return
      }

      const rawAndOr = edges.pr_and_or?.[edgeId]
      const allowsConcurrency = edges.pr_concurrency?.[edgeId] === "Y"
      const groupNumber = edges.pr_group_no?.[edgeId]
      const sequenceNumber = edges.pr_seq_no?.[edgeId]
      const minGrade = edges.pr_grade_min?.[edgeId]

      if (toCourse === currentCourseCode) {
        const graphSource: GraphRecommendationSource = {
          type: "graph",
          relation: "incoming",
          allowsConcurrency,
          rawAndOr,
          groupNumber,
          sequenceNumber,
          minGrade,
        }

        const targetGroup: RecommendationGroupId = allowsConcurrency
          ? "corequisites"
          : "preparation"

        addToGroup(
          targetGroup,
          fromCourse,
          graphSource,
          computeGraphScore({
            base: allowsConcurrency ? 0.85 : 0.95,
            andOr: rawAndOr,
          }),
          nodeInfoMap.get(fromCourse)?.title
        )
        return
      }

      if (fromCourse === currentCourseCode) {
        const graphSource: GraphRecommendationSource = {
          type: "graph",
          relation: "outgoing",
          allowsConcurrency,
          rawAndOr,
          groupNumber,
          sequenceNumber,
          minGrade,
        }

        addToGroup(
          "followOn",
          toCourse,
          graphSource,
          computeGraphScore({
            base: 0.65,
            andOr: rawAndOr,
          }),
          nodeInfoMap.get(toCourse)?.title
        )
      }
    })
  }

  if (detail.concurrent_courses) {
    Object.entries(detail.concurrent_courses).forEach(([code, data]) => {
      if (!code) {
        return
      }

      const concurrentSource: ConcurrentRecommendationSource = {
        type: "concurrentPair",
        percent: data.percent,
        coiScore: data.coi_score,
        isGateway: data.is_gateway,
        isBottleneck: data.is_bottleneck,
        title: data.title,
      }

      addToGroup(
        "pairs",
        code,
        concurrentSource,
        computeConcurrentScore(data.percent),
        data.title
      )
    })
  }

  const groups = groupOrder
    .map((id) => {
      const items = Array.from(groupMaps[id].values()).sort(
        (a, b) => b.score - a.score
      )
      if (items.length === 0) {
        return null
      }

      return {
        id,
        items,
      }
    })
    .filter((group): group is RecommendationGroup => group !== null)

  const courseCodes = new Set<string>()
  groups.forEach((group) => {
    group.items.forEach((item) => courseCodes.add(item.courseCode))
  })

  return {
    groups,
    courseCodes: Array.from(courseCodes),
  }
}
