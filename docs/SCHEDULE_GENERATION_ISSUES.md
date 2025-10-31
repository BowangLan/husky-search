# Schedule Generation Logic Analysis

## Data Flow Overview

```
1. useScheduleGeneration hook
   ├─> Reads: useScheduledCourses() → courses[]
   ├─> Computes: coursesWithoutSessions (courses with 0 sessions)
   ├─> Computes: currentGenerationKey (JSON string of course state)
   ├─> Queries: coursesWithSessionsData (Convex query for courses without sessions)
   └─> Triggers: useEffect → generateScheduleVariants() → setVariants()

2. GeneratedSchedulesPanel
   ├─> Uses: useScheduleGeneration() (triggers generation)
   ├─> Uses: useGeneratedSchedules() (reads variants)
   └─> Displays: Loading/Empty/Variants UI

3. generated-schedules.store.ts
   ├─> Stores: variants[], selectedVariantIds
   └─> setVariants() clears selection automatically
```

## Critical Issues Found

### 1. **Shared Ref Problem (Module-Level State)**
**Location:** `use-schedule-generation.tsx:13`
```typescript
const generationKeyRef = { current: "" }
```

**Problem:**
- Shared across ALL hook instances globally
- If multiple components use `useScheduleGeneration()`, they share the same ref
- Could cause incorrect "already generated" detection across components
- Race conditions when multiple components try to generate simultaneously

**Impact:** Medium - Only an issue if hook is used in multiple places

### 2. **Race Condition in setTimeout**
**Location:** `use-schedule-generation.tsx:94-114`

**Problem:**
- setTimeout callback captures `courses` and `coursesWithSessionsData` at timeout creation time
- If dependencies change before timeout executes (100ms delay), stale data is used
- If component unmounts, cleanup runs but timeout might still execute
- Multiple timeouts can queue up if dependencies change rapidly

**Example Scenario:**
1. User adds course A → timeout scheduled with course A
2. User adds course B before 100ms → timeout scheduled with course B
3. First timeout executes with stale course A data
4. Second timeout executes with course B data
5. Both update store, causing flickering or incorrect state

**Impact:** High - Can cause incorrect variant generation

### 3. **Stale Closure in setTimeout Callback**
**Location:** `use-schedule-generation.tsx:94-114`

**Problem:**
- `courses` and `coursesWithSessionsData` are captured in closure
- If these change between setting timeout and execution, old values are used
- `currentGenerationKey` is also captured, but it's computed from stale `courses`

**Impact:** High - Can generate variants for wrong course state

### 4. **Selection Loss on Variant Update**
**Location:** `generated-schedules.store.ts:22-26`

**Problem:**
- `setVariants()` always clears `selectedVariantIds`
- If user selects variants while generation is running, selection is lost
- No way to preserve selection across regeneration

**Impact:** Medium - Poor UX, user loses selections

### 5. **Multiple Hook Instances Problem**
**Location:** `generated-schedules-panel.tsx:34-38` and `schedule/page.tsx:31`

**Problem:**
- Both `GeneratedSchedulesPanel` and `SchedulePage` call `useScheduleGeneration()`
- This creates two separate hook instances
- Each has its own `isGenerating` state
- Both try to generate variants independently
- Shared `generationKeyRef` means they might interfere with each other

**Impact:** High - Duplicate generation attempts, wasted computation

### 6. **Inconsistent Loading State**
**Location:** `generated-schedules-panel.tsx:40-43`

**Problem:**
- `isGenerating` prop can override hook's `isGenerating`
- If prop is passed, hook's internal state is ignored
- Could show loading when not actually generating
- Could hide loading when generation is happening

**Impact:** Medium - Confusing UX

### 7. **Empty Array Handling Edge Case**
**Location:** `use-schedule-generation.tsx:69-76`

**Problem:**
- If `coursesWithSessionsData` is empty array (no sessions found), it clears variants
- But `coursesWithoutSessions.length > 0` is still true
- This means we have courses without sessions, but no data to generate from
- State shows "generating" then clears, but user might expect variants

**Impact:** Low - Edge case, but confusing UX

### 8. **Missing Cleanup for Generation**
**Location:** `use-schedule-generation.tsx:117`

**Problem:**
- Cleanup only clears timeout
- Doesn't cancel any in-flight generation work
- If `generateScheduleVariants()` is slow, it might complete after unmount
- Will still call `setVariants()` after component unmounts (memory leak risk)

**Impact:** Medium - Potential memory leaks with slow generation

### 9. **Generation Key Dependency Issue**
**Location:** `use-schedule-generation.tsx:30-40, 81`

**Problem:**
- `currentGenerationKey` depends on `courseCodesToFetch` and `courses`
- But `courses` includes ALL courses (with and without sessions)
- If a course WITH sessions changes, key changes even though we don't need to regenerate
- This causes unnecessary regeneration

**Impact:** Low - Performance issue, unnecessary re-computation

### 10. **Reload Function Doesn't Reset State Properly**
**Location:** `use-schedule-generation.tsx:126-131`

**Problem:**
- `reload()` clears `generationKeyRef` and variants
- But doesn't reset `isGenerating` state
- Component might show loading state incorrectly
- Doesn't force re-fetch of `coursesWithSessionsData`

**Impact:** Low - Minor UX issue

## Recommendations

### High Priority Fixes

1. **Use useRef instead of module-level ref**
   ```typescript
   // In hook, not module level
   const generationKeyRef = useRef("")
   ```

2. **Fix race condition with cleanup flag**
   ```typescript
   useEffect(() => {
     let cancelled = false
     const timeoutId = setTimeout(() => {
       if (cancelled) return
       // ... generation logic
     }, 100)
     return () => {
       cancelled = true
       clearTimeout(timeoutId)
     }
   }, [...])
   ```

3. **Fix stale closure by using refs or checking key**
   ```typescript
   // Use currentGenerationKey in cleanup check
   // Or use refs for latest values
   ```

4. **Deduplicate hook calls**
   - Only call `useScheduleGeneration()` once at top level
   - Pass `isGenerating` as prop if needed

5. **Preserve selection on variant update**
   ```typescript
   setVariants: (variants) => {
     set((state) => {
       // Preserve selected variant IDs that still exist
       const preservedSelection = new Set(
         Array.from(state.selectedVariantIds).filter(id =>
           variants.some(v => v.id === id)
         )
       )
       return { variants, selectedVariantIds: preservedSelection }
     })
   }
   ```

### Medium Priority Fixes

6. Remove prop override for `isGenerating` - use hook state only
7. Add cancellation mechanism for generation work
8. Improve empty state messaging

### Low Priority Fixes

9. Optimize generation key to only depend on relevant changes
10. Fix reload function to properly reset state

