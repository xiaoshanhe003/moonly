# moonly

Moonly is a lightweight cycle tracking web app built as an installable PWA. It helps users understand where they are in their cycle, record daily signals with very low friction, and review predicted phases in a calm calendar view.

## Quick Start

For a new working session, use the standard Vite flow below:

```bash
npm install
npm run dev:agent
```

- Default local URL: `http://localhost:5173/`
- If port `5173` is occupied, Vite will print the next available local URL in the terminal
- Keep the dev server running during multi-turn product iteration so UI and state changes can be tested continuously

Recommended validation after non-trivial changes:

```bash
npm run lint
npm run test:cycle
npm run build
```

## Current Scope

- `Today view`: current phase, gentle guidance, do/don't hints, and progressive daily logging
- `Calendar view`: cycle length, period length, next period date, and phase-colored monthly forecast
- `Cold start onboarding`: collects last period start, typical period length, and cycle length, with sensible defaults when unknown
- `PWA support`: installable app shell and offline-ready service worker output
- `State simulation`: built-in scenario switcher for UI iteration and page-state testing

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Zustand for app state
- React Router
- `vite-plugin-pwa`

## Project Structure

```text
src/
  app/         router, shell, global styles
  pages/       onboarding, today, calendar
  features/    cycle logic, types, store
  components/  UI primitives and domain components
  mocks/       scenario presets for state simulation
  lib/         shared helpers
public/        PWA icons
```

## Development

```bash
npm install
npm run dev:agent
npm run dev
npm run lint
npm run test:cycle
npm run build
npm run preview
```

- `npm run dev:agent`: start the recommended wrapper for agent-driven iterative sessions
- `npm run dev`: start the local Vite dev server
- `npm run dev -- --host`: expose the dev server to the local network when needed
- `npm run lint`: run ESLint on the codebase
- `npm run test:cycle`: run sparse-record regression tests for cycle prediction logic
- `npm run build`: type-check and create a production build
- `npm run preview`: serve the production build locally

## Notes for Iteration

The UI is intentionally split into small domain components so visual refinement can happen without rewriting cycle logic. The scenario bar in the app can switch between cold start, pending log, in-progress log, completed log, and calendar forecast states.

For product debugging across multiple conversation turns:

- Start by getting `npm run dev:agent` running and keep it alive while iterating
- Treat `src/pages/` as the route entry points for behavior changes
- Treat `src/features/cycle/` as the source of truth for cycle calculations and persisted state
- Use the built-in scenario switcher before adding temporary mock code
- Run `npm run lint` and `npm run build` before wrapping up substantial changes

Repository conventions live in [AGENTS.md](./AGENTS.md).
