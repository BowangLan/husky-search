# RFP: UC-018 - Render Prerequisite Graph

**Phase:** Phase 4: Multi-Term Board + Prereq Overlay  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** M (Medium)  
**Created:** 2025-01-XX

---

## Overview

Render an interactive prerequisite graph visualization showing prerequisite chains for courses, enabling users to visualize course dependencies and prerequisite paths.

## Background

Prerequisite data exists but is displayed as text links. A visual graph provides better understanding of course dependencies and prerequisite relationships.

**Current State:**
- Prerequisites shown as text links
- No graph visualization
- Hard to see prerequisite chains

**Target State:**
- Interactive prerequisite graph
- Shows prerequisite chain for selected course
- Click nodes to navigate
- Overlay on course detail panel

## Files to Create

- `components/pages/plan/prereq-graph-overlay.tsx` (new) - Graph component
- `lib/prereq-utils.ts` - Use `buildPrereqChain` from UC-003

## Acceptance Criteria

1. **Graph Rendering**
   - Graph renders using `react-flow` or `vis-network`
   - Nodes represent courses
   - Edges represent prerequisites
   - Clear visual hierarchy

2. **Prerequisite Chain**
   - Shows prerequisite chain for selected course
   - Displays all prerequisite paths
   - Handles multiple paths
   - Shows AND/OR logic

3. **Interactivity**
   - Click nodes to navigate to course
   - Hover shows course details
   - Zoom and pan support
   - Search/filter nodes

4. **Overlay Integration**
   - Overlay on course detail panel
   - Toggle show/hide
   - Responsive sizing
   - Mobile-friendly

5. **Visual Design**
   - Clear node styling
   - Color coding (eligible/blocked)
   - Edge styling
   - Legend and labels

6. **Testing**
   - Graph renders correctly
   - Node interaction works
   - Prerequisite chains accurate
   - Performance acceptable

## Implementation Details

### Graph Library

- Use `react-flow` (recommended) or `vis-network`
- Install: `npm install reactflow`
- Configure nodes and edges

### Graph Structure

```tsx
<ReactFlow nodes={nodes} edges={edges}>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

### Node Styling

- Green: Eligible courses
- Yellow: Partially eligible
- Red: Blocked courses
- Gray: Not in plan

### Edge Styling

- Solid: Required prerequisite
- Dashed: OR prerequisite
- Arrow direction: dependency direction

## Risks & Dependencies

**Risks:**
- Graph library complexity
- Performance with large graphs
- Visual clutter
- Mobile UX challenges

**Dependencies:** UC-003 (Extract Prereq Graph Utilities)

## Testing Requirements

- Graph renders correctly
- Node interaction works
- Prerequisite chains accurate
- Performance acceptable
- Mobile behavior works

## Success Metrics

- Graph visualization clear
- Prerequisite chains accurate
- Interaction intuitive
- Performance acceptable

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 1.8 (Prerequisite & Concurrent Data)
- See `docs/UX_Grounding_Report.md` Section 6 (Multi-Term Planning & Roadmap Graph)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-018

