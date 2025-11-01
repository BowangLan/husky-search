# RFP: UC-004 - Add Schedule Variant Filters

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add filtering capabilities to schedule variant generation to allow users to customize variant generation based on preferences (no Friday classes, morning-only, credit limits, etc.) and set maximum variant counts.

## Background

The current variant generation algorithm generates ALL valid combinations without filters or limits, leading to exponential explosion for many courses. Users need ways to filter variants based on preferences and limit the number of variants generated.

**Current State:**
- `generateScheduleVariants()` generates all variants
- No filtering options
- No maximum variant limit
- Exponential complexity for 5+ courses

**Target State:**
- `generateScheduleVariants()` accepts `filters?: ScheduleFilters`
- Filters: `maxVariants`, `excludeDays`, `timeRange`, `maxCredits`
- UI filter panel in generated schedules panel
- Variants filtered before generation completes

## Files to Modify

- `lib/schedule-generator.ts` - Add filter options to generation function
- `components/schedule/use-schedule-generation.tsx` - Pass filters to generator
- `components/schedule/generated-schedules-panel.tsx` - Add filter UI

## Acceptance Criteria

1. **Filter Options**
   - `generateScheduleVariants` accepts `filters?: ScheduleFilters`
   - Filter types: `maxVariants`, `excludeDays`, `timeRange`, `maxCredits`
   - Filters applied during generation (not post-filtering)

2. **Max Variants Filter**
   - Limits total number of variants generated
   - Early termination when limit reached
   - Prevents exponential explosion

3. **Day Exclusion Filter**
   - `excludeDays: string[]` (e.g., `["F"]` for no Friday)
   - Variants containing excluded days are filtered out
   - Works with multi-day sessions

4. **Time Range Filter**
   - `timeRange: { start: number, end: number }` (minutes from midnight)
   - Only variants with sessions within time range included
   - Handles sessions spanning multiple days

5. **Credit Limit Filter**
   - `maxCredits: number` limits total credits per variant
   - Variants exceeding limit are filtered out
   - Uses `customCredits` if available

6. **UI Filter Panel**
   - Filter controls in `generated-schedules-panel.tsx`
   - Filters persist in localStorage
   - Clear visual feedback when filters applied

7. **Testing**
   - Unit tests for each filter type
   - Integration tests for filter combination
   - Performance tests for filter application

## Implementation Details

### Type Definition

```typescript
type ScheduleFilters = {
  maxVariants?: number
  excludeDays?: string[]          // ["F", "M"]
  timeRange?: { start: number, end: number }  // minutes from midnight
  maxCredits?: number
}

export function generateScheduleVariants(
  scheduledCourses: ScheduleCourse[],
  coursesWithSessions: CourseWithSessions[],
  filters?: ScheduleFilters
): GeneratedVariant[]
```

### Filter Implementation

- Apply filters during backtracking (early termination)
- `maxVariants`: Stop generating when limit reached
- `excludeDays`: Check session meeting days before adding to variant
- `timeRange`: Validate session times before adding
- `maxCredits`: Calculate credits as variant builds

### UI Components

- Filter panel with toggle switches and inputs
- Filter indicators showing active filters
- "Clear filters" button
- Filter persistence in localStorage

## Risks & Dependencies

**Risks:**
- Filter complexity may slow generation
- UI needs to be intuitive
- Filter combinations may be confusing

**Dependencies:** None

## Testing Requirements

- Each filter works correctly
- Filter combinations work together
- Performance acceptable with filters
- UI is intuitive and responsive
- Filters persist correctly

## Success Metrics

- Users can filter variants successfully
- Generation time improves with filters
- UI is clear and easy to use
- No regressions in variant generation

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.6 (Schedule Variant Generation)
- See `docs/UX_Grounding_Report.md` Section 4 (Scheduling Engine Deep Dive)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-004
- See `docs/SCHEDULE_GENERATION_ISSUES.md` for known issues

