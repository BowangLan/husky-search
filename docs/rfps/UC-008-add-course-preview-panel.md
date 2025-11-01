# RFP: UC-008 - Add Course Preview Panel

**Phase:** Phase 2: Unified Canvas  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Add a lightweight preview panel that appears when hovering over or clicking search results, providing quick course information and "Add to term" actions without opening the full detail panel.

## Background

Currently, users must navigate to a full course detail page to see course information. A preview panel provides quick access to essential information and actions, improving workflow efficiency.

**Current State:**
- Search redirects to detail page
- No quick preview option
- Context lost on navigation

**Target State:**
- Preview panel on search hover/click
- Shows key course info
- "Add to term" buttons for each term
- Quick, non-intrusive

## Files to Create

- `components/pages/planning/course-preview-panel.tsx` (new) - Preview component
- `components/course-search.tsx` - Trigger preview on hover/click

## Acceptance Criteria

1. **Preview Trigger**
   - Preview opens on search item hover (desktop)
   - Preview opens on search item click (mobile)
   - Preview position adjusts to avoid screen edges
   - Smooth appearance animation

2. **Content Display**
   - Shows: course code, title, credits, gen ed badges
   - Shows: quick stats (if available)
   - Shows: term availability badges
   - Content loads quickly (< 200ms)

3. **Actions**
   - "Add to term" buttons for each term
   - Buttons trigger `addCourseToTerm` action
   - Visual feedback on click
   - Preview closes after action (optional)

4. **Interaction**
   - Preview closes on hover out (desktop)
   - Preview closes on `Esc` key
   - Preview closes on outside click
   - Preview stays open during hover (desktop)

5. **Mobile Behavior**
   - Preview as bottom sheet on mobile
   - Swipe down to close
   - Touch gestures work correctly

6. **Testing**
   - Preview trigger works correctly
   - Content displays properly
   - Actions function correctly
   - Mobile behavior works

## Implementation Details

### Preview Content

```tsx
<CoursePreviewPanel courseCode={courseCode} position={position}>
  <CourseCode>{courseCode}</CourseCode>
  <CourseTitle>{title}</CourseTitle>
  <CourseCredits>{credits}</CourseCredits>
  <GenEdBadges badges={genEd} />
  <TermAvailability terms={termsOffered} />
  <AddToTermActions 
    terms={terms}
    onAdd={(termId) => addCourseToTerm(courseCode, termId)}
  />
</CoursePreviewPanel>
```

### Positioning Logic

- Position preview near cursor/hovered item
- Adjust to avoid screen edges
- Flip position if needed
- Smooth transitions

### Data Loading

- Fetch minimal course data for preview
- Use Convex query for course info
- Cache preview data
- Handle loading states

## Risks & Dependencies

**Risks:**
- Positioning complexity
- Performance with many previews
- Mobile UX challenges
- Data loading delays

**Dependencies:** UC-006 (Planning Canvas Layout)

## Testing Requirements

- Preview triggers correctly
- Content displays properly
- Actions work correctly
- Mobile behavior functions
- Performance acceptable

## Success Metrics

- Preview appears quickly (< 200ms)
- Content displays correctly
- Actions work smoothly
- Mobile UX intuitive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.1 (Course Search)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-008

