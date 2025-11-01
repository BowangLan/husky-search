# RFP: UC-019 - Add Eligibility Badges to Course Cards

**Phase:** Phase 4: Multi-Term Board + Prereq Overlay  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add eligibility badges to course cards showing whether prerequisites are met, enabling users to quickly identify which courses they can take and which are blocked.

## Background

Users need to know if they can take a course before adding it to their plan. Eligibility badges provide immediate visual feedback on prerequisite status.

**Current State:**
- No eligibility indicators
- Must check prerequisites manually
- Unclear if course can be taken

**Target State:**
- Eligibility badges on course cards
- "Blocked by: CSE 142" badge if not eligible
- "Eligible" badge if prerequisites met
- Color coding: green (eligible), yellow (partial), red (blocked)

## Files to Modify

- `components/pages/plan/planned-course-card.tsx` - Add eligibility badge
- `lib/prereq-utils.ts` - Use `checkEligibility` from UC-003

## Acceptance Criteria

1. **Badge Display**
   - Badge shows on course cards
   - Badge color: green (eligible), yellow (partial), red (blocked)
   - Badge text: "Eligible" or "Blocked by: [courses]"
   - Badge visible but not intrusive

2. **Eligibility Checking**
   - Uses `checkEligibility` from prereq utils
   - Checks against completed courses
   - Updates when completed courses change
   - Cached for performance

3. **Badge Tooltip**
   - Tooltip shows missing prerequisites
   - Tooltip shows eligible courses
   - Tooltip shows partial eligibility details
   - Tooltip accessible via keyboard

4. **Performance**
   - Eligibility checks cached
   - Badge updates efficiently
   - No performance degradation
   - Batch updates when possible

5. **Edge Cases**
   - Handles courses without prerequisites
   - Handles missing prerequisite data
   - Handles circular dependencies
   - Clear error states

6. **Testing**
   - Badge displays correctly
   - Eligibility checking accurate
   - Tooltip works correctly
   - Performance acceptable

## Implementation Details

### Badge Component

```tsx
function EligibilityBadge({ courseCode, completedCourses }: Props) {
  const eligibility = checkEligibility(courseCode, completedCourses, graph)
  
  if (eligibility.eligible) {
    return <Badge variant="success">Eligible</Badge>
  }
  
  if (eligibility.blockedBy.length > 0) {
    return (
      <Tooltip content={`Blocked by: ${eligibility.blockedBy.join(", ")}`}>
        <Badge variant="error">Blocked</Badge>
      </Tooltip>
    )
  }
  
  return <Badge variant="warning">Partial</Badge>
}
```

### Caching

- Cache eligibility results per `(courseCode, completedCourses)` tuple
- Invalidate cache on completed courses change
- Use memoization for performance

## Risks & Dependencies

**Risks:**
- Performance with many courses
- Caching complexity
- Visual clutter

**Dependencies:** UC-003 (Extract Prereq Graph Utilities)

## Testing Requirements

- Badge displays correctly
- Eligibility checking accurate
- Tooltip works correctly
- Performance acceptable
- Edge cases handled

## Success Metrics

- Badges display correctly
- Eligibility checking accurate
- Performance acceptable
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.8 (Prerequisite & Concurrent Data)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-019

