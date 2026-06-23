# Cycle Prediction Principles

This document is the working reference for Moonly's cycle prediction logic. Read it before changing `src/features/cycle/cycle.ts`, calendar phase coloring, period-start detection, cycle calibration, or related tests.

The current implementation lives primarily in:

- `src/features/cycle/cycle.ts`
- `src/features/cycle/types.ts`
- `tests/features/cycle/sparse-records.test.ts`

## Core Model

Moonly starts with the user's profile, then refines predictions from logged evidence.

- `profile.lastPeriodStart`, `profile.periodLength`, and `profile.cycleLength` are seed values and fallbacks.
- Daily records are evidence. `bleedingLevel` says what happened. `periodSignal` says whether the user marked bleeding as a period start.
- Derived values such as current cycle length, period length, last period start, phase, and next period date are recalculated from profile plus entries. They should not be treated as permanently stored truth.
- Calculation is date-relative. A summary for a historical date must be based on information available for that date, with only tightly bounded exceptions described below.

## Period Start Detection

The engine groups bleeding entries into streaks before classifying period starts.

- Bleeding means `spotting`, `light`, `medium`, or `heavy`.
- Strong bleeding means `light`, `medium`, or `heavy`.
- Adjacent bleeding days belong to the same streak.
- A one-day unlogged gap between bleeding entries is treated as one streak, but the missing day is not counted as confirmed bleeding evidence.
- Bleeding before `profile.lastPeriodStart` is ignored for calibration.

A streak becomes a confirmed period start when:

- It contains an entry with `periodSignal: "confirmed_start"`.
- It has two consecutive strong bleeding entries.
- It starts with spotting and turns strong within `SPOTTING_CONFIRMATION_WINDOW_DAYS`.

A streak may become a likely start when:

- It is not inside the continuation window.
- It is not probable ovulation spotting.
- It starts with `spotting`, `medium`, or `heavy`, but lacks enough confirmation.

Likely starts are useful for interpretation, but they do not calibrate cycle length.

## Continuation Window

Do not split one period into multiple cycles too eagerly.

- A candidate streak is ignored as a new period when it starts within `max(profile.periodLength + CONTINUATION_BUFFER_DAYS, MIN_CONTINUATION_WINDOW_DAYS)` after the previous reliable period start.
- A candidate streak is also ignored when it starts less than `MIN_CYCLE_LENGTH_DAYS` after the previous reliable period start.

This protects against late-period spotting or sparse period logs being misread as a new cycle.

## Ovulation Spotting

Single-day spotting near the predicted ovulation window should not create or calibrate a period.

The current rule treats a streak as probable ovulation spotting when:

- It contains exactly one entry.
- That entry is `spotting`.
- Its base-profile day-of-cycle is within one day of `max(10, cycleLength - 14)`.

If this rule changes, add a regression test that proves isolated ovulation spotting does not shift `lastPeriodStart`.

## Cycle Length Calibration

Cycle length is calibrated from reliable starts, not from every bleeding entry.

- Reliable starts are the profile calibration start plus confirmed period-start events.
- Use only the latest four reliable start dates for calibration.
- Use intervals between those dates.
- Exclude suspiciously long intervals: an interval is safe only when it is below `round(profile.cycleLength * 1.65)`.
- If there are no safe intervals, fall back to `profile.cycleLength`.
- Average safe recent intervals and round to the nearest day.

Important: a missed logging gap should not directly stretch cycle length. Use missed-period prompting for that case instead of silently recalibrating from a doubled interval.

## Period Length Calibration

Period length requires stronger evidence than period start.

The app only updates `periodLength` from a completed reliable streak when:

- The streak belongs to a confirmed period start.
- The period has ended.
- The day after the bleeding streak is explicitly logged as no bleeding.
- Every day from the period start through the streak end has tracked bleeding.

If any of those conditions is missing, fall back to `profile.periodLength`.

This means sparse logs can still update `lastPeriodStart`, but they must not shrink or stretch period length.

## Overdue No-Bleeding Extension

When a predicted period is overdue and the user logs no bleeding, the app can extend the current cycle so that the predicted-period window does not show as menstrual.

This rule is deliberately narrow:

- For the calculation date, no-bleeding entries on or before that date can extend the cycle.
- A later no-bleeding entry can clarify the current overdue predicted-period window only when the calculation date is already overdue, the calculation date is not a bleeding day, and there is no bleeding entry between the calculation date and that later no-bleeding entry.
- Future no-bleeding records must not stretch historical cycle summaries outside that current overdue window.

This protects calendar history from being rewritten by future "no bleeding" logs while preserving the intended UX for an overdue predicted period.

## Phase Assignment

After resolving `lastPeriodStart`, `cycleLength`, and `periodLength`, phase is assigned by day of cycle.

- `dayOfCycle = elapsed days since lastPeriodStart modulo cycleLength, plus 1`.
- `ovulationDay = max(10, cycleLength - 14)`.
- Menstrual phase: `dayOfCycle <= periodLength`.
- Follicular phase: after menstrual and before `ovulationDay`.
- Ovulation phase: `ovulationDay` through `ovulationDay + 1`.
- Luteal phase: everything after ovulation through the end of the cycle.

If the calculated phase is menstrual but that exact date is explicitly logged as no bleeding, the app displays follicular instead.

## Calendar Principles

Calendar coloring calls `getCycleSummary(profile, entries, cellDate)` for each date.

- A month grid must not compute all cells from today's summary.
- A historical cell must not be polluted by future no-bleeding logs.
- Future cells may be predictive, but prediction styling is a UI concern and should not change phase calculation.
- Logged mood stickers are colored with the cell's calculated phase.

## Change Checklist

Before changing prediction logic:

1. Identify which principle this change intentionally alters.
2. Add or update a focused test in `tests/features/cycle/sparse-records.test.ts` before changing implementation.
3. Preserve existing tests unless the product principle itself is deliberately changing.
4. Include at least one boundary case involving sparse records, no bleeding, spotting, or historical calendar dates when relevant.
5. Run `npm run test:cycle`.
6. For app-facing changes, also run `npm run lint` and `npm run build`.

Regression cases that must stay protected:

- Sparse period logs should not recalibrate period length without an explicit next-day no-bleeding marker.
- Single ovulation spotting should not shift `lastPeriodStart`.
- One missed logging interval should not silently stretch cycle length.
- Overdue no-bleeding should keep the current predicted-period window out of menstrual.
- Future no-bleeding logs should not rewrite historical phase colors.
- User profile values are fallbacks, not permanent overrides of reliable logged evidence.

