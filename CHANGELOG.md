# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org).

## [0.2.0] - 2026-11-12

### Added

- US-04: export all breakdowns to a CSV file that opens in Excel in Spanish (`;`, decimal comma, UTF-8 with BOM).
- US-05: shared storage between devices with a REST API (`/api/breakdowns`, Vercel functions + Upstash Redis): server-side validation with the domain rules, rate limiting of writes, and automatic fallback to browser storage when no database is connected.
- Storage indicator in the footer, error banner when saving fails, automatic refresh every 30 s to see other devices' breakdowns.
- Agents (`tester`, `code-reviewer`, `docs-writer`) and skills (`/review`, `/smoke-test`, `/release`) in `.claude/`.
- `tsconfig.api.json`: type-check of the Vercel functions with Node ESM rules.
- 95 tests (from 50).

### Changed

- Documentation (README, AI workflow, changelog) translated to English, the language of the course. The user interface stays in Spanish for Spanish plant workers.

### Fixed

- CSV injection: user text starting with `=`, `+`, `-` or `@` is neutralised in the export (found by `/review`).

## [0.1.0] - 2026-11-11 · MVP

### Added

- US-01: breakdown report form, mobile-first, with validation messages in Spanish.
- US-02: pending breakdowns sorted by priority, status changes (open → in progress → resolved) and a history of resolved breakdowns.
- US-03: plant and per-machine indicators (breakdowns, pending, downtime hours, MTTR).
- Demo mode with 14 realistic breakdowns.
- Vue 3 + Vite + TypeScript + Tailwind + Pinia skeleton, DevContainer, multi-stage Docker (dev/build/prod with Nginx), CI with GitHub Actions, Vercel configuration and `/api/health`.
- 50 Vitest tests.
