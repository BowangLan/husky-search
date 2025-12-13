# Implementation Plan: Enhanced Multi-Quarter Course Management

**Date:** 2025-01-11
**Status:** Draft for Review
**Focus:** UI distinction for active vs planning quarters, backend persistence with Convex + Clerk

---

## Executive Summary

Enhance the existing course planning system to clearly distinguish between **active quarters** (current enrollment with detailed session scheduling) and **planning quarters** (future/past terms with course-level planning only). Add backend persistence using Convex with Clerk authentication for cross-device sync.

### Current State
- ✅ Multi-quarter planning with localStorage persistence
- ✅ Course management across terms (add/remove/move)
- ✅ Session/schedule management
- ✅ Credit tracking and basic UI
- ❌ No distinction between active vs planning quarters
- ❌ No backend persistence (localStorage only)
- ❌ No user authentication integration
- ❌ No cross-device sync

### Target State
- ✅ Clear UI distinction: active quarters (with sessions) vs planning quarters (course codes only)
- ✅ Backend persistence in Convex with Clerk user authentication
- ✅ Cross-device sync with real-time updates
- ✅ Authenticated users only (anonymous users redirected to sign-in)
- ✅ Simplified course addition for non-active quarters (no session picker)

---

## Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Zustand Store (Local State)                 │  │
│  │  - terms, plansByTerm, activeTermIds                  │  │
│  │  - Optimistic updates                                 │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                        │
│                     │ Sync on mutations                     │
│                     ↓                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Convex Mutations/Queries                     │  │
│  │  - createPlan, updatePlan, syncPlan                   │  │
│  └──────────────────┬───────────────────────────────────┘  │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      │ Real-time subscription
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                    Convex Backend                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            coursePlans Table                          │  │
│  │  - userId (Clerk ID)                                  │  │
│  │  - terms (JSON)                                       │  │
│  │  - plansByTerm (JSON)                                 │  │
│  │  - activeTermIds (array)                              │  │
│  │  - metadata (created, updated)                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Authentication: Clerk JWT validation                        │
└─────────────────────────────────────────────────────────────┘
```

### Term States

```typescript
// Terms can be in one of three states:
type TermStatus = "completed" | "active" | "planned"

// Derived from:
// - completed: term.id not in activeTermIds && term is in the past
// - active: term.id in activeTermIds (1-2 terms, typically current quarter)
// - planned: term.id not in activeTermIds && term is in the future
```

---

## Implementation Plan

### Phase 1: Database Schema & Backend Setup

#### 1.1 Create Convex Schema for Course Plans

**File:** `convex/schema.ts` (modify)

Add new table definition:

```typescript
coursePlans: defineTable({
  userId: v.string(), // Clerk user ID
  name: v.optional(v.string()), // Plan name (e.g., "4-Year Plan", "Default")
  isDefault: v.boolean(), // Whether this is the user's default plan

  // Core plan data (synced from Zustand store)
  terms: v.array(v.object({
    id: v.string(),
    year: v.number(),
    quarter: v.string(), // "Winter" | "Spring" | "Summer" | "Autumn"
    label: v.string(),
  })),

  plansByTerm: v.any(), // Record<string, TermPlan> - flexible JSON structure
  activeTermIds: v.array(v.string()), // List of active term IDs

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  lastSyncedAt: v.optional(v.number()),
  version: v.number(), // For conflict resolution
})
  .index("by_user_id", ["userId"])
  .index("by_user_and_default", ["userId", "isDefault"])
```

**Files to create:**
- `convex/coursePlans.ts` - Mutations and queries for course plans

#### 1.2 Implement Convex Functions

**File:** `convex/coursePlans.ts` (new)

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// Get user's default plan
export const getDefaultPlan = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const plan = await ctx.db
      .query("coursePlans")
      .withIndex("by_user_and_default", (q) =>
        q.eq("userId", identity.subject).eq("isDefault", true)
      )
      .first();

    return plan;
  },
});

// Get all plans for a user
export const getUserPlans = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const plans = await ctx.db
      .query("coursePlans")
      .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
      .collect();

    return plans;
  },
});

// Create new plan
export const createPlan = mutation({
  args: {
    name: v.optional(v.string()),
    isDefault: v.boolean(),
    terms: v.any(),
    plansByTerm: v.any(),
    activeTermIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // If this is set as default, unset other defaults
    if (args.isDefault) {
      const existingPlans = await ctx.db
        .query("coursePlans")
        .withIndex("by_user_id", (q) => q.eq("userId", identity.subject))
        .collect();

      for (const plan of existingPlans) {
        if (plan.isDefault) {
          await ctx.db.patch(plan._id, { isDefault: false });
        }
      }
    }

    const now = Date.now();
    const planId = await ctx.db.insert("coursePlans", {
      userId: identity.subject,
      name: args.name ?? "My Course Plan",
      isDefault: args.isDefault,
      terms: args.terms,
      plansByTerm: args.plansByTerm,
      activeTermIds: args.activeTermIds,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    return planId;
  },
});

// Update existing plan
export const updatePlan = mutation({
  args: {
    planId: v.id("coursePlans"),
    terms: v.optional(v.any()),
    plansByTerm: v.optional(v.any()),
    activeTermIds: v.optional(v.array(v.string())),
    version: v.number(), // For optimistic concurrency control
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existingPlan = await ctx.db.get(args.planId);
    if (!existingPlan) throw new Error("Plan not found");
    if (existingPlan.userId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Version check for conflict detection
    if (existingPlan.version !== args.version) {
      throw new Error("Plan has been modified by another device");
    }

    const updates: any = {
      updatedAt: Date.now(),
      version: existingPlan.version + 1,
    };

    if (args.terms !== undefined) updates.terms = args.terms;
    if (args.plansByTerm !== undefined) updates.plansByTerm = args.plansByTerm;
    if (args.activeTermIds !== undefined) updates.activeTermIds = args.activeTermIds;

    await ctx.db.patch(args.planId, updates);

    return { success: true, version: updates.version };
  },
});

// Delete plan
export const deletePlan = mutation({
  args: {
    planId: v.id("coursePlans"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.userId !== identity.subject) throw new Error("Unauthorized");

    await ctx.db.delete(args.planId);
    return { success: true };
  },
});

// Set active terms (marks which quarters are "current enrollment")
export const setActiveTerms = mutation({
  args: {
    planId: v.id("coursePlans"),
    activeTermIds: v.array(v.string()),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const plan = await ctx.db.get(args.planId);
    if (!plan) throw new Error("Plan not found");
    if (plan.userId !== identity.subject) throw new Error("Unauthorized");
    if (plan.version !== args.version) {
      throw new Error("Plan has been modified");
    }

    await ctx.db.patch(args.planId, {
      activeTermIds: args.activeTermIds,
      updatedAt: Date.now(),
      version: plan.version + 1,
    });

    return { success: true, version: plan.version + 1 };
  },
});
```

---

### Phase 2: Authentication & Middleware

#### 2.1 Protect the /plan Route

**File:** `middleware.ts` (modify)

Update to protect the planning route:

```typescript
const isPrivateRoute = createRouteMatcher(['/profile', '/plan'])
```

#### 2.2 Create Plan Page with Auth Check

**File:** `app/(plan-studio)/plan/page.tsx` (modify)

Add server-side auth check:

```typescript
import { Metadata } from "next"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CoursePlanStudio } from "@/components/pages/plan/course-plan-studio"

export const metadata: Metadata = {
  title: "Course Plan Studio | Husky Search",
  description: "Plan your courses across multiple quarters at UW",
}

export default async function CoursePlanPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/plan")
  }

  return <CoursePlanStudio />
}
```

---

### Phase 3: Frontend Store Enhancement

#### 3.1 Add Sync Layer to Zustand Store

**File:** `store/course-plan.store.ts` (modify)

Add new state and actions for backend sync:

```typescript
export type CoursePlanState = {
  // ... existing fields ...

  // Backend sync
  convexPlanId: Id<"coursePlans"> | null
  syncStatus: "idle" | "syncing" | "synced" | "error"
  syncError: string | null
  lastSyncedAt: number | null
  localVersion: number // Track local changes

  // New actions
  setSyncStatus: (status: CoursePlanState["syncStatus"], error?: string) => void
  setConvexPlanId: (planId: Id<"coursePlans"> | null) => void
  syncToBackend: () => Promise<void>
  loadFromBackend: (planData: any) => void

  // Mark term as active/inactive
  toggleActiveTerms: (termIds: string[]) => void
}
```

Add implementation in the store:

```typescript
// Inside the store creator function:
{
  // ... existing state ...
  convexPlanId: null,
  syncStatus: "idle",
  syncError: null,
  lastSyncedAt: null,
  localVersion: 0,

  setSyncStatus: (status, error) => {
    set({ syncStatus: status, syncError: error ?? null })
  },

  setConvexPlanId: (planId) => {
    set({ convexPlanId: planId })
  },

  loadFromBackend: (planData) => {
    if (!planData) return

    set({
      terms: planData.terms ?? [],
      plansByTerm: planData.plansByTerm ?? {},
      activeTermIds: planData.activeTermIds ?? [],
      convexPlanId: planData._id,
      localVersion: planData.version ?? 0,
      lastSyncedAt: planData.updatedAt ?? Date.now(),
      syncStatus: "synced",
    })
  },

  toggleActiveTerms: (termIds: string[]) => {
    set((state) => {
      const newActiveTermIds = [...termIds]
      return {
        activeTermIds: newActiveTermIds,
        localVersion: state.localVersion + 1,
      }
    })
  },

  // Existing actions should increment localVersion on changes
  addTerm: (year: number, quarter: Quarter) => {
    set((state) => {
      // ... existing logic ...
      return {
        // ... existing updates ...
        localVersion: state.localVersion + 1,
      }
    })
  },

  // ... repeat for other mutation actions ...
}
```

---

### Phase 4: Sync Hook & Logic

#### 4.1 Create Sync Hook

**File:** `hooks/use-course-plan-sync.ts` (new)

```typescript
"use client"

import { useEffect, useCallback, useRef } from "react"
import { useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useCoursePlan } from "@/store/course-plan.store"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

export function useCoursePlanSync() {
  const { user } = useUser()
  const store = useCoursePlan()
  const syncTimeoutRef = useRef<NodeJS.Timeout>()

  // Convex hooks
  const defaultPlan = useQuery(
    api.coursePlans.getDefaultPlan,
    user ? {} : "skip"
  )
  const createPlan = useMutation(api.coursePlans.createPlan)
  const updatePlan = useMutation(api.coursePlans.updatePlan)

  // Initial load from backend
  useEffect(() => {
    if (!user || !defaultPlan || !store.hydrated) return

    // Only load if we don't have a local plan or it's outdated
    if (
      !store.convexPlanId ||
      !store.lastSyncedAt ||
      (defaultPlan.updatedAt > store.lastSyncedAt)
    ) {
      console.log("[Sync] Loading plan from backend")
      store.loadFromBackend(defaultPlan)
    }
  }, [user, defaultPlan, store.hydrated])

  // Sync to backend when local changes occur
  const syncToBackend = useCallback(async () => {
    if (!user || !store.hydrated) return
    if (store.syncStatus === "syncing") return

    try {
      store.setSyncStatus("syncing")

      const planData = {
        terms: store.terms,
        plansByTerm: store.plansByTerm,
        activeTermIds: store.activeTermIds,
      }

      if (!store.convexPlanId) {
        // Create new plan
        console.log("[Sync] Creating new plan")
        const planId = await createPlan({
          name: "My Course Plan",
          isDefault: true,
          ...planData,
        })
        store.setConvexPlanId(planId as Id<"coursePlans">)
      } else {
        // Update existing plan
        console.log("[Sync] Updating plan")
        const result = await updatePlan({
          planId: store.convexPlanId,
          ...planData,
          version: store.localVersion,
        })

        if (result.version) {
          set((state) => ({ localVersion: result.version }))
        }
      }

      store.setSyncStatus("synced")
      console.log("[Sync] Sync successful")
    } catch (error) {
      console.error("[Sync] Error:", error)
      const errorMessage = error instanceof Error ? error.message : "Sync failed"

      if (errorMessage.includes("modified by another device")) {
        toast.error("Plan conflict", {
          description: "Your plan was modified on another device. Refreshing...",
        })
        // Reload from backend
        if (defaultPlan) {
          store.loadFromBackend(defaultPlan)
        }
      } else {
        store.setSyncStatus("error", errorMessage)
        toast.error("Failed to sync plan", {
          description: errorMessage,
        })
      }
    }
  }, [user, store, createPlan, updatePlan, defaultPlan])

  // Debounced sync on local changes
  useEffect(() => {
    if (!user || !store.hydrated) return
    if (store.localVersion === 0) return // Initial state

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }

    // Debounce sync by 2 seconds
    syncTimeoutRef.current = setTimeout(() => {
      syncToBackend()
    }, 2000)

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [
    store.terms,
    store.plansByTerm,
    store.activeTermIds,
    store.localVersion,
    syncToBackend,
  ])

  return {
    syncStatus: store.syncStatus,
    syncError: store.syncError,
    lastSyncedAt: store.lastSyncedAt,
    manualSync: syncToBackend,
  }
}
```

---

### Phase 5: UI Enhancements

#### 5.1 Add Active Term Toggle UI

**File:** `components/pages/plan/term-card.tsx` (modify)

Add toggle button to mark term as active:

```typescript
// Add to imports
import { Zap } from "lucide-react"
import { useCoursePlan, useActiveTermIds } from "@/store/course-plan.store"

// Inside component
const { toggleActiveTerms } = useCoursePlan()
const activeTermIds = useActiveTermIds()
const isActive = activeTermIds.includes(term.id)

// Add to dropdown menu or header
<DropdownMenuItem
  onClick={() => {
    const newActiveTermIds = isActive
      ? activeTermIds.filter(id => id !== term.id)
      : [...activeTermIds, term.id]
    toggleActiveTerms(newActiveTermIds)
  }}
>
  <Zap className="size-4 mr-2" />
  {isActive ? "Mark as Planning" : "Mark as Active"}
</DropdownMenuItem>

// Add visual indicator in header
{isActive && (
  <Badge variant="default" className="bg-blue-600">
    <Zap className="size-3 mr-1" />
    Active
  </Badge>
)}
```

#### 5.2 Simplify Course Addition for Non-Active Terms

**File:** `components/pages/plan/course-search-dialog.tsx` (modify)

Detect if target term is active and show appropriate UI:

```typescript
// Check if target term is active
const activeTermIds = useActiveTermIds()
const isTargetTermActive = targetTermId && activeTermIds.includes(targetTermId)

// Modify the add course handler
const handleAddCourse = useCallback(
  (courseCode: string) => {
    // ... existing validation ...

    addCourse(targetTermId, {
      courseCode,
      courseTitle: undefined, // Could fetch from API if needed
      credits: 5, // Default credits
      sessions: [], // Empty for non-active terms
    })

    // Show different toast message based on term status
    toast.success(
      isTargetTermActive ? "Course added to active term" : "Course added to plan",
      {
        description: isTargetTermActive
          ? `${courseCode} added to ${term.label}. Add sessions from the course detail page.`
          : `${courseCode} added to ${term.label} for planning.`,
      }
    )
  },
  [targetTermId, terms, addCourse, isTargetTermActive]
)
```

#### 5.3 Add Session Selector for Active Terms Only

**File:** `components/pages/course-detail/course-detail-header.tsx` (modify)

Only show "Add to Schedule" button when viewing active terms:

```typescript
// In the component that renders add to schedule button
const activeTermIds = useActiveTermIds()

// Conditionally render based on whether we're in an active term
{activeTermIds.length > 0 && (
  <Button
    variant="default"
    onClick={handleAddToSchedule}
    disabled={!someActiveTermHasThisCourse}
  >
    <Plus className="size-4 mr-2" />
    Add Session to Active Term
  </Button>
)}
```

#### 5.4 Add Sync Status Indicator

**File:** `components/pages/plan/plan-toolbar.tsx` (modify)

Add sync status indicator to toolbar:

```typescript
import { useCoursePlanSync } from "@/hooks/use-course-plan-sync"
import { Cloud, CloudOff, Loader2, CloudCheck } from "lucide-react"

// Inside component
const { syncStatus, lastSyncedAt, manualSync } = useCoursePlanSync()

const getSyncIcon = () => {
  switch (syncStatus) {
    case "syncing":
      return <Loader2 className="size-4 animate-spin" />
    case "synced":
      return <CloudCheck className="size-4 text-green-600" />
    case "error":
      return <CloudOff className="size-4 text-destructive" />
    default:
      return <Cloud className="size-4" />
  }
}

// Add to toolbar
<Button
  variant="ghost"
  size="sm"
  onClick={manualSync}
  disabled={syncStatus === "syncing"}
  className="gap-2"
>
  {getSyncIcon()}
  <span className="text-xs text-muted-foreground">
    {syncStatus === "synced" && lastSyncedAt
      ? `Synced ${formatTimeAgo(lastSyncedAt)}`
      : syncStatus === "syncing"
      ? "Syncing..."
      : syncStatus === "error"
      ? "Sync failed"
      : "Not synced"}
  </span>
</Button>
```

---

### Phase 6: Helper Utilities

#### 6.1 Create Term Status Helper

**File:** `lib/plan/get-term-status.ts` (new)

```typescript
import { Term } from "@/store/course-plan.store"

export type TermStatus = "completed" | "active" | "planned"

/**
 * Derives term status from term data and active term IDs
 */
export function getTermStatus(
  term: Term,
  activeTermIds: string[],
  allTerms: Term[]
): TermStatus {
  // Check if term is active
  if (activeTermIds.includes(term.id)) {
    return "active"
  }

  // Find the earliest active term
  const activeTerms = allTerms.filter((t) => activeTermIds.includes(t.id))
  if (activeTerms.length === 0) {
    // No active terms set - treat all as planned
    return "planned"
  }

  // Sort active terms chronologically
  const sortedActiveTerms = activeTerms.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return quarterOrder[a.quarter as Quarter] - quarterOrder[b.quarter as Quarter]
  })

  const earliestActiveTerm = sortedActiveTerms[0]

  // Compare this term with the earliest active term
  const thisTermOrder = term.year * 10 + quarterOrder[term.quarter as Quarter]
  const earliestActiveTermOrder =
    earliestActiveTerm.year * 10 + quarterOrder[earliestActiveTerm.quarter as Quarter]

  if (thisTermOrder < earliestActiveTermOrder) {
    return "completed"
  }

  return "planned"
}

const quarterOrder: Record<string, number> = {
  Winter: 1,
  Spring: 2,
  Summer: 3,
  Autumn: 4,
}
```

#### 6.2 Create Status Badge Component

**File:** `components/ui/term-status-badge.tsx` (new)

```typescript
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Zap } from "lucide-react"
import { TermStatus } from "@/lib/plan/get-term-status"

type TermStatusBadgeProps = {
  status: TermStatus
  className?: string
}

export function TermStatusBadge({ status, className }: TermStatusBadgeProps) {
  const config = {
    completed: {
      label: "Completed",
      icon: CheckCircle2,
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    },
    active: {
      label: "Active",
      icon: Zap,
      variant: "default" as const,
      className: "bg-blue-600 text-white",
    },
    planned: {
      label: "Planned",
      icon: Circle,
      variant: "outline" as const,
      className: "text-muted-foreground",
    },
  }

  const { label, icon: Icon, variant, className: statusClass } = config[status]

  return (
    <Badge variant={variant} className={`${statusClass} ${className}`}>
      <Icon className="size-3 mr-1" />
      {label}
    </Badge>
  )
}
```

---

## Testing Plan

### Unit Tests
1. Term status derivation logic
2. Sync conflict resolution
3. Version increment on mutations
4. Active term toggle logic

### Integration Tests
1. Plan creation and sync flow
2. Plan update and conflict detection
3. Multi-device sync simulation
4. Auth flow (anonymous → authenticated)

### E2E Tests
1. User creates plan → syncs to backend
2. User modifies plan on device A → sees changes on device B
3. User marks term as active → sessions appear in course cards
4. User adds course to non-active term → no session picker shown

---

## Migration Strategy

### For Existing Users (localStorage → Convex)

**File:** `hooks/use-course-plan-sync.ts` (enhance)

Add migration logic:

```typescript
// Inside useEffect for initial load
useEffect(() => {
  if (!user || !store.hydrated) return

  // Check if user has local data but no backend plan
  if (!defaultPlan && store.terms.length > 0 && !store.convexPlanId) {
    console.log("[Migration] Migrating local plan to backend")

    // Create plan from local storage
    createPlan({
      name: "My Course Plan",
      isDefault: true,
      terms: store.terms,
      plansByTerm: store.plansByTerm,
      activeTermIds: store.activeTermIds || [],
    }).then((planId) => {
      store.setConvexPlanId(planId as Id<"coursePlans">)
      toast.success("Plan synced to cloud", {
        description: "Your local plan has been saved to your account",
      })
    })
  }
}, [user, defaultPlan, store])
```

---

## Rollout Plan

### Phase 1 (Week 1)
- ✅ Convex schema and backend functions
- ✅ Authentication middleware updates
- ✅ Basic sync hook implementation

### Phase 2 (Week 2)
- ✅ Store enhancements with sync layer
- ✅ Term status derivation logic
- ✅ Migration logic for existing users

### Phase 3 (Week 3)
- ✅ UI updates (active term toggle, status badges)
- ✅ Sync status indicator
- ✅ Simplified course addition flow

### Phase 4 (Week 4)
- ✅ Testing (unit, integration, E2E)
- ✅ Bug fixes and polish
- ✅ Documentation updates

---

## Success Metrics

1. **Backend Adoption**: 90%+ of authenticated users have plans synced to Convex
2. **Sync Reliability**: <1% sync errors across all operations
3. **UI Clarity**: Users understand active vs planning quarters (user testing)
4. **Performance**: Sync operations complete in <500ms for typical plans
5. **Data Integrity**: Zero data loss during migration from localStorage

---

## Risk Mitigation

### Risk: Data Loss During Migration
**Mitigation:** Keep localStorage as backup, implement rollback mechanism

### Risk: Sync Conflicts
**Mitigation:** Optimistic concurrency control with version numbers, conflict UI

### Risk: Performance with Large Plans
**Mitigation:** Debounced sync (2s), incremental updates, pagination if needed

### Risk: User Confusion About Active vs Planned
**Mitigation:** Clear visual indicators, onboarding tooltips, help documentation

---

## Future Enhancements (Out of Scope)

1. Multiple plans per user (e.g., "Conservative", "Aggressive")
2. Plan sharing with advisors
3. Import/export functionality
4. Prerequisite checking integration
5. Requirement tracking integration
6. Historical view of completed courses
7. Canvas integration for past courses

---

## Dependencies

- Clerk authentication (already configured)
- Convex backend (already configured)
- Zustand store (already implemented)
- Next.js 15 App Router (already implemented)

---

## Files to Modify/Create

### New Files
- `convex/coursePlans.ts` - Backend mutations/queries
- `hooks/use-course-plan-sync.ts` - Sync hook
- `lib/plan/get-term-status.ts` - Status derivation helper
- `components/ui/term-status-badge.tsx` - Status badge component

### Modified Files
- `convex/schema.ts` - Add coursePlans table
- `middleware.ts` - Protect /plan route
- `app/(plan-studio)/plan/page.tsx` - Add auth check
- `store/course-plan.store.ts` - Add sync state and actions
- `components/pages/plan/term-card.tsx` - Add active term toggle, status badge
- `components/pages/plan/plan-toolbar.tsx` - Add sync status indicator
- `components/pages/plan/course-search-dialog.tsx` - Detect active terms
- `components/pages/course-detail/course-detail-header.tsx` - Conditional session UI

---

## Questions for Stakeholders

1. Should we support multiple plans per user, or just one default plan?
2. What should happen to anonymous users' localStorage plans after they sign in?
3. Should we add plan sharing/collaboration features in this phase?
4. Do we need plan version history or just latest version?
5. Should completed courses be imported from an external source (Canvas)?

---

## Conclusion

This plan provides a comprehensive path to enhance the multi-quarter course management feature with:
- Clear UI distinction between active and planning quarters
- Robust backend persistence with Convex
- Real-time sync with conflict resolution
- Seamless migration for existing users
- Authentication-first approach with Clerk

The implementation is broken into manageable phases with clear deliverables and success metrics.
