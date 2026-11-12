# CLAUDE.md

Guidance for Claude when working in this repository.

## Project overview

**Registro de Averías** (breakdown-log) is a web app for small and medium manufacturing plants.
Line operators report machine breakdowns from any device in seconds; maintenance technicians see the open breakdowns sorted by priority and update their status; the maintenance manager sees, per machine, how many breakdowns there were, the downtime hours and the MTTR, to decide where preventive maintenance pays off.

It replaces breakdowns reported by word of mouth or on paper. Minimum moment of value: an operator reports a breakdown and the technician sees it in the list immediately.

The MVP runs entirely in the browser: data is stored in `localStorage` behind a service layer, so a real REST API and database can replace it later without changing views or stores.

## User stories

MVP:

- **US-01** As a line operator, I want to report a breakdown (machine, description, priority, whether the machine is stopped), so that maintenance knows about it immediately without paper.
- **US-02** As a maintenance technician, I want to see the open breakdowns sorted by priority and change their status (open → in progress → resolved), so that I know what to attend to first.
- **US-03** As the maintenance manager, I want to see per machine the number of breakdowns, the downtime hours and the MTTR, so that I can decide where to invest in preventive maintenance.

v0.2.0:

- **US-04** As the maintenance manager, I want to export all breakdowns to a file I can open in Excel, so that I can analyse them and add them to my monthly report.
- **US-05** As a technician, I want to see the breakdowns reported from any device, so that an operator's report on their phone reaches me on my PC.

Backlog: users with login and roles, notifications, MTBF and OEE indicators, machine management screen.

## Stack

- Vue 3 (Composition API, `<script setup lang="ts">`) + TypeScript
- Vite
- Vue Router, Pinia
- Tailwind CSS
- Vitest + Vue Test Utils (jsdom)
- Docker + docker compose, DevContainer
- Deploy: Vercel (static build to `dist/`, serverless functions in `/api`)

## Architecture

```
src/
  main.ts          # bootstrap: createApp, router, pinia
  App.vue          # layout shell (header, navigation, <RouterView>)
  router/          # routes: / (report), /breakdowns, /indicators
  views/           # route-level pages
  components/      # presentational UI, props in / events out
  stores/          # Pinia stores (breakdowns)
  services/        # data access - the ONLY layer that touches storage
  domain/          # pure business logic (sorting, status transitions, metrics)
  types/           # shared models: Breakdown, Machine, Priority, Status
  data/            # static data: plant machines
tests/             # Vitest specs, mirroring src/
api/               # Vercel serverless functions (health check)
docs/              # project documentation (AI workflow, prompts)
```

### Rules

- Data flow: `views -> stores -> services -> localStorage`. Components never import services.
- Business logic (MTTR, downtime, sorting, allowed status changes) lives in `src/domain/` as pure, tested functions.
- All shared models are typed in `src/types/`. No `any`.
- Use `<script setup lang="ts">` and the Composition API.
- Style with Tailwind utilities.
- User interface text in Spanish (end users are Spanish plant workers); code, comments, commits and file names in English.

### Definitions

- **Downtime (horas de parada)**: for breakdowns that stop the machine, the time from the report until it is resolved.
- **MTTR**: mean time to repair = average time from report to resolution of the resolved breakdowns of a machine.

## Commands

```bash
npm install         # install dependencies
npm run dev         # dev server -> http://localhost:5173
npm test            # Vitest
npm run lint        # type-check (vue-tsc)
npm run build       # type-check + production build to dist/
docker compose up   # dev server inside Docker -> http://localhost:5173
```

## Git workflow (mandatory)

- `main` is production, `develop` is integration. Never commit directly to `main`.
- Every feature goes in a `feature/<name>` branch created from `develop` and is merged into `develop` with `--no-ff` only after review.
- Releases: merge `develop` into `main` only with the user's approval.
- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`. Summary in English, lowercase, no trailing period.

## Agents and skills

Specialized agents in `.claude/agents/` and skills in `.claude/skills/`. Use them in every cycle:

| When | Use |
| --- | --- |
| Right after implementing a story | `tester` agent: tests for normal, edge and error cases |
| Before merging a branch into `develop` | `/review` skill: lint + tests + build + `code-reviewer` agent |
| After a merge or a deployment | `/smoke-test` skill: the 3 main flows in a real browser |
| End of every feature | `docs-writer` agent: CHANGELOG, README, docs/ai-workflow.md |
| Publishing a version | `/release` skill: checks, changelog, version and tag, with the user's approval |

## Working rules

- Before writing code for a feature, explain the plan and the files you will touch.
- Implement only the user story requested; don't add anything that is not in its acceptance criteria.
- Every change comes with its tests. The full suite, type-check and build must pass before merging.
- If a test fails, explain the cause before fixing it. Never change a test just to make it pass.
- Never write secrets in the code: environment variables, `.env` in `.gitignore`, versioned `.env.example`.
- The development environment is a DevContainer; the application can also run with Docker.
