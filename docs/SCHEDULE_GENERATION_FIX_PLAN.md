# Schedule Generation Fix Plan

## Overview
This plan addresses 10 identified issues in the schedule generation logic, prioritized by impact and dependencies.

## Phase 1: Critical Fixes (Must Fix First)

### Fix 1.1: Eliminate Duplicate Hook Instances
**Priority:** Critical (Blocks other fixes)
**Files:** `app/(main)/schedule/page.tsx`, `components/schedule/generated-schedules-panel.tsx`

**Problem:**
- `SchedulePage` calls `useScheduleGeneration()` only to get `isGenerating`
- `GeneratedSchedulesPanel` also calls `useScheduleGeneration()` internally
- This creates duplicate instances and duplicate generation attempts

**Solution:**
1. Remove `useScheduleGeneration()` call from `SchedulePage`
2. Remove `isGenerating` prop from `GeneratedSchedulesPanel`
3. Let `GeneratedSchedulesPanel` manage generation internally
4. If `SchedulePage` needs generation state, use the store directly

**Steps:**
```typescript
// In schedule/page.tsx - REMOVE:
const { isGenerating } = useScheduleGeneration()

// In schedule/page.tsx - CHANGE:
<GeneratedSchedulesPanel isGenerating={isGenerating} />
// TO:
<GeneratedSchedulesPanel />

// In generated-schedules-panel.tsx - REMOVE:
isGenerating?: boolean prop
// Remove prop override logic, use hook state only
```

**Testing:**
- Verify only one generation happens when courses change
- Check loading state displays correctly
- Ensure no duplicate API calls

---

### Fix 1.2: Fix Race Condition with Cancellation Flag
**Priority:** Critical (Causes incorrect data)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- setTimeout captures stale closures
- Multiple timeouts can queue up
- Old generation can complete after new one starts

**Solution:**
1. Add cancellation flag using useRef
2. Check cancellation flag before state updates
3. Properly clean up timeout and cancel flag

**Steps:**
```typescript
// Add cancellation ref
const cancelledRef = useRef(false)

useEffect(() => {
  cancelledRef.current = false
  
  // ... early returns ...
  
  const timeoutId = setTimeout(() => {
    // Check cancellation before any work
    if (cancelledRef.current) return
    
    try {
      const generatedVariants = generateScheduleVariants(...)
      
      // Check cancellation again before state update
      if (cancelledRef.current) return
      
      if (generatedVariants.length > 0) {
        setVariants(generatedVariants)
      } else {
        setVariants([])
      }
    } catch (error) {
      if (!cancelledRef.current) {
        console.error("Error generating schedules:", error)
        setVariants([])
      }
    } finally {
      if (!cancelledRef.current) {
        setIsGenerating(false)
      }
    }
  }, 100)
  
  return () => {
    cancelledRef.current = true
    clearTimeout(timeoutId)
  }
}, [...])
```

**Testing:**
- Rapidly add/remove courses
- Verify only latest generation completes
- Check no stale state updates

---

### Fix 1.3: Fix Stale Closure with Latest Values
**Priority:** Critical (Causes incorrect data)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- setTimeout callback uses stale `courses` and `coursesWithSessionsData`
- Should use latest values when timeout executes

**Solution:**
1. Use refs to track latest values
2. Read from refs in timeout callback
3. Update refs when values change

**Steps:**
```typescript
// Add refs for latest values
const coursesRef = useRef(courses)
const coursesWithSessionsDataRef = useRef(coursesWithSessionsData)
const currentGenerationKeyRef = useRef(currentGenerationKey)

// Update refs when values change
useEffect(() => {
  coursesRef.current = courses
}, [courses])

useEffect(() => {
  coursesWithSessionsDataRef.current = coursesWithSessionsData
}, [coursesWithSessionsData])

useEffect(() => {
  currentGenerationKeyRef.current = currentGenerationKey
}, [currentGenerationKey])

// In setTimeout callback, use refs:
const timeoutId = setTimeout(() => {
  if (cancelledRef.current) return
  
  // Use latest values from refs
  const latestCourses = coursesRef.current
  const latestCoursesWithSessionsData = coursesWithSessionsDataRef.current
  
  // Verify key still matches (double-check)
  const latestKey = currentGenerationKeyRef.current
  if (latestKey !== currentGenerationKeyRef.current) {
    // Key changed, skip this generation
    return
  }
  
  const generatedVariants = generateScheduleVariants(
    latestCourses,
    latestCoursesWithSessionsData,
    20
  )
  // ... rest of logic
}, 100)
```

**Alternative Simpler Approach:**
Check if key still matches before updating state:
```typescript
const timeoutId = setTimeout(() => {
  if (cancelledRef.current) return
  
  // Get latest values
  const latestCourses = coursesRef.current
  const latestCoursesWithSessionsData = coursesWithSessionsDataRef.current
  
  // Verify we're still generating for the same state
  const latestKey = JSON.stringify({
    coursesWithoutSessions: latestCourses.filter(c => c.sessions.length === 0).map(c => c.courseCode).sort(),
    coursesWithSessions: latestCourses.filter(c => c.sessions.length > 0).map(c => ({
      code: c.courseCode,
      sessions: c.sessions.map(s => s.id).sort(),
    })),
  })
  
  if (latestKey !== currentGenerationKeyRef.current) {
    // State changed, skip
    return
  }
  
  // ... generate and update
}, 100)
```

**Testing:**
- Change courses rapidly
- Verify generation uses correct latest data
- Check no stale variant generation

---

## Phase 2: Important Fixes (Fix After Phase 1)

### Fix 2.1: Move Module-Level Ref to Hook Instance
**Priority:** High (Fixes shared state issue)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- `generationKeyRef` is module-level, shared across all instances
- After Fix 1.1, only one instance exists, but still wrong pattern

**Solution:**
1. Move ref to hook instance using useRef
2. Remove module-level ref

**Steps:**
```typescript
// REMOVE module-level:
// const generationKeyRef = { current: "" }

// ADD in hook:
const generationKeyRef = useRef("")

// All references stay the same, just location changes
```

**Testing:**
- Verify key tracking works correctly
- Check no interference between mounts/unmounts

---

### Fix 2.2: Preserve Selection on Variant Update
**Priority:** High (Improves UX)
**Files:** `store/generated-schedules.store.ts`

**Problem:**
- `setVariants()` always clears selection
- User loses selections when variants regenerate

**Solution:**
1. Preserve selected variant IDs that still exist in new variants
2. Only clear selection for variants that no longer exist

**Steps:**
```typescript
setVariants: (variants) => {
  set((state) => {
    // Preserve selected variant IDs that still exist
    const newVariantIds = new Set(variants.map(v => v.id))
    const preservedSelection = new Set(
      Array.from(state.selectedVariantIds).filter(id =>
        newVariantIds.has(id)
      )
    )
    
    return { 
      variants,
      selectedVariantIds: preservedSelection
    }
  })
}
```

**Testing:**
- Select variants, then change courses
- Verify selected variants persist if they still exist
- Verify selections clear for variants that no longer exist

---

### Fix 2.3: Add Proper Cleanup for Generation Work
**Priority:** Medium (Prevents memory leaks)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- Can't cancel `generateScheduleVariants()` execution
- Might update state after unmount

**Solution:**
1. Cancellation flag already covers this (Fix 1.2)
2. Add check before `setVariants()` and `setIsGenerating()`
3. Consider making generator cancellable if it's slow

**Note:** If `generateScheduleVariants()` is synchronous and fast, Fix 1.2 cancellation flag is sufficient. If it's async or slow, we may need to:
- Make it cancellable using AbortController
- Or accept that sync work can't be cancelled (but check flag before state updates)

**Testing:**
- Unmount component during generation
- Verify no state updates after unmount
- Check console for errors

---

### Fix 2.4: Remove Prop Override for isGenerating
**Priority:** Medium (Simplifies code)
**Files:** `components/schedule/generated-schedules-panel.tsx`

**Problem:**
- `isGenerating` prop can override hook state
- After Fix 1.1, prop won't exist, but verify logic is clean

**Solution:**
1. Remove prop (already done in Fix 1.1)
2. Use hook state directly
3. Simplify loading state logic

**Steps:**
```typescript
// Remove prop, use hook state only
const {
  reload,
  isGenerating,
  isLoadingCourseData,
} = useScheduleGeneration()

const isLoading = isGenerating || isLoadingCourseData
```

**Testing:**
- Verify loading state displays correctly
- Check no prop-related logic remains

---

## Phase 3: Polish and Optimization

### Fix 3.1: Optimize Generation Key Dependencies
**Priority:** Low (Performance)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- Key includes ALL courses, even ones with sessions
- Changes to courses with sessions trigger regeneration unnecessarily

**Solution:**
1. Only include coursesWithoutSessions in key
2. Track coursesWithSessions separately if needed for generation
3. Only regenerate when coursesWithoutSessions change

**Steps:**
```typescript
const currentGenerationKey = useMemo(() => {
  return JSON.stringify({
    coursesWithoutSessions: courseCodesToFetch.sort(),
    // Only include session IDs, not full course data
    coursesWithSessions: courses
      .filter((c) => c.sessions.length > 0)
      .map((c) => ({
        code: c.courseCode,
        sessions: c.sessions.map((s) => s.id).sort(),
      })),
  })
}, [courseCodesToFetch, courses])
```

**Note:** The current key already does this, but we can verify it's optimal. The issue might be that `courses` array reference changes even when content doesn't.

**Better approach:**
```typescript
const currentGenerationKey = useMemo(() => {
  const coursesWithoutSessions = courseCodesToFetch.sort()
  const coursesWithSessions = courses
    .filter((c) => c.sessions.length > 0)
    .map((c) => ({
      code: c.courseCode,
      sessions: c.sessions.map((s) => s.id).sort(),
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
  
  return JSON.stringify({
    coursesWithoutSessions,
    coursesWithSessions,
  })
}, [courseCodesToFetch, courses])
```

**Testing:**
- Verify regeneration only happens when needed
- Check no unnecessary regenerations

---

### Fix 3.2: Fix Reload Function
**Priority:** Low (Minor UX)
**Files:** `components/schedule/use-schedule-generation.tsx`

**Problem:**
- `reload()` doesn't reset `isGenerating` state
- Doesn't force re-fetch of course data

**Solution:**
1. Reset `isGenerating` in reload
2. Clear generation key to force regeneration
3. Note: Can't force re-fetch of Convex query, but clearing key will trigger regeneration

**Steps:**
```typescript
const reload = () => {
  // Clear the generation key to force regeneration
  generationKeyRef.current = ""
  // Clear variants to reset state
  setVariants([])
  // Reset loading state
  setIsGenerating(false)
}
```

**Testing:**
- Click reload button
- Verify state resets correctly
- Check regeneration happens

---

### Fix 3.3: Improve Empty State Messaging
**Priority:** Low (UX improvement)
**Files:** `components/schedule/generated-schedules-panel.tsx`, `components/schedule/use-schedule-generation.tsx`

**Problem:**
- When `coursesWithSessionsData` is empty but `coursesWithoutSessions.length > 0`, message is confusing

**Solution:**
1. Track if we have courses without sessions but no data
2. Show appropriate message
3. Differentiate between "no courses" vs "no sessions found"

**Steps:**
```typescript
// In hook, return additional state
return {
  isGenerating,
  isLoadingCourseData,
  hasCoursesWithoutSessions: coursesWithoutSessions.length > 0,
  hasNoSessionData: coursesWithSessionsData?.length === 0 && coursesWithoutSessions.length > 0,
  reload,
}

// In panel, show appropriate message:
if (variants.length === 0) {
  if (hasNoSessionData) {
    return <div>No sessions found for courses without sessions</div>
  }
  return <div>No variants available. Add courses without sessions...</div>
}
```

**Testing:**
- Add course without sessions
- Verify correct message shows
- Check empty state displays correctly

---

## Implementation Order

### Step 1: Phase 1.1 (Remove Duplicate Hook)
**Why first:** Simplifies everything else, eliminates duplicate calls

### Step 2: Phase 1.2 + 1.3 (Fix Race Conditions)
**Why second:** Critical for correctness, fixes data integrity issues

### Step 3: Phase 2.1 (Move Ref to Hook)
**Why third:** Cleanup after Phase 1, fixes architecture issue

### Step 4: Phase 2.2 (Preserve Selection)
**Why fourth:** Important UX improvement, independent of other fixes

### Step 5: Phase 2.3 (Cleanup)
**Why fifth:** Already partially fixed by Phase 1.2, verify completeness

### Step 6: Phase 2.4 (Remove Prop)
**Why sixth:** Already done in Phase 1.1, verify cleanup

### Step 7: Phase 3 (Polish)
**Why last:** Optimizations and improvements, low priority

## Testing Strategy

### Unit Tests
- Test hook with various course states
- Test cancellation logic
- Test selection preservation

### Integration Tests
- Test full generation flow
- Test rapid course changes
- Test unmount during generation

### Manual Testing Checklist
- [ ] Add course without sessions → variants generate
- [ ] Rapidly add/remove courses → only latest generation completes
- [ ] Select variants → change courses → selections preserved if variants exist
- [ ] Unmount component during generation → no errors
- [ ] Click reload → state resets correctly
- [ ] Empty state shows correct message

## Risk Assessment

### Low Risk
- Phase 1.1 (Remove duplicate hook) - Simple removal
- Phase 2.2 (Preserve selection) - Clear logic change
- Phase 3 (Polish) - Optimizations

### Medium Risk
- Phase 1.2 + 1.3 (Race conditions) - Complex async logic
- Phase 2.1 (Move ref) - State management change

### Mitigation
- Test thoroughly after each phase
- Keep old code commented for quick rollback
- Test edge cases (rapid changes, unmounts)

## Estimated Effort

- Phase 1: 2-3 hours
- Phase 2: 1-2 hours  
- Phase 3: 1 hour
- Testing: 1-2 hours

**Total: 5-8 hours**

## Notes

- Fixes are designed to be incremental
- Each phase can be tested independently
- Backward compatibility maintained (no API changes)
- Store API remains the same

