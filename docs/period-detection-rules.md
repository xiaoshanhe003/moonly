# Period Detection Rules

## Goal

Moonly should not treat "period start" as a single perfect tap from the user.
The system should combine daily facts, user intent, and later follow-up records to
make a more reliable judgment and revise that judgment when more evidence arrives.

## Product Principles

1. Record evidence, not just conclusions.
2. Allow post-hoc correction when later days make the pattern clearer.
3. Distinguish certainty levels instead of pretending the system always knows.
4. Ignore probable ovulation spotting when correcting the long-term cycle.

## Daily Signals Collected

- `bleedingLevel`
  - `none`
  - `spotting`
  - `light`
  - `medium`
  - `heavy`
- `periodSignal`
  - `none`
  - `possible_start`
  - `confirmed_start`

`bleedingLevel` records what happened.
`periodSignal` records the user's subjective judgment about whether the bleeding feels
like the start of a new period.

## Confidence Model

The system classifies candidate period starts as:

- `confirmed`
- `likely`
- `inferred`

These confidence values are derived from the record stream and are not treated as
equivalent.

## First-Version Heuristics

### Confirmed start

Treat a date as a confirmed period start when any of these patterns is observed:

- The user marks a day as a possible/confirmed start and the streak contains
  `light` or heavier bleeding.
- A bleeding streak contains at least 2 days of `light` or heavier bleeding.
- The streak starts with `spotting`, then progresses into `light` or heavier
  bleeding on the next day.

### Likely start

Treat a date as a likely period start when:

- The user marks the day as a possible start, but there is not enough follow-up
  evidence yet.
- A streak currently consists only of `spotting`, so the system should wait for
  more data before upgrading it.

### Inferred start

Treat a date as an inferred period start when:

- The first recorded day in a bleeding streak is `medium` or `heavy`.
- The previous calendar day has no record at all.
- There is enough surrounding bleeding evidence to suggest the user probably
  started recording late.

In version one, the inferred start still lands on the first recorded bleeding day.
We do not automatically move the start date backward yet.

### Ovulation spotting

Treat a streak as probable ovulation spotting when:

- It contains only `spotting`.
- It lasts just 1 day.
- It falls near the predicted ovulation window.

Probable ovulation spotting should not be used to create a new cycle.

## Cycle Correction Rules

The cycle engine should prefer stronger evidence in this order:

1. Explicit `confirmed_start` user signals
2. Confirmed system-detected period starts
3. Inferred period starts
4. Onboarding defaults

`likely` starts should not directly correct the stored cycle length.

## Period Length Correction

The current period length should be based on the latest confirmed or inferred
bleeding streak. If the app does not yet have enough evidence, fall back to the
onboarding `periodLength`.

## Cycle Length Correction

The current cycle length should be corrected using intervals between reliable
period starts:

- Use confirmed starts first.
- Use inferred starts when confirmed data is insufficient.
- Do not use likely starts.
- Do not use ovulation spotting.

When possible, the system should smooth the result instead of replacing the cycle
length with a single raw interval. Version one uses a short rolling average of the
latest reliable intervals.

## UX Guidance

The UI should ask for:

1. What happened today: bleeding level
2. What the user thinks it means: "this feels like my period starting"

The UI should avoid forcing the user to make a precise medical judgment on the
first day. The app should be comfortable saying:

- "This may be the start of your period. We'll keep adjusting as you log the next few days."
- "This looks more like brief spotting, so it is not being treated as a new cycle yet."
