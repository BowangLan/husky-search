# RFP: UC-013 - Add Variant Scoring

**Phase:** Phase 3: Smart Schedule Simulation  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add scoring system to schedule variants based on user preferences (fewer days, morning preference, credit balance), enabling automatic sorting and prioritization of variants.

## Background

Variants are currently generated in arbitrary order. Scoring allows variants to be ranked by desirability, helping users find the best schedules faster.

**Current State:**
- Variants generated in arbitrary order
- No preference-based ranking
- Users must manually compare

**Target State:**
- Variants scored based on preferences
- Variants sorted by score (highest first)
- Score displayed in variant list
- Scoring factors configurable

## Files to Modify

- `lib/schedule-generator.ts` - Add `scoreVariant` function
- `components/schedule/generated-schedules-panel.tsx` - Display scores, sort by score

## Acceptance Criteria

1. **Scoring Function**
   - `scoreVariant(variant)` returns number (higher = better)
   - Scoring factors: fewer days, morning preference, credit balance
   - Configurable weights
   - Deterministic scoring

2. **Scoring Factors**
   - Fewer days: Higher score for fewer days with classes
   - Morning preference: Higher score for earlier classes
   - Credit balance: Higher score for balanced credits
   - Additional factors as needed

3. **Sorting**
   - Variants sorted by score (highest first)
   - Sort persists during generation
   - Sort can be toggled (ascending/descending)

4. **Score Display**
   - Score displayed in variant list
   - Score format: "Score: 85" or "⭐⭐⭐⭐"
   - Score breakdown shown on hover
   - Clear visual indicator

5. **Configuration**
   - Scoring weights configurable
   - User preferences respected
   - Default weights sensible

6. **Testing**
   - Scoring logic accurate
   - Sorting works correctly
   - Score display correct
   - Performance acceptable

## Implementation Details

### Scoring Function

```typescript
function scoreVariant(variant: GeneratedVariant): number {
  let score = 0
  
  // Prefer fewer days
  const days = new Set<string>()
  variant.courses.forEach(c => {
    c.sessions.forEach(s => {
      s.meetingDetailsList?.forEach(m => {
        expandDays(m.days).forEach(d => days.add(d))
      })
    })
  })
  score += (7 - days.size) * 10
  
  // Prefer morning classes
  variant.courses.forEach(c => {
    c.sessions.forEach(s => {
      s.meetingDetailsList?.forEach(m => {
        const [start] = parseTimeRangeToMinutes(m.time) || [0]
        if (start < 12 * 60) score += 5
      })
    })
  })
  
  // Prefer balanced credits
  const credits = variant.courses.reduce((sum, c) => sum + getCredits(c), 0)
  if (credits >= 12 && credits <= 18) score += 10
  
  return score
}
```

### Scoring Weights

- Days factor: 10 points per day fewer
- Morning factor: 5 points per morning class
- Credit balance: 10 points for balanced credits

## Risks & Dependencies

**Risks:**
- Scoring algorithm subjectivity
- Performance impact
- User preference mismatch

**Dependencies:** UC-004 (Schedule Variant Filters)

## Testing Requirements

- Scoring logic accurate
- Sorting works correctly
- Score display correct
- Performance acceptable
- Edge cases handled

## Success Metrics

- Variants sorted meaningfully
- Users find better schedules faster
- Score display clear
- Performance acceptable

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 4 (Scheduling Engine Deep Dive)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-013

