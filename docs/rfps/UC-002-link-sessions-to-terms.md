# RFP: UC-002 - Link Sessions to Terms Explicitly

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Refactor `PlannedCourse` to explicitly link sessions to terms via `sessionsByTerm` mapping, enabling multi-term session management and eliminating reliance on implicit "active term" assumptions.

## Background

Currently, sessions are stored in `PlannedCourse.sessions[]` with no explicit term linkage. The system assumes sessions belong to the "active term", which breaks down when managing multiple terms simultaneously.

**Current State:**
- `PlannedCourse.sessions` is a flat array
- Sessions assumed to belong to active term
- Cannot track sessions for different terms simultaneously

**Target State:**
- `PlannedCourse.sessionsByTerm` maps termId → sessions
- Each term can have its own session assignments
- Schedule store reads from term-specific sessions

## Files to Modify

- `store/course-plan.store.ts` - Change `sessions` to `sessionsByTerm`
- `store/schedule.store.ts` - Read from `sessionsByTerm[activeTermId]`
- `lib/schedule-generator.ts` - Use term-specific sessions

## Acceptance Criteria

1. **Data Structure Change**
   - `PlannedCourse.sessions` → `sessionsByTerm: Record<string, ScheduleSession[]>`
   - Type change is backward compatible (migration handles it)

2. **Migration Logic**
   - Migration preserves existing sessions under active term
   - If no active term exists, use first term or default
   - All existing sessions preserved with no data loss

3. **Store Updates**
   - `schedule.store.ts` reads from `sessionsByTerm[activeTermId]`
   - Fallback to empty array if term not found
   - Session operations target specific term

4. **Schedule Generator**
   - `schedule-generator.ts` uses term-specific sessions
   - Variant generation respects term boundaries
   - No cross-term session conflicts

5. **Testing**
   - Migration preserves sessions correctly
   - Session retrieval per term works
   - Multi-term session management functions properly

## Implementation Details

### Type Definition

```typescript
type PlannedCourse = {
  id: string
  courseCode: string
  courseTitle?: string
  credits: number | string
  customCredits?: number
  sessionsByTerm: Record<string, ScheduleSession[]>  // CHANGED from sessions
  notes?: string
  color?: string
  status?: "completed" | "current" | "planned"
}
```

### Migration Strategy

- Increment store version (v3 → v4 if UC-001 done, or v2 → v3 if standalone)
- For each `PlannedCourse`:
  - Extract `sessions` array
  - Create `sessionsByTerm` object
  - Map sessions to `sessionsByTerm[activeTermId]` or first term
  - Remove old `sessions` field

### Schedule Store Changes

```typescript
// In schedule.store.ts
const termSessions = course.sessionsByTerm?.[activeTermId] || []
```

## Risks & Dependencies

**Risks:**
- Migration complexity if many courses exist
- Potential data loss if migration fails
- Breaking changes to components using `sessions` directly

**Dependencies:** 
- UC-001 (if done first, simplifies migration with status field)

## Testing Requirements

- Migration preserves all sessions
- Sessions correctly mapped to terms
- Schedule store reads correct term sessions
- Multi-term scenarios work correctly
- No regressions in schedule generation

## Success Metrics

- Zero data loss during migration
- Sessions correctly associated with terms
- Schedule operations work per term
- Multi-term planning functions correctly

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 3 (Information Architecture)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-002

