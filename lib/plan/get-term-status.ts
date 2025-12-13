import { Term, Quarter } from "@/store/course-plan.store"

export type TermStatus = "completed" | "active" | "planned"

const quarterOrder: Record<Quarter, number> = {
  Winter: 1,
  Spring: 2,
  Summer: 3,
  Autumn: 4,
}

/**
 * Derives term status from term data and active term IDs
 */
export function getTermStatus(
  term: Term,
  activeTermIds: string[],
  allTerms: Term[]
): TermStatus {
  // Check if term is active
  if (activeTermIds.includes(term.id)) {
    return "active"
  }

  // Find the earliest active term
  const activeTerms = allTerms.filter((t) => activeTermIds.includes(t.id))
  if (activeTerms.length === 0) {
    // No active terms set - treat all as planned
    return "planned"
  }

  // Sort active terms chronologically
  const sortedActiveTerms = activeTerms.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return quarterOrder[a.quarter] - quarterOrder[b.quarter]
  })

  const earliestActiveTerm = sortedActiveTerms[0]

  // Compare this term with the earliest active term
  const thisTermOrder = term.year * 10 + quarterOrder[term.quarter]
  const earliestActiveTermOrder =
    earliestActiveTerm.year * 10 + quarterOrder[earliestActiveTerm.quarter]

  if (thisTermOrder < earliestActiveTermOrder) {
    return "completed"
  }

  return "planned"
}
