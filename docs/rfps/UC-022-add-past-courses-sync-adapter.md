# RFP: UC-022 - Add Past Courses Sync Adapter

**Phase:** Phase 5: Insights & Personalization  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Create an adapter interface for syncing past courses from external sources (Canvas API, manual entry), enabling users to import their completed courses for eligibility checking and requirement tracking.

## Background

Users need to track completed courses for eligibility checking. This ticket provides a flexible adapter system for importing past courses from various sources.

**Current State:**
- No past course sync
- No Canvas integration
- Manual entry only

**Target State:**
- `PastCoursesAdapter` interface
- `ManualPastCoursesAdapter` implementation
- `CanvasPastCoursesAdapter` stub (if Canvas API available)
- "Sync from Canvas" button (if authenticated)

## Files to Create

- `lib/adapters/past-courses-adapter.ts` (new) - Adapter interface and implementations
- `store/user-progress.store.ts` (new) - Use adapter for sync

## Acceptance Criteria

1. **Adapter Interface**
   - `PastCoursesAdapter` interface defined
   - `fetchCompletedCourses(userId)` method
   - `fetchCurrentEnrollment(userId)` method
   - Extensible for future adapters

2. **Manual Adapter**
   - `ManualPastCoursesAdapter` implementation
   - Stores completed courses in localStorage
   - Manual entry UI
   - CRUD operations for courses

3. **Canvas Adapter**
   - `CanvasPastCoursesAdapter` stub (if Canvas API available)
   - OAuth flow (if applicable)
   - API integration (if available)
   - Error handling

4. **Sync Button**
   - "Sync from Canvas" button (if authenticated)
   - Loading states
   - Success/error feedback
   - Sync status tracking

5. **Data Mapping**
   - Map external data to `CompletedCourse` format
   - Handle data inconsistencies
   - Validate imported data
   - Error handling

6. **Testing**
   - Adapter interface works
   - Manual adapter functions
   - Canvas adapter stub works
   - Error handling works

## Implementation Details

### Adapter Interface

```typescript
export interface PastCoursesAdapter {
  fetchCompletedCourses(userId: string): Promise<CompletedCourse[]>
  fetchCurrentEnrollment(userId: string): Promise<Enrollment[]>
}

export class ManualPastCoursesAdapter implements PastCoursesAdapter {
  async fetchCompletedCourses(userId: string): Promise<CompletedCourse[]> {
    // Return from localStorage
  }
}

export class CanvasPastCoursesAdapter implements PastCoursesAdapter {
  async fetchCompletedCourses(userId: string): Promise<CompletedCourse[]> {
    // Call Canvas API (if available)
    // Map to CompletedCourse format
  }
}
```

### Sync Component

```tsx
<SyncPastCoursesButton 
  adapter={canvasAdapter}
  onSync={handleSync}
/>
```

## Risks & Dependencies

**Risks:**
- Canvas API availability
- OAuth complexity
- Data mapping issues
- Privacy concerns

**Dependencies:** None

## Testing Requirements

- Adapter interface works
- Manual adapter functions
- Canvas adapter stub works
- Error handling works
- Data mapping accurate

## Success Metrics

- Adapter system extensible
- Manual sync works
- Canvas sync works (if available)
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 8 (Personalization & Data Sync)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-022
- See `docs/UX_Grounding_Report.md` Section 11, Q1 (Canvas API Integration)

