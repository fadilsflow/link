# Drag & Drop Flicker Fix - Technical Documentation

**Date:** February 2, 2026  
**Context:** Fixing persistent flickering/jumping issues during drag-and-drop reordering in the Link Dashboard.

## Executive Summary

The drag-and-drop flickering issue was caused by a "perfect storm" of three distinct factors: **Network Sync Race Conditions**, **Layout Shifts**, and **CSS Animation Conflicts**. The solution involved shifting the dashboard to a strictly **"Local-First"** architecture, creating stable layout dimensions, and optimizing CSS transitions.

---

## 1. The Root Causes (Diagnosis)

### A. Network Race Condition (The "Revert" Effect)

- **Symptom:** Item jumps back to original position then snaps to new position.
- **Cause:** The `useEffect` hook responsible for syncing server data was overwriting local state during the drag operation.
- **Process:**
  1.  User drags item locally (Local State updates immediately).
  2.  Mutation sends request to server.
  3.  A background refetch or stale cache triggers the `useEffect`.
  4.  `useEffect` sees the _old_ order from the server/cache.
  5.  `useEffect` forces `localLinks` back to the old order while the user is still looking at the new order.
  6.  Result: Visual Flicker.

### B. Layout Shift (The "Unstable Width" Effect)

- **Symptom:** Items glitch or resize slightly when dragging starts or ends.
- **Cause:** The `StatusBadge` component had a dynamic width (`w-0` when hidden vs `w-content` when visible).
- **Impact:** When an item's status changed (e.g., from "Saved" to undefined during drag), the badge width changed from `0px` to `~96px`. This forced the adjacent flex container (the input fields) to resize instantly, causing a layout repaint that looked like a flicker.

### C. CSS Animation Conflict (The "Elastic/Laggy" Effect)

- **Symptom:** Items felt "heavy" or "elastic" when dragged, fighting against the mouse movement.
- **Cause:** The item container had `transition-all duration-200`.
- **Impact:** `dnd-kit` updates the `transform` style continuously (every ms) to follow the mouse. However, `transition-all` told the browser to "animate any change over 200ms". The browser tried to smooth out the `dnd-kit` movement, causing a conflict where the visual position lagged behind the actual cursor position.

---

## 2. Technical Solutions

### ✅ Solution 1: "Strict Local-First" Hydration

We fundamentally changed how the dashboard syncs data. Instead of continuous two-way sync, we now use **One-Time Hydration**.

**Code Strategy (`admin.tsx`):**

```tsx
const hasHydratedRef = useRef(false)

useEffect(() => {
  // If we already hydrated once, NEVER sync from server again
  if (hasHydratedRef.current || !dashboardData?.links) return

  setLocalLinks(...)
  hasHydratedRef.current = true // Lock synchronization
}, [dashboardData?.links])
```

- **Why:** Server data is treated as _persistence only_, not the _source of truth_ for the active UI. The UI trusts local manipulations 100%.

### ✅ Solution 2: Fixed Layout Stability

We enforced a stable width for dynamic components to prevent layout shifts.

**Code Strategy (`StatusBadge.tsx`):**

```tsx
// Before: w-0 when hidden
// After: Always w-24, just hide opacity
className = 'w-24 border-l ...'
```

- **Why:** Even if the badge is invisible or status is unknown, it occupies the exact same pixel width. The flex siblings never need to resize/reflow.

### ✅ Solution 3: CSS Transition Optimization

We removed global transitions that conflict with drag transforms.

**Code Strategy (`SortableLinkItem.tsx`):**

```tsx
// Before: transition-all
// After: transition-colors
className = '... transition-colors duration-200 ...'
```

- **Why:** We only animate what needs animating (hover colors). We explicitly do NOT animate `transform`, allowing `dnd-kit` to have full, instant control over positioning.

---

## 3. Best Practices for Future Development

1.  **Avoid `transition-all` on Draggables:** Never stick `transition-all` on an element that is being moved via JS/Transform. It kills performance and responsiveness.
2.  **Stable Dimensions:** Use `w-[fixed]`, `min-w`, or `aspect-ratio` for elements that might hide/show content inside a flex/grid list. `w-0` to `w-auto` is a layout killer.
3.  **Local Optimism:** For complex interactive lists, trust local state completely. Don't let background queries overwrite active user input.
