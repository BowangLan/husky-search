# RFP: UC-015 - Create Longitudinal Board View

**Phase:** Phase 4: Multi-Term Board + Prereq Overlay  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Create a horizontal scrolling board view where terms are displayed as columns, enabling users to see their entire academic plan at a glance and facilitating drag-and-drop course management across terms.

## Background

Currently, terms are displayed in a grid layout, making it difficult to see the full academic timeline. A longitudinal board view provides a horizontal timeline view similar to a kanban board.

**Current State:**
- Term cards in grid view
- No longitudinal timeline view
- Difficult to see year-long flow

**Target State:**
- Horizontal scroll layout (columns = terms)
- Each column: term header, course cards, drop zone
- Toggle between grid and board view
- Smooth horizontal scrolling

## Files to Create/Modify

- `components/pages/plan/longitudinal-board.tsx` (new) - Board component
- `components/pages/plan/term-view-pane.tsx` - Add view toggle

## Acceptance Criteria

1. **Horizontal Layout**
   - Terms displayed as columns
   - Horizontal scroll container
   - Smooth scrolling
   - Column widths appropriate

2. **Term Columns**
   - Each column: term header, course cards, drop zone
   - Term header shows: term name, credit total, warnings
   - Course cards display correctly
   - Drop zone for adding courses

3. **Styling**
   - Reuses `term-card.tsx` styling
   - Consistent visual design
   - Responsive column widths
   - Clear visual hierarchy

4. **View Toggle**
   - Toggle between grid and board view
   - View preference persisted
   - Smooth transition between views
   - Clear toggle control

5. **Scrolling**
   - Horizontal scroll works smoothly
   - Scroll position persists
   - Keyboard navigation (arrow keys)
   - Touch gestures (mobile)

6. **Testing**
   - Layout renders correctly
   - Scrolling works smoothly
   - View toggle functions
   - Responsive behavior works

## Implementation Details

### Board Structure

```tsx
<LongitudinalBoard>
  <HorizontalScrollContainer>
    {terms.map(term => (
      <TermColumn key={term.id}>
        <TermHeader term={term} />
        <CourseCards term={term} />
        <DropZone termId={term.id} />
      </TermColumn>
    ))}
  </HorizontalScrollContainer>
  <AddTermButton />
</LongitudinalBoard>
```

### Column Layout

- Fixed column width: ~300px
- Responsive: adapts to screen size
- Minimum width enforced
- Smooth scrolling

### View Toggle

- Toggle button in header
- Grid view: existing `term-view-pane.tsx`
- Board view: new `longitudinal-board.tsx`
- Smooth transition animation

## Risks & Dependencies

**Risks:**
- Horizontal scroll complexity
- Performance with many terms
- Mobile UX challenges
- Styling consistency

**Dependencies:** None

## Testing Requirements

- Layout renders correctly
- Scrolling works smoothly
- View toggle functions
- Responsive behavior works
- Performance acceptable

## Success Metrics

- Board view displays correctly
- Scrolling smooth and intuitive
- View toggle works seamlessly
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.7 (Multi-Term Planning)
- See `docs/UX_Grounding_Report.md` Section 6 (Multi-Term Planning & Roadmap Graph)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-015

