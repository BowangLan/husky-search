# Husky Search Style Guide

## Design Principles
- Keep layouts airy with generous padding and soft borders.
- Prioritize readability with muted secondary text and clear hierarchy.
- Use subtle hover states and gentle motion, not loud effects.
- Support dark mode by relying on theme tokens instead of hard-coded colors.

## Core Tokens (Tailwind + CSS Variables)
- Backgrounds: `bg-background`, `bg-card`, `bg-muted`, `bg-muted/40`.
- Text: `text-foreground`, `text-muted-foreground`, `text-primary`.
- Borders: `border`, `border-border`, `border-border/60`.
- Radius: `rounded-lg`, `rounded-xl` (default base radius is `0.65rem`).
- Shadows: `shadow-lg` for focus surfaces; otherwise use minimal or none.

## Typography
- Font stack: Geist Sans (`--font-geist-sans`) for body, Geist Mono for code.
- Headings use `font-heading` (weight 700); body uses `font-base` (weight 500).
- Common sizes: `text-xs` for metadata, `text-sm` for body, `text-lg`+ for titles.
- Secondary copy should use `text-muted-foreground` and lighter weights.

## Layout & Spacing
- Standard page container: `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8`.
- Default page padding uses helper classes: `mx-page` and `px-page`.
- Keep section spacing consistent with `py-6` to `py-12` depending on density.

## Cards & Surfaces
- Primary surface: `rounded-xl border border-zinc-200/80 bg-white`.
- Dark mode surface: `dark:border-zinc-800/80 dark:bg-zinc-900/20`.
- Hover treatment: `hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-lg`.
- Use `bg-card` for smaller panels like alerts and inset rows.

## Buttons & Controls
- Prefer existing button variants in `components/ui/button`.
- Ghost/hover states lean on `bg-foreground/5` and `dark:bg-foreground/15`.
- Keep icon + text buttons with `gap-2` and consistent sizing.

## Banners & Notices
- Use muted backgrounds and border separators: `bg-muted/40 border-b border-border/60`.
- Keep text short, uppercase tracking optional; size `text-xs`/`text-sm`.

## Motion & Transitions
- Use the `trans` helper for smooth, expo-out transitions.
- Favor `transition-all` with 300–500ms durations for hover effects.

## Icons
- Default size: `size-4` for buttons, `size-6` for navigation.
- Use `text-muted-foreground` for passive icons and `text-primary` for accents.

## Dark Mode
- Always use semantic tokens (`bg-background`, `text-foreground`, etc.).
- When custom color is needed, pair with `dark:` variants matching zinc palette.

## Accessibility
- Keep contrast high on primary actions and critical data.
- Ensure hover/focus states are visible; rely on `outline-ring` where possible.
- Avoid placeholder-only labels; provide visible labels or `aria-label`.
