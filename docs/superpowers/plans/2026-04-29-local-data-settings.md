# Local Data Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add local-first data confidence, prediction calibration, backup text import/export, and a settings sheet for Moonly.

**Architecture:** Keep the app local-first with Zustand persistence as the source of truth. Add focused domain helpers for backup text and app info, then mount a reusable settings sheet from the existing app shell.

**Tech Stack:** React 19, TypeScript, Zustand persist, React Router, Vite, Tailwind CSS utilities, lucide-react.

---

### Task 1: State And Cycle Rules

**Files:**
- Modify: `src/features/cycle/types.ts`
- Modify: `src/features/cycle/store.ts`
- Modify: `src/features/cycle/cycle.ts`

- [ ] **Step 1: Extend stored profile**

Add an optional `calibratedAt` string to `CycleProfile`. It marks the date when the user manually set the prediction anchor.

- [ ] **Step 2: Add profile update action**

Add `updateProfile(patch: Partial<CycleProfile>)` to the Zustand store so settings can update only the calibration date without touching daily entries.

- [ ] **Step 3: Respect calibration anchor**

In `resolveCycleMetrics`, ignore period-start events before `profile.lastPeriodStart` so calibration resets prediction from that date forward while leaving entries unchanged.

### Task 2: Backup Text

**Files:**
- Create: `src/features/backup/backup-text.ts`
- Modify: `src/features/cycle/store.ts`

- [ ] **Step 1: Define backup payload**

Create helpers to serialize `{ version, app, createdAt, data: { profile, entries } }` into a readable backup text headed by `月信备份` and `MOONLY-1`.

- [ ] **Step 2: Parse backup text**

Create a parser that accepts the full readable text, extracts the recovery code after `MOONLY-1`, decodes JSON, validates profile and entries shape, and returns a typed result with `createdAt`, `profile`, and `entries`.

- [ ] **Step 3: Add import action**

Add `importEntries(entries, conflictMode)` where conflict mode is `skip` or `overwrite`. For existing profiles with data, imported `profile` is not exposed as a user decision; entries are merged by date.

### Task 3: Settings Sheet

**Files:**
- Create: `src/features/app-info/app-info.ts`
- Create: `src/components/domain/settings-sheet.tsx`
- Modify: `src/app/shell.tsx`

- [ ] **Step 1: Add settings home**

Build a Sheet with list entries for `预测校准`, `数据备份`, `了解周期`, and `关于月信`.

- [ ] **Step 2: Add prediction calibration**

Allow selecting a recent period start date with `max={today}`. Before saving, show the confirmation text: `保存后，月信会从这一天开始重新判断相位和未来预测。已有每日记录不会被修改。`

- [ ] **Step 3: Add data backup**

Show local data explanation, copy backup text, show copy guidance, parse pasted backup text, preview creation time and record count, and ask the exact conflict question: `发现X个日期的记录已存在，你想如何处理这些记录？` with options `跳过重复日期` and `覆盖全部并导入`.

- [ ] **Step 4: Add about section**

Show version `0.2.0` and three user-visible recent updates.

### Task 4: Onboarding And Header

**Files:**
- Modify: `src/pages/onboarding-page.tsx`
- Modify: `src/components/domain/install-app-button.tsx`
- Modify: `src/app/shell.tsx`

- [ ] **Step 1: Show local-save sheet after onboarding completion**

After clicking `完成`, persist the profile, then show a sheet titled `已保存到本机` with one button `我知道了`. Navigate to `/today` only after acknowledgment.

- [ ] **Step 2: Move install action into header**

Make `InstallAppButton` support inline rendering and place it to the left of the settings gear in the shell header. Hide settings until onboarding is complete.

### Task 5: Verification

**Files:**
- Validate all modified files.

- [ ] **Step 1: Run lint**

Run `npm run lint`. Expected: command exits successfully.

- [ ] **Step 2: Run build**

Run `npm run build`. Expected: TypeScript and Vite production build complete successfully.
