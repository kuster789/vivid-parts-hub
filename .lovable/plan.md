

## Problem

The product add/edit form modal closes automatically when interacting with `<select>` dropdowns (brand, model, condition). This happens because:

1. The modal overlay (line 528) has `onClick={() => { setShowForm(false); resetForm(); }}`
2. Native `<select>` dropdown options render outside the modal's `<div>` boundary
3. Clicking a dropdown option triggers the overlay's click handler, closing the form

## Fix

Change the overlay's `onClick` to only fire when clicking directly on the overlay itself, not on child elements or portaled content:

**File:** `src/components/admin/AdminProducts.tsx` (line 528)

Replace:
```tsx
onClick={() => { setShowForm(false); resetForm(); }}
```
With:
```tsx
onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}
```

This ensures the modal only closes when clicking the backdrop itself, not when interacting with form elements like selects.

## Scope
- Single line change in `AdminProducts.tsx`
- No other files affected

