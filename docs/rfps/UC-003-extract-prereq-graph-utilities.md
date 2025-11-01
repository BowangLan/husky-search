# RFP: UC-003 - Extract Prerequisite Graph Utilities

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Extract prerequisite graph utilities from raw DawgPath data into a reusable utility module that provides eligibility checking, prerequisite chain building, and graph traversal functionality.

## Background

Prerequisite data exists in `convex/dawgpath.ts` but is not normalized or easily usable. The system needs utilities to check course eligibility, build prerequisite chains, and traverse the prerequisite graph.

**Current State:**
- Prerequisites stored as string arrays in `MyplanCourse.prereqs`
- DawgPath graph data exists but unused
- No eligibility checking logic
- No prerequisite visualization

**Target State:**
- Normalized prerequisite graph utilities
- `checkEligibility()` function
- `buildPrereqChain()` function
- Graph data cached and reusable

## Files to Create/Modify

- `lib/prereq-utils.ts` (new) - Core utility functions
- `convex/dawgpath.ts` - Reference for data structure

## Acceptance Criteria

1. **Graph Building**
   - `buildPrereqGraph(dawgpathData)` returns normalized graph structure
   - Graph is efficiently structured for traversal
   - Handles edge cases (missing data, circular dependencies)

2. **Eligibility Checking**
   - `checkEligibility(courseCode, completedCourses, graph)` returns `EligibilityResult`
   - Returns: `eligible`, `blockedBy`, `missingPrereqs`, `canTakeConcurrently`
   - Handles AND/OR prerequisite logic
   - Handles concurrent course rules

3. **Prerequisite Chain Building**
   - `buildPrereqChain(courseCode, graph)` returns prerequisite paths
   - Returns directed graph structure for visualization
   - Handles multiple prerequisite paths

4. **Type Definitions**
   - `EligibilityResult` type exported
   - `PrereqGraph` type exported
   - `PrereqChain` type exported

5. **Testing**
   - Unit tests for eligibility logic
   - Unit tests for graph traversal
   - Edge cases: circular deps, missing courses, OR logic

## Implementation Details

### Type Definitions

```typescript
type EligibilityResult = {
  courseCode: string
  eligible: boolean
  blockedBy: string[]
  missingPrereqs: string[]
  canTakeConcurrently: boolean
}

type PrereqGraph = {
  edges: {
    from: Record<string, string>
    to: Record<string, string>
    pr_and_or: Record<string, string>
    pr_concurrency: Record<string, string>
    pr_grade_min: Record<string, string>
  }
  nodes: Record<string, CourseNode>
}

type PrereqChain = {
  courseCode: string
  paths: PrereqPath[]
}

type PrereqPath = {
  courses: string[]
  allRequired: boolean  // true if AND, false if OR
}
```

### Core Functions

```typescript
export function buildPrereqGraph(dawgpathData: any): PrereqGraph {
  // Normalize DawgPath data into traversable graph
}

export function checkEligibility(
  courseCode: string,
  completedCourses: string[],
  graph: PrereqGraph
): EligibilityResult {
  // Traverse graph backwards from courseCode
  // Check if all prerequisites met
  // Return eligibility status
}

export function buildPrereqChain(
  courseCode: string,
  graph: PrereqGraph
): PrereqChain {
  // BFS from courseCode to find all prerequisite paths
  // Return directed graph structure
}
```

## Risks & Dependencies

**Risks:**
- Complex prerequisite logic (AND/OR, concurrent rules)
- Performance concerns with large graphs
- Data quality issues in DawgPath data

**Dependencies:** None

## Testing Requirements

- Eligibility checking accuracy
- Graph traversal correctness
- Edge cases handled properly
- Performance acceptable for large graphs
- Type safety maintained

## Success Metrics

- Eligibility checking is accurate
- Prerequisite chains build correctly
- Graph utilities reusable across codebase
- Performance acceptable (< 100ms for typical queries)

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.8 (Prerequisite & Concurrent Data)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-003
- See `convex/dawgpath.ts` for data structure reference

