# RFP: UC-016 - Add Drag-and-Drop for Course Cards

**Phase:** Phase 4: Multi-Term Board + Prereq Overlay  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** L (Large)  
**Created:** 2025-01-XX

---

## Overview

Implement drag-and-drop functionality for course cards, enabling users to move courses between terms by dragging cards to term drop zones, with full keyboard accessibility support.

## Background

Currently, courses must be moved between terms via dropdown menus. Drag-and-drop provides a more intuitive and efficient way to reorganize courses across terms.

**Current State:**
- Courses moved via dropdown menus
- Manual term selection required
- No visual drag feedback

**Target State:**
- Course cards draggable
- Term cards have drop zones
- Visual feedback during drag
- Keyboard alternative (select + arrow keys)
- Smooth drag animations

## Files to Modify

- `components/pages/plan/planned-course-card.tsx` - Add drag handle
- `components/pages/plan/term-card.tsx` - Add drop zone
- `store/course-plan.store.ts` - Extend `moveCourse` action

## Acceptance Criteria

1. **Drag Library Integration**
   - Integrate `@dnd-kit/core`
   - Proper setup and configuration
   - No conflicts with existing interactions

2. **Draggable Cards**
   - Course cards have drag handle
   - Cards draggable within and between terms
   - Visual feedback during drag
   - Drag preview shows course info

3. **Drop Zones**
   - Term cards have drop zones
   - Drop zones highlight on drag over
   - Drop zones accept course drops
   - Visual feedback for valid/invalid drops

4. **Move Action**
   - `moveCourse` called on drop
   - Course moved to correct term
   - State updates correctly
   - Undo support (optional)

5. **Keyboard Alternative**
   - Select course with keyboard
   - Move with arrow keys
   - Navigate between terms
   - Full keyboard accessibility

6. **Visual Feedback**
   - Drag preview during drag
   - Drop zone highlighting
   - Invalid drop indicators
   - Smooth animations

7. **Testing**
   - Drag-and-drop works correctly
   - Keyboard alternative functions
   - Visual feedback works
   - Edge cases handled

## Implementation Details

### DnD Setup

```tsx
<DndContext onDragEnd={handleDragEnd}>
  <Draggable id={course.id}>
    <PlannedCourseCard course={course} />
  </Draggable>
  <Droppable id={term.id}>
    <TermCard term={term} />
  </Droppable>
</DndContext>
```

### Drag Handler

```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event
  if (!over) return
  
  const courseId = active.id as string
  const targetTermId = over.id as string
  
  moveCourse(courseId, currentTermId, targetTermId)
}
```

### Keyboard Support

- Use `@dnd-kit/core` keyboard sensors
- Arrow keys navigate between terms
- Enter/Space to confirm move
- Escape to cancel

## Risks & Dependencies

**Risks:**
- DnD library complexity
- Touch device support
- Accessibility challenges
- Performance concerns

**Dependencies:** UC-015 (Longitudinal Board View)

## Testing Requirements

- Drag-and-drop works correctly
- Keyboard alternative functions
- Visual feedback works
- Touch gestures work
- Accessibility standards met

## Success Metrics

- Drag-and-drop intuitive and smooth
- Keyboard alternative fully functional
- Visual feedback clear
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.7 (Multi-Term Planning)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-016

