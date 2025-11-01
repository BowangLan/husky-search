# RFP: UC-020 - Implement Warnings Engine

**Phase:** Phase 5: Insights & Personalization  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Implement a comprehensive warnings engine that checks for credit limits, missing prerequisites, requirement gaps, and conflicts, providing proactive warnings to help users build valid schedules.

## Background

Currently, warnings are limited to time conflicts. A comprehensive warnings engine provides proactive guidance for common planning issues.

**Current State:**
- Time conflict toasts only
- No credit limit warnings
- No requirement coverage warnings
- Reactive rather than proactive

**Target State:**
- Comprehensive warnings engine
- Credit limit warnings
- Missing prerequisite warnings
- Requirement gap warnings
- Conflict warnings
- Warnings panel display

## Files to Create

- `lib/warnings-engine.ts` (new) - Core warnings logic
- `components/pages/plan/warnings-panel.tsx` (new) - Warnings display

## Acceptance Criteria

1. **Warnings Engine**
   - `computeWarnings(context)` returns `Warning[]`
   - Rule-based warning system
   - Extensible rule architecture
   - Efficient computation

2. **Warning Rules**
   - Credit limit rule (UW max: 18 credits)
   - Missing prerequisite rule
   - Requirement gap rule
   - Conflict rule (existing)
   - Additional rules as needed

3. **Warning Types**
   - Error: Blocks schedule (credit limit, missing prereq)
   - Warning: Should fix (requirement gaps)
   - Info: Helpful information

4. **Warnings Panel**
   - Panel displays all warnings for active term
   - Warnings grouped by type
   - Clear warning messages
   - Actionable suggestions

5. **Warning Badges**
   - Warning badges on term cards
   - Badge count shows warning count
   - Color coding by severity
   - Click to open warnings panel

6. **Testing**
   - Warning computation accurate
   - Warnings display correctly
   - Edge cases handled
   - Performance acceptable

## Implementation Details

### Warning Types

```typescript
type Warning = {
  id: string
  type: "credit-limit" | "missing-prereq" | "requirement-gap" | "conflict"
  severity: "error" | "warning" | "info"
  message: string
  courseCode?: string
  termId?: string
  actions?: Action[]
}

type WarningContext = {
  termPlan: TermPlan
  completedCourses: string[]
  prereqGraph: PrereqGraph
  courseData: Map<string, MyplanCourse>
}
```

### Rule System

```typescript
type WarningRule = {
  id: string
  check: (context: WarningContext) => Warning | null
  severity: "error" | "warning" | "info"
}

const warningRules: WarningRule[] = [
  creditLimitRule,
  missingPrereqRule,
  requirementGapRule,
  conflictRule,
]
```

### Warnings Panel

```tsx
<WarningsPanel warnings={warnings}>
  {warnings.map(warning => (
    <WarningCard key={warning.id} warning={warning} />
  ))}
</WarningsPanel>
```

## Risks & Dependencies

**Risks:**
- Rule complexity
- Performance with many courses
- False positive warnings
- User annoyance

**Dependencies:** UC-003 (Extract Prereq Graph Utilities)

## Testing Requirements

- Warning computation accurate
- Warnings display correctly
- Edge cases handled
- Performance acceptable
- User feedback positive

## Success Metrics

- Warnings accurate and helpful
- Users fix issues proactively
- Performance acceptable
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 7 (Smart Warnings & Insights)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-020

