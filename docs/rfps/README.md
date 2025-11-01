# RFP Index: Unified Planning Canvas Tickets

**Generated:** 2025-01-XX  
**Source:** `docs/UX_Grounding_Report.md`  
**Total RFPs:** 23

---

## Overview

This directory contains Request for Proposal (RFP) documents for each ticket in the Unified Planning Canvas roadmap. Each RFP provides detailed specifications, acceptance criteria, implementation details, and testing requirements.

## Phase 1: Foundations (State Normalization, Scheduling Core, Route/Panel Scaffolding)

| Ticket | Title | Complexity | Status | File |
|--------|-------|-----------|--------|------|
| UC-001 | Normalize PlannedCourse with Status Field | S | Open | [UC-001-normalize-planned-course-status.md](./UC-001-normalize-planned-course-status.md) |
| UC-002 | Link Sessions to Terms Explicitly | M | Open | [UC-002-link-sessions-to-terms.md](./UC-002-link-sessions-to-terms.md) |
| UC-003 | Extract Prerequisite Graph Utilities | M | Open | [UC-003-extract-prereq-graph-utilities.md](./UC-003-extract-prereq-graph-utilities.md) |
| UC-004 | Add Schedule Variant Filters | M | Open | [UC-004-add-schedule-variant-filters.md](./UC-004-add-schedule-variant-filters.md) |
| UC-005 | Add Variant Memoization | S | Open | [UC-005-add-variant-memoization.md](./UC-005-add-variant-memoization.md) |
| UC-006 | Create Planning Canvas Layout Scaffold | M | Open | [UC-006-create-planning-canvas-layout.md](./UC-006-create-planning-canvas-layout.md) |

## Phase 2: Unified Canvas (Layout, Panels, Omnibox, Inline Preview)

| Ticket | Title | Complexity | Status | File |
|--------|-------|-----------|--------|------|
| UC-007 | Convert Course Detail to Panel | M | Open | [UC-007-convert-course-detail-to-panel.md](./UC-007-convert-course-detail-to-panel.md) |
| UC-008 | Add Course Preview Panel | M | Open | [UC-008-add-course-preview-panel.md](./UC-008-add-course-preview-panel.md) |
| UC-009 | Refactor Search to Non-Navigating | S | Open | [UC-009-refactor-search-non-navigating.md](./UC-009-refactor-search-non-navigating.md) |
| UC-010 | Add Keyboard Shortcuts | S | Open | [UC-010-add-keyboard-shortcuts.md](./UC-010-add-keyboard-shortcuts.md) |

## Phase 3: Smart Schedule Simulation (Variants, Rule Filters, Caching)

| Ticket | Title | Complexity | Status | File |
|--------|-------|-----------|--------|------|
| UC-011 | Add Variant Saving | M | Open | [UC-011-add-variant-saving.md](./UC-011-add-variant-saving.md) |
| UC-012 | Add Variant Comparison View | M | Open | [UC-012-add-variant-comparison-view.md](./UC-012-add-variant-comparison-view.md) |
| UC-013 | Add Variant Scoring | S | Open | [UC-013-add-variant-scoring.md](./UC-013-add-variant-scoring.md) |
| UC-014 | Add Conflict Resolution Panel | M | Open | [UC-014-add-conflict-resolution-panel.md](./UC-014-add-conflict-resolution-panel.md) |

## Phase 4: Multi-Term Board + Prereq Overlay

| Ticket | Title | Complexity | Status | File |
|--------|-------|-----------|--------|------|
| UC-015 | Create Longitudinal Board View | M | Open | [UC-015-create-longitudinal-board-view.md](./UC-015-create-longitudinal-board-view.md) |
| UC-016 | Add Drag-and-Drop for Course Cards | L | Open | [UC-016-add-drag-and-drop.md](./UC-016-add-drag-and-drop.md) |
| UC-017 | Add Quick-Add Menu to Course Cards | S | Open | [UC-017-add-quick-add-menu.md](./UC-017-add-quick-add-menu.md) |
| UC-018 | Render Prerequisite Graph | M | Open | [UC-018-render-prereq-graph.md](./UC-018-render-prereq-graph.md) |
| UC-019 | Add Eligibility Badges to Course Cards | S | Open | [UC-019-add-eligibility-badges.md](./UC-019-add-eligibility-badges.md) |

## Phase 5: Insights & Personalization

| Ticket | Title | Complexity | Status | File |
|--------|-------|-----------|--------|------|
| UC-020 | Implement Warnings Engine | M | Open | [UC-020-implement-warnings-engine.md](./UC-020-implement-warnings-engine.md) |
| UC-021 | Add Requirement Tracking | M | Open | [UC-021-add-requirement-tracking.md](./UC-021-add-requirement-tracking.md) |
| UC-022 | Add Past Courses Sync Adapter | M | Open | [UC-022-add-past-courses-sync-adapter.md](./UC-022-add-past-courses-sync-adapter.md) |
| UC-023 | Add User Progress Store | M | Open | [UC-023-add-user-progress-store.md](./UC-023-add-user-progress-store.md) |

## Complexity Legend

- **S** = Small (1-3 days)
- **M** = Medium (4-7 days)
- **L** = Large (8+ days)

## RFP Structure

Each RFP document includes:

1. **Overview** - High-level description of the feature
2. **Background** - Current state vs target state
3. **Files to Modify/Create** - List of affected files
4. **Acceptance Criteria** - Detailed requirements
5. **Implementation Details** - Code examples and architecture
6. **Risks & Dependencies** - Known risks and ticket dependencies
7. **Testing Requirements** - What needs to be tested
8. **Success Metrics** - How to measure success
9. **Related Documentation** - Links to relevant sections

## Quick Reference

### Foundation Tickets (Start Here)
- UC-001: Status field normalization
- UC-002: Session-term linking
- UC-003: Prerequisite utilities

### Critical Path
1. UC-006 → UC-007 → UC-008 → UC-009 (Canvas + Panels)
2. UC-004 → UC-005 → UC-011 → UC-012 (Variants)
3. UC-003 → UC-018 → UC-019 (Prerequisites)
4. UC-003 → UC-020 → UC-021 (Warnings)

### Dependencies Graph
```
UC-001 → UC-002 (optional, simplifies migration)
UC-004 → UC-005 (filters affect caching)
UC-006 → UC-007, UC-008, UC-010 (canvas layout)
UC-008 → UC-009 (preview panel)
UC-011 → UC-012 (variant saving)
UC-015 → UC-016 (board view)
UC-003 → UC-018, UC-019, UC-020 (prereq utilities)
UC-020 → UC-021 (warnings engine)
UC-022 → UC-023 (sync adapter)
```

## Notes

- All RFPs are currently **Open** and unassigned
- Dependencies should be considered when prioritizing work
- Complexity estimates are rough and may vary based on implementation approach
- See `docs/UX_Grounding_Report.md` for full context and background

