# AI workflow: from idea to MVP and v0.2.0

How *Registro de Averías* (Breakdown Log) was built with an AI agent (Claude), following the course workflow (*Development workflow with AI agents*): set up the project (steps 3.1–3.3) and repeat one cycle per user story (steps 4.1–4.4).

## 0. Starting point: defining the idea

I started from the final project brief and the *MVP scope and requirements* template (module 5). The agent proposed four ideas related to my background in industrial automation: a breakdown log, a PLC data explorer, a quote builder and a cable sizing calculator. **I chose the breakdown log** because I saw the problem first-hand during my internship in a plant, and because it can be understood in one minute.

| Question | Answer |
| --- | --- |
| What problem does it solve? | Breakdowns are reported by word of mouth or on paper: maintenance cannot see what is pending and nobody measures which machine stops the most. |
| Who is it for? | Operators, technicians and the maintenance manager of a small or medium plant. |
| Minimum moment of value? | The operator reports the breakdown and the technician has it at the top of their list, without phone calls. |

Scope decisions:

- **3 stories in the MVP** (report, attend, measure) and the rest in the backlog.
- **No database in the MVP**, so it could be published and presented on time. The `services/` layer is ready to swap it.
- **User interface in Spanish** (the users are Spanish plant workers) and **code and documentation in English** (course convention).

## 1. Setting up the project (steps 1–3.3)

**Steps 1–2 · Repository and branches**

```bash
git init -b main && git commit -m "chore: initialize repository"
git switch -c develop
```

**Prompt 3.2 · README and CLAUDE.md, no code**

> We are starting a new project in this folder. The project is: a web app for small and medium manufacturing plants where line operators report machine breakdowns in seconds, maintenance technicians see them sorted by priority and update their status, and the maintenance manager sees downtime and MTTR per machine to decide where preventive maintenance pays off. Stack: Vue 3 + Vite + TypeScript + Tailwind + Pinia + Vitest, deployed on Vercel. Create: 1. A README.md with the project description… 2. A CLAUDE.md with the description, the stack, the conventions, and these working rules: Git workflow (main is production and develop is integration; each feature goes in a feature/<name> branch created from develop); Conventional Commits; the development environment is a DevContainer; the application is deployed with Docker; never write secrets in the code. Don't write any application code yet.

Result: `docs: add project definition in readme and claude.md`. CLAUDE.md also includes the exact definitions of *downtime* and *MTTR*, so that the code and the tests use the same formulas.

**Prompt 3.3 · Skeleton**

> Read the README.md and the CLAUDE.md and set up the project so we can start building, working on the develop branch: create the folder structure and the minimal skeleton for the stack; add .devcontainer/devcontainer.json, Dockerfile, docker-compose.yml, .gitignore, and .env.example; set up the test framework and leave one example test that passes. Make small commits in the Conventional Commits format. When you finish, tell me how to run the project and how to run the tests.

Result: three small commits (Vue skeleton; Docker and DevContainer; CI with the Vercel configuration and `/api/health`). Example test, type-check and build all passing.

## 2. Building the MVP: one cycle per story

For every story: **4.1** prompt with the story and its criteria → **4.2** tests (normal cases, edge cases, errors) and the full suite → **4.3** human test in the browser → **4.4** commit and merge into `develop`.

### US-01 · Report a breakdown (`feature/report-breakdown`)

> I want to build this feature: As a line operator, I want to report a breakdown (machine, description, priority, whether the machine is stopped), so that maintenance knows about it immediately without paper. Acceptance criteria: the machine is chosen from the plant list; the description has 5–500 characters; priority and the operator's name are required; errors are shown in Spanish; the breakdown is saved and survives a page reload; a confirmation is shown and the form is cleared, keeping the operator's name. Create a feature/report-breakdown branch from develop. Before writing any code, explain your plan and which files you will touch, and wait for my approval. Follow the conventions in CLAUDE.md and don't add anything that is not in the criteria.

- **Tests (4.2):** 15 tests covering validation, the storage service (including corrupted data), the store and the form.
- **Browser test (4.3):** empty form → 4 errors in Spanish; breakdown reported → confirmation; after reloading, the breakdown is still saved.

### US-02 · Priority list and statuses (`feature/breakdown-list`)

> I want to build this feature: As a maintenance technician, I want to see the open breakdowns sorted by priority and change their status (open → in progress → resolved), so that I know what to attend to first. Acceptance criteria: high priority first, then stopped machines, then the oldest; a resolved breakdown cannot be reopened; a quick fix can go straight from open to resolved; every change is saved; resolved breakdowns are kept in a history tab. Create a feature/breakdown-list branch from develop. Before writing any code, explain your plan…

- **Tests:** priority order, allowed and forbidden transitions, duration formatting and the full view. 33 tests in total.
- **Browser test:** 3 breakdowns reported in random order appear correctly sorted. **A visual bug was found** (the urgent card had a black border) and fixed before the merge.

### US-03 · Indicators per machine (`feature/maintenance-indicators`)

> I want to build this feature: As the maintenance manager, I want to see per machine the number of breakdowns, the downtime hours and the MTTR, so that I can decide where to invest in preventive maintenance. Acceptance criteria: downtime only counts breakdowns with the machine stopped, from the report to the resolution (or until now if still open); MTTR is the average time from report to resolution of resolved breakdowns; machines without breakdowns appear with empty values; the table is sorted by downtime; plant totals are shown on top. Create a feature/maintenance-indicators branch from develop. Before writing any code, explain your plan…

- **Tests:** downtime (resolved, ongoing, machine not stopped), MTTR (including "nothing resolved" → `—`), table order, unknown machines and the view. 46 tests in total.

### Demo data (`chore/demo-data`)

With an empty app the indicators show nothing in a presentation, so a loader of 14 realistic breakdowns was added, with dates relative to "now". It asks for a second click before replacing or deleting data, and its tests check that the dates are consistent. 50 tests in total.

### Prompt 4.2 (same for every story)

> Write the tests for the feature you just built: normal cases, edge cases, and expected errors. Then run the whole test suite (not just the new tests) and show me the result. If something fails, explain the cause before fixing it. Don't change a test just to make it pass.

### Prompt 4.4 (same for every story)

> The feature is validated. Commit the changes with a Conventional Commits message, push the feature/[name] branch to GitHub, merge it into develop, and push develop. Show me the git commands before running them and tell me if there are any conflicts.

## 3. Publishing the MVP (steps 5.1–5.4)

> Check that US-01 to US-03 are complete, that there are no secrets or data in Git, and that lint, tests, and build pass. Give me a short report and the commands to merge develop into main.

```bash
git switch main
git merge --no-ff develop -m "chore(release): publish MVP v0.1.0"
git tag v0.1.0
git push origin main --tags
```

Then, in Vercel: Add New → Project → import the repository (Vite, output `dist`, production branch `main`) → Deploy. And an UptimeRobot monitor on `/api/health`.

## 4. Version 0.2.0: improving with agents and skills

After publishing the MVP, I asked to make the project as good as possible before the presentation. The agent compared it with the final project brief (module 7) and proposed three improvements:

1. **Agents and skills** were missing. The brief asks for them in section 4 of the README.
2. **An item from the backlog** (CSV export), to show the continuous improvement cycle of module 6.
3. **The main limitation of the MVP**: data not shared between devices.

I chose all three.

### Agents and skills (`chore/agents-skills`)

Created in `.claude/` and listed in CLAUDE.md with **when** to use each one:

| Type | Name | Purpose |
| --- | --- | --- |
| Agent | `tester` | Tests for normal, edge and error cases |
| Agent | `code-reviewer` | Read-only review against the CLAUDE.md rules, with a verdict |
| Agent | `docs-writer` | Keeps the documentation in sync |
| Skill | `/review` | Lint + tests + build + code review |
| Skill | `/smoke-test` | The main flows in a real browser |
| Skill | `/release` | Release checklist, waiting for my approval |

They were then used in the two cycles below.

### US-04 · Export to CSV (`feature/csv-export`)

> I want to build this feature: As the maintenance manager, I want to export all breakdowns to a file I can open in Excel, so that I can analyse them and add them to my monthly report. Acceptance criteria: the file opens correctly in Excel in Spanish (";" separator, decimal comma, accents); one row per breakdown with machine, area, priority, status, dates, downtime and time to resolve; the button is disabled when there is nothing to export; the file name includes the date. Create a feature/csv-export branch from develop. Before writing any code, explain your plan…

- **Tests:** 9 new tests (headers, Spanish labels, empty cells, escaping, unknown machines, file name, button).
- **Browser test:** downloaded the file and read it back as Excel would: 14 rows, accents correct.
- **`/review` found a security problem:** a description starting with `=` would be executed by Excel as a formula (CSV injection). Fixed in its own commit (`fix(export): …`), with a test.

### US-05 · Shared storage (`feature/shared-storage`)

> I want to build this feature: As a technician, I want to see the breakdowns reported from any device, so that an operator's report on their phone reaches me on my PC. Acceptance criteria: a REST API in Vercel functions with Upstash Redis; every input validated on the server with the same rules as the UI; rate limiting on writes; if the database is not configured, the app keeps working with browser storage and says so; other devices' breakdowns appear without reloading. Create a feature/shared-storage branch from develop. Before writing any code, explain your plan…

Design decisions:

- **The API logic is a pure `Request -> Response` function** (`src/server/breakdownsApi.ts`) with an injected store. It is tested with an in-memory store, and the Vercel function only connects it to Redis.
- **Fallback instead of failure.** If `/api/breakdowns` does not answer with a list (no database, local development, network error), the service uses `localStorage`. The footer always says which mode is active, so publishing v0.2.0 cannot break the live app.
- **Same rules on both sides.** The server validates with `src/domain/`, sets the id and the time itself, and only allows the valid status transitions.

Results:

- **Tests:** 36 new tests (API with every method and error, rate limiting, limits, Redis store with a fake client, cloud repository, fallback in 4 situations, store errors). 95 in total.
- **End-to-end test with two separate browsers** against the real API code: report on the "phone" → visible on the "PC" → status changed on the PC → visible on the phone; demo data shared; without a database, the app switches to browser mode.
- **`/review` found two issues:** a component importing a type from the service layer (against CLAUDE.md), and an unclear validation trick in the store. Both fixed before merging.
- **A risk caught by tooling:** Vercel runs functions as Node ESM, where relative imports need `.js`. A `tsconfig.api.json` with Node rules makes `npm run lint` fail if that is wrong.

### Release 0.2.0 (`/release`)

Lint, 95 tests and build passing, no secrets in Git, CHANGELOG and version updated. Merged into `main` with my approval and tagged `v0.2.0`. On Vercel: connect *Upstash for Redis* in **Storage** and redeploy.

## 5. Lessons learned

1. **CLAUDE.md is half of the work.** The rules *"implement only the user story requested"* and *"never change a test just to make it pass"* kept the scope under control.
2. **Tests do not replace looking at the app.** The border bug and the data-per-browser problem only appeared when testing like a user.
3. **An honest MVP says what it does not do.** The most important limitation of 0.1.0 (data not shared between devices) became the main story of 0.2.0.
4. **A review step pays off.** `/review` found a security problem (CSV injection) that no test was looking for, because nobody had thought of it yet.
