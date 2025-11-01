# RFP: UC-009 - Refactor Search to Non-Navigating

**Phase:** Phase 2: Unified Canvas  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Refactor the course search component to support non-navigating behavior with callback props, enabling search to work within the planning canvas without triggering page navigation.

## Background

Currently, course search always navigates to `/courses/[id]` on selection. For the unified planning canvas, search should trigger preview/panel actions instead of navigation.

**Current State:**
- Search navigates on Enter/selection
- Hard navigation loses context
- No callback option

**Target State:**
- Search supports callback prop `onCourseSelect`
- Navigation optional (for standalone search page)
- Preview panel opens on select
- Existing routes still work

## Files to Modify

- `components/course-search.tsx` - Add callback prop, make navigation optional
- `hooks/use-course-search.ts` - Support callback mode

## Acceptance Criteria

1. **Callback Prop**
   - `onCourseSelect?: (courseCode: string) => void` prop added
   - Callback invoked before navigation
   - Navigation prevented if callback provided

2. **Conditional Navigation**
   - Search navigates only if no callback provided
   - Standalone search page still navigates
   - Planning canvas uses callback

3. **Preview Integration**
   - Preview panel opens when callback invoked
   - Smooth transition from search to preview
   - No navigation flash

4. **Backward Compatibility**
   - Existing `/courses/[id]` route still works
   - Search component works in existing contexts
   - No breaking changes

5. **Testing**
   - Search behavior with/without callback
   - Callback invocation works
   - Navigation still works when needed
   - No regressions

## Implementation Details

### Component Changes

```tsx
type CourseSearchProps = {
  onCourseSelect?: (courseCode: string) => void
  navigateOnSelect?: boolean  // default: true for backward compat
}

function CourseSearch({ onCourseSelect, navigateOnSelect = true }: CourseSearchProps) {
  const handleSelect = (courseCode: string) => {
    if (onCourseSelect) {
      onCourseSelect(courseCode)
      if (!navigateOnSelect) return
    }
    router.push(`/courses/${courseCode}`)
  }
}
```

### Hook Changes

- `useCourseSearch` supports callback mode
- Navigation logic conditional
- Maintains existing behavior when no callback

## Risks & Dependencies

**Risks:**
- Breaking changes if not careful
- Multiple search contexts need handling
- Callback timing issues

**Dependencies:** UC-008 (Course Preview Panel)

## Testing Requirements

- Search with callback works
- Search without callback still navigates
- Callback invoked correctly
- No regressions in existing usage

## Success Metrics

- Search works in planning canvas
- Existing search pages unaffected
- Preview panel opens correctly
- Zero breaking changes

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.1 (Course Search)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-009

