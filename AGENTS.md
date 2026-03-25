# Repository Guidelines

## Project Structure & Module Organization
This repository is currently empty. As code is added, keep the layout predictable:

- `src/` for application code
- `tests/` for automated tests
- `assets/` for static files such as images or sample data
- `docs/` for design notes and architecture decisions

Group related modules by feature or domain, and keep file names descriptive, for example `src/auth/session.ts` or `tests/auth/session.test.ts`.

## Build, Test, and Development Commands
No build system is configured yet. When tooling is introduced, document the primary commands in the root `README.md` and keep them consistent:

- `npm install` or equivalent to install dependencies
- `npm run dev` to start local development
- `npm test` to run the automated test suite
- `npm run lint` and `npm run format` for code quality checks

If another stack is chosen, provide equivalent commands and avoid duplicate task runners.

## Coding Style & Naming Conventions
Use 2-space indentation for JavaScript, TypeScript, JSON, and YAML unless the chosen formatter enforces something else. Prefer:

- `camelCase` for variables and functions
- `PascalCase` for classes and components
- `kebab-case` for file and directory names

Adopt a formatter and linter early, such as Prettier and ESLint, and run them before opening a pull request.

## Testing Guidelines
Add tests alongside new functionality. Mirror the source structure under `tests/` or colocate test files when the toolchain supports it. Use names like `feature-name.test.ts` or `feature-name.spec.ts`.

Aim for meaningful coverage on core paths, edge cases, and regressions. Do not merge features without at least one automated test when the repository has a test framework in place.

## Commit & Pull Request Guidelines
There is no existing Git history in this directory, so adopt a simple convention now:

- Write commit subjects in the imperative mood, for example `Add auth session model`
- Keep the first line under 72 characters
- Separate unrelated changes into different commits

Pull requests should include a short summary, testing notes, and screenshots for UI changes. Link related issues when applicable and note any follow-up work explicitly.

## Configuration & Security
Do not commit secrets, local environment files, or generated credentials. Store local settings in ignored files such as `.env.local`, and add a checked-in `.env.example` when configuration becomes necessary.
