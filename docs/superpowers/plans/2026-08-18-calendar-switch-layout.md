# Calendar Switch Layout Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the mobile visual jump when switching from Today to Calendar.

**Architecture:** Keep the shell Header at a stable 72px height. Render calendar-only summary and date navigation inside `CalendarPage` as a second sticky header below the shell Header. Measure both sticky regions in a layout effect and position the initial calendar month before the browser paints.

**Tech Stack:** React 19, React Router, TypeScript, Tailwind CSS, Vite.

---

### Task 1: Stabilize shell header and move calendar header ownership

**Files:**
- Modify: `src/app/shell.tsx`
- Modify: `src/pages/calendar-page.tsx`

- [x] Remove calendar-only summary/month rendering and state from `AppShell`; keep the shell header at its existing 72px bar.
- [x] Render the moved content in `CalendarPage` with a `data-calendar-sticky-header` marker and `top: 72px` sticky positioning.
- [x] Update calendar positioning to include both shell and calendar sticky header heights.

### Task 2: Eliminate paint-then-scroll timing

**Files:**
- Modify: `src/pages/calendar-page.tsx`

- [x] Measure sticky header heights in `useLayoutEffect`.
- [x] Replace the `requestAnimationFrame`-delayed initial `window.scrollTo` with a layout-effect scroll after the measured offset is available.
- [x] Prevent the visible-month observer from publishing a pre-scroll month before the initial positioning completes.

### Task 3: Verify the regression

**Files:**
- No test file currently covers browser layout transitions.

- [x] Run `npm run lint`.
- [x] Run `npm run build`.
- [x] Reproduce at a 390×844 viewport and verify repeated Today → Calendar transitions no longer show a post-paint jump, while the current month remains below both sticky headers.
