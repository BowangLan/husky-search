# UX Grounding Report: Unified Planning Canvas

**Generated:** 2025-01-XX  
**Codebase:** Husky Search (UW Course Planning Platform)  
**Target UX:** 8 Core Principles for Unified Planning Canvas

---

## 0. Repository Snapshot

### Tech Stack Summary

- **Frontend Framework:** Next.js 16 (App Router), React 19.1.0
- **UI Library:** Radix UI primitives, Tailwind CSS 4.1, Motion (Framer Motion)
- **State Management:** Zustand 5.0.6 (with localStorage persistence)
- **Backend/DB:** Convex (real-time database), PostgreSQL (Drizzle ORM)
- **Authentication:** Clerk (@clerk/nextjs 6.31.9)
- **Data Fetching:** Convex React hooks (`useQuery`), static JSON files
- **Form Handling:** React Hook Form 7.56.3, Zod 3.24.4
- **Type Safety:** TypeScript 4.9.5

### High-Level File Tree

```
components/
  ├── pages/
  │   ├── course-detail/          # Course detail views
  │   │   ├── course-detail-header.tsx
  │   │   ├── course-sessions-list-view.tsx
  │   │   ├── course-sessions-calendar-view.tsx
  │   │   └── course-metadata-section.tsx
  │   └── plan/                    # Multi-term planning UI
  │       ├── course-plan-studio.tsx
  │       ├── term-view-pane.tsx
  │       ├── schedule-view-pane.tsx
  │       └── course-browse-pane.tsx
  ├── schedule/                    # Schedule generation & calendar
  │   ├── schedule-calendar.tsx
  │   ├── variant-column-view.tsx
  │   ├── generated-schedules-panel.tsx
  │   └── use-schedule-generation.tsx
  ├── course-search.tsx             # Main search component
  ├── course-card.tsx               # Course card component
  └── ui/                          # 57 Radix UI components

store/
  ├── course-plan.store.ts         # Multi-term planning state
  ├── schedule.store.ts            # Active term scheduling state
  ├── favorite-courses.store.ts    # User favorites
  └── visit-cache.store.ts         # Visit tracking

lib/
  ├── schedule-generator.ts        # Variant generation algorithm
  └── utils.ts                     # Helper functions

convex/
  ├── schema.ts                    # Database schema
  ├── courses.ts                  # Course queries
  ├── myplan.ts                   # MyPlan API integration
  ├── dawgpath.ts                 # DawgPath data
  └── cec.ts                      # CEC (evaluation) data

app/
  ├── (main)/                      # Main app routes
  │   ├── courses/[id]/page.tsx   # Course detail page
  │   └── schedule/page.tsx       # Schedule page
  └── (plan-studio)/              # Plan studio routes
      └── plan/page.tsx           # Course plan page
```

### Key Domain Types/Interfaces

**Location:** `store/course-plan.store.ts:16-85`

```typescript
// Core planning entities
type Term = {
  id: string                    // "2025-Winter"
  year: number
  quarter: "Winter" | "Spring" | "Summer" | "Autumn"
  label: string                // "Winter 2025"
}

type PlannedCourse = {
  id: string
  courseCode: string           // "CSE 142"
  courseTitle?: string
  credits: number | string
  customCredits?: number       // User override
  sessions: ScheduleSession[]  // Empty for future terms
  notes?: string
  color?: string
}

type ScheduleSession = {
  id: string
  code: string                 // "A", "AA"
  type?: string               // "Lecture", "Quiz"
  instructor?: string
  registrationCode?: string | number
  meetingDetailsList?: ScheduleMeeting[]
}

type ScheduleMeeting = {
  days?: string               // "MWF"
  time?: string               // "10:30 AM-11:20 AM"
  building?: string
  room?: string
  campus?: string
}
```

**Location:** `convex/schema.ts:58-104`

```typescript
// Database entities
type MyplanCourse = {
  courseCode: string
  courseId: string
  title: string
  credit: string
  prereqs?: string[]
  genEdReqs: string[]
  termsOffered: string[]
  currentTermData?: MyplanCourseTermData[]
  detailData?: any              // Full course detail
}

type MyplanCourseTermSession = {
  id: string
  code: string
  enrollCount: string
  enrollMax: string
  instructor?: string
  meetingDetailsList: any[]
  addCodeRequired?: boolean
}
```

---

## 1. Current UX Surfaces (Grounded in Code)

### 1.1 Course Search

**What exists:**
- Global search bar (Cmd+K) with live autocomplete
- Static course code matching from `public/course_codes.json`
- Subject area search from `public/subject_areas.json`
- Redirects to `/courses/[id]` on selection

**Primary components:**
- `components/course-search.tsx` (main search UI)
- `hooks/use-course-search.ts` (search logic)
- `components/hero-search.tsx` (landing page variant)
- `components/pages/plan/course-browse-pane.tsx` (plan studio search)

**Data dependencies:**
- `hooks/use-static-course-data.ts` → static JSON files
- `convex/myplan.searchCourses` → Convex query (when Enter pressed)

**Edge cases:**
- Search is client-side only; no fuzzy matching
- No recent searches persistence
- No search history

**Evidence:** `components/course-search.tsx:16-187`, `hooks/use-course-search.ts:13-164`

---

### 1.2 Course Detail Page

**What exists:**
- Full course metadata display (title, credits, gen ed, prerequisites)
- Term availability badges
- Session list view (grid + mobile)
- Calendar view for sessions
- Session scheduling toggle (add/remove from active term)
- Links to MyPlan and DawgPath

**Primary components:**
- `components/pages/course-detail-page.tsx`
- `components/pages/course-detail/course-detail-header.tsx`
- `components/pages/course-detail/course-sessions-list-view.tsx`
- `components/pages/course-detail/course-sessions-calendar-view.tsx`
- `components/pages/course-detail/course-metadata-section.tsx`

**Data dependencies:**
- `convex/courses.getByCourseCode` → full course data
- `convex/cec.getByCourseCode` → professor ratings (optional)
- `store/course-plan.store` → active term check
- `store/schedule.store` → session scheduling state

**Known limitations:**
- Prerequisites shown as HTML string, not interactive graph
- No prerequisite eligibility checking
- No "add to term" from detail page (only "add to schedule")
- Hard page navigation (no modal/panel option)

**Evidence:** `components/pages/course-detail/course-detail-header.tsx:19-245`, `course-sessions-list-view.tsx:25-397`

---

### 1.3 Session Picker & Scheduling

**What exists:**
- Session list with filtering (pinned, displayed)
- Session toggle buttons (add/remove from active term schedule)
- Conflict detection (time overlap, single/double-letter rules)
- Session preview on hover
- Enrollment progress indicators

**Primary components:**
- `components/pages/course-detail/course-sessions-list-view.tsx`
- `components/pages/course-detail/session-schedule-toggle-button.tsx`
- `components/pages/course-detail/use-schedule-toggle.ts`
- `store/schedule.store.ts:436-484` (validation logic)

**Data dependencies:**
- `store/schedule.store` → active term schedule
- `store/course-plan.store` → term management
- `convex/courses.getSessionsByIds` → session metadata

**Validation rules:**
- One single-letter session per course (`schedule.store.ts:452-462`)
- One double-letter session per course (`schedule.store.ts:464-475`)
- Double-letter must match single-letter prefix (`schedule-generator.ts:136-143`)
- No time conflicts (`schedule.store.ts:184-207`)

**Evidence:** `store/schedule.store.ts:436-484`, `lib/schedule-generator.ts:107-157`

---

### 1.4 Schedule Calendar View

**What exists:**
- Weekly calendar grid (8 AM - 10 PM)
- Automatic column layout for concurrent events
- Color-coded courses
- Session details on hover/click
- Mini calendar view variant

**Primary components:**
- `components/schedule/schedule-calendar.tsx`
- `components/schedule/mini-calendar-view.tsx`
- `components/pages/plan/calendar-view-pane.tsx`
- `components/pages/course-detail/course-sessions-calendar-view.tsx`

**Data dependencies:**
- `store/schedule.store` → scheduled courses
- `lib/utils.ts:expandDays` → day parsing ("MWF" → ["M","W","F"])
- `lib/utils.ts:parseTimeRangeToMinutes` → time parsing

**Layout algorithm:**
- Events sorted by start time
- Column assignment using greedy algorithm (`calendar-view-pane.tsx:47-98`)
- Concurrent events share columns

**Evidence:** `components/schedule/schedule-calendar.tsx:312-619`, `components/pages/plan/calendar-view-pane.tsx:47-98`

---

### 1.5 Schedule List View

**What exists:**
- List of scheduled courses with sessions
- Compact/detailed view toggle
- Remove course/session actions
- Credit total display

**Primary components:**
- `components/schedule/scheduled-session-list-view.tsx`
- `components/schedule/schedule-course-card.tsx`
- `components/schedule/schedule-courses-list.tsx`

**Data dependencies:**
- `store/schedule.store` → scheduled courses
- `store/course-plan.store` → term plan

**Evidence:** `components/schedule/scheduled-session-list-view.tsx:30-148`

---

### 1.6 Schedule Variant Generation

**What exists:**
- Backtracking algorithm to generate all valid session combinations
- Variant list and column views
- Multi-variant selection (up to 3)
- Master calendar showing all variants

**Primary components:**
- `components/schedule/generated-schedules-panel.tsx`
- `components/schedule/variant-column-view.tsx`
- `components/schedule/variant-master-calendar-view.tsx`
- `components/schedule/use-schedule-generation.tsx`
- `lib/schedule-generator.ts:163-350` (core algorithm)

**Algorithm:**
- Backtracking DFS (`lib/schedule-generator.ts:245-345`)
- Groups sessions by single/double-letter type
- Validates at each step (time conflicts, letter rules)
- No limit on variant count (generates all combinations)

**Performance concerns:**
- Exponential complexity for many courses
- No memoization/caching
- No early termination limits
- No rule filters (e.g., "no Friday classes")

**Evidence:** `lib/schedule-generator.ts:163-350`, `components/schedule/use-schedule-generation.tsx:12-208`

---

### 1.7 Multi-Term Planning (Course Plan Studio)

**What exists:**
- Term creation (year + quarter)
- Term cards with course lists
- Add/remove courses per term
- Move courses between terms
- Credit totals per term
- Active term selection (for scheduling)

**Primary components:**
- `components/pages/plan/course-plan-studio.tsx`
- `components/pages/plan/term-view-pane.tsx`
- `components/pages/plan/term-card.tsx`
- `components/pages/plan/planned-course-card.tsx`
- `store/course-plan.store.ts:148-451` (state management)

**Data dependencies:**
- `store/course-plan.store` → persisted in localStorage
- `convex/courses.getByCourseCode` → course metadata

**Limitations:**
- No drag-and-drop reordering
- No prerequisite visualization
- No course status tracking (completed/current/planned)
- No longitudinal view (all terms in one board)

**Evidence:** `store/course-plan.store.ts:148-451`, `components/pages/plan/course-plan-studio.tsx:20-146`

---

### 1.8 Prerequisite & Concurrent Data

**What exists:**
- Prerequisites stored as string array (`MyplanCourse.prereqs`)
- Prerequisites displayed as HTML links (`course-metadata-section.tsx:16-46`)
- DawgPath prerequisite graph data available (`convex/dawgpath.ts:43-78`)
- Concurrent courses tracked in DawgPath (`dawgpath.ts:21-29`)

**Primary components:**
- `components/pages/course-detail/course-metadata-section.tsx`
- `convex/dawgpath.ts` (prerequisite graph structure)

**Data structure:**
```typescript
// DawgPath prerequisite graph
type PrereqGraph = {
  edges: {
    from: Record<string, string>
    to: Record<string, string>
    pr_and_or: Record<string, string>
    pr_concurrency: Record<string, string>
    pr_grade_min: Record<string, string>
  }
  nodes: Record<string, CourseNode>
}
```

**Gaps:**
- No visual graph rendering
- No eligibility checking ("can take CSE 373?")
- No prerequisite path visualization
- No "blocked by" indicators

**Evidence:** `convex/dawgpath.ts:43-78`, `components/pages/course-detail/course-metadata-section.tsx:16-46`

---

## 2. Target UX vs Current Implementation — Gap Analysis

| UX Principle/Goal | Current Behavior (with file refs) | Evidence (paths+lines) | Gaps / Risks | Suggested Change (concrete) |
|---|---|---|---|---|
| **1. Unified Planning Canvas** | Separate pages: `/courses/[id]`, `/schedule`, `/plan`. No unified workspace. | `app/(main)/courses/[id]/page.tsx`, `app/(main)/schedule/page.tsx`, `app/(plan-studio)/plan/page.tsx` | Hard page boundaries lose context. No side-by-side search + schedule + detail. | Create `app/(main)/planning/page.tsx` with 3-pane layout (search left, schedule center, detail right). Convert detail page to panel (`components/pages/planning/course-detail-panel.tsx`). |
| **2. Drag-and-Drop Course Cards** | No drag-and-drop. Course cards are static with click-to-add. | `components/pages/plan/planned-course-card.tsx:25-155`, `components/schedule/schedule-course-card.tsx:39-202` | Manual term selection required. No visual drag feedback. | Integrate `@dnd-kit/core` into `planned-course-card.tsx`. Add `useDroppable` to term cards. Implement `onDragEnd` handler in `course-plan.store.ts` (extend `moveCourse`). |
| **3. Status Awareness (completed/current/planned)** | No status tracking. All courses treated equally. | `store/course-plan.store.ts:26-35` (`PlannedCourse` has no status field) | Cannot distinguish past vs future courses. | Add `status: "completed" \| "current" \| "planned"` to `PlannedCourse`. Add `updateCourseStatus` action. Add status badges to cards (`components/pages/plan/planned-course-card.tsx`). |
| **4. Smart Schedule Simulation** | Variant generation exists but lacks: filters, variant saving, deterministic ordering, limits. | `lib/schedule-generator.ts:163-350` (generates all variants, no filters) | Exponential explosion for 5+ courses. No user preferences. | Add `generateScheduleVariants` options: `maxVariants`, `filters` (noFriday, morningOnly, creditCap). Add `saveVariant` to `schedule.store.ts`. Add variant comparison view. |
| **5. Inline Conflict Resolution** | Conflicts detected but user must manually fix. Toast notifications only. | `store/schedule.store.ts:436-484` (`canAddSession` returns reason), `use-schedule-toggle.ts:150-165` (toast on violation) | No "suggest alternate session" UI. No conflict visualization. | Add `findAlternativeSessions` utility (`lib/schedule-generator.ts`). Add conflict resolution panel (`components/schedule/conflict-resolution-panel.tsx`). Show conflict overlay on calendar. |
| **6. Degree & Dependency Awareness** | Prerequisites shown as text links. No graph. No eligibility checking. | `components/pages/course-detail/course-metadata-section.tsx:16-46`, `convex/dawgpath.ts:43-78` (graph data exists but unused) | Cannot see prerequisite chain. Cannot check "can I take this?". | Render prerequisite graph using `react-flow` or `vis-network`. Add `checkEligibility(courseCode, completedCourses)` util (`lib/prereq-utils.ts`). Add "Blocked by" badge to course cards. |
| **7. Multi-Term Overview** | Term cards in grid view. No longitudinal board. | `components/pages/plan/term-view-pane.tsx:62-70` (grid layout), `store/course-plan.store.ts:54` (`plansByTerm: Record<string, TermPlan>`) | Hard to see year-long flow. No quick-add to any term. | Create `components/pages/plan/longitudinal-board.tsx` (columns = terms). Add horizontal scroll. Add "quick-add" dropdown on course cards. |
| **8. Inline Search & Preview** | Search redirects to detail page. No preview panel. | `components/course-search.tsx:74-187`, `hooks/use-course-search.ts:61-95` (navigates on Enter) | Context lost on navigation. No quick preview. | Add `components/pages/planning/course-preview-panel.tsx`. Trigger on search hover/click. Show key info + "Add to term" buttons. Keep search bar always visible. |
| **9. Smart Warnings & Insights** | Time conflict toasts only. No credit limit warnings. No requirement coverage. | `use-schedule-toggle.ts:150-165` (conflict toast), `store/course-plan.store.ts:428-445` (credit sum only) | No proactive warnings. No degree requirement tracking. | Add `computeWarnings(termPlan)` (`lib/warnings-engine.ts`): credit limits, missing prereqs, requirement gaps. Add `components/pages/plan/warnings-panel.tsx`. Show persistent warning bar. |
| **10. Personalization** | Favorites exist. No past course sync. No "taken" tracking. | `store/favorite-courses.store.ts:54-92`, `store/visit-cache.store.ts:139-195` (visit tracking only) | Cannot import past courses. No sync with UW systems. | Add `convex/users.getPastCourses` (if Canvas API available). Add `markAsCompleted(courseCode, termId)` to `course-plan.store.ts`. Add "Sync from Canvas" button (if authenticated). |

---

## 3. Information Architecture & State Model

### Current Entities

**Course (`PlannedCourse`)**  
Location: `store/course-plan.store.ts:26-35`  
- ID stable (UUID generated)  
- Sessions linked to term via `PlannedCourse.sessions`  
- No status field (completed/current/planned)  
- Notes and custom credits supported

**Session (`ScheduleSession`)**  
Location: `store/course-plan.store.ts:16-23`  
- ID stable (from MyPlan `activityId` or generated)  
- Linked to course via `PlannedCourse.sessions[]`  
- Meeting details normalized  
- No term linkage (assumes active term)

**Term (`Term`)**  
Location: `store/course-plan.store.ts:39-44`  
- ID format: `"{year}-{quarter}"` (stable)  
- Terms stored in array + `plansByTerm` record  
- Reordering supported (`reorderTerms`)

**Prerequisite Graph**  
Location: `convex/dawgpath.ts:43-78`  
- Edges stored as records (`from`, `to`, `pr_and_or`, etc.)  
- Nodes indexed by course ID  
- Not normalized into relational structure  
- Eligibility logic not computed

### Normalization Assessment

**Issues:**
1. Sessions don't explicitly link to term (assumed via active term)
2. Prerequisites stored as string array, not graph edges
3. No requirement tracking (degree requirements, gen ed coverage)
4. No user progress model (completed courses, current enrollment)

**ID Stability:**
- Course codes: Stable (e.g., "CSE 142")
- Session IDs: Stable (from MyPlan `activityId`)
- Term IDs: Stable (format: `"2025-Winter"`)
- PlannedCourse IDs: Stable (UUID)

### Recommended Canonical Store Shape

```typescript
// Unified Planning Canvas State
type UnifiedPlanningState = {
  // User context
  userId: string | null
  completedCourses: CompletedCourse[]      // Past courses
  currentEnrollment: Enrollment[]          // Current term
  
  // Multi-term planning
  terms: Term[]
  plansByTerm: Record<string, TermPlan>
  activeTermId: string | null
  
  // Scheduling (active term only)
  scheduleVariants: SavedVariant[]
  selectedVariantIds: string[]
  
  // Prerequisite graph cache
  prereqGraph: PrereqGraph                 // Cached from DawgPath
  eligibilityCache: Map<string, EligibilityResult>
  
  // Warnings & insights
  warnings: Warning[]
  insights: Insight[]
  
  // UI state
  selectedCourseCode: string | null
  previewPanelOpen: boolean
  detailPanelOpen: boolean
}

type CompletedCourse = {
  courseCode: string
  termId: string
  grade?: string
  credits: number
  completedAt: number
}

type SavedVariant = {
  id: string
  name: string
  termId: string
  courseAssignments: Map<string, ScheduleSession[]>
  createdAt: number
  metadata: {
    totalCredits: number
    conflicts: Conflict[]
  }
}

type EligibilityResult = {
  courseCode: string
  eligible: boolean
  blockedBy: string[]
  missingPrereqs: string[]
  canTakeConcurrently: boolean
}

type Warning = {
  id: string
  type: "credit-limit" | "missing-prereq" | "conflict" | "requirement-gap"
  severity: "error" | "warning" | "info"
  message: string
  courseCode?: string
  termId?: string
  actions?: Action[]
}
```

### Migration Notes

**From current to canonical:**

1. **Add status to PlannedCourse:**
   - Extend `PlannedCourse` with `status?: "completed" | "current" | "planned"`
   - Migrate existing courses: check if `termId` is in past → `status: "completed"`
   - Update `course-plan.store.ts` version to 3

2. **Link sessions to terms explicitly:**
   - Change `PlannedCourse.sessions` to `Record<string, ScheduleSession[]>` (termId → sessions)
   - Migrate: move `sessions` to `sessionsByTerm[activeTermId]`

3. **Extract prerequisite graph:**
   - Create `lib/prereq-graph.ts` with `buildPrereqGraph(dawgpathData)`
   - Cache in `store/prereq-graph.store.ts`
   - Compute eligibility on-demand

4. **Add requirement tracking:**
   - Create `store/requirements.store.ts` for degree requirements
   - Track gen ed coverage per term

---

## 4. Scheduling Engine Deep Dive

### Current Conflict Logic

**Location:** `store/schedule.store.ts:184-207`, `lib/schedule-generator.ts:42-72`

**Algorithm:**
1. Parse time range to minutes (`parseTimeRangeToMinutes`)
2. Expand days string ("MWF" → ["M","W","F"])
3. Check day overlap (`days.some(d => edays.includes(d))`)
4. Check time overlap (`cStart < eEnd && cEnd > eStart`)

**Complexity:** O(n²) where n = number of sessions

**Limitations:**
- No consideration of campus location (could allow same time if different campus)
- No handling of "TBA" meetings
- No handling of asynchronous/online courses

### Variant Generation Algorithm

**Location:** `lib/schedule-generator.ts:163-350`

**Approach:**
- Backtracking DFS
- Groups sessions by single/double-letter type
- Validates at each step (time conflicts, letter rules)
- Generates ALL valid combinations (no limit)

**Performance:**
- Exponential complexity: O(2^n) for n courses with 2 sessions each
- No memoization: recomputes conflicts for each path
- No early termination: generates all variants even if user only needs top 10

**Current issues:**
- `docs/SCHEDULE_GENERATION_ISSUES.md` documents known problems
- `docs/SCHEDULE_GENERATION_FIX_PLAN.md` outlines fixes

### Required Features for Smart Schedule Simulation

**1. Generate valid combinations** ✅ (exists but needs limits)

**2. Rule filters** ❌ (missing)
- No Friday classes
- Morning-only (before 12 PM)
- Credit cap per term
- Specific day preferences

**3. Variant saving & diffing** ❌ (missing)
- No `saveVariant` function
- No variant comparison UI
- No variant history

**4. Deterministic ordering** ⚠️ (partial)
- Variants generated in order but not explicitly sorted
- No preference scoring (e.g., "prefer fewer days", "prefer morning")

**5. Memoization/cache** ❌ (missing)
- Conflict checks repeated across variants
- No caching of valid combinations

### Concrete Refactor Plan

**File: `lib/schedule-generator.ts`**

**Add filter options:**
```typescript
type ScheduleFilters = {
  maxVariants?: number
  excludeDays?: string[]          // ["F"]
  timeRange?: { start: number, end: number }  // minutes
  maxCredits?: number
  preferFewerDays?: boolean
}

export function generateScheduleVariants(
  scheduledCourses: ScheduleCourse[],
  coursesWithSessions: CourseWithSessions[],
  filters?: ScheduleFilters
): GeneratedVariant[]
```

**Add memoization:**
```typescript
const conflictCache = new Map<string, boolean>()

function getConflictKey(session1: ScheduleSession, session2: ScheduleSession): string {
  return `${session1.id}-${session2.id}`
}

function hasTimeConflictCached(s1: ScheduleSession, s2: ScheduleSession): boolean {
  const key = getConflictKey(s1, s2)
  if (conflictCache.has(key)) return conflictCache.get(key)!
  const result = hasTimeConflict(s1, [s2])
  conflictCache.set(key, result)
  return result
}
```

**Add variant scoring:**
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
  
  return score
}
```

**Add variant saving:**
```typescript
// In store/schedule.store.ts
saveVariant: (variantId: string, name: string) => void
loadVariant: (variantId: string) => void
compareVariants: (variantId1: string, variantId2: string) => VariantDiff
```

**Unit tests to write:**
- `lib/schedule-generator.test.ts`
  - `hasTimeConflict` edge cases (TBA, async, different campuses)
  - `generateScheduleVariants` with filters
  - `scoreVariant` correctness
  - Memoization effectiveness

---

## 5. Interaction Model for the Unified Planning Canvas

### Proposed Components

**Top-level layout:**
```
app/(main)/planning/page.tsx
├── PlanningCanvasLayout
    ├── SearchRail (left, 300px)
    │   ├── CourseSearchBar
    │   ├── CourseSearchResults
    │   └── QuickFilters
    ├── ScheduleCanvas (center, flex)
    │   ├── TermSelector (tabs or dropdown)
    │   ├── ScheduleView (list or calendar)
    │   └── CourseCards (draggable)
    └── DetailPanel (right, 400px, collapsible)
        ├── CoursePreview (when search item hovered)
        ├── CourseDetail (when card selected)
        └── VariantComparison (when variants selected)
```

### Component Reuse Assessment

**Can reuse:**
- `components/course-search.tsx` → `components/pages/planning/search-rail.tsx` (refactor to not navigate)
- `components/schedule/schedule-calendar.tsx` → `components/pages/planning/schedule-canvas.tsx` (keep as-is)
- `components/pages/course-detail/course-detail-header.tsx` → `components/pages/planning/course-detail-panel.tsx` (extract to panel)

**Need refactor:**
- `components/pages/plan/planned-course-card.tsx` → Add drag handle, status badges
- `components/pages/plan/term-card.tsx` → Add drop zone, quick-add menu
- `components/course-search.tsx` → Remove navigation, add preview callback

**New components needed:**
- `components/pages/planning/planning-canvas-layout.tsx` (3-pane layout)
- `components/pages/planning/course-preview-panel.tsx` (hover preview)
- `components/pages/planning/variant-comparison-panel.tsx` (variant diff view)

### Navigation/Routing Adjustments

**Current:** Hard page switches (`/courses/[id]`, `/schedule`, `/plan`)

**Proposed:** Single route `/planning` with URL state:
- `/planning?term=2025-Winter&course=CSE142` (opens detail panel)
- `/planning?variant=variant-1` (highlights variant)
- Use Next.js `useSearchParams` for state sync

**Panel management:**
- Use `vaul` drawer (already in dependencies) for mobile panels
- Use `react-resizable-panels` (already in dependencies) for desktop

### Keyboard & Accessibility Plan

**Shortcuts:**
- `Cmd/Ctrl+K`: Focus search (already exists)
- `Cmd/Ctrl+/`: Show shortcuts help
- `Esc`: Close panels
- `Arrow keys`: Navigate search results
- `Enter`: Add course to active term
- `Tab`: Navigate between panes

**Focus management:**
- Focus trap in panels (`@radix-ui/react-dialog` already handles this)
- Roving tabindex for course cards
- Announce schedule changes via `aria-live` regions

**Accessibility:**
- Add `aria-label` to drag handles
- Add `aria-describedby` for conflict warnings
- Keyboard drag alternative (select + move with arrow keys)

**Files to modify:**
- `components/pages/planning/planning-canvas-layout.tsx` (keyboard handlers)
- `components/pages/planning/course-preview-panel.tsx` (focus trap)
- `components/pages/plan/planned-course-card.tsx` (aria labels)

---

## 6. Multi-Term Planning & Roadmap Graph

### Current Implementation

**Location:** `components/pages/plan/term-view-pane.tsx:62-70`

**Current behavior:**
- Grid layout of term cards
- Each term card shows course list
- Add/remove courses per term
- Move courses between terms (via dropdown)

**Data structure:**
- `terms: Term[]` (chronological array)
- `plansByTerm: Record<string, TermPlan>` (termId → courses)

### Longitudinal Board Implementation

**Proposed component:** `components/pages/plan/longitudinal-board.tsx`

**Layout:**
```
LongitudinalBoard
├── HorizontalScrollContainer
│   ├── TermColumn (Winter 2025)
│   │   ├── TermHeader (credits, warnings)
│   │   ├── CourseCard (draggable)
│   │   └── DropZone (for adding)
│   ├── TermColumn (Spring 2025)
│   └── TermColumn (Summer 2025)
└── AddTermButton
```

**Data flow:**
- Reuse `store/course-plan.store.ts` (no changes needed)
- Add `useLongitudinalView` hook for column rendering
- Use `@dnd-kit/core` for drag-and-drop

**Quick-add menu:**
- Add to `components/pages/plan/planned-course-card.tsx`
- Dropdown with term list
- Action: `moveCourse(courseId, fromTermId, toTermId)`

### Prerequisite Graph Overlay

**Data structures to reuse:**
- `convex/dawgpath.ts:43-78` (prerequisite graph structure)
- `convex/courses.getByCourseCode` (course data)

**Computation:**
```typescript
// lib/prereq-utils.ts
export function checkEligibility(
  courseCode: string,
  completedCourses: string[],
  prereqGraph: PrereqGraph
): EligibilityResult {
  // Traverse graph from courseCode backwards
  // Check if all prerequisites are in completedCourses
  // Return blockedBy and missingPrereqs
}

export function buildPrereqChain(
  courseCode: string,
  prereqGraph: PrereqGraph
): PrereqChain {
  // BFS from courseCode to find all prerequisite paths
  // Return directed graph structure
}
```

**Visualization:**
- Use `react-flow` or `vis-network` for graph rendering
- Overlay on course cards: "Blocked by: CSE 142, MATH 126"
- Color coding: green (eligible), yellow (partial), red (blocked)

**Memoization boundaries:**
- Cache eligibility results per `(courseCode, completedCourses)` tuple
- Cache prerequisite chain per `courseCode`
- Invalidate on `completedCourses` change

**Files to create:**
- `lib/prereq-utils.ts` (eligibility logic)
- `components/pages/plan/prereq-graph-overlay.tsx` (visualization)
- `store/prereq-graph.store.ts` (caching)

---

## 7. Smart Warnings & Insights

### Present Logic

**Location:** `store/schedule.store.ts:436-484` (`canAddSession` validation)

**Current warnings:**
- Time conflict (`reason: "time-conflict"`)
- Single/double-letter violation (`reason: "switch-single-letter"`)

**Display:** Toast notifications only (`use-schedule-toggle.ts:150-165`)

### Gaps

**Missing warnings:**
- Credit limit exceeded (UW max: 18 credits typically)
- Missing prerequisites (check against completed courses)
- Requirement gaps (gen ed, major requirements)
- Concurrency violations (e.g., "cannot take CSE 373 with CSE 331")
- Course availability (not offered in selected term)

### Rules Engine Proposal

**File: `lib/warnings-engine.ts`**

```typescript
type WarningRule = {
  id: string
  check: (context: WarningContext) => Warning | null
  severity: "error" | "warning" | "info"
}

type WarningContext = {
  termPlan: TermPlan
  completedCourses: string[]
  prereqGraph: PrereqGraph
  courseData: Map<string, MyplanCourse>
}

export const warningRules: WarningRule[] = [
  {
    id: "credit-limit",
    severity: "error",
    check: (ctx) => {
      const credits = ctx.termPlan.courses.reduce((sum, c) => {
        const credits = c.customCredits ?? c.credits
        return sum + (typeof credits === "number" ? credits : parseFloat(String(credits)) || 0)
      }, 0)
      if (credits > 18) {
        return {
          id: "credit-limit",
          type: "credit-limit",
          severity: "error",
          message: `Term credits (${credits}) exceed UW limit (18)`,
          termId: ctx.termPlan.termId,
        }
      }
      return null
    },
  },
  {
    id: "missing-prereq",
    severity: "error",
    check: (ctx) => {
      // Check each course in termPlan
      for (const course of ctx.termPlan.courses) {
        const eligibility = checkEligibility(
          course.courseCode,
          ctx.completedCourses,
          ctx.prereqGraph
        )
        if (!eligibility.eligible && eligibility.blockedBy.length > 0) {
          return {
            id: `missing-prereq-${course.courseCode}`,
            type: "missing-prereq",
            severity: "error",
            message: `${course.courseCode} blocked by: ${eligibility.blockedBy.join(", ")}`,
            courseCode: course.courseCode,
            termId: ctx.termPlan.termId,
          }
        }
      }
      return null
    },
  },
  // ... more rules
]

export function computeWarnings(context: WarningContext): Warning[] {
  return warningRules
    .map(rule => rule.check(context))
    .filter((w): w is Warning => w !== null)
}
```

**Integration:**
- `components/pages/plan/warnings-panel.tsx` (display warnings)
- `components/pages/planning/warning-badge.tsx` (badge on term cards)
- Hook: `useWarnings(termId)` → `Warning[]`

**Test list:**
- `lib/warnings-engine.test.ts`
  - Credit limit warnings
  - Missing prerequisite detection
  - Requirement gap detection
  - Concurrency violation detection

---

## 8. Personalization & Data Sync

### Current Ingestion

**Location:** `store/favorite-courses.store.ts:54-92`, `store/visit-cache.store.ts:139-195`

**What exists:**
- Favorites (localStorage only)
- Visit tracking (course/major views)
- No past course sync
- No Canvas integration

### Proposed Adapter Interfaces

**Minimal adapter for past courses:**
```typescript
// lib/adapters/past-courses-adapter.ts
export interface PastCoursesAdapter {
  fetchCompletedCourses(userId: string): Promise<CompletedCourse[]>
  fetchCurrentEnrollment(userId: string): Promise<Enrollment[]>
}

// Implementation for Canvas (if available)
export class CanvasPastCoursesAdapter implements PastCoursesAdapter {
  async fetchCompletedCourses(userId: string): Promise<CompletedCourse[]> {
    // Call Canvas API
    // Map to CompletedCourse format
  }
}

// Fallback: manual entry
export class ManualPastCoursesAdapter implements PastCoursesAdapter {
  async fetchCompletedCourses(userId: string): Promise<CompletedCourse[]> {
    // Return from localStorage
  }
}
```

### User-Specific Status Storage

**Where to store:**
- `store/course-plan.store.ts` (extend `PlannedCourse` with `status`)
- Or separate `store/user-progress.store.ts` for completed courses

**Proposed structure:**
```typescript
// In course-plan.store.ts
type PlannedCourse = {
  // ... existing fields
  status?: "completed" | "current" | "planned"
  completedAt?: number
  grade?: string
}

// Separate store for user progress
type UserProgressState = {
  completedCourses: CompletedCourse[]
  currentEnrollment: Enrollment[]
  syncLastAttempted: number
  syncLastSuccess: number
}
```

**Privacy considerations:**
- Store completed courses in localStorage (client-side only)
- Optionally sync to Convex `users` table (requires auth)
- No external API calls without user consent

**Offline considerations:**
- localStorage persistence (already exists via Zustand persist)
- Sync on reconnect (use Convex real-time subscriptions)
- Conflict resolution if local and remote differ

**Files to create:**
- `lib/adapters/past-courses-adapter.ts`
- `store/user-progress.store.ts`
- `components/pages/planning/sync-past-courses-button.tsx`

---

## 9. Roadmap — Phased Plan with Tickets

### Phase 1: Foundations (State Normalization, Scheduling Core, Route/Panel Scaffolding)

**Ticket UC-001: Normalize PlannedCourse with Status Field**  
**Owner:** _blank_  
**Files:** `store/course-plan.store.ts`, `components/pages/plan/planned-course-card.tsx`, `components/pages/plan/term-card.tsx`  
**Acceptance criteria:**
- `PlannedCourse` type includes `status?: "completed" | "current" | "planned"`
- Migration from v2 to v3 handles existing courses (default to "planned")
- Course cards display status badge
- Status can be updated via dropdown menu
- Tests: migration logic, status updates

**Risks/Dependencies:** None  
**Est. complexity:** S

---

**Ticket UC-002: Link Sessions to Terms Explicitly**  
**Owner:** _blank_  
**Files:** `store/course-plan.store.ts`, `store/schedule.store.ts`, `lib/schedule-generator.ts`  
**Acceptance criteria:**
- `PlannedCourse.sessions` → `sessionsByTerm: Record<string, ScheduleSession[]>`
- Migration preserves existing sessions under active term
- `schedule.store.ts` reads from `sessionsByTerm[activeTermId]`
- Tests: migration, session retrieval per term

**Risks/Dependencies:** UC-001 (if done first, simplifies migration)  
**Est. complexity:** M

---

**Ticket UC-003: Extract Prerequisite Graph Utilities**  
**Owner:** _blank_  
**Files:** `lib/prereq-utils.ts` (new), `convex/dawgpath.ts`  
**Acceptance criteria:**
- `buildPrereqGraph(dawgpathData)` returns normalized graph
- `checkEligibility(courseCode, completedCourses, graph)` returns `EligibilityResult`
- `buildPrereqChain(courseCode, graph)` returns prerequisite paths
- Tests: eligibility logic, graph traversal

**Risks/Dependencies:** None  
**Est. complexity:** M

---

**Ticket UC-004: Add Schedule Variant Filters**  
**Owner:** _blank_  
**Files:** `lib/schedule-generator.ts`, `components/schedule/use-schedule-generation.tsx`, `components/schedule/generated-schedules-panel.tsx`  
**Acceptance criteria:**
- `generateScheduleVariants` accepts `filters?: ScheduleFilters`
- Filters: `maxVariants`, `excludeDays`, `timeRange`, `maxCredits`
- UI: Filter panel in `generated-schedules-panel.tsx`
- Tests: filter application, variant count limits

**Risks/Dependencies:** None  
**Est. complexity:** M

---

**Ticket UC-005: Add Variant Memoization**  
**Owner:** _blank_  
**Files:** `lib/schedule-generator.ts`  
**Acceptance criteria:**
- Conflict checks cached in `Map<sessionId1-sessionId2, boolean>`
- Cache cleared on course/session changes
- Performance: 50%+ reduction in conflict check time for 10+ variants
- Tests: cache hit rate, correctness

**Risks/Dependencies:** UC-004 (filters may affect caching strategy)  
**Est. complexity:** S

---

**Ticket UC-006: Create Planning Canvas Layout Scaffold**  
**Owner:** _blank_  
**Files:** `app/(main)/planning/page.tsx` (new), `components/pages/planning/planning-canvas-layout.tsx` (new)  
**Acceptance criteria:**
- 3-pane layout: search (left), schedule (center), detail (right)
- Responsive: mobile stacks vertically, desktop side-by-side
- Uses `react-resizable-panels` for desktop resizing
- Routes to `/planning` without breaking existing routes
- Tests: layout rendering, responsive behavior

**Risks/Dependencies:** None  
**Est. complexity:** M

---

### Phase 2: Unified Canvas (Layout, Panels, Omnibox, Inline Preview)

**Ticket UC-007: Convert Course Detail to Panel**  
**Owner:** _blank_  
**Files:** `components/pages/course-detail-page.tsx`, `components/pages/planning/course-detail-panel.tsx` (new), `components/pages/planning/planning-canvas-layout.tsx`  
**Acceptance criteria:**
- `course-detail-panel.tsx` renders same content as detail page
- Panel opens/closes via URL state (`?course=CSE142`)
- Panel closes on `Esc` or outside click
- Mobile: drawer via `vaul`
- Tests: panel open/close, URL sync

**Risks/Dependencies:** UC-006  
**Est. complexity:** M

---

**Ticket UC-008: Add Course Preview Panel**  
**Owner:** _blank_  
**Files:** `components/pages/planning/course-preview-panel.tsx` (new), `components/course-search.tsx`  
**Acceptance criteria:**
- Preview opens on search item hover (desktop) or click (mobile)
- Shows: course code, title, credits, gen ed, quick stats
- "Add to term" buttons for each term
- Closes on hover out or `Esc`
- Tests: preview trigger, content display

**Risks/Dependencies:** UC-006  
**Est. complexity:** M

---

**Ticket UC-009: Refactor Search to Non-Navigating**  
**Owner:** _blank_  
**Files:** `components/course-search.tsx`, `hooks/use-course-search.ts`  
**Acceptance criteria:**
- Search no longer navigates on Enter (unless in standalone search page)
- Callback prop: `onCourseSelect?: (courseCode: string) => void`
- Preview panel opens on select
- Existing `/courses/[id]` route still works
- Tests: search behavior, callback invocation

**Risks/Dependencies:** UC-008  
**Est. complexity:** S

---

**Ticket UC-010: Add Keyboard Shortcuts**  
**Owner:** _blank_  
**Files:** `components/pages/planning/planning-canvas-layout.tsx`, `components/ui/keyboard-shortcuts-help.tsx` (new)  
**Acceptance criteria:**
- `Cmd/Ctrl+K`: Focus search
- `Esc`: Close panels
- `Cmd/Ctrl+/`: Show shortcuts help
- `Arrow keys`: Navigate search results
- `Enter`: Add course to active term
- Shortcuts help modal
- Tests: shortcut handling, help modal

**Risks/Dependencies:** UC-006, UC-007  
**Est. complexity:** S

---

### Phase 3: Smart Schedule Simulation (Variants, Rule Filters, Caching)

**Ticket UC-011: Add Variant Saving**  
**Owner:** _blank_  
**Files:** `store/schedule.store.ts`, `components/schedule/generated-schedules-panel.tsx`  
**Acceptance criteria:**
- `saveVariant(variantId, name)` persists to localStorage
- `loadVariant(variantId)` restores variant
- Variant list shows saved variants
- Variant can be renamed/deleted
- Tests: save/load, persistence

**Risks/Dependencies:** UC-004  
**Est. complexity:** M

---

**Ticket UC-012: Add Variant Comparison View**  
**Owner:** _blank_  
**Files:** `components/schedule/variant-comparison-panel.tsx` (new), `lib/schedule-generator.ts`  
**Acceptance criteria:**
- `compareVariants(variant1, variant2)` returns `VariantDiff`
- Diff shows: courses added/removed, sessions changed, time differences
- Side-by-side comparison UI
- Highlight differences
- Tests: diff computation, UI rendering

**Risks/Dependencies:** UC-011  
**Est. complexity:** M

---

**Ticket UC-013: Add Variant Scoring**  
**Owner:** _blank_  
**Files:** `lib/schedule-generator.ts`, `components/schedule/generated-schedules-panel.tsx`  
**Acceptance criteria:**
- `scoreVariant(variant)` returns number (higher = better)
- Scoring factors: fewer days, morning preference, credit balance
- Variants sorted by score (highest first)
- Score displayed in variant list
- Tests: scoring logic, sorting

**Risks/Dependencies:** UC-004  
**Est. complexity:** S

---

**Ticket UC-014: Add Conflict Resolution Panel**  
**Owner:** _blank_  
**Files:** `components/schedule/conflict-resolution-panel.tsx` (new), `lib/schedule-generator.ts`  
**Acceptance criteria:**
- `findAlternativeSessions(courseCode, conflictSession)` returns alternatives
- Panel shows: conflicting sessions, alternative sessions, "switch" buttons
- Visual conflict overlay on calendar
- Tests: alternative finding, conflict display

**Risks/Dependencies:** UC-005  
**Est. complexity:** M

---

### Phase 4: Multi-Term Board + Prereq Overlay

**Ticket UC-015: Create Longitudinal Board View**  
**Owner:** _blank_  
**Files:** `components/pages/plan/longitudinal-board.tsx` (new), `components/pages/plan/term-view-pane.tsx`  
**Acceptance criteria:**
- Horizontal scroll layout (columns = terms)
- Each column: term header, course cards, drop zone
- Reuses `term-card.tsx` styling
- Toggle between grid and board view
- Tests: layout, scrolling

**Risks/Dependencies:** None  
**Est. complexity:** M

---

**Ticket UC-016: Add Drag-and-Drop for Course Cards**  
**Owner:** _blank_  
**Files:** `components/pages/plan/planned-course-card.tsx`, `components/pages/plan/term-card.tsx`, `store/course-plan.store.ts`  
**Acceptance criteria:**
- Integrate `@dnd-kit/core`
- Course cards draggable
- Term cards have drop zones
- `moveCourse` called on drop
- Visual feedback during drag
- Keyboard alternative (select + arrow keys)
- Tests: drag-and-drop, keyboard alternative

**Risks/Dependencies:** UC-015  
**Est. complexity:** L

---

**Ticket UC-017: Add Quick-Add Menu to Course Cards**  
**Owner:** _blank_  
**Files:** `components/pages/plan/planned-course-card.tsx`, `components/pages/planning/course-preview-panel.tsx`  
**Acceptance criteria:**
- Dropdown menu on course card with term list
- "Add to [Term]" actions
- `moveCourse` called on selection
- Works in both grid and board views
- Tests: menu display, move action

**Risks/Dependencies:** UC-016  
**Est. complexity:** S

---

**Ticket UC-018: Render Prerequisite Graph**  
**Owner:** _blank_  
**Files:** `components/pages/plan/prereq-graph-overlay.tsx` (new), `lib/prereq-utils.ts`  
**Acceptance criteria:**
- Graph renders using `react-flow` or `vis-network`
- Shows prerequisite chain for selected course
- Interactive: click nodes to navigate
- Overlay on course detail panel
- Tests: graph rendering, node interaction

**Risks/Dependencies:** UC-003  
**Est. complexity:** M

---

**Ticket UC-019: Add Eligibility Badges to Course Cards**  
**Owner:** _blank_  
**Files:** `components/pages/plan/planned-course-card.tsx`, `lib/prereq-utils.ts`  
**Acceptance criteria:**
- "Blocked by: CSE 142" badge if not eligible
- "Eligible" badge if prerequisites met
- Badge color: green (eligible), yellow (partial), red (blocked)
- Badge tooltip shows missing prerequisites
- Tests: badge display, eligibility checking

**Risks/Dependencies:** UC-003  
**Est. complexity:** S

---

### Phase 5: Insights & Personalization

**Ticket UC-020: Implement Warnings Engine**  
**Owner:** _blank_  
**Files:** `lib/warnings-engine.ts` (new), `components/pages/plan/warnings-panel.tsx` (new)  
**Acceptance criteria:**
- `computeWarnings(context)` returns `Warning[]`
- Rules: credit limit, missing prereq, requirement gap, conflict
- Warnings panel displays all warnings for active term
- Warning badges on term cards
- Tests: warning computation, display

**Risks/Dependencies:** UC-003  
**Est. complexity:** M

---

**Ticket UC-021: Add Requirement Tracking**  
**Owner:** _blank_  
**Files:** `store/requirements.store.ts` (new), `lib/warnings-engine.ts`  
**Acceptance criteria:**
- Track gen ed requirements per term
- Track major requirements (if available)
- `computeRequirementCoverage(termPlan)` returns coverage %
- Warning if requirements not met
- Tests: requirement tracking, coverage computation

**Risks/Dependencies:** UC-020  
**Est. complexity:** M

---

**Ticket UC-022: Add Past Courses Sync Adapter**  
**Owner:** _blank_  
**Files:** `lib/adapters/past-courses-adapter.ts` (new), `store/user-progress.store.ts` (new)  
**Acceptance criteria:**
- `PastCoursesAdapter` interface
- `ManualPastCoursesAdapter` implementation (localStorage)
- `CanvasPastCoursesAdapter` stub (if Canvas API available)
- "Sync from Canvas" button (if authenticated)
- Tests: adapter interface, manual sync

**Risks/Dependencies:** None  
**Est. complexity:** M

---

**Ticket UC-023: Add User Progress Store**  
**Owner:** _blank_  
**Files:** `store/user-progress.store.ts` (new), `store/course-plan.store.ts`  
**Acceptance criteria:**
- `UserProgressState` tracks completed courses, current enrollment
- `markAsCompleted(courseCode, termId)` action
- Completed courses considered in eligibility checks
- Sync status tracking
- Tests: progress tracking, eligibility integration

**Risks/Dependencies:** UC-022, UC-003  
**Est. complexity:** M

---

## 10. Metrics & Telemetry

### What to Instrument

**Time-to-valid-schedule:**
- Measure: Time from "add course" to "first valid variant generated"
- Events: `schedule.variant_generated`, `schedule.variant_generation_time_ms`

**Variant comparisons:**
- Measure: Number of variants compared, comparison time
- Events: `schedule.variants_compared`, `schedule.comparison_time_ms`

**Drag usage:**
- Measure: Drag-and-drop vs menu selection ratio
- Events: `planning.course_moved_drag`, `planning.course_moved_menu`

**Conflict rate:**
- Measure: Percentage of sessions that conflict
- Events: `schedule.conflict_detected`, `schedule.conflict_resolved`

**Search patterns:**
- Measure: Search queries, result selections
- Events: `search.query`, `search.result_selected`

### Proposed Event Schema

```typescript
type TelemetryEvent = {
  name: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
}

// Examples
{
  name: "schedule.variant_generated",
  properties: {
    courseCount: 5,
    variantCount: 12,
    generationTimeMs: 234,
    filtersApplied: ["noFriday", "morningOnly"]
  },
  timestamp: 1234567890
}

{
  name: "planning.course_moved_drag",
  properties: {
    courseCode: "CSE 142",
    fromTermId: "2025-Winter",
    toTermId: "2025-Spring"
  },
  timestamp: 1234567890
}
```

### Integration Points

**Files to instrument:**
- `lib/schedule-generator.ts` (variant generation)
- `store/course-plan.store.ts` (course moves)
- `components/pages/planning/planning-canvas-layout.tsx` (drag events)
- `components/course-search.tsx` (search events)

**Implementation:**
- Use `@vercel/analytics` (already in dependencies) for production
- Dev: `console.log` or custom telemetry service
- Hook: `useTelemetry()` → `(event: TelemetryEvent) => void`

---

## 11. Open Questions

### Q1: Canvas API Integration

**Question:** Can we access UW Canvas API to sync past courses?

**Proposed answer:**
- Spike: Research Canvas API documentation, OAuth flow
- If available: Implement `CanvasPastCoursesAdapter` (UC-022)
- If not: Manual entry only

**Action:** Create `docs/CANVAS_API_INTEGRATION.md` spike doc

---

### Q2: Degree Requirement Data Source

**Question:** Where do degree requirements come from? (Major requirements, gen ed rules)

**Proposed answer:**
- Option 1: Scrape from MyPlan (similar to course scraping)
- Option 2: Manual entry/admins
- Option 3: User-defined requirements

**Action:** Check `convex/myplan.ts` for requirement data availability

---

### Q3: Concurrent Course Rules

**Question:** Are there official rules for concurrent courses? (e.g., "CSE 373 cannot be taken with CSE 331")

**Proposed answer:**
- Check `convex/dawgpath.ts:21-29` (`concurrent_courses` data)
- If available: Add to warnings engine (UC-020)
- If not: Skip concurrent violation warnings

**Action:** Inspect `dawgpath.ts` data structure, test with real courses

---

### Q4: Performance Limits for Variant Generation

**Question:** What's the maximum number of courses/sessions before variant generation becomes too slow?

**Proposed answer:**
- Benchmark: Generate variants for 3, 5, 7, 10 courses
- Target: < 1s for 5 courses, < 5s for 10 courses
- If exceeded: Add hard limit (e.g., max 10 variants) or early termination

**Action:** Create `scripts/benchmark-variant-generation.ts`

---

### Q5: Data Freshness

**Question:** How often should course/session data be refreshed? (MyPlan updates, enrollment changes)

**Proposed answer:**
- Current: `updateIntervalSeconds` in `convex/myplan.ts` (6h-24h)
- Consider: Real-time updates via Convex subscriptions
- User-facing: Show "last updated" timestamp

**Action:** Review `convex/crons.ts` for update frequency

---

## 12. Appendix

### A. File Inventory

**Core Planning:**
- `store/course-plan.store.ts` - Multi-term planning state (Zustand)
- `store/schedule.store.ts` - Active term scheduling state (Zustand)
- `components/pages/plan/course-plan-studio.tsx` - Main planning UI
- `components/pages/plan/term-view-pane.tsx` - Term grid view
- `components/pages/plan/term-card.tsx` - Individual term card
- `components/pages/plan/planned-course-card.tsx` - Course card in plan

**Scheduling:**
- `lib/schedule-generator.ts` - Variant generation algorithm
- `components/schedule/schedule-calendar.tsx` - Calendar view
- `components/schedule/generated-schedules-panel.tsx` - Variant list
- `components/schedule/use-schedule-generation.tsx` - Variant generation hook

**Course Detail:**
- `components/pages/course-detail-page.tsx` - Course detail page
- `components/pages/course-detail/course-detail-header.tsx` - Header
- `components/pages/course-detail/course-sessions-list-view.tsx` - Session list
- `components/pages/course-detail/course-sessions-calendar-view.tsx` - Session calendar

**Search:**
- `components/course-search.tsx` - Main search component
- `hooks/use-course-search.ts` - Search logic hook
- `components/pages/plan/course-browse-pane.tsx` - Plan studio search

**Data:**
- `convex/schema.ts` - Database schema
- `convex/courses.ts` - Course queries
- `convex/myplan.ts` - MyPlan API integration
- `convex/dawgpath.ts` - DawgPath data (prerequisites)

**Utilities:**
- `lib/utils.ts` - Helper functions (`expandDays`, `parseTimeRangeToMinutes`)
- `lib/cec-utils.ts` - CEC (evaluation) utilities
- `lib/course-utils.ts` - Course utilities

### B. Key Types/Interfaces

**PlannedCourse** (`store/course-plan.store.ts:26-35`)
```typescript
type PlannedCourse = {
  id: string
  courseCode: string
  courseTitle?: string
  credits: number | string
  customCredits?: number
  sessions: ScheduleSession[]
  notes?: string
  color?: string
}
```

**ScheduleSession** (`store/course-plan.store.ts:16-23`)
```typescript
type ScheduleSession = {
  id: string
  code: string
  type?: string
  instructor?: string
  registrationCode?: string | number
  meetingDetailsList?: ScheduleMeeting[]
}
```

**TermPlan** (`store/course-plan.store.ts:46-49`)
```typescript
type TermPlan = {
  termId: string
  courses: PlannedCourse[]
}
```

### C. Test Plan Outline

**Unit Tests:**
- `lib/schedule-generator.test.ts` - Variant generation, conflict detection
- `lib/prereq-utils.test.ts` - Eligibility checking, graph traversal
- `lib/warnings-engine.test.ts` - Warning computation
- `store/course-plan.store.test.ts` - State management, migrations

**Integration Tests:**
- `components/pages/planning/planning-canvas-layout.test.tsx` - Layout rendering
- `components/schedule/generated-schedules-panel.test.tsx` - Variant display
- `components/pages/plan/longitudinal-board.test.tsx` - Board view

**Interaction Tests:**
- `e2e/planning-flow.spec.ts` - Full planning flow (add course, generate variants, save)
- `e2e/drag-and-drop.spec.ts` - Drag course between terms
- `e2e/search-preview.spec.ts` - Search → preview → add to term

### D. Glossary

**Session:** A specific section of a course (e.g., "CSE 142 A", "CSE 142 AA"). Sessions have meeting times, instructors, enrollment.

**Section:** Synonym for session (used interchangeably in codebase).

**Meeting:** A single time/location instance within a session (e.g., "MWF 10:30 AM-11:20 AM, Room 123").

**Term:** A quarter/semester (Winter, Spring, Summer, Autumn) in a specific year (e.g., "2025-Winter").

**Quarter:** Synonym for term (UW uses quarters, not semesters).

**Plan:** A collection of courses planned for a specific term (`TermPlan`).

**Variant:** A valid schedule combination generated from courses without selected sessions. Each variant assigns specific sessions to each course.

**Prerequisite:** A course that must be completed before taking another course (e.g., "CSE 142" is a prerequisite for "CSE 143").

**Concurrent:** A course that can be taken at the same time as another course (with restrictions).

**Eligibility:** Whether a user can take a course based on completed prerequisites.

**Conflict:** Two sessions that overlap in time and share at least one day.

---

**End of Report**

