# RFP: UC-014 - Add Conflict Resolution Panel

**Phase:** Phase 3: Smart Schedule Simulation  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add a conflict resolution panel that suggests alternative sessions when conflicts are detected, enabling users to quickly resolve scheduling conflicts without manual trial and error.

## Background

Currently, conflicts are detected but users must manually find alternatives. This ticket adds automatic alternative suggestions and a UI for resolving conflicts.

**Current State:**
- Conflicts detected via toast notifications
- No alternative suggestions
- Manual conflict resolution required

**Target State:**
- Conflict resolution panel shows alternatives
- Automatic alternative finding
- Visual conflict overlay on calendar
- One-click conflict resolution

## Files to Create

- `components/schedule/conflict-resolution-panel.tsx` (new) - Resolution UI
- `lib/schedule-generator.ts` - Add `findAlternativeSessions` function

## Acceptance Criteria

1. **Alternative Finding**
   - `findAlternativeSessions(courseCode, conflictSession)` returns alternatives
   - Finds sessions without conflicts
   - Considers time preferences
   - Returns top alternatives

2. **Conflict Panel**
   - Panel shows: conflicting sessions, alternative sessions, "switch" buttons
   - Clear conflict explanation
   - Visual conflict indicators
   - Easy to understand

3. **Visual Overlay**
   - Conflict overlay on calendar
   - Highlighted conflicting sessions
   - Color coding for conflicts
   - Click to open resolution panel

4. **Resolution Actions**
   - "Switch to [Session]" buttons
   - One-click session replacement
   - Undo resolution action
   - Multiple conflict resolution

5. **Integration**
   - Panel opens on conflict detection
   - Panel opens on conflict click
   - Panel integrates with schedule store
   - Smooth resolution flow

6. **Testing**
   - Alternative finding accurate
   - Conflict display correct
   - Resolution actions work
   - Visual overlay functions

## Implementation Details

### Alternative Finding

```typescript
function findAlternativeSessions(
  courseCode: string,
  conflictSession: ScheduleSession,
  currentSchedule: ScheduleCourse[],
  availableSessions: ScheduleSession[]
): ScheduleSession[] {
  // Find sessions without conflicts
  // Consider time preferences
  // Return top alternatives
}
```

### Conflict Panel

```tsx
<ConflictResolutionPanel conflict={conflict}>
  <ConflictExplanation conflict={conflict} />
  <ConflictingSessions sessions={conflict.sessions} />
  <AlternativeSessions 
    alternatives={alternatives}
    onSwitch={(session) => switchSession(session)}
  />
</ConflictResolutionPanel>
```

### Visual Overlay

- Red highlight for conflicts
- Tooltip on hover
- Click to open panel
- Animated highlighting

## Risks & Dependencies

**Risks:**
- Alternative finding complexity
- UI complexity
- Performance concerns
- User confusion

**Dependencies:** UC-005 (Variant Memoization)

## Testing Requirements

- Alternative finding accurate
- Conflict display correct
- Resolution actions work
- Visual overlay functions
- Edge cases handled

## Success Metrics

- Conflicts resolved quickly
- Alternative suggestions helpful
- Visual overlay clear
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.3 (Session Picker & Scheduling)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-014

