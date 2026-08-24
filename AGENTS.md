# Repository Guidelines

## Fast Start For Agent Sessions
This repository is an active Vite frontend app, not an empty scaffold. At the start of a new session, optimize for getting the app running quickly so product iteration can happen in multiple turns.

- First inspect `package.json` and confirm the standard scripts still exist.
- Default install command: `npm install`
- Preferred development command: `npm run dev:agent`
- Fallback development command: `npm run dev`
- Default local URL: `http://localhost:5173/`
- If `5173` is occupied, Vite may automatically move to the next free port. Read the terminal output and report the actual URL.
- Keep the dev server running during the conversation unless the user asks to stop it or a restart is required.
- After code changes, prefer validating with `npm run lint` and `npm run build` when the change is substantial or could affect routing, state, or TypeScript types.
- This app is designed for iterative product debugging. Favor small, testable changes and keep the running service available between turns.

## Project Structure & Module Organization
Use the current layout and keep new files consistent with it:

- `src/` for application code
- `tests/` for automated tests when introduced
- `assets/` for static files such as images or sample data if needed later
- `docs/` for design notes and architecture decisions

Current feature grouping:

- `src/app/` for router, shell, and app-wide styles
- `src/pages/` for route-level page components
- `src/features/` for cycle logic, types, and Zustand state
- `src/components/ui/` for reusable primitives
- `src/components/domain/` for product-specific UI blocks
- `src/mocks/` for scenario presets used during UI iteration
- `src/lib/` for shared helpers

Keep file names descriptive and use feature-oriented placement.

## Build, Test, and Development Commands
Primary commands for this repository:

- `npm install` to install dependencies
- `npm run dev:agent` to start the recommended wrapper for iterative sessions
- `npm run dev` to start the raw Vite development server
- `npm run lint` to run ESLint
- `npm run build` to type-check and create a production build
- `npm run preview` to serve the production build locally

There is no `npm test` script yet. If tests are added, document the exact command in both `package.json` and `README.md`.

## Coding Style & Naming Conventions
Use 2-space indentation for JavaScript, TypeScript, JSON, and YAML unless the chosen formatter enforces something else. Prefer:

- `camelCase` for variables and functions
- `PascalCase` for classes and components
- `kebab-case` for file and directory names

Adopt a formatter and linter early, such as Prettier and ESLint, and run them before opening a pull request.

For visual styling work, prefer existing design tokens and shared scales over hardcoded values. Reuse the project's color variables, spacing tokens, radius values, and typography steps whenever possible; only introduce one-off literal values when there is a clear need and no suitable token already exists.

## Testing Guidelines
Add tests alongside new functionality when a test runner is introduced. Mirror the source structure under `tests/` or colocate test files when the toolchain supports it. Use names like `feature-name.test.ts` or `feature-name.spec.ts`.

Aim for meaningful coverage on core paths, edge cases, and regressions. Until a test framework exists, use `npm run lint` and `npm run build` as the minimum validation for non-trivial changes.

## Commit & Pull Request Guidelines
Adopt a simple commit convention:

- Write commit subjects in the imperative mood, for example `Add auth session model`
- Keep the first line under 72 characters
- Separate unrelated changes into different commits

Before every commit or push, perform a code review. The review may be skipped when the changes were reviewed recently, or when the changes are minor and do not affect code functionality, such as replacing an image or updating copy.

Pull requests should include a short summary, testing notes, and screenshots for UI changes. Link related issues when applicable and note any follow-up work explicitly.

## Configuration & Security
Do not commit secrets, local environment files, or generated credentials. Store local settings in ignored files such as `.env.local`, and add a checked-in `.env.example` when configuration becomes necessary.

## Iteration Notes
This app is optimized for product and UX iteration through repeated conversations. When working in this repo:

- Preserve the user's in-progress state model and scenario tooling unless the task requires changing it.
- Prefer making incremental UI and state updates over broad rewrites.
- When starting a session, report whether the app server is already running and which URL should be used.
- If a bug report is tied to a specific route, inspect the relevant page under `src/pages/` first, then trace into `src/components/domain/` and `src/features/cycle/`.
