# RFP: UC-017 - Add Quick-Add Menu to Course Cards

**Phase:** Phase 4: Multi-Term Board + Prereq Overlay  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add a quick-add dropdown menu to course cards that allows users to quickly add courses to any term without navigating away, improving workflow efficiency.

## Background

Users need a quick way to add courses to different terms. Currently, this requires multiple steps. A quick-add menu provides instant access to term selection.

**Current State:**
- Courses added via full detail view
- Multiple steps required
- No quick-add option

**Target State:**
- Dropdown menu on course cards
- "Add to [Term]" actions for each term
- One-click course addition
- Works in grid and board views

## Files to Modify

- `components/pages/plan/planned-course-card.tsx` - Add dropdown menu
- `components/pages/planning/course-preview-panel.tsx` - Add quick-add (if applicable)

## Acceptance Criteria

1. **Dropdown Menu**
   - Menu button on course card
   - Menu shows list of terms
   - "Add to [Term]" actions for each term
   - Current term disabled/grayed out

2. **Add Action**
   - `moveCourse` called on selection
   - Course added to selected term
   - Visual feedback on add
   - Success notification

3. **View Compatibility**
   - Works in grid view
   - Works in board view
   - Consistent behavior
   - No layout issues

4. **UI/UX**
   - Menu easily accessible
   - Clear visual indicators
   - Smooth animations
   - Mobile-friendly

5. **Edge Cases**
   - Handles duplicate courses
   - Handles term limits
   - Handles errors gracefully
   - Clear error messages

6. **Testing**
   - Menu displays correctly
   - Add action works
   - Works in both views
   - Edge cases handled

## Implementation Details

### Menu Component

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <MoreVertical />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {terms.map(term => (
      <DropdownMenuItem
        key={term.id}
        onClick={() => moveCourse(course.id, null, term.id)}
        disabled={term.id === currentTermId}
      >
        Add to {term.label}
      </DropdownMenuItem>
    ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Integration

- Add to `planned-course-card.tsx`
- Use Radix UI DropdownMenu
- Consistent with existing UI patterns
- Accessible and keyboard navigable

## Risks & Dependencies

**Risks:**
- Menu clutter
- Performance with many terms
- Mobile UX challenges

**Dependencies:** UC-016 (Drag-and-Drop)

## Testing Requirements

- Menu displays correctly
- Add action works
- Works in both views
- Edge cases handled
- Mobile behavior works

## Success Metrics

- Quick-add menu intuitive
- Course addition fast
- Works in all views
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.7 (Multi-Term Planning)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-017

