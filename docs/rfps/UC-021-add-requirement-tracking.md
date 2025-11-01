# RFP: UC-021 - Add Requirement Tracking

**Phase:** Phase 5: Insights & Personalization  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add requirement tracking system to monitor degree requirements (gen ed, major requirements) and provide coverage insights and warnings when requirements are not met.

## Background

Users need to track whether their planned courses meet degree requirements. This ticket adds requirement tracking and coverage computation.

**Current State:**
- Gen ed shown on courses
- No requirement tracking
- No coverage computation
- No requirement warnings

**Target State:**
- Track gen ed requirements per term
- Track major requirements (if available)
- Compute requirement coverage percentage
- Warning if requirements not met

## Files to Create

- `store/requirements.store.ts` (new) - Requirement state
- `lib/warnings-engine.ts` - Add requirement gap rule

## Acceptance Criteria

1. **Requirement Store**
   - `requirements.store.ts` tracks requirements
   - Stores gen ed requirements
   - Stores major requirements (if available)
   - Persists in localStorage

2. **Requirement Types**
   - Gen ed requirements (VLPA, I&S, etc.)
   - Major requirements (if available)
   - Elective requirements
   - Credit requirements

3. **Coverage Computation**
   - `computeRequirementCoverage(termPlan)` returns coverage %
   - Tracks which requirements are met
   - Tracks which requirements are missing
   - Shows progress toward completion

4. **Requirement Warnings**
   - Warning if requirements not met
   - Warning if requirements exceeded
   - Warning if requirements duplicated
   - Actionable suggestions

5. **UI Display**
   - Requirement progress indicators
   - Coverage percentage display
   - Missing requirements list
   - Requirement badges on courses

6. **Testing**
   - Requirement tracking accurate
   - Coverage computation correct
   - Warnings accurate
   - Edge cases handled

## Implementation Details

### Requirement Store

```typescript
type RequirementState = {
  genEdRequirements: GenEdRequirement[]
  majorRequirements: MajorRequirement[]
  completedRequirements: string[]
}

type GenEdRequirement = {
  id: string
  name: string
  category: "VLPA" | "I&S" | "NW" | "QSR"
  credits: number
  courses: string[]
}

type MajorRequirement = {
  id: string
  name: string
  category: string
  credits: number
  courses: string[]
}
```

### Coverage Computation

```typescript
function computeRequirementCoverage(
  termPlan: TermPlan,
  requirements: RequirementState
): CoverageResult {
  // Check which requirements are met
  // Compute coverage percentage
  // Return missing requirements
}
```

### Integration

- Use in warnings engine
- Display in UI
- Update on course changes
- Persist in localStorage

## Risks & Dependencies

**Risks:**
- Requirement data availability
- Complex requirement logic
- Performance concerns
- Data accuracy

**Dependencies:** UC-020 (Warnings Engine)

## Testing Requirements

- Requirement tracking accurate
- Coverage computation correct
- Warnings accurate
- Edge cases handled
- Performance acceptable

## Success Metrics

- Requirements tracked accurately
- Coverage computation correct
- Warnings helpful
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 7 (Smart Warnings & Insights)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-021
- See `convex/myplan.ts` for requirement data availability

