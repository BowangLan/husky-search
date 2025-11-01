# RFP: UC-010 - Add Keyboard Shortcuts

**Phase:** Phase 2: Unified Canvas  
**Status:** Open  
**Owner:** _blank_  
**Estimated Complexity:** S (Small)  
**Created:** 2025-01-XX

---

## Overview

Add comprehensive keyboard shortcuts to the planning canvas for power users, improving efficiency and accessibility for common actions.

## Background

Keyboard shortcuts enable faster workflows and improve accessibility. The planning canvas should support common shortcuts for navigation, search, and actions.

**Current State:**
- `Cmd/Ctrl+K` exists for search (global)
- No other shortcuts
- No shortcuts help

**Target State:**
- `Cmd/Ctrl+K`: Focus search
- `Esc`: Close panels
- `Cmd/Ctrl+/`: Show shortcuts help
- `Arrow keys`: Navigate search results
- `Enter`: Add course to active term
- Shortcuts help modal

## Files to Create/Modify

- `components/pages/planning/planning-canvas-layout.tsx` - Keyboard handlers
- `components/ui/keyboard-shortcuts-help.tsx` (new) - Help modal

## Acceptance Criteria

1. **Search Shortcuts**
   - `Cmd/Ctrl+K`: Focus search bar
   - `Arrow keys`: Navigate search results (up/down)
   - `Enter`: Select highlighted result
   - `Esc`: Close search dropdown

2. **Panel Shortcuts**
   - `Esc`: Close active panel
   - `Tab`: Navigate between panes
   - `Shift+Tab`: Navigate backwards

3. **Action Shortcuts**
   - `Enter`: Add course to active term (when course selected)
   - `Cmd/Ctrl+N`: New term (if applicable)
   - `Cmd/Ctrl+S`: Save plan (if applicable)

4. **Help Modal**
   - `Cmd/Ctrl+/`: Show shortcuts help
   - Modal lists all shortcuts
   - Categorized by function
   - Dismissible with `Esc` or click

5. **Platform Support**
   - Works on Mac (`Cmd`) and Windows/Linux (`Ctrl`)
   - Handles modifier keys correctly
   - No conflicts with browser shortcuts

6. **Testing**
   - All shortcuts work correctly
   - Help modal displays correctly
   - No conflicts with browser shortcuts
   - Accessibility standards met

## Implementation Details

### Keyboard Handler

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modifier = isMac ? e.metaKey : e.ctrlKey
    
    if (modifier && e.key === 'k') {
      e.preventDefault()
      focusSearch()
    }
    
    if (e.key === 'Escape') {
      closeActivePanel()
    }
    
    if (modifier && e.key === '/') {
      e.preventDefault()
      showShortcutsHelp()
    }
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### Shortcuts Help Modal

- List all shortcuts
- Group by category (Search, Navigation, Actions)
- Show platform-specific modifiers
- Searchable/filterable

## Risks & Dependencies

**Risks:**
- Browser shortcut conflicts
- Platform detection complexity
- Accessibility concerns
- User confusion

**Dependencies:** UC-006 (Planning Canvas Layout), UC-007 (Course Detail Panel)

## Testing Requirements

- All shortcuts work correctly
- Platform detection accurate
- No browser conflicts
- Help modal displays correctly
- Accessibility standards met

## Success Metrics

- Shortcuts work reliably
- Help modal clear and useful
- No browser conflicts
- User feedback positive

## Related Documentation

- See `docs/UX_Grounding_Report.md` Section 5 (Interaction Model)
- See `docs/UX_Grounding_Report.md` Section 9, Ticket UC-010

