# Registro de Averías · Breakdown Log

**Operators report a machine breakdown in 20 seconds from their phone, maintenance sees it on any device sorted by urgency, and the maintenance manager knows which machine stops the most.**

Final project of the course *Building Digital Products with Generative AI* (2026) · Jorge Iglesias Alsina.

**Live app:** https://breakdown-log-alpha.vercel.app · **Version:** 0.2.0

![Indicators per machine](docs/screenshots/indicators.png)

---

## 1. What it is

**The problem.** In many small and medium manufacturing plants, breakdowns are reported by word of mouth or written on paper. I saw it first-hand during my internship at a plastic film factory: technicians have no list of what is pending, nobody knows how long each machine was stopped, and deciding where to do preventive maintenance is pure intuition.

**Who it is for.** Three people in the same plant:

| User | What they need |
| --- | --- |
| Line operator | Report a breakdown quickly, from a phone or a tablet, without looking for anyone |
| Maintenance technician | Know what to attend to first, on whatever device they have at hand |
| Maintenance manager | See which machines stop the most, how long repairs take, and take the data to Excel |

**Minimum moment of value.** The operator reports the breakdown on their phone and the technician has it at the top of their list on their PC, sorted by priority, without a single phone call.

> **Language choice.** The user interface is in Spanish because the end users are Spanish plant workers. Code, commits and documentation are in English.

## 2. Features

| # | User story | Version |
| --- | --- | --- |
| US-01 | As a **line operator**, I want to report a breakdown (machine, description, priority and whether the machine is stopped), so that maintenance knows about it immediately without paper. | ✅ 0.1.0 |
| US-02 | As a **maintenance technician**, I want to see the pending breakdowns sorted by priority and change their status (open → in progress → resolved), so that I know what to attend to first. | ✅ 0.1.0 |
| US-03 | As the **maintenance manager**, I want to see per machine the number of breakdowns, the downtime hours and the MTTR, so that I can decide where to invest in preventive maintenance. | ✅ 0.1.0 |
| US-04 | As the **maintenance manager**, I want to export all breakdowns to a file I can open in Excel, so that I can analyse them and add them to my monthly report. | ✅ 0.2.0 |
| US-05 | As a **technician**, I want to see the breakdowns reported from any device, so that an operator's report on their phone reaches me on my PC. | ✅ 0.2.0 |

**Backlog** (left out on purpose): users with login and roles, alerts to the technician (email or notification), MTBF and OEE indicators, and a screen to manage machines.

**What each screen does**

- **Registrar · Report** (`/`): mobile-first form with validation messages in Spanish. It remembers the operator's name for the next report.
- **Averías · Breakdowns** (`/breakdowns`): pending breakdowns sorted by priority, then stopped machines, then the oldest. Each one can be moved to *In progress* or *Resolved*, and a history tab lists the resolved ones.
- **Indicadores · Indicators** (`/indicators`): total breakdowns, pending, downtime hours and MTTR of the plant, a table per machine sorted by downtime, and **Exportar a Excel (CSV)**.
- **Footer:** shows where the data lives. *Datos compartidos* (green) means every device sees the same breakdowns. *Datos guardados solo en este navegador* (amber) means there is no database connected.

**How the indicators are calculated**

- **Downtime hours.** Only breakdowns that stop the machine count, from the report to the resolution. While still open, they count until now.
- **MTTR** (*Mean Time To Repair*). Average time from the report to the resolution of the resolved breakdowns.

**The CSV export** opens directly in Excel set to Spanish: it uses `;` as separator, a decimal comma, dates as `dd/mm/yyyy hh:mm` and UTF-8 with BOM, so accents display correctly.

| Report (mobile) | Pending breakdowns (mobile) |
| --- | --- |
| ![Report](docs/screenshots/mobile-report.png) | ![List](docs/screenshots/mobile-list.png) |

## 3. How to run it

**Live app:** https://breakdown-log-alpha.vercel.app

A **demo mode** in the page footer loads 14 realistic breakdowns from a plastic film plant (*Cargar datos de ejemplo*) or deletes everything (*Borrar todos los datos*). Both ask for a second click to confirm.

### Requirements

- Node.js 20 or later, **or** Docker, **or** VS Code with the Dev Containers extension.
- Environment variables: **none to run it**. Shared storage needs the two variables in `.env.example`, which Vercel adds automatically (see below).

### Option A · Node.js

```bash
npm install
npm run dev        # http://localhost:5173 (data stored in the browser)
```

### Option B · Docker

```bash
docker compose up                                        # development -> http://localhost:5173
docker build --target prod -t breakdown-log . \
  && docker run -p 8080:80 breakdown-log                 # production with Nginx -> http://localhost:8080
```

### Option C · DevContainer

Open the folder in VS Code and choose **Reopen in Container**. The container comes with Node 22, Git, GitHub CLI and the Vue, Tailwind and Vitest extensions, and runs `npm install` on its own.

### Tests and quality

```bash
npm test           # 95 Vitest tests: domain, API, storage, services, stores, components and views
npm run lint       # type-check with vue-tsc (app + Vercel functions with Node ESM rules)
npm run build      # production build to dist/
```

GitHub Actions (`.github/workflows/ci.yml`) runs all three on every push and pull request to `main` and `develop`.

### Deploying on Vercel

1. Vercel → **Add New → Project** → import this repository. Vercel detects Vite (`npm run build`, output `dist`, production branch `main`) → **Deploy**.
2. **Shared storage (US-05).** In the project, open **Storage → Create Database → Upstash for Redis** (free plan) and connect it to the project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN`. Then **Redeploy**. The footer turns green: *Datos compartidos*.
3. `vercel.json` sends every route except `/api/*` to `index.html` (the app uses browser routing).
4. Functions:
   - `/api/breakdowns`: the shared storage API.
   - `/api/health`: answers `{"status":"ok"}`, for uptime monitoring with UptimeRobot.

Without the database, `/api/breakdowns` answers `503` and the app keeps working with each browser's storage. Nothing breaks.

### Structure

```
src/
  views/        pages: ReportView, BreakdownsView, IndicatorsView
  components/   BreakdownForm, BreakdownCard, KpiTile, ExportButton, StorageStatus, DemoBar
  stores/       Pinia: breakdowns state, storage mode, errors
  services/     data access, the ONLY layer that touches storage: cloud API or browser
  domain/       pure, tested logic: validation, ordering, statuses, MTTR, CSV
  server/       API logic (Request -> Response), Redis and in-memory stores
  types/  data/ models, plant machines and sample data
api/            Vercel functions: breakdowns.ts (shared storage), health.ts
tests/          95 tests, mirroring src/
.claude/        agents and skills used to build it
docs/           AI workflow and screenshots
```

**API** (`/api/breakdowns`, validated on the server with the same rules as the UI, max 30 writes per minute per client):

| Method | What it does |
| --- | --- |
| `GET` | List all breakdowns |
| `POST` | Report a breakdown; the server sets the id and the time |
| `PATCH ?id=…` | Change the status, only allowed transitions |
| `PUT` | Replace everything (demo mode) |

## 4. How it was built with AI

I built it with **Claude** (Anthropic) as the agent, following the course workflow: *requirement → prompt → plan → execution and test → commit*.

**My role:** defining the problem from my experience in a plant, choosing the idea and the scope, deciding what went into each version and what stayed in the backlog, and reviewing the result. **The agent's role:** proposing and writing the code, the tests and the configuration, reviewing it with its own agents and skills, and testing everything in a real browser before each merge.

**Environment for the agent**

- [`CLAUDE.md`](CLAUDE.md): the problem, the user stories, the stack, the architecture, the definitions of the indicators, and working rules such as *"implement only the user story requested"* or *"never change a test just to make it pass"*.
- **Agents** in [`.claude/agents/`](.claude/agents):

  | Agent | What it does |
  | --- | --- |
  | `tester` | Writes tests for normal, edge and error cases |
  | `code-reviewer` | Read-only review against the CLAUDE.md rules, with a verdict |
  | `docs-writer` | Keeps README, CHANGELOG and the AI workflow in sync |

- **Skills** in [`.claude/skills/`](.claude/skills):

  | Skill | What it does |
  | --- | --- |
  | `/review` | Lint + tests + build + code review |
  | `/smoke-test` | The 3 main flows in a real browser, mobile and desktop |
  | `/release` | Checks, changelog, version and tag, with my approval |

- **Branches:** `main` (production) and `develop` (integration), one `feature/…` branch per story merged with `--no-ff`, and Conventional Commits.
- DevContainer, multi-stage Docker and CI on GitHub Actions from day one.

**The cycle of each story** (details and all prompts in [`docs/ai-workflow.md`](docs/ai-workflow.md))

1. A prompt with the story and its acceptance criteria, on a `feature/` branch created from `develop`.
2. The agent implements it, and the `tester` agent writes the tests.
3. `/review`: lint, the whole suite, build and the `code-reviewer` agent.
4. `/smoke-test` in a real browser with Playwright, mobile and desktop.
5. Merge into `develop`. When a version is complete: `/release` into `main`, and Vercel deploys it.

**The US-05 prompt** (course template 4.1, adapted to the story):

> I want to build this feature: As a technician, I want to see the breakdowns reported from any device, so that an operator's report on their phone reaches me on my PC. Acceptance criteria: a REST API in Vercel functions with Upstash Redis; every input validated on the server with the same rules as the UI; rate limiting on writes; if the database is not configured, the app keeps working with browser storage and says so; other devices' breakdowns appear without reloading. Create a feature/shared-storage branch from develop. Before writing any code, explain your plan and which files you will touch. Follow the conventions in CLAUDE.md and don't add anything that is not in the criteria.

**What worked well**

- **Separating the pure logic** (`src/domain/`) from the interface: the same validation and status rules run in the browser and on the server, and are tested once.
- **The `/review` skill caught real problems before merging:**
  - In US-04, a **CSV injection** risk: a description starting with `=` would run as a formula in Excel. User text is now neutralised.
  - In US-05, a component importing from the service layer (against the CLAUDE.md rules), and some unclear validation code.
- **Testing like a user caught what the tests could not see:**
  - In 0.1.0, a visual bug.
  - Most importantly, that **data did not reach other devices**. That became US-05.

**What was hard or did not go as expected**

- **Data per browser in 0.1.0.** Testing with two browsers showed that a report on the phone did not appear on the PC, which breaks the main promise of the product. v0.2.0 fixes it with a shared database. It was tested end to end with **two separate browsers** against the real API code (with an in-memory store): report on the "phone" → visible on the "PC" → status changed on the PC → visible on the phone.
- **Vercel functions run as Node ESM**, which needs `.js` extensions in relative imports. A dedicated `tsconfig.api.json` with Node rules now catches it in `npm run lint`, before deploying.
- **Docker and the DevContainer could not be run** in the agent's environment, which had no access to Docker Hub. The files follow the structure seen in the course, but they still have to be run on a computer with Docker.

## 5. Status and next steps

**Status: v0.2.0.** The 5 stories work on mobile and desktop, with 95 passing tests, a clean type-check and build, CI on every push, and the app live on Vercel. Shared storage works as soon as the Upstash database is connected in Vercel. Until then, each browser keeps its own data.

**Known limitations**

- **There is no login yet:** anyone with the link can report breakdowns or use the demo mode to replace the data. Rate limiting reduces abuse, but real use needs users and roles.
- The machines of the plant are fixed in `src/data/machines.ts`.

**Next steps (v0.3.0)**

1. **Login by role.** Operators report, technicians change statuses, only the manager exports or deletes.
2. **Alerts to the technician** when a high-priority breakdown is reported.
3. **MTBF and OEE indicators**, and a **machine management** screen.
