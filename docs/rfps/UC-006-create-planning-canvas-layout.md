# RFP: UC-006 - Create Planning Canvas Layout Scaffold

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Create the foundational 3-pane layout for the unified planning canvas, providing a workspace where users can search, schedule, and view course details simultaneously without page navigation.

## Background

Currently, course search, scheduling, and detail views are separate pages requiring navigation. The unified planning canvas consolidates these into a single workspace with resizable panels.

**Current State:**
- Separate pages: `/courses/[id]`, `/schedule`, `/plan`
- Hard page boundaries lose context
- No side-by-side search + schedule + detail

**Target State:**
- Single route `/planning` with 3-pane layout
- Search (left), Schedule (center), Detail (right)
- Responsive: mobile stacks, desktop side-by-side
- Resizable panels on desktop

## Files to Create

- `app/(main)/planning/page.tsx` (new) - Main planning route
- `components/pages/planning/planning-canvas-layout.tsx` (new) - Layout component

## Acceptance Criteria

1. **3-Pane Layout**
   - Search rail (left, ~300px fixed)
   - Schedule canvas (center, flex-grow)
   - Detail panel (right, ~400px, collapsible)
   - Panels properly sized and aligned

2. **Responsive Design**
   - Mobile: Panels stack vertically
   - Desktop: Panels side-by-side
   - Tablet: Adaptive layout
   - Breakpoints handled correctly

3. **Resizable Panels**
   - Desktop uses `react-resizable-panels` for resizing
   - Panel sizes persist in localStorage
   - Smooth resize interactions
   - Minimum/maximum sizes enforced

4. **Routing**
   - Routes to `/planning` without breaking existing routes
   - Existing routes (`/courses/[id]`, `/schedule`, `/plan`) still work
   - URL state management for panel state

5. **Testing**
   - Layout renders correctly
   - Responsive behavior works
   - Panel resizing functions
   - No breaking changes to existing routes

## Implementation Details

### Layout Structure

```tsx
<PlanningCanvasLayout>
  <SearchRail width={300}>
    {/* Search components */}
  </SearchRail>
  <ScheduleCanvas flex={1}>
    {/* Schedule components */}
  </ScheduleCanvas>
  <DetailPanel width={400} collapsible>
    {/* Detail components */}
  </DetailPanel>
</PlanningCanvasLayout>
```

### Responsive Breakpoints

- Mobile: < 768px (stack vertically)
- Tablet: 768px - 1024px (adaptive)
- Desktop: > 1024px (side-by-side)

### Panel Persistence

- Panel sizes stored in localStorage
- Panel collapse state persisted
- Restore on page load

## Risks & Dependencies

**Risks:**
- Layout complexity
- Responsive design challenges
- Performance with many panels
- Accessibility concerns

**Dependencies:** None

## Testing Requirements

- Layout renders correctly on all screen sizes
- Panel resizing works smoothly
- Responsive breakpoints function correctly
- Existing routes unaffected
- Accessibility standards met

## Success Metrics

- 3-pane layout functional
- Responsive design works on all devices
- Panel resizing smooth and intuitive
- Zero breaking changes to existing routes

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 2 (Target UX vs Current Implementation)
- See `docs/UX_Grounding_Report.md` Section 5 (Interaction Model)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-006

