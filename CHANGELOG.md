# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com) and [Semantic Versioning](https://semver.org).

## [Unreleased]

### Changed

- Documentation (README, AI workflow, changelog) translated to English, the language of the course. The user interface stays in Spanish for Spanish plant workers.

## [0.1.0] - 2026-11-11 · MVP

### Added

- US-01: breakdown report form, mobile-first, with validation messages in Spanish.
- US-02: pending breakdowns sorted by priority, status changes (open → in progress → resolved) and a history of resolved breakdowns.
- US-03: plant and per-machine indicators (breakdowns, pending, downtime hours, MTTR).
- Demo mode with 14 realistic breakdowns.
- Vue 3 + Vite + TypeScript + Tailwind + Pinia skeleton, DevContainer, multi-stage Docker (dev/build/prod with Nginx), CI with GitHub Actions, Vercel configuration and `/api/health`.
- 50 Vitest tests.
