# Node-Based Canvas Editor Implementation Guide

## Overview

This document provides a comprehensive standard operating procedure (SOP) and best practices guide for implementing a node-based visual editor for any use case. It's based on analysis of Langflow's production-grade implementation using React Flow (@xyflow/react v12).

**Table of Contents**
- [Architecture Overview](#architecture-overview)
- [Core Technology Stack](#core-technology-stack)
- [Foundation Setup](#foundation-setup)
- [State Management](#state-management)
- [Node System](#node-system)
- [Edge System](#edge-system)
- [Interactions & Events](#interactions--events)
- [Advanced Features](#advanced-features)
- [Performance Optimization](#performance-optimization)
- [Testing Strategy](#testing-strategy)
- [Best Practices](#best-practices)

---

## Architecture Overview

### Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│   Presentation Layer (React Components) │
│   - FlowPage (container)                │
│   - PageComponent (React Flow wrapper)  │
│   - Custom Nodes & Edges                │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│   State Management Layer (Zustand)      │
│   - flowStore (nodes, edges, actions)   │
│   - typesStore (component templates)    │
│   - flowsManagerStore (history/undo)    │
└─────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────┐
│   Data/Business Logic Layer             │
│   - Utility functions (validation)      │
│   - API interactions                    │
│   - Graph processing                    │
└─────────────────────────────────────────┘
```

**Key Design Principles:**
1. **Separation of Concerns**: Presentation, state, and business logic are clearly separated
2. **Unidirectional Data Flow**: State flows down, actions flow up
3. **Composability**: Small, focused components with clear responsibilities
4. **Extensibility**: Plugin-based system for custom nodes/edges

#### State Ownership by Layer (Langflow Reference)
- **Presentation (`src/frontend/src/pages/FlowPage/index.tsx`, `components/PageComponent`)** keeps only ephemeral UI flags in local `useState` (e.g. export modal visibility, selection menu position) while reading/writing graph data exclusively through Zustand stores. Navigation- and modal-related state stays colocated with the component that renders the UI.
- **State Layer (Zustand stores in `src/frontend/src/stores`)** holds any data that must survive React tree re-renders, route changes, or cross-component coordination. `flowStore` is the single source of truth for nodes, edges, IO metadata, build status, and the bound `ReactFlowInstance`. `flowsManagerStore` tracks the active flow, history stacks, loader flags, and orchestrates undo/redo. `typesStore` owns component templates fetched from the API. Additional slices (`globalVariablesStore`, `tweaksStore`, etc.) decorate the graph with auxiliary data but never duplicate `nodes`/`edges`.
- **Business Logic (`src/frontend/src/utils`, `hooks/flows`)** performs validation, sanitization, and API interactions. Functions such as `cleanEdges`, `getInputsAndOutputs`, and `updateGroupRecursion` receive raw store data, derive safe artifacts, and push results back via store actions. Hooks like `use-save-flow` invoke API clients and then call `flowsManagerStore.setCurrentFlow` → `flowStore.resetFlow` to hydrate the canvas.
- **Rule of thumb:** anything that must be reflected across multiple components or must survive undo/redo goes into a store; transient concerns (hover states, currently dragged helper lines) stay local to the component that renders the interaction.

---

## Core Technology Stack

### Required Dependencies

```json
{
  "dependencies": {
    "@xyflow/react": "^12.3.6",        // React Flow v12 (latest)
    "react": "^18.3.1",                 // React 18
    "react-dom": "^18.3.1",
    "zustand": "^4.5.2",                // State management
    "lodash": "^4.17.21",               // Utilities (cloneDeep)
    "short-unique-id": "^5.2.0",        // ID generation
    "elkjs": "^0.9.3"                   // Auto-layout (optional)
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0"
  }
}
```

### Technology Choices & Rationale

| Technology | Why Use It | When NOT to Use It |
|-----------|------------|-------------------|
| **React Flow** | Battle-tested, handles pan/zoom/rendering, extensive plugin system | Simple diagrams where `<svg>` suffices |
| **Zustand** | Minimal boilerplate, great performance, no context hell | Very simple apps with useState |
| **TypeScript** | Type safety for complex node/edge data structures | Prototypes/MVPs (though still recommended) |
| **ELK.js** | Auto-layout algorithms (hierarchical, force-directed) | Manual layout is preferred |

---

## Foundation Setup

### Step 1: Project Structure

```
src/
├── pages/
│   └── FlowPage/
│       ├── index.tsx                    # Container component
│       └── components/
│           ├── PageComponent/           # React Flow wrapper
│           │   ├── index.tsx
│           │   ├── MemoizedComponents.tsx
│           │   └── helpers/
│           ├── flowSidebarComponent/    # Component palette
│           ├── nodeToolbarComponent/    # Node actions toolbar
│           └── ConnectionLineComponent/ # Custom connection preview
├── CustomNodes/
│   ├── GenericNode/
│   │   ├── index.tsx
│   │   ├── components/
│   │   └── hooks/
│   └── NoteNode/
│       └── index.tsx
├── CustomEdges/
│   └── index.tsx
├── stores/
│   ├── flowStore.ts                     # Main flow state
│   ├── flowsManagerStore.ts             # Undo/redo history
│   └── typesStore.ts                    # Component definitions
├── hooks/
│   ├── use-add-component.ts             # Add nodes
│   └── flows/
│       ├── use-autosave-flow.ts
│       └── use-save-flow.ts
└── utils/
    ├── reactflowUtils.ts                # Core utilities
    └── layoutUtils.ts                   # Auto-layout
```

### Step 2: Initialize React Flow

**Basic Setup** (`PageComponent/index.tsx`):

```typescript
import {
  ReactFlow,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Background,
  Controls,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Define node types
const nodeTypes = {
  genericNode: GenericNode,
  noteNode: NoteNode,
};

// Define edge types
const edgeTypes = {
  default: DefaultEdge,
};

export default function CanvasEditor() {
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const onNodesChange = useFlowStore((state) => state.onNodesChange);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const onConnect = useFlowStore((state) => state.onConnect);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.25}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

**Key Configuration Options:**
- `fitView`: Auto-fits the viewport to show all nodes
- `minZoom`/`maxZoom`: Prevents excessive zooming
- `proOptions={{ hideAttribution: true }}`: Hides React Flow branding (commercial use requires license)
- `deleteKeyCode={[]}`: Disables default delete key (use custom handlers)
- `disableKeyboardA11y={true}`: Disables keyboard accessibility (if implementing custom)

---

## State Management

### Zustand Store Architecture

**Core Store Pattern** (`stores/flowStore.ts`):

```typescript
import { create } from 'zustand';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import type { AllNodeType, EdgeType } from '../types/flow';

interface FlowStoreType {
  // State
  nodes: AllNodeType[];
  edges: EdgeType[];
  reactFlowInstance: ReactFlowInstance | null;

  // Node actions
  setNodes: (nodes: AllNodeType[] | ((oldNodes: AllNodeType[]) => AllNodeType[])) => void;
  onNodesChange: (changes: NodeChange<AllNodeType>[]) => void;
  deleteNode: (nodeId: string | string[]) => void;
  setNode: (id: string, change: AllNodeType | ((old: AllNodeType) => AllNodeType)) => void;

  // Edge actions
  setEdges: (edges: EdgeType[] | ((oldEdges: EdgeType[]) => EdgeType[])) => void;
  onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void;
  onConnect: (connection: Connection) => void;
  deleteEdge: (edgeId: string | string[]) => void;

  // Clipboard
  paste: (selection: OnSelectionChangeParams, position: XYPosition) => void;
  lastCopiedSelection: OnSelectionChangeParams | null;
  setLastCopiedSelection: (selection: OnSelectionChangeParams | null, isCrop?: boolean) => void;

  // React Flow instance
  setReactFlowInstance: (instance: ReactFlowInstance) => void;
}

const useFlowStore = create<FlowStoreType>((set, get) => ({
  nodes: [],
  edges: [],
  reactFlowInstance: null,
  lastCopiedSelection: null,

  setNodes: (change) => {
    const newNodes = typeof change === 'function' ? change(get().nodes) : change;
    set({ nodes: newNodes });
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },

  setEdges: (change) => {
    const newEdges = typeof change === 'function' ? change(get().edges) : change;
    set({ edges: newEdges });
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },

  onConnect: (connection) => {
    get().setEdges((oldEdges) => addEdge(connection, oldEdges));
  },

  deleteNode: (nodeId) => {
    const idsToDelete = typeof nodeId === 'string' ? [nodeId] : nodeId;
    get().setNodes((nodes) => nodes.filter((n) => !idsToDelete.includes(n.id)));
    // Also delete connected edges
    get().setEdges((edges) =>
      edges.filter((e) => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target))
    );
  },

  deleteEdge: (edgeId) => {
    const idsToDelete = typeof edgeId === 'string' ? [edgeId] : edgeId;
    get().setEdges((edges) => edges.filter((e) => !idsToDelete.includes(e.id)));
  },

  setNode: (id, change) => {
    const newNode = typeof change === 'function'
      ? change(get().nodes.find((n) => n.id === id)!)
      : change;

    get().setNodes((nodes) => nodes.map((n) => n.id === id ? newNode : n));
  },

  setReactFlowInstance: (instance) => {
    set({ reactFlowInstance: instance });
  },

  paste: (selection, position) => {
    const { nodes, edges } = selection;
    const rfInstance = get().reactFlowInstance;

    if (!rfInstance) return;

    // Convert screen position to flow position
    const flowPosition = rfInstance.screenToFlowPosition(position);

    // Calculate offset from original position
    const minX = Math.min(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));

    // Create new nodes with new IDs
    const idsMap: Record<string, string> = {};
    const newNodes = nodes.map((node) => {
      const newId = getNodeId(node.data.type);
      idsMap[node.id] = newId;

      return {
        ...node,
        id: newId,
        position: {
          x: flowPosition.x + (node.position.x - minX),
          y: flowPosition.y + (node.position.y - minY),
        },
        data: {
          ...cloneDeep(node.data),
          id: newId,
        },
      };
    });

    // Create new edges with updated IDs
    const newEdges = edges.map((edge) => ({
      ...edge,
      id: `e${idsMap[edge.source]}-${idsMap[edge.target]}`,
      source: idsMap[edge.source],
      target: idsMap[edge.target],
    }));

    get().setNodes((old) => [...old, ...newNodes]);
    get().setEdges((old) => [...old, ...newEdges]);
  },

  setLastCopiedSelection: (selection, isCrop = false) => {
    if (isCrop && selection) {
      // Cut operation - delete original nodes/edges
      const nodeIds = selection.nodes.map((n) => n.id);
      const edgeIds = selection.edges.map((e) => e.id);
      get().deleteNode(nodeIds);
      get().deleteEdge(edgeIds);
    }
    set({ lastCopiedSelection: selection });
  },
}));

export default useFlowStore;
```

#### Langflow-Specific Graph State Responsibilities
- **Source of truth:** `src/frontend/src/stores/flowStore.ts` is the canonical record for node/edge arrays, IO metadata, build state, and canvas-level UI flags (`currentFlow`, `flowPool`, `componentsToUpdate`, `helperLineEnabled`, etc.). All mutations flow through store actions so that side effects (validation, auto-save, analytics) fire consistently.
- **Hydration (`resetFlow`)**: Whenever a flow is fetched or switched, `flowsManagerStore.setCurrentFlow` calls `flowStore.resetFlow`. This copies `flow.data.nodes/edges` into the store, sanitises them via `cleanEdges`, rebuilds IO caches with `getInputsAndOutputs`, restores dismissed node preferences from `localStorage`, and runs `updateComponentsToUpdate` so the UI can surface outdated components.
- **Mutation guards:** `setNodes`, `setEdges`, and `setNode` all run `cleanEdges` and `updateCurrentFlow` internally, recompute inputs/outputs, and trigger `autoSaveFlow` if the autosave hook has been wired in. When adding new setters, mirror this pattern or call existing helpers to avoid skipping validation or leaving `currentFlow.data` stale.
- **Flow persistence (`updateCurrentFlow`)** keeps `currentFlow.data.nodes/edges` in sync with the canonical arrays. Any mutation that bypasses store helpers must call `updateCurrentFlow` manually or the "unsaved changes" blocker will misfire.
- **Undo/redo integration:** Before destructive graph operations (grouping, bulk delete) the UI calls `flowsManagerStore.takeSnapshot()`. New high-level actions must follow the same pattern: `takeSnapshot()` → mutate via `flowStore` → optionally `flowsManagerStore.undo/redo`.
- **React Flow instance:** The store owns `reactFlowInstance` and utilities like `fitViewNode`, `paste`, and `setHandleDragging`. Components retrieve the instance via selectors instead of storing refs locally, which keeps clipboard/paste handlers working across portals.
- **Locking/build pipeline:** Fields such as `isBuilding`, `flowBuildStatus`, `currentBuildingNodeId`, and `flowPool` are updated both from API web socket callbacks and UI actions. Treat them as shared state—mutations should stay in the store so build modals, node badges, and logs stay in sync.

### Undo/Redo History Store

**History Management** (`stores/flowsManagerStore.ts`):

```typescript
import { create } from 'zustand';
import type { FlowType } from '../types/flow';

interface HistoryState {
  past: FlowType[];
  present: FlowType | null;
  future: FlowType[];
}

interface FlowsManagerStoreType {
  currentFlow: FlowType | null;
  history: HistoryState;

  setCurrentFlow: (flow: FlowType | null) => void;
  takeSnapshot: () => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY_SIZE = 50;

const useFlowsManagerStore = create<FlowsManagerStoreType>((set, get) => ({
  currentFlow: null,
  history: {
    past: [],
    present: null,
    future: [],
  },

  setCurrentFlow: (flow) => {
    set({ currentFlow: flow });
  },

  takeSnapshot: () => {
    const currentFlow = get().currentFlow;
    if (!currentFlow) return;

    const { past, present } = get().history;

    // Add current state to history
    const newPast = present
      ? [...past, present].slice(-MAX_HISTORY_SIZE)
      : past;

    set({
      history: {
        past: newPast,
        present: cloneDeep(currentFlow),
        future: [], // Clear future on new action
      },
    });
  },

  undo: () => {
    const { past, present, future } = get().history;

    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      currentFlow: previous,
      history: {
        past: newPast,
        present: previous,
        future: present ? [present, ...future] : future,
      },
    });

    // Update flow store
    useFlowStore.getState().resetFlow(previous);
  },

  redo: () => {
    const { past, present, future } = get().history;

    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      currentFlow: next,
      history: {
        past: present ? [...past, present] : past,
        present: next,
        future: newFuture,
      },
    });

    // Update flow store
    useFlowStore.getState().resetFlow(next);
  },
}));

export default useFlowsManagerStore;
```

#### Langflow Flow Management Notes
- **Per-flow history buckets:** The production store keeps `past` and `future` dictionaries keyed by `currentFlowId`. This allows multiple tabs to maintain separate undo stacks while sharing a single Zustand store. Whenever you change the `currentFlowId`, clear the corresponding history arrays to avoid leaking previous flow states.
- **Autosave integration:** Fields such as `autoSaving`, `autoSavingInterval`, `saveLoading`, and `isLoading` inform both the toolbar and the navigation blocker. When adding new save pathways, toggle these flags so the UI can render spinners and disable buttons consistently.
- **Flow switching pipeline:** `setCurrentFlow` updates `currentFlowId`, then immediately calls `flowStore.resetFlow`. Any future enhancements (e.g., loading overlays or branch previews) must respect this sequence or the canvas and sidebar will drift out of sync.
- **Snapshots before destructive actions:** UI commands (duplicate, group, delete, drag) call `takeSnapshot()` before mutating the graph. Remember to extend this protocol when adding new bulk operations—undo/redo stacks should only contain sanitized state (`cloneDeep` of the store’s `nodes/edges`).
- **IO modal & search filters:** `IOModalOpen`, `searchFlowsComponents`, and `selectedFlowsComponentsCards` live here so multiple components (sidebar, overlays, header) can stay in sync. When introducing new cross-cutting filters, colocate them in this store rather than React context.

### Supporting Stores & Data Sources (Langflow)
- **`typesStore` (`src/frontend/src/stores/typesStore.ts`)** receives raw API payloads via `useGetTypes`. It normalises the objects into `types`, `templates`, and caches sensitive fields in `ComponentFields`. Graph components treat this store as read-only configuration—mutations happen only when new component definitions are fetched or when secrets/overrides are merged.
- **`globalVariablesStore` & `tweaksStore`** enrich nodes with external context (global vars, runtime tweaks). They expose read helpers that `flowStore` consumes inside actions like `paste` or `updateGroupRecursion`. Keep these auxiliary slices decoupled from the core graph state to avoid circular dependencies.
- **`utilityStore`, `alertStore`, `shortcuts`, etc.** handle orthogonal concerns (toast notifications, keyboard shortcuts, theme). They never duplicate `nodes/edges`; instead, they subscribe to `flowStore` or `flowsManagerStore` selectors when needed.
- **API controllers (`src/frontend/src/controllers/API/queries/...`)** hydrate stores via React Query. For example, `useGetFlow` resolves to `setCurrentFlow` → `resetFlow`. Whenever you add a new API surface (e.g., template overrides), pipe the data through a store setter so it becomes accessible to the rest of the canvas.

### Data Flow Lifecycle (Langflow)
1. **Bootstrapping**
   - `FlowPage` mounts, triggers `useGetTypes`, and populates `typesStore` with templates. Once flows are loaded, `useFlowsManagerStore.setCurrentFlow` selects the active flow.
   - `setCurrentFlow` immediately calls `flowStore.resetFlow`, which sanitises nodes/edges, rebuilds IO metadata, and primes runtime caches (`flowPool`, `dismissedNodes`, tweaks).
2. **Canvas Rendering**
   - `PageComponent` subscribes to `flowStore` selectors (`nodes`, `edges`, `onNodesChange`, etc.) and binds them to `<ReactFlow />`. Custom nodes/edges also read from auxiliary stores (tweaks, alerts) to render status badges.
   - Local component state (`selectionMenuVisible`, `openExportModal`, helper line hover state) remains inside `PageComponent`; it never writes back to Zustand.
3. **User Mutations**
   - Toolbar or keyboard handlers call `flowsManagerStore.takeSnapshot()` before mutating.
   - Actual mutations go through `flowStore` actions (`setNodes`, `setNode`, `deleteEdge`, `paste`). Each action recalculates derived data, syncs `currentFlow.data`, and optionally fires analytics.
   - When new mutation paths are introduced (e.g., AI-assisted edits), they must reuse these store actions or replicate their internal steps (`cleanEdges` → `updateComponentsToUpdate` → `updateCurrentFlow`).
4. **Persistence & Autosave**
   - `useAutoSaveFlow` injects a debounced saver into `flowStore.autoSaveFlow`. Mutations trigger this callback, which eventually calls `use-save-flow` to POST the flow and `flowsManagerStore.setCurrentFlow` with the saved payload.
   - Manual saves and export/import flows use the same pipeline: update store → trigger API → refresh `currentFlow` + history stacks.
5. **Build Execution**
   - When a build runs, `flowStore.setIsBuilding(true)` and `setBuildController` track the request. Streaming results push into `flowStore.flowPool`, and `flowBuildStatus` updates node badges. Cancel, retry, or log panels read from the same store to stay synchronised.
6. **Teardown**
   - `FlowPage` unmounts, calling `setOnFlowPage(false)` and `setCurrentFlow(undefined)`. `flowStore.resetFlowState()` (e.g., when logging out) clears all per-flow caches to avoid leaking data between sessions.

### Implementation Checklist
- **Fetching:** Call `useGetTypes` before rendering the canvas and wait for `typesStore.templates` so handles and forms resolve correctly.
- **Flow selection:** Always call `flowsManagerStore.setCurrentFlow(flow)` rather than writing to `flowStore` directly; it handles history, local storage, and tweak initialisation.
- **Graph mutations:** Before changing node/edge arrays, call `flowsManagerStore.takeSnapshot()` then use one of the existing `flowStore` actions (`setNodes`, `setNode`, `setEdges`, `deleteNode`, `deleteEdge`, `paste`). If you roll a custom mutation, mirror the internal steps: `cleanEdges` → `updateComponentsToUpdate` → `updateCurrentFlow` → trigger autosave.
- **Persistence hooks:** When introducing new save/autosave flows, set `flowStore.autoSaveFlow` to a debounced callback and keep `flowsManagerStore.autoSaving`/`saveLoading` up to date.
- **Build triggers:** Use `flowStore.buildFlow` (or equivalent action) so the store can update `isBuilding`, `currentBuildingNodeId`, and `flowBuildStatus` for downstream consumers (toolbar, node badges, logs).
- **Cleanup:** On navigation or logout, call `flowStore.resetFlowState()` and `flowsManagerStore.resetStore()` to wipe caches, and clear any per-flow features (dismissed nodes, tweaks) stored in local storage.

---

## Node System

### Node Type Definition

```typescript
// types/flow.ts
export interface NodeDataType {
  id: string;
  type: string;
  node?: APIClassType; // Your node template/config
  showNode?: boolean; // Expanded/collapsed state
  selected_output?: string; // For multi-output nodes
}

export interface AllNodeType extends Node {
  type: 'genericNode' | 'noteNode';
  data: NodeDataType;
}
```

### Custom Node Component

**Generic Node Example** (`CustomNodes/GenericNode/index.tsx`):

```typescript
import { memo } from 'react';
import { Handle, Position, useUpdateNodeInternals } from '@xyflow/react';
import type { NodeDataType } from '../../types/flow';

interface GenericNodeProps {
  data: NodeDataType;
  selected?: boolean;
}

function GenericNode({ data, selected }: GenericNodeProps) {
  const updateNodeInternals = useUpdateNodeInternals();

  // Update handles when template changes
  useEffect(() => {
    updateNodeInternals(data.id);
  }, [data.node?.template]);

  const showNode = data.showNode ?? true;
  const inputs = Object.keys(data.node?.template ?? {}).filter(
    (key) => data.node!.template[key].show && !data.node!.template[key].advanced
  );
  const outputs = data.node?.outputs ?? [];

  return (
    <div
      className={`rounded-lg border shadow-sm ${
        selected ? 'border-blue-500' : 'border-gray-300'
      }`}
      style={{ width: showNode ? '320px' : '192px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <NodeIcon icon={data.node?.icon} />
          <span className="font-medium">{data.node?.display_name}</span>
        </div>
        <NodeStatus data={data} />
      </div>

      {/* Body - only show if expanded */}
      {showNode && (
        <div className="p-3 space-y-2">
          {inputs.map((inputKey) => (
            <InputParameter
              key={inputKey}
              nodeId={data.id}
              paramKey={inputKey}
              paramData={data.node!.template[inputKey]}
            />
          ))}
        </div>
      )}

      {/* Input Handles (left side) */}
      {inputs.map((inputKey, index) => (
        <Handle
          key={`input-${inputKey}`}
          type="target"
          position={Position.Left}
          id={createHandleId({ fieldName: inputKey, id: data.id })}
          style={{
            top: showNode ? `${60 + index * 40}px` : '50%',
            background: '#555',
          }}
        />
      ))}

      {/* Output Handles (right side) */}
      {outputs.map((output, index) => (
        <Handle
          key={`output-${output.name}`}
          type="source"
          position={Position.Right}
          id={createHandleId({ name: output.name, id: data.id })}
          style={{
            top: showNode ? `${60 + index * 40}px` : '50%',
            background: '#555',
          }}
        />
      ))}
    </div>
  );
}

export default memo(GenericNode);
```

**Node Design Principles:**
1. **Memoization**: Wrap with `memo()` to prevent unnecessary re-renders
2. **Dynamic Handles**: Generate handles based on node data, not hardcoded
3. **Visual States**: Show different styles for selected/error/building states
4. **Responsive Layout**: Support both expanded and collapsed views
5. **Handle IDs**: Use unique, serialized identifiers for connection validation

### Handle ID System

**Critical for Connection Validation:**

```typescript
// utils/reactflowUtils.ts

export function scapedJSONStringfy(json: object): string {
  return JSON.stringify(json).replace(/"/g, 'œ');
}

export function scapeJSONParse(json: string): any {
  return JSON.parse(json.replace(/œ/g, '"'));
}

// Target handle (input)
export interface targetHandleType {
  fieldName: string;
  id: string; // Node ID
  type?: string;
  inputTypes?: string[];
  proxy?: { id: string; field: string }; // For grouped nodes
}

// Source handle (output)
export interface sourceHandleType {
  name: string;
  id: string; // Node ID
  dataType: string;
  output_types: string[];
}

// Create handle ID for React Flow
export function createTargetHandleId(handle: targetHandleType): string {
  return scapedJSONStringfy(handle);
}

export function createSourceHandleId(handle: sourceHandleType): string {
  return scapedJSONStringfy(handle);
}
```

**Why Escaped JSON?**
- React Flow uses handle IDs in DOM attributes
- Quotes in IDs cause HTML parsing issues
- Solution: Replace `"` with `œ` (rare character)
- Allows storing complex metadata in handle IDs

### Node ID Generation

```typescript
import ShortUniqueId from 'short-unique-id';

const uid = new ShortUniqueId();

export function getNodeId(nodeType: string): string {
  return `${nodeType}-${uid.randomUUID(5)}`;
}
```

**Best Practice:**
- Prefix with node type for debugging
- Use short IDs (5 chars) to keep handle IDs manageable
- Never reuse IDs (even after deletion)

---

## Edge System

### Custom Edge Component

**Bezier Edge with Loop Detection** (`CustomEdges/index.tsx`):

```typescript
import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  Position,
} from '@xyflow/react';

export function DefaultEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourceHandleId,
  targetHandleId,
  ...props
}: EdgeProps) {
  const targetHandle = scapeJSONParse(targetHandleId!);

  // Detect loop connections (output-to-input on same component)
  const isLoop = Boolean(targetHandle.output_types);

  // Calculate custom curve for loops
  const distance = 200 + 0.1 * ((sourceX - targetX) / 2);

  let edgePath: string;

  if (isLoop) {
    // Custom curved path for loops
    edgePath = `M ${sourceX} ${sourceY} C ${sourceX + distance} ${sourceY + 200}, ${targetX - distance} ${targetY + 200}, ${targetX} ${targetY}`;
  } else {
    // Standard bezier path
    [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      targetX,
      targetY,
    });
  }

  return (
    <BaseEdge
      path={edgePath}
      strokeDasharray={isLoop ? '5 5' : '0'}
      {...props}
    />
  );
}
```

### Edge Validation & Connection Rules

**Connection Validation** (`utils/reactflowUtils.ts`):

```typescript
export function isValidConnection(
  connection: Connection,
  nodes: AllNodeType[],
  edges: EdgeType[],
): boolean {
  const { source, target, sourceHandle, targetHandle } = connection;

  // Rule 1: No self-connections
  if (source === target) return false;

  const sourceHandleObj: sourceHandleType = scapeJSONParse(sourceHandle!);
  const targetHandleObj: targetHandleType = scapeJSONParse(targetHandle!);

  // Rule 2: Type compatibility
  const typesMatch =
    sourceHandleObj.output_types.some((outputType) =>
      targetHandleObj.inputTypes?.includes(outputType)
    ) || sourceHandleObj.output_types.some((t) => t === targetHandleObj.type);

  if (!typesMatch) return false;

  // Rule 3: One connection per input (unless list type)
  const targetNode = nodes.find((n) => n.id === target);
  const existingConnection = edges.find((e) => e.targetHandle === targetHandle);
  const isListType = targetNode?.data.node?.template[targetHandleObj.fieldName]?.list;

  if (existingConnection && !isListType) return false;

  // Rule 4: Prevent cycles (unless loop component)
  if (targetHandleObj.output_types) {
    // This is a loop component - check if cycle is valid
    return detectValidCycle(target, source, nodes, edges);
  }

  if (detectCycle(target, source, nodes, edges)) return false;

  return true;
}

function detectCycle(
  nodeId: string,
  targetNodeId: string,
  nodes: AllNodeType[],
  edges: EdgeType[],
): boolean {
  const visited = new Set<string>();

  function dfs(currentId: string): boolean {
    if (currentId === targetNodeId) return true;
    if (visited.has(currentId)) return false;

    visited.add(currentId);

    const outgoingEdges = edges.filter((e) => e.source === currentId);
    for (const edge of outgoingEdges) {
      if (dfs(edge.target)) return true;
    }

    return false;
  }

  return dfs(nodeId);
}
```

**Edge Cleaning (Remove Invalid Edges):**

```typescript
export function cleanEdges(
  nodes: AllNodeType[],
  edges: EdgeType[],
): EdgeType[] {
  return edges.filter((edge) => {
    // Check if source and target nodes exist
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);

    if (!sourceNode || !targetNode) return false;

    // Validate handles still exist
    const targetHandle = scapeJSONParse(edge.targetHandle!);
    const fieldExists = targetNode.data.node?.template[targetHandle.fieldName];

    if (!fieldExists || fieldExists.show === false) return false;

    return true;
  });
}
```

---

## Interactions & Events

### Drag & Drop System

**Adding Components from Palette:**

```typescript
// hooks/use-add-component.ts
import { useStoreApi } from '@xyflow/react';

export function useAddComponent() {
  const store = useStoreApi();
  const paste = useFlowStore((state) => state.paste);

  const addComponent = useCallback(
    (componentType: string, position?: { x: number; y: number }) => {
      const {
        height,
        width,
        transform: [transformX, transformY, zoomLevel],
      } = store.getState();

      // Calculate center position if not provided
      let flowPosition;
      if (position) {
        flowPosition = position;
      } else {
        const centerX = -transformX / zoomLevel + (width / zoomLevel) / 2;
        const centerY = -transformY / zoomLevel + (height / zoomLevel) / 2;
        flowPosition = { x: centerX, y: centerY };
      }

      // Create new node
      const newId = getNodeId(componentType);
      const newNode: AllNodeType = {
        id: newId,
        type: 'genericNode',
        position: { x: 0, y: 0 },
        data: {
          id: newId,
          type: componentType,
          node: getComponentTemplate(componentType),
        },
      };

      // Use paste to add node (handles positioning)
      paste({ nodes: [newNode], edges: [] }, flowPosition);
    },
    [store, paste],
  );

  return addComponent;
}
```

**Drag & Drop Handler:**

```typescript
// In PageComponent
const onDrop = useCallback(
  (event: React.DragEvent) => {
    event.preventDefault();

    // Get component type from drag data
    const componentType = event.dataTransfer.getData('application/reactflow');

    if (!componentType) return;

    // Add component at drop position
    addComponent(componentType, {
      x: event.clientX,
      y: event.clientY,
    });
  },
  [addComponent],
);

const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);

return (
  <ReactFlow
    onDrop={onDrop}
    onDragOver={onDragOver}
    // ... other props
  />
);
```

### Keyboard Shortcuts

```typescript
import { useHotkeys } from 'react-hotkeys-hook';

function PageComponent() {
  const takeSnapshot = useFlowsManagerStore((state) => state.takeSnapshot);
  const undo = useFlowsManagerStore((state) => state.undo);
  const redo = useFlowsManagerStore((state) => state.redo);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const lastSelection = useFlowStore((state) => state.lastSelection);
  const paste = useFlowStore((state) => state.paste);
  const setLastCopiedSelection = useFlowStore((state) => state.setLastCopiedSelection);

  // Undo/Redo
  useHotkeys('ctrl+z, cmd+z', (e) => {
    e.preventDefault();
    undo();
  });

  useHotkeys('ctrl+shift+z, cmd+shift+z', (e) => {
    e.preventDefault();
    redo();
  });

  // Copy/Paste/Cut
  useHotkeys('ctrl+c, cmd+c', (e) => {
    if (lastSelection && window.getSelection()?.toString().length === 0) {
      e.preventDefault();
      setLastCopiedSelection(lastSelection);
    }
  });

  useHotkeys('ctrl+v, cmd+v', (e) => {
    const copiedSelection = useFlowStore.getState().lastCopiedSelection;
    if (copiedSelection && window.getSelection()?.toString().length === 0) {
      e.preventDefault();
      takeSnapshot();
      paste(copiedSelection, { x: event.clientX, y: event.clientY });
    }
  });

  useHotkeys('ctrl+x, cmd+x', (e) => {
    if (lastSelection && window.getSelection()?.toString().length === 0) {
      e.preventDefault();
      setLastCopiedSelection(lastSelection, true); // true = cut
    }
  });

  // Delete
  useHotkeys('delete, backspace', (e) => {
    if (lastSelection && !isWrappedWithClass(e, 'nodelete')) {
      e.preventDefault();
      takeSnapshot();
      deleteNode(lastSelection.nodes.map((n) => n.id));
      deleteEdge(lastSelection.edges.map((e) => e.id));
    }
  });

  return <ReactFlow ... />;
}

// Utility to check if event target has a class
function isWrappedWithClass(e: KeyboardEvent, className: string): boolean {
  let target = e.target as HTMLElement;
  while (target) {
    if (target.classList?.contains(className)) return true;
    target = target.parentElement!;
  }
  return false;
}
```

**Keyboard Shortcut Best Practices:**
1. Use `useHotkeys` library for cross-platform support
2. Always `preventDefault()` to avoid browser defaults
3. Check `window.getSelection()` to avoid conflicts with text editing
4. Use class names (`.nodelete`, `.noflow`) to exclude elements
5. Take snapshot before destructive operations

### Selection & Multi-Select

```typescript
const [lastSelection, setLastSelection] = useState<OnSelectionChangeParams | null>(null);

const onSelectionChange = useCallback((selection: OnSelectionChangeParams) => {
  setLastSelection(selection);
}, []);

return (
  <ReactFlow
    onSelectionChange={onSelectionChange}
    // ... other props
  />
);
```

---

## Advanced Features

### Undo/Redo Implementation

**Snapshot System:**

```typescript
// In flowsManagerStore
const takeSnapshot = () => {
  const currentFlow = get().currentFlow;
  const nodes = useFlowStore.getState().nodes;
  const edges = useFlowStore.getState().edges;

  if (!currentFlow) return;

  const snapshot = {
    ...currentFlow,
    data: {
      nodes: cloneDeep(nodes),
      edges: cloneDeep(edges),
      viewport: useFlowStore.getState().reactFlowInstance?.getViewport(),
    },
  };

  const { past, present } = get().history;

  set({
    history: {
      past: present ? [...past, present].slice(-MAX_HISTORY_SIZE) : past,
      present: snapshot,
      future: [],
    },
  });
};
```

**When to Take Snapshots:**
1. Before any destructive action (delete, cut)
2. On node drag start (not drag end - too laggy)
3. On connection creation
4. Before paste operations
5. NOT on every state change (performance issue)

### Auto-Layout with ELK

```typescript
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

export async function getLayoutedNodes(
  nodes: AllNodeType[],
  edges: EdgeType[],
): Promise<AllNodeType[]> {
  const elkNodes = nodes.map((node) => ({
    id: node.id,
    width: 320,
    height: 200,
  }));

  const elkEdges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  const graph = await elk.layout({
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '50',
      'elk.layered.spacing.nodeNodeBetweenLayers': '100',
    },
    children: elkNodes,
    edges: elkEdges,
  });

  return nodes.map((node) => {
    const elkNode = graph.children?.find((n) => n.id === node.id);
    return {
      ...node,
      position: { x: elkNode?.x ?? 0, y: elkNode?.y ?? 0 },
    };
  });
}
```

### Helper Lines (Snap-to-Align)

```typescript
// helpers/helper-lines.ts
export interface HelperLinesState {
  horizontal?: number;
  vertical?: number;
}

export function getHelperLines(
  draggedNode: AllNodeType,
  allNodes: AllNodeType[],
): HelperLinesState {
  const SNAP_DISTANCE = 10;
  const helperLines: HelperLinesState = {};

  const draggedCenter = {
    x: draggedNode.position.x + (draggedNode.measured?.width ?? 0) / 2,
    y: draggedNode.position.y + (draggedNode.measured?.height ?? 0) / 2,
  };

  for (const node of allNodes) {
    if (node.id === draggedNode.id) continue;

    const nodeCenter = {
      x: node.position.x + (node.measured?.width ?? 0) / 2,
      y: node.position.y + (node.measured?.height ?? 0) / 2,
    };

    // Check horizontal alignment
    if (Math.abs(draggedCenter.y - nodeCenter.y) < SNAP_DISTANCE) {
      helperLines.horizontal = nodeCenter.y;
    }

    // Check vertical alignment
    if (Math.abs(draggedCenter.x - nodeCenter.x) < SNAP_DISTANCE) {
      helperLines.vertical = nodeCenter.x;
    }
  }

  return helperLines;
}

export function getSnapPosition(
  draggedNode: AllNodeType,
  allNodes: AllNodeType[],
): { x: number; y: number } {
  const helperLines = getHelperLines(draggedNode, allNodes);
  const SNAP_DISTANCE = 10;

  let x = draggedNode.position.x;
  let y = draggedNode.position.y;

  const draggedCenter = {
    x: x + (draggedNode.measured?.width ?? 0) / 2,
    y: y + (draggedNode.measured?.height ?? 0) / 2,
  };

  if (helperLines.horizontal !== undefined) {
    const diff = helperLines.horizontal - draggedCenter.y;
    if (Math.abs(diff) < SNAP_DISTANCE) {
      y += diff;
    }
  }

  if (helperLines.vertical !== undefined) {
    const diff = helperLines.vertical - draggedCenter.x;
    if (Math.abs(diff) < SNAP_DISTANCE) {
      x += diff;
    }
  }

  return { x, y };
}
```

### Flow Serialization & Export

```typescript
export async function downloadFlow(
  flow: FlowType,
  flowName: string,
): Promise<void> {
  const clonedFlow = cloneDeep(flow);

  // Remove sensitive data
  clonedFlow.data?.nodes.forEach((node) => {
    if (node.type !== 'genericNode') return;

    for (const key in node.data.node?.template) {
      if (node.data.node.template[key].password) {
        node.data.node.template[key].value = '';
      }
    }
  });

  // Sort keys for deterministic output
  const sortedFlow = sortJsonStructure(clonedFlow);

  // Create download
  const blob = new Blob([JSON.stringify(sortedFlow, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${flowName}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function sortJsonStructure<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sortJsonStructure) as unknown as T;

  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = sortJsonStructure(obj[key]);
      return result;
    }, {} as any);
}
```

---

## Performance Optimization

### Memoization Strategy

```typescript
// Memoize expensive components
const MemoizedNodeIcon = memo(NodeIcon);
const MemoizedNodeName = memo(NodeName);
const MemoizedInputParameters = memo(InputParameters);
const MemoizedNodeOutputs = memo(NodeOutputs);

// Use in render
return (
  <div>
    <MemoizedNodeIcon icon={icon} />
    <MemoizedNodeName name={name} />
    {showNode && (
      <>
        <MemoizedInputParameters data={data} />
        <MemoizedNodeOutputs outputs={outputs} />
      </>
    )}
  </div>
);
```

### Selective Re-renders with Zustand

```typescript
// Bad - re-renders on any state change
const flowStore = useFlowStore();

// Good - only re-renders when nodes change
const nodes = useFlowStore((state) => state.nodes);

// Better - only re-renders when specific node changes
const node = useFlowStore((state) =>
  state.nodes.find((n) => n.id === nodeId)
);

// Best - use useShallow for object/array selectors
import { useShallow } from 'zustand/react/shallow';

const { nodes, edges } = useFlowStore(
  useShallow((state) => ({ nodes: state.nodes, edges: state.edges }))
);
```

### Virtualization (Large Graphs)

**For 100+ nodes, consider:**

```typescript
// Only render nodes in viewport
const [visibleNodes, setVisibleNodes] = useState<AllNodeType[]>([]);

const onViewportChange = useCallback((viewport: Viewport) => {
  const rfInstance = useFlowStore.getState().reactFlowInstance;
  if (!rfInstance) return;

  const bounds = rfInstance.getViewport();
  const visible = nodes.filter((node) => {
    const nodeX = node.position.x;
    const nodeY = node.position.y;

    return (
      nodeX > bounds.x - 500 &&
      nodeX < bounds.x + window.innerWidth + 500 &&
      nodeY > bounds.y - 500 &&
      nodeY < bounds.y + window.innerHeight + 500
    );
  });

  setVisibleNodes(visible);
}, [nodes]);

return (
  <ReactFlow
    nodes={visibleNodes}
    onViewportChange={onViewportChange}
    // ...
  />
);
```

### Debouncing & Throttling

```typescript
import { debounce } from 'lodash';

// Debounce expensive operations
const debouncedAutoSave = useMemo(
  () => debounce((flow: FlowType) => {
    saveFlow(flow);
  }, 1000),
  [],
);

// Throttle frequent events
const throttledOnNodesChange = useMemo(
  () => throttle((changes: NodeChange[]) => {
    onNodesChange(changes);
  }, 16), // ~60fps
  [],
);
```

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

```typescript
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import GenericNode from './GenericNode';

describe('GenericNode', () => {
  it('renders node with correct name', () => {
    const mockData = {
      id: 'test-123',
      type: 'TestNode',
      node: {
        display_name: 'Test Node',
        template: {},
        outputs: [],
      },
    };

    render(
      <ReactFlowProvider>
        <GenericNode data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Test Node')).toBeInTheDocument();
  });

  it('shows inputs when expanded', () => {
    const mockData = {
      id: 'test-123',
      type: 'TestNode',
      showNode: true,
      node: {
        display_name: 'Test Node',
        template: {
          input1: { show: true, display_name: 'Input 1' },
        },
        outputs: [],
      },
    };

    render(
      <ReactFlowProvider>
        <GenericNode data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.getByText('Input 1')).toBeInTheDocument();
  });

  it('hides inputs when collapsed', () => {
    const mockData = {
      id: 'test-123',
      type: 'TestNode',
      showNode: false,
      node: {
        display_name: 'Test Node',
        template: {
          input1: { show: true, display_name: 'Input 1' },
        },
        outputs: [],
      },
    };

    render(
      <ReactFlowProvider>
        <GenericNode data={mockData} />
      </ReactFlowProvider>
    );

    expect(screen.queryByText('Input 1')).not.toBeInTheDocument();
  });
});
```

### Integration Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import useFlowStore from '../stores/flowStore';

describe('Flow Store', () => {
  beforeEach(() => {
    useFlowStore.setState({ nodes: [], edges: [] });
  });

  it('adds node correctly', () => {
    const { result } = renderHook(() => useFlowStore());

    act(() => {
      result.current.setNodes([
        {
          id: 'node-1',
          type: 'genericNode',
          position: { x: 0, y: 0 },
          data: { id: 'node-1', type: 'Test' },
        },
      ]);
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('node-1');
  });

  it('deletes node and connected edges', () => {
    const { result } = renderHook(() => useFlowStore());

    act(() => {
      result.current.setNodes([
        { id: 'node-1', type: 'genericNode', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', type: 'genericNode', position: { x: 100, y: 0 }, data: {} },
      ]);
      result.current.setEdges([
        { id: 'edge-1', source: 'node-1', target: 'node-2' },
      ]);
    });

    act(() => {
      result.current.deleteNode('node-1');
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.edges).toHaveLength(0);
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('can add and connect nodes', async ({ page }) => {
  await page.goto('/editor');

  // Add first node
  await page.dragAndDrop(
    '[data-testid="component-palette-item-text"]',
    '.react-flow__pane',
    { targetPosition: { x: 200, y: 200 } }
  );

  // Add second node
  await page.dragAndDrop(
    '[data-testid="component-palette-item-llm"]',
    '.react-flow__pane',
    { targetPosition: { x: 500, y: 200 } }
  );

  // Connect nodes
  const sourceHandle = page.locator('[data-handleid*="text-"]').first();
  const targetHandle = page.locator('[data-handleid*="llm-"]').first();

  await sourceHandle.hover();
  await page.mouse.down();
  await targetHandle.hover();
  await page.mouse.up();

  // Verify edge created
  const edges = page.locator('.react-flow__edge');
  await expect(edges).toHaveCount(1);
});
```

---

## Best Practices

### Architecture Patterns

1. **Separation of Concerns**
   - **Presentation**: React components (dumb, focused on UI)
   - **State**: Zustand stores (single source of truth)
   - **Business Logic**: Utils functions (pure, testable)

2. **Immutability**
   - Always use `cloneDeep` for nested objects
   - Never mutate state directly
   - Use functional updates: `setNodes((old) => [...old, newNode])`

3. **Type Safety**
   - Define strict TypeScript interfaces
   - Use discriminated unions for node types
   - Leverage type guards for runtime checks

4. **Error Boundaries**
   ```typescript
   import { ErrorBoundary } from 'react-error-boundary';

   function ErrorFallback({ error }: { error: Error }) {
     return (
       <div role="alert">
         <h2>Something went wrong</h2>
         <pre>{error.message}</pre>
       </div>
     );
   }

   <ErrorBoundary FallbackComponent={ErrorFallback}>
     <FlowEditor />
   </ErrorBoundary>
   ```

### Performance Guidelines

1. **Memoization**
   - Wrap all custom nodes/edges with `memo()`
   - Memoize callbacks with `useCallback`
   - Memoize expensive computations with `useMemo`

2. **Selective Subscriptions**
   ```typescript
   // Bad - subscribes to entire store
   const store = useFlowStore();

   // Good - only subscribes to nodes
   const nodes = useFlowStore((state) => state.nodes);

   // Better - uses selector
   const nodeCount = useFlowStore((state) => state.nodes.length);
   ```

3. **Lazy Loading**
   ```typescript
   const HeavyComponent = lazy(() => import('./HeavyComponent'));

   <Suspense fallback={<Spinner />}>
     <HeavyComponent />
   </Suspense>
   ```

4. **Debouncing & Throttling**
   - Debounce: User input (search, autosave)
   - Throttle: High-frequency events (drag, scroll)

### Accessibility

1. **Keyboard Navigation**
   - Support arrow keys for node selection
   - Tab through focusable elements
   - Enter to open node details

2. **Screen Reader Support**
   ```typescript
   <div
     role="button"
     aria-label={`${node.display_name} node`}
     tabIndex={0}
   >
     {/* Node content */}
   </div>
   ```

3. **Focus Management**
   - Trap focus in modals
   - Restore focus after actions
   - Visible focus indicators

### Code Organization

**Recommended File Structure:**

```
src/
├── pages/
│   └── FlowPage/               # Page-level component
│       ├── index.tsx           # Entry point
│       └── components/         # Page-specific components
├── components/                 # Shared components
│   ├── ui/                     # UI primitives (button, input, etc.)
│   └── common/                 # Shared business components
├── CustomNodes/                # Node definitions
│   ├── GenericNode/
│   │   ├── index.tsx
│   │   ├── components/         # Node-specific subcomponents
│   │   └── hooks/              # Node-specific hooks
│   └── [NodeType]/
├── CustomEdges/                # Edge definitions
├── stores/                     # Zustand stores
├── hooks/                      # Shared hooks
├── utils/                      # Pure utility functions
├── types/                      # TypeScript types
└── constants/                  # Constants & config
```

### Naming Conventions

```typescript
// Stores: use[Store]Store
const useFlowStore = create(...);

// Hooks: use[Action/Data]
const useAddComponent = () => { ... };
const useNodeData = (nodeId: string) => { ... };

// Components: PascalCase, descriptive
GenericNode, FlowSidebar, NodeToolbar

// Utils: camelCase, verb-first
getNodeId, validateConnection, cleanEdges

// Types: PascalCase with suffix
NodeDataType, EdgeType, FlowStoreType

// Constants: SCREAMING_SNAKE_CASE
MAX_HISTORY_SIZE, NODE_WIDTH, DEFAULT_ZOOM
```

### Common Pitfalls

1. **Not Cleaning Edges**
   - Always call `cleanEdges()` after node updates
   - Remove edges when deleting nodes
   - Validate handle IDs after template changes

2. **Forgetting to Update Node Internals**
   ```typescript
   // After changing handles
   updateNodeInternals(nodeId);
   ```

3. **Not Taking Snapshots**
   - Take snapshot BEFORE destructive operations
   - Don't snapshot on every change (performance)

4. **Mutating State**
   ```typescript
   // Bad
   nodes[0].position.x = 100;

   // Good
   setNodes((nodes) => nodes.map((n, i) =>
     i === 0 ? { ...n, position: { ...n.position, x: 100 } } : n
   ));
   ```

5. **Not Handling Async Operations**
   ```typescript
   // Bad - state may be stale
   const nodes = useFlowStore.getState().nodes;
   setTimeout(() => {
     // nodes is stale!
   }, 1000);

   // Good - get fresh state
   setTimeout(() => {
     const freshNodes = useFlowStore.getState().nodes;
   }, 1000);
   ```

---

## Deployment Considerations

### Build Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-flow': ['@xyflow/react'],
          'vendor': ['react', 'react-dom', 'zustand'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

### Environment Variables

```env
VITE_API_URL=https://api.example.com
VITE_ENABLE_AUTOSAVE=true
VITE_MAX_NODES=1000
```

### Error Tracking

```typescript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});

// In error boundaries
<ErrorBoundary
  onError={(error, errorInfo) => {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }}
>
  <App />
</ErrorBoundary>
```

---

## Conclusion

This guide covers the essential aspects of building a production-ready node-based editor. Key takeaways:

1. **Use React Flow** - Don't reinvent the wheel
2. **Zustand for State** - Simple, fast, no boilerplate
3. **Memoize Everything** - Performance is critical for large graphs
4. **Type Safety** - TypeScript prevents runtime errors
5. **Undo/Redo** - Users expect this, implement early
6. **Connection Validation** - Prevent invalid graphs
7. **Clean Edges** - Maintain data integrity
8. **Test Thoroughly** - Unit, integration, and E2E tests

**Additional Resources:**
- [React Flow Documentation](https://reactflow.dev)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Langflow Source Code](https://github.com/langflow-ai/langflow)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-30
**Based on**: Langflow v1.6.4
