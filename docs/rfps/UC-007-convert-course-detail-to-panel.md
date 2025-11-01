# RFP: UC-007 - Convert Course Detail to Panel

**Phase:** Phase 2: Unified Canvas  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Convert the course detail page into a resizable panel component that can be opened within the planning canvas, eliminating the need for page navigation and maintaining context.

## Background

Currently, course details are displayed on a separate page (`/courses/[id]`), requiring navigation and losing context. This ticket converts the detail view into a panel that can be opened within the planning canvas.

**Current State:**
- Course detail on separate page `/courses/[id]`
- Hard navigation loses context
- No side-by-side with schedule

**Target State:**
- Course detail as panel in planning canvas
- Opens/closes without navigation
- URL state sync (`?course=CSE142`)
- Mobile: drawer implementation

## Files to Create/Modify

- `components/pages/planning/course-detail-panel.tsx` (new) - Panel component
- `components/pages/course-detail-page.tsx` - Extract reusable components
- `components/pages/planning/planning-canvas-layout.tsx` - Integrate panel

## Acceptance Criteria

1. **Panel Component**
   - `course-detail-panel.tsx` renders same content as detail page
   - All existing detail page features preserved
   - Panel can be opened/closed

2. **URL State Sync**
   - Panel opens via URL state (`?course=CSE142`)
   - URL updates when panel opens/closes
   - Browser back/forward works correctly
   - Deep linking works

3. **Interaction**
   - Panel closes on `Esc` key
   - Panel closes on outside click (desktop)
   - Panel closes on backdrop click (mobile)
   - Smooth open/close animations

4. **Mobile Support**
   - Mobile uses `vaul` drawer component
   - Drawer slides up from bottom
   - Drawer closes on swipe down
   - Touch gestures work correctly

5. **Content Preservation**
   - All detail page sections render correctly
   - Session lists work in panel
   - Calendar view works in panel
   - Links and actions function correctly

6. **Testing**
   - Panel open/close works
   - URL sync functions correctly
   - Mobile drawer works
   - Content displays correctly
   - No regressions in detail page

## Implementation Details

### Panel Structure

```tsx
<CourseDetailPanel 
  courseCode={selectedCourseCode}
  open={isOpen}
  onOpenChange={setIsOpen}
>
  {/* Reuse components from course-detail-page.tsx */}
  <CourseDetailHeader />
  <CourseMetadataSection />
  <CourseSessionsListView />
  <CourseSessionsCalendarView />
</CourseDetailPanel>
```

### URL State Management

- Use Next.js `useSearchParams` for URL state
- `?course=CSE142` opens panel with course
- Remove param when panel closes
- Handle browser navigation

### Mobile Drawer

- Use `vaul` (already in dependencies)
- Drawer component wraps panel content
- Slide-up animation
- Backdrop overlay

## Risks & Dependencies

**Risks:**
- Component extraction complexity
- URL state management complexity
- Mobile drawer UX challenges
- Performance with large content

**Dependencies:** UC-006 (Planning Canvas Layout)

## Testing Requirements

- Panel opens/closes correctly
- URL state syncs properly
- Mobile drawer functions
- Content renders correctly
- No regressions in detail page

## Success Metrics

- Panel works seamlessly in canvas
- URL state syncs correctly
- Mobile drawer intuitive
- Zero breaking changes to detail page

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.2 (Course Detail Page)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-007

