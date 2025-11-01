# RFP: UC-012 - Add Variant Comparison View

**Phase:** Phase 3: Smart Schedule Simulation  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add a side-by-side comparison view for schedule variants, enabling users to visually compare multiple schedule options and see differences at a glance.

## Background

Users need to compare multiple schedule variants to make decisions. Currently, variants must be viewed individually, making comparison difficult.

**Current State:**
- Variants viewed individually
- No comparison functionality
- Difficult to see differences

**Target State:**
- Side-by-side variant comparison
- Highlights differences between variants
- Shows courses added/removed
- Shows session changes
- Shows time differences

## Files to Create

- `components/schedule/variant-comparison-panel.tsx` (new) - Comparison UI
- `lib/schedule-generator.ts` - Add `compareVariants` function

## Acceptance Criteria

1. **Comparison Function**
   - `compareVariants(variant1, variant2)` returns `VariantDiff`
   - Diff includes: courses added/removed, sessions changed, time differences
   - Accurate diff computation
   - Handles edge cases

2. **Side-by-Side UI**
   - Two variants displayed side-by-side
   - Calendar views aligned
   - Synchronized scrolling
   - Responsive layout

3. **Difference Highlighting**
   - Differences highlighted visually
   - Color coding for changes
   - Clear visual indicators
   - Tooltips explain differences

4. **Comparison Metrics**
   - Total credits comparison
   - Total days comparison
   - Time distribution comparison
   - Conflict count comparison

5. **Multi-Variant Support**
   - Compare 2-3 variants simultaneously
   - Tab-based or grid layout
   - Easy variant selection
   - Clear navigation

6. **Testing**
   - Diff computation accurate
   - UI renders correctly
   - Differences highlighted correctly
   - Performance acceptable

## Implementation Details

### Diff Type

```typescript
type VariantDiff = {
  coursesAdded: string[]
  coursesRemoved: string[]
  sessionsChanged: {
    courseCode: string
    oldSession: ScheduleSession
    newSession: ScheduleSession
  }[]
  timeDifferences: {
    courseCode: string
    oldTime: string
    newTime: string
  }[]
  metrics: {
    creditsDiff: number
    daysDiff: number
    conflictsDiff: number
  }
}

function compareVariants(v1: GeneratedVariant, v2: GeneratedVariant): VariantDiff {
  // Compute differences
}
```

### UI Layout

```tsx
<VariantComparisonPanel variants={[variant1, variant2]}>
  <VariantCalendar variant={variant1} />
  <VariantCalendar variant={variant2} />
  <DiffHighlights diff={diff} />
</VariantComparisonPanel>
```

## Risks & Dependencies

**Risks:**
- Diff computation complexity
- UI complexity
- Performance with large variants
- Visual clutter

**Dependencies:** UC-011 (Variant Saving)

## Testing Requirements

- Diff computation accurate
- UI renders correctly
- Differences highlighted
- Performance acceptable
- Edge cases handled

## Success Metrics

- Diff computation accurate
- Comparison UI clear and intuitive
- Performance acceptable
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.6 (Schedule Variant Generation)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-012

