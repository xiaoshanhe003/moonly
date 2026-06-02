# Sparse Cycle Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add regression coverage and conservative cycle guards for users who log intermittently, skip days, or pause logging for a month.

**Architecture:** Keep the existing cycle engine in `src/features/cycle/cycle.ts`, but add explicit sparse-record invariants around calibration. Use Node's built-in test runner so the repository can test TypeScript cycle logic without adding dependencies.

**Tech Stack:** TypeScript, Node 25 `node:test`, Vite/ESLint existing validation.

---

### Task 1: Add Sparse Record Regression Tests

**Files:**
- Create: `tests/features/cycle/sparse-records.test.ts`
- Modify: `package.json`
- Modify: `README.md`
- Modify: `eslint.config.js`

- [x] Add `npm run test:cycle` using `node --experimental-strip-types --test tests/features/cycle/*.test.ts`.
- [x] Cover sparse bleeding logs, explicit period endings, skipped days inside bleeding, missed-cycle gaps, and overdue no-bleeding records.
- [x] Document the test command in `README.md`.
- [x] Allow Node globals in `tests/**/*.ts` ESLint config.

### Task 2: Harden Period Length Calibration

**Files:**
- Modify: `src/features/cycle/cycle.ts`
- Test: `tests/features/cycle/sparse-records.test.ts`

- [x] Require an explicit next-day no-bleeding marker before using a streak to calibrate `periodLength`.
- [x] Require every day from the period start through the streak end to have an explicit bleeding record before using the streak length.
- [x] Preserve confirmed starts for `lastPeriodStart` and cycle prediction even when the streak is too sparse for period-length calibration.

### Task 3: Harden Cycle Length Calibration

**Files:**
- Modify: `src/features/cycle/cycle.ts`
- Test: `tests/features/cycle/sparse-records.test.ts`

- [x] Exclude suspiciously long intervals from direct `cycleLength` calibration when they are more likely to represent missed logging.
- [x] Keep `getMissedPeriodCandidate` available for the UI to handle a possible missed cycle instead of silently stretching the user's cycle length.

### Task 4: Verify

**Files:**
- Validate repository state only.

- [x] Run `npm run test:cycle`.
- [x] Run `npm run lint`.
- [x] Run `npm run build`.
