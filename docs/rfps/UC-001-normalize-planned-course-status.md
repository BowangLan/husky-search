# RFP: UC-001 - Normalize PlannedCourse with Status Field

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add status tracking to `PlannedCourse` entities to distinguish between completed, current, and planned courses. This enables the system to visualize past progress and distinguish between different course states in the planning UI.

## Background

Currently, all courses in the plan are treated equally with no distinction between past, current, and future courses. This prevents users from seeing their academic progress and makes it difficult to track completion status.

**Current State:**
- `PlannedCourse` type has no status field
- All courses treated equally regardless of term
- No visual distinction for completed courses

**Target State:**
- `PlannedCourse` includes `status?: "completed" | "current" | "planned"`
- Course cards display status badges
- Status can be updated via UI

## Files to Modify

- `store/course-plan.store.ts` - Extend `PlannedCourse` type, add migration logic
- `components/pages/plan/planned-course-card.tsx` - Display status badge
- `components/pages/plan/term-card.tsx` - Show status indicators

## Acceptance Criteria

1. **Type Extension**
   - `PlannedCourse` type includes `status?: "completed" | "current" | "planned"`
   - Type is properly exported and used throughout codebase

2. **Migration Logic**
   - Migration from v2 to v3 handles existing courses
   - Default all existing courses to `status: "planned"`
   - Migration preserves all existing course data

3. **UI Display**
   - Course cards display status badge (visual indicator)
   - Badge colors: green (completed), blue (current), gray (planned)
   - Badge is visible but not intrusive

4. **Status Updates**
   - Status can be updated via dropdown menu on course card
   - Updates persist to localStorage
   - Status changes trigger UI updates

5. **Testing**
   - Unit tests for migration logic
   - Unit tests for status update actions
   - Integration tests for status badge display

## Implementation Details

### Type Definition

```typescript
type PlannedCourse = {
  id: string
  courseCode: string
  courseTitle?: string
  credits: number | string
  customCredits?: number
  sessions: ScheduleSession[]
  notes?: string
  color?: string
  status?: "completed" | "current" | "planned"  // NEW
}
```

### Migration Strategy

- Increment store version from v2 to v3
- In migration function, iterate through all courses
- Set `status: "planned"` for all existing courses
- Preserve all other fields unchanged

### UI Components

- Status badge component: Small colored badge with icon
- Status dropdown: Menu item to change status
- Visual indicators: Different styling for each status

## Risks & Dependencies

**Risks:** None

**Dependencies:** None

## Testing Requirements

- Migration preserves existing data
- Status updates persist correctly
- UI displays status badges correctly
- Status dropdown functions properly
- No breaking changes to existing functionality

## Success Metrics

- All existing courses migrate successfully
- Status badges display correctly on course cards
- Users can update course status via UI
- Zero data loss during migration

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 3 (Information Architecture)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-001

