# Issue Resolution Log: State Persistence & Drag-and-Drop Fixes

**Date:** February 12, 2026
**Summary:** Resolved three interconnected issues regarding state loss on navigation, drag-and-drop flickering, and preview context flashing.

---

## 1. State Reset on Navigation

**Problem:**
When making changes in the **Profiles** editor, navigating to the **Appearance** tab and coming back caused all unsaved changes to be lost (reset to server state).

**Root Cause:**
The `profiles.tsx` component managed `localBlocks` state independently but blocked re-hydration using a `hasHydratedRef`.

- When navigating away, the component unmounted.
- On return (remount), `hasHydratedRef` reset to `false`.
- The component re-hydrated from the **React Query cache**, which was stale (contained old server data), overwriting the local unsaved changes.

**Solution (Hybrid Architecture):**
We implemented a **two-way sync** pattern:

1. **Local-First:** We kept `useState` for `localBlocks` to ensure stability for the UI.
2. **Reverse Sync:** Added a `useEffect` that updates the **React Query cache** whenever `localBlocks` changes.
   ```tsx
   // Sync local changes to cache so they persist across navigation/remounts
   useEffect(() => {
     if (!hasHydratedRef.current) return
     queryClient.setQueryData(queryKey, (old) => ({
       ...old,
       blocks: localBlocks,
     }))
   }, [localBlocks])
   ```
   Now, when the component remounts, it hydrates from a cache that _already contains_ the user's latest edits.

---

## 2. Drag-and-Drop Flickering

**Problem:**
Dragging blocks caused visual flickering, jumping, or "fighting" against the cursor.

**Root Causes:**

1. **Unstable References:** In an earlier iteration, we derived `localBlocks` directly from props during render. This created new object references on every frame/render, confusing the `dnd-kit` library.
2. **Double Re-renders:** The `reorder` mutation's `onSuccess` callback was updating the local state _again_ (to update `syncStatus`), triggering a second render immediately after the drag update.
3. **CSS Conflicts:** The draggable items had `transition-all duration-300`. This caused the browser's CSS transition to "fight" against the JavaScript-controlled transform updates from `dnd-kit`.

**Solution:**

1. **Stable State:** Reverted to `useState` (from Issue #1 fix) to guarantee stable object references during drag operations.
2. **Optimized Updates:** Removed the redundant state update in the `reorder` mutation's `onSuccess`. The optimistic update during the drag is sufficient.
3. **CSS Fix:** Changed `transition-all` to `transition-colors` in `SortableBlockItem.tsx`.
   ```tsx
   // Before: transition-all (animates transform = lag)
   // After: transition-colors (animates only hover effects)
   className = '... transition-colors duration-200 ...'
   ```

---

## 3. Preview Flash on Navigation

**Problem:**
When navigating between **Appearance** and **Profiles**, the Live Preview would momentarily "flash" or revert to old data before updating.

**Root Cause:**
Each page's strict synchronization logic was overwriting the global `PreviewContext`.

- **Scenario:** You change the background in _Appearance_. You go to _Profiles_.
- _Profiles_ mounts and immediately calls `setUser(serverData)`.
- This overwrites the global preview context with stale server data, removing the unsaved background change from _Appearance_.

**Solution (Smart Merging):**
We changed the sync logic in both `profiles.tsx` and `appearance.tsx` to use **Partial Updates**.

1. **Initial Load:** Only use `setUser` (full replace) if `previewUser` is `null`.
2. **On Navigation:** Use `updateUser` (merge) to update _only_ the fields relevant to the current page.

**Code Example:**

```tsx
// profiles.tsx
if (!previewUser) {
  setUser(data.user) // First load: strict sync
} else {
  // Navigation: only update profile fields, preserve appearance
  updateUser({ name: data.user.name, bio: data.user.bio, ... })
}
```

This ensures that unsaved changes from one page persist in the preview context while the user works on another page.
