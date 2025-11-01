# RFP: UC-005 - Add Variant Memoization

**Phase:** Phase 1: Foundations  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add memoization to conflict checks in schedule variant generation to improve performance by caching conflict results and avoiding redundant computations.

## Background

The variant generation algorithm repeatedly checks conflicts between the same session pairs across different variant paths. This leads to redundant computation and slower generation times, especially with many courses.

**Current State:**
- Conflict checks repeated for same session pairs
- No caching of conflict results
- O(n²) complexity per variant path

**Target State:**
- Conflict checks cached in `Map<sessionId1-sessionId2, boolean>`
- Cache cleared on course/session changes
- Significant performance improvement (50%+ reduction)

## Files to Modify

- `lib/schedule-generator.ts` - Add conflict cache

## Acceptance Criteria

1. **Conflict Cache**
   - `Map<sessionId1-sessionId2, boolean>` cache
   - Cache key is deterministic (sorted session IDs)
   - Cache stores conflict results

2. **Cache Usage**
   - Conflict checks use cache when available
   - Cache miss triggers computation and storage
   - Cache hit returns cached result immediately

3. **Cache Invalidation**
   - Cache cleared on course/session changes
   - Cache cleared when filters change
   - Cache lifecycle managed properly

4. **Performance**
   - 50%+ reduction in conflict check time for 10+ variants
   - No performance regression for small course counts
   - Memory usage acceptable

5. **Testing**
   - Unit tests for cache hit/miss scenarios
   - Performance benchmarks
   - Cache correctness tests

## Implementation Details

### Cache Implementation

```typescript
const conflictCache = new Map<string, boolean>()

function getConflictKey(session1: ScheduleSession, session2: ScheduleSession): string {
  const ids = [session1.id, session2.id].sort()
  return `${ids[0]}-${ids[1]}`
}

function hasTimeConflictCached(s1: ScheduleSession, s2: ScheduleSession): boolean {
  const key = getConflictKey(s1, s2)
  if (conflictCache.has(key)) {
    return conflictCache.get(key)!
  }
  const result = hasTimeConflict(s1, [s2])
  conflictCache.set(key, result)
  return result
}
```

### Cache Invalidation

- Clear cache when courses change
- Clear cache when sessions change
- Clear cache when generation starts
- Consider cache size limits for memory management

## Risks & Dependencies

**Risks:**
- Memory usage with large caches
- Cache invalidation complexity
- Potential correctness issues if cache stale

**Dependencies:** 
- UC-004 (filters may affect caching strategy)

## Testing Requirements

- Cache hit rate measured
- Correctness verified (cached vs computed)
- Performance benchmarks
- Memory usage monitored
- Edge cases handled

## Success Metrics

- 50%+ reduction in conflict check time
- Cache hit rate > 70% for typical scenarios
- No correctness regressions
- Memory usage acceptable

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 4 (Scheduling Engine Deep Dive)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-005

