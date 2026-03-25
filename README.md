# moonly

Moonly is a lightweight cycle tracking web app built as an installable PWA. It helps users understand where they are in their cycle, record daily signals with very low friction, and review predicted phases in a calm calendar view.

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
npm run dev
npm run lint
npm run build
npm run preview
```

- `npm run dev`: start the local Vite dev server
- `npm run lint`: run ESLint on the codebase
- `npm run build`: type-check and create a production build
- `npm run preview`: serve the production build locally

## Notes for Iteration

The UI is intentionally split into small domain components so visual refinement can happen without rewriting cycle logic. The scenario bar in the app can switch between cold start, pending log, in-progress log, completed log, and calendar forecast states.

Repository conventions live in [AGENTS.md](./AGENTS.md).
