# Missed Period Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a bottom Sheet confirmation when cycle data suggests one period was missed, and add a dev scenario to trigger it.

**Architecture:** Cycle inference exposes a `getMissedPeriodCandidate` helper that detects a suspicious gap between reliable period starts using the user's baseline cycle length. Zustand stores handled candidate ids so the same prompt does not repeat. `AppShell` renders the existing `Sheet` style and only backfills a minimal confirmed start after user confirmation.

**Tech Stack:** React 19, TypeScript, Zustand persist, existing Moonly UI primitives.

---

### Task 1: Cycle Candidate Helper

**Files:**
- Modify: `src/features/cycle/cycle.ts`

- [ ] Export a `MissedPeriodCandidate` type with `id`, `previousStart`, `nextStart`, `suggestedStart`, `gapDays`, and `expectedCycleLength`.
- [ ] Add `getMissedPeriodCandidate(profile, entries, today)` that reuses `getPeriodEvents`, includes the profile calibration start, and detects gaps between reliable starts when the gap is roughly two or more expected cycles.
- [ ] Use `profile.cycleLength` as the expected length for candidate detection so a suspect doubled interval does not hide itself by recalibrating the cycle length.

### Task 2: Store Handled Prompt State

**Files:**
- Modify: `src/features/cycle/store.ts`

- [ ] Add `handledMissedPeriodCandidateIds: string[]`.
- [ ] Add `handleMissedPeriodCandidate(id)` to mark a prompt handled.
- [ ] Clear handled ids when loading a dev scenario or restarting.
- [ ] Migrate older persisted stores with an empty handled list.

### Task 3: App Shell Sheet

**Files:**
- Modify: `src/app/shell.tsx`

- [ ] Import `Sheet`, `getMissedPeriodCandidate`, and existing `Button`/style helpers.
- [ ] Render the Sheet when a candidate exists and its id is not handled.
- [ ] On confirm, call `updateEntry(candidate.suggestedStart, { bleedingLevel: "spotting", periodSignal: "confirmed_start" })` while preserving any existing entry fields through store merging, then mark handled.
- [ ] On dismiss or close, only mark handled.

### Task 4: Dev Scenario

**Files:**
- Modify: `src/features/cycle/types.ts`
- Modify: `src/mocks/scenarios.ts`
- Modify: `src/components/domain/dev-scenario-bar.tsx`

- [ ] Add a `missed-period` scenario id.
- [ ] Build a scenario with `lastPeriodStart` 56 days ago, cycle length 28, and today's confirmed bleeding start.
- [ ] Expose the scenario in the dev panel.

### Task 5: Verification

**Files:**
- No source files.

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Confirm the dev server remains available.
