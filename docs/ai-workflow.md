# Proceso con IA: de la idea al MVP

Registro de cómo se construyó *Registro de Averías* con un agente de IA (Claude), siguiendo el flujo de trabajo del curso (*Development workflow with AI agents*): preparar el proyecto (3.1–3.3) y repetir un ciclo por historia de usuario (4.1–4.4).

## 0. Punto de partida: definir la idea

Partí del encargo del proyecto final y de la plantilla *Alcance y requisitos del MVP* (módulo 5). El agente propuso cuatro ideas ligadas a mi perfil (automática industrial): un registro de averías, un explorador de datos de PLC, un presupuestador y una calculadora de cables. **Elegí el registro de averías** porque es un problema que vi de cerca en mis prácticas en planta y porque se entiende en un minuto.

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué problema resuelve? | Las averías se avisan de palabra o en papel: mantenimiento no ve lo pendiente y nadie mide qué máquina para más. |
| ¿Para quién? | Operarios, técnicos y jefe de mantenimiento de una planta pequeña o mediana. |
| ¿Momento mínimo de valor? | El operario registra la avería y el técnico la tiene arriba de su lista, sin llamadas. |

Decisiones de alcance:

- **3 historias en el MVP** (registrar, atender, medir) y el resto al backlog.
- **Sin base de datos en el MVP**, para poder publicarlo y defenderlo a tiempo. La capa `services/` queda preparada para cambiarla.
- **Interfaz en español** (los usuarios son operarios de planta) y **código en inglés** (convención del curso).

## 1. Preparar el proyecto (pasos 1–3.3)

**Paso 1–2 · Repositorio y ramas**

```bash
git init -b main && git commit -m "chore: initialize repository"
git switch -c develop
```

**Prompt 3.2 · README y CLAUDE.md, sin código**

> We are starting a new project in this folder. The project is: a web app for small and medium manufacturing plants where line operators report machine breakdowns in seconds, maintenance technicians see them sorted by priority and update their status, and the maintenance manager sees downtime and MTTR per machine to decide where preventive maintenance pays off. Stack: Vue 3 + Vite + TypeScript + Tailwind + Pinia + Vitest, deployed on Vercel. Create: 1. A README.md with the project description… 2. A CLAUDE.md with the description, the stack, the conventions, and these working rules: Git workflow (main is production and develop is integration; each feature goes in a feature/<name> branch created from develop); Conventional Commits; the development environment is a DevContainer; the application is deployed with Docker; never write secrets in the code. Don't write any application code yet.

Resultado: `docs: add project definition in readme and claude.md`. El CLAUDE.md incluye además las definiciones exactas de *horas de parada* y *MTTR*, para que el código y los tests usen las mismas fórmulas.

**Prompt 3.3 · Esqueleto**

> Read the README.md and the CLAUDE.md and set up the project so we can start building, working on the develop branch: create the folder structure and the minimal skeleton for the stack; add .devcontainer/devcontainer.json, Dockerfile, docker-compose.yml, .gitignore, and .env.example; set up the test framework and leave one example test that passes. Make small commits in the Conventional Commits format. When you finish, tell me how to run the project and how to run the tests.

Resultado: tres commits pequeños (esqueleto Vue, Docker y DevContainer, CI con Vercel y `/api/health`). Test de ejemplo, comprobación de tipos y build en verde.

## 2. Construir el MVP: un ciclo por historia

En cada historia: **4.1** prompt con la historia y sus criterios → **4.2** tests (normales, límite y errores) y suite completa → **4.3** prueba humana en navegador → **4.4** commit y merge a `develop`.

### US-01 · Registrar una avería (`feature/report-breakdown`)

> I want to build this feature: As a line operator, I want to report a breakdown (machine, description, priority, whether the machine is stopped), so that maintenance knows about it immediately without paper. Acceptance criteria: the machine is chosen from the plant list; the description has 5–500 characters; priority and the operator's name are required; errors are shown in Spanish; the breakdown is saved and survives a page reload; a confirmation is shown and the form is cleared, keeping the operator's name. Create a feature/report-breakdown branch from develop. Before writing any code, explain your plan and which files you will touch, and wait for my approval. Follow the conventions in CLAUDE.md and don't add anything that is not in the criteria.

- **Tests (4.2):** 15 tests sobre la validación, el servicio de almacenamiento (incluido el caso de datos corruptos), el store y el formulario.
- **Prueba en navegador (4.3):** formulario vacío → 4 errores en español; avería registrada → confirmación; tras recargar, la avería sigue guardada.

### US-02 · Lista por prioridad y estados (`feature/breakdown-list`)

> I want to build this feature: As a maintenance technician, I want to see the open breakdowns sorted by priority and change their status (open → in progress → resolved), so that I know what to attend to first. Acceptance criteria: high priority first, then stopped machines, then the oldest; a resolved breakdown cannot be reopened; a quick fix can go straight from open to resolved; every change is saved; resolved breakdowns are kept in a history tab. Create a feature/breakdown-list branch from develop. Before writing any code, explain your plan…

- **Tests:** orden de prioridad, transiciones permitidas y prohibidas, formato de duraciones y la vista completa. 33 tests en total.
- **Prueba en navegador:** 3 averías registradas en desorden aparecen bien ordenadas. **Se encontró un fallo visual** (la tarjeta urgente salía con un borde negro) y se corrigió antes del merge.

### US-03 · Indicadores por máquina (`feature/maintenance-indicators`)

> I want to build this feature: As the maintenance manager, I want to see per machine the number of breakdowns, the downtime hours and the MTTR, so that I can decide where to invest in preventive maintenance. Acceptance criteria: downtime only counts breakdowns with the machine stopped, from the report to the resolution (or until now if still open); MTTR is the average time from report to resolution of resolved breakdowns; machines without breakdowns appear with empty values; the table is sorted by downtime; plant totals are shown on top. Create a feature/maintenance-indicators branch from develop. Before writing any code, explain your plan…

- **Tests:** cálculo de parada (resuelta, en curso, sin parada), MTTR (incluido "sin resueltas" → `—`), orden de la tabla, máquinas desconocidas y la vista. 46 tests en total.

### Datos de demostración (`chore/demo-data`)

Con la app vacía, los indicadores no enseñan nada en una presentación, así que se añadió un cargador de 14 averías realistas con fechas relativas a "ahora". Pide una segunda pulsación antes de reemplazar o borrar datos, y tiene tests que comprueban que las fechas son coherentes. 50 tests en total.

### Prompt 4.2 (igual en todas las historias)

> Write the tests for the feature you just built: normal cases, edge cases, and expected errors. Then run the whole test suite (not just the new tests) and show me the result. If something fails, explain the cause before fixing it. Don't change a test just to make it pass.

### Prompt 4.4 (igual en todas las historias)

> The feature is validated. Commit the changes with a Conventional Commits message, push the feature/[name] branch to GitHub, merge it into develop, and push develop. Show me the git commands before running them and tell me if there are any conflicts.

## 3. Publicar el MVP (pasos 5.1–5.4)

> Check that US-01 to US-03 are complete, that there are no secrets or data in Git, and that lint, tests, and build pass. Give me a short report and the commands to merge develop into main.

```bash
git switch main
git merge --no-ff develop -m "chore(release): publish MVP v0.1.0"
git tag v0.1.0
git push origin main --tags
```

Después, en Vercel: Add New → Project → importar el repositorio (Vite, salida `dist`, rama de producción `main`) → Deploy. Y un monitor en UptimeRobot sobre `/api/health`.

## 4. Lecciones

1. **El CLAUDE.md es la mitad del trabajo.** Las reglas *"implement only the user story requested"* y *"never change a test just to make it pass"* mantuvieron el alcance bajo control.
2. **Los tests no sustituyen mirar la app.** El fallo del borde y el problema de los datos por navegador solo aparecieron al probar como un usuario.
3. **Un MVP honesto dice lo que no hace.** La limitación más importante (datos no compartidos entre dispositivos) es justo el siguiente paso del producto.
