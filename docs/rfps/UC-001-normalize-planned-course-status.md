# RFP: UC-001 - Normalize PlannedCourse Status Derivation

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Derive course status from term metadata so the planning UI can distinguish between completed, current, and planned courses without persisting an explicit status flag. This enables the system to visualize past progress while keeping course data normalized.

## Background

Currently, all courses in the plan are treated equally with no distinction between past, current, and future courses. While Convex stores an ordered list of active term ids, the UI does not consume this metadata to highlight course progress.

**Current State:**
- `PlannedCourse` type has no derived status helper
- All courses treated equally regardless of term ordering
- No visual distinction for completed courses
- Convex plan documents expose `activeTermIds` that identify the in-progress term(s)

**Target State:**
- Status is derived by comparing a course's term with the active term window
- Course cards display status badges
- UI recalculates status as term data changes, no per-course overrides needed

## Files to Modify

- `store/course-plan.store.ts` (or equivalent) - Ensure active term ids and course term metadata are available to consumers
- `lib/plan/get-course-status.ts` (new helper) - Derive status from course term relative to active terms
- `components/pages/plan/planned-course-card.tsx` - Display derived status badge
- `components/pages/plan/term-card.tsx` - Surface visual indicators that leverage derived status

## Acceptance Criteria

1. **Status Derivation**
   - A shared helper derives `"completed" | "current" | "planned"` using course term order and `activeTermIds`
   - Helper handles plans with one or two active terms

2. **Data Availability**
   - Client state exposes the active term ids and term ordering necessary for derivation
   - No additional persistence or migration is required

3. **UI Display**
   - Course cards display status badge (visual indicator)
   - Badge colors: green (completed), blue (current), gray (planned)
   - Badge is visible but not intrusive

4. **Status Reactivity**
   - Derived status updates automatically when active term ids change
   - Local state persists the minimal data necessary (no explicit status override)

5. **Testing**
   - Unit tests for status derivation helper (including plans with dual active terms)
   - Integration tests for status badge display

## Implementation Details

### Status Derivation Helper

- Accepts course term identifier and the ordered term catalog
- Receives `activeTermIds` (one or two terms in progress)
- Returns `"completed"` when course term precedes the first active term, `"current"` when it matches one of the active terms, otherwise `"planned"`
- Handles missing or unknown terms gracefully by defaulting to `"planned"`

### UI Components

- Status badge component: Small colored badge with icon
- Term and card components call the helper to select styles
- Visual indicators: Different styling for each status

## Risks & Dependencies

**Risks:** None

**Dependencies:** None

## Testing Requirements

- Status derivation handles edge cases (dual active terms, missing term metadata)
- UI displays status badges correctly
- Active term changes propagate to the UI correctly
- No breaking changes to existing functionality

## Success Metrics

- Status derivation works for all courses without additional persistence
- Status badges display correctly on course cards
- Users see accurate progress indicators without manual status maintenance
- Zero data loss or regressions in stored plan data

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 3 (Information Architecture)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-001

