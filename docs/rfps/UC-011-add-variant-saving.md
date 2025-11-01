# RFP: UC-011 - Add Variant Saving

**Phase:** Phase 3: Smart Schedule Simulation  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add the ability to save generated schedule variants with custom names, enabling users to save multiple schedule options and compare them later.

## Background

Users can generate multiple schedule variants but cannot save them for later comparison. This ticket adds variant persistence to localStorage with naming and management capabilities.

**Current State:**
- Variants generated but not saved
- No way to name variants
- Variants lost on page refresh

**Target State:**
- Variants can be saved with custom names
- Saved variants persist in localStorage
- Variants can be loaded, renamed, and deleted
- Variant list shows saved variants

## Files to Modify

- `store/schedule.store.ts` - Add variant saving/loading actions
- `components/schedule/generated-schedules-panel.tsx` - Add save/load UI

## Acceptance Criteria

1. **Save Function**
   - `saveVariant(variantId, name)` persists to localStorage
   - Variant data serialized correctly
   - Name validation (non-empty, unique)
   - Success feedback to user

2. **Load Function**
   - `loadVariant(variantId)` restores variant
   - Variant applied to schedule store
   - All sessions restored correctly
   - Load feedback to user

3. **Variant List**
   - Saved variants shown in list
   - Variant names displayed
   - Creation timestamp shown
   - Variant count displayed

4. **Variant Management**
   - Variant can be renamed
   - Variant can be deleted
   - Confirmation for delete
   - Undo delete (optional)

5. **Persistence**
   - Variants persist across page refreshes
   - Variants persist across sessions
   - Storage limits handled gracefully
   - Migration support for future changes

6. **Testing**
   - Save/load works correctly
   - Persistence works across refreshes
   - Rename/delete functions correctly
   - Edge cases handled

## Implementation Details

### Store Actions

```typescript
type SavedVariant = {
  id: string
  name: string
  termId: string
  courseAssignments: Map<string, ScheduleSession[]>
  createdAt: number
  metadata: {
    totalCredits: number
    conflicts: Conflict[]
  }
}

saveVariant: (variantId: string, name: string) => void
loadVariant: (variantId: string) => void
deleteVariant: (variantId: string) => void
renameVariant: (variantId: string, newName: string) => void
getSavedVariants: () => SavedVariant[]
```

### UI Components

- Save button on variant card
- Name input dialog
- Saved variants list
- Rename/delete actions
- Confirmation dialogs

## Risks & Dependencies

**Risks:**
- localStorage size limits
- Data serialization complexity
- Migration complexity
- UI clutter

**Dependencies:** UC-004 (Schedule Variant Filters)

## Testing Requirements

- Save/load works correctly
- Persistence verified
- Rename/delete functions
- Edge cases handled
- Storage limits handled

## Success Metrics

- Variants save successfully
- Variants load correctly
- Persistence reliable
- UI intuitive and clear

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.6 (Schedule Variant Generation)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-011

