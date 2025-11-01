# RFP: UC-023 - Add User Progress Store

**Phase:** Phase 5: Insights & Personalization  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Create a user progress store that tracks completed courses and current enrollment, integrating with eligibility checks and requirement tracking to provide personalized planning insights.

## Background

User progress (completed courses, current enrollment) needs to be tracked and integrated with eligibility checking and requirement tracking. This ticket creates a centralized progress store.

**Current State:**
- No user progress tracking
- No integration with eligibility checks
- No sync status tracking

**Target State:**
- `UserProgressState` tracks completed courses, current enrollment
- `markAsCompleted(courseCode, termId)` action
- Completed courses considered in eligibility checks
- Sync status tracking

## Files to Create

- `store/user-progress.store.ts` (new) - Progress store
- `store/course-plan.store.ts` - Integrate with progress store

## Acceptance Criteria

1. **Progress Store**
   - `UserProgressState` type defined
   - Tracks completed courses
   - Tracks current enrollment
   - Persists in localStorage

2. **Completed Courses**
   - `CompletedCourse` type includes: courseCode, termId, grade, credits, completedAt
   - `markAsCompleted(courseCode, termId)` action
   - `removeCompletedCourse(courseCode)` action
   - CRUD operations for completed courses

3. **Current Enrollment**
   - `Enrollment` type includes: courseCode, termId, sessions
   - Track current term enrollment
   - Update on enrollment changes
   - Sync with Canvas (if available)

4. **Eligibility Integration**
   - Completed courses considered in eligibility checks
   - Eligibility checks use progress store
   - Real-time eligibility updates
   - Cached for performance

5. **Sync Status**
   - Sync last attempted timestamp
   - Sync last success timestamp
   - Sync error tracking
   - Sync status display

6. **Testing**
   - Progress tracking accurate
   - Eligibility integration works
   - Sync status tracking works
   - Persistence works correctly

## Implementation Details

### Progress Store

```typescript
type UserProgressState = {
  completedCourses: CompletedCourse[]
  currentEnrollment: Enrollment[]
  syncLastAttempted: number
  syncLastSuccess: number
  syncError: string | null
}

type CompletedCourse = {
  courseCode: string
  termId: string
  grade?: string
  credits: number
  completedAt: number
}

type Enrollment = {
  courseCode: string
  termId: string
  sessions: ScheduleSession[]
}
```

### Store Actions

```typescript
markAsCompleted: (courseCode: string, termId: string, grade?: string) => void
removeCompletedCourse: (courseCode: string) => void
setCurrentEnrollment: (enrollment: Enrollment[]) => void
updateSyncStatus: (status: SyncStatus) => void
```

### Eligibility Integration

```typescript
// In eligibility checks
const completedCourses = useUserProgressStore(state => 
  state.completedCourses.map(c => c.courseCode)
)
const eligibility = checkEligibility(courseCode, completedCourses, graph)
```

## Risks & Dependencies

**Risks:**
- Data consistency
- Sync complexity
- Performance concerns
- Privacy concerns

**Dependencies:** UC-022 (Past Courses Sync Adapter), UC-003 (Extract Prereq Graph Utilities)

## Testing Requirements

- Progress tracking accurate
- Eligibility integration works
- Sync status tracking works
- Persistence works correctly
- Edge cases handled

## Success Metrics

- Progress tracked accurately
- Eligibility checks use progress
- Sync status accurate
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 8 (Personalization & Data Sync)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-023

