# Retirement Planner Constitution

## Core Principles

### I. Accuracy & Transparency
Financial trust is paramount. All calculations must be transparent to the user.
- **Show Your Work**: Every major number (projections, taxes) must be traceable. Maintain the "Methodology" panel and calculation tooltips.
- **Verifiable Logic**: Financial formulas must be isolated in pure functions (`src/utils/`) and rigorously tested.

### II. Privacy First (Local-First)
User financial data is sensitive.
- **No Server Storage**: All user data persists only in the browser (`localStorage`).
- **No Telemetry**: Do not add analytics that track personal financial inputs.

### III. Modern & Clean Architecture
We maintain a cutting-edge, maintainable codebase.
- **Stack**: React 19, TypeScript, Vite, Tailwind CSS v4.
- **Type Safety**: Strict TypeScript usage. No `any` types unless absolutely unavoidable.
- **Component Design**: Functional components with hooks. Keep UI (components) separate from Business Logic (utils/hooks).

### IV. Testing Standards
- **Logic Testing**: All functions in `src/utils/` (taxes, projections) must have comprehensive unit tests.
- **Edge Cases**: Tests must cover edge cases (0 balances, extreme ages, market crashes).
- **Command**: Run `npm test` to verify logic before any merge.

## Development Workflow

1.  **Understand**: Read existing logic in `src/utils/` before modifying.
2.  **Plan**: Define the financial impact of changes.
3.  **Test-Drive**: For calculation changes, write/update tests in `src/tests/` first.
4.  **Implement**: Write clean, idiomatic React/TypeScript code.
5.  **Verify**: Ensure `npm test` passes and `npm run lint` is clean.

## Governance

This constitution guides all AI and human contributions to the Retirement Planner.
- **Conflicts**: If a requested feature conflicts with Privacy or Accuracy, raise a concern immediately.
- **Refactoring**: improvements to code clarity are encouraged, provided they don't break existing tests.

**Version**: 1.0.0 | **Ratified**: 2026-01-01