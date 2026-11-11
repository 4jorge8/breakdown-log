# Registro de Averías

**Los operarios avisan de una avería en 20 segundos, mantenimiento la ve ordenada por urgencia y el jefe de mantenimiento sabe qué máquina para más.**

Proyecto final del curso *Building Digital Products with Generative AI* (2026) · Jorge Iglesias Alsina.

![Indicadores por máquina](docs/screenshots/indicators.png)

---

## 1. Qué es

**El problema.** En muchas plantas industriales pequeñas y medianas, las averías se avisan de palabra o se apuntan en papel. Lo vi durante mis prácticas en una fábrica de film plástico: el técnico no tiene una lista de lo pendiente, nadie sabe cuánto tiempo estuvo parada cada máquina y decidir dónde hacer mantenimiento preventivo es pura intuición.

**Para quién.** Para tres personas de la misma planta:

| Usuario | Qué necesita |
| --- | --- |
| Operario de línea | Avisar de una avería rápido, desde un móvil o una tablet, sin buscar a nadie |
| Técnico de mantenimiento | Saber qué atender primero |
| Jefe de mantenimiento | Ver qué máquinas paran más y cuánto se tarda en resolverlas |

**Momento mínimo de valor.** El operario registra la avería y el técnico la tiene arriba de su lista, ordenada por prioridad, sin una sola llamada.

## 2. Funcionalidades

Historias de usuario del MVP, todas implementadas y con tests:

| # | Historia de usuario | Estado |
| --- | --- | --- |
| US-01 | Como **operario de línea**, quiero registrar una avería (máquina, descripción, prioridad y si la máquina está parada) para que mantenimiento se entere al momento sin papel. | ✅ MVP |
| US-02 | Como **técnico de mantenimiento**, quiero ver las averías pendientes ordenadas por prioridad y cambiar su estado (abierta → en reparación → resuelta) para saber qué atender primero. | ✅ MVP |
| US-03 | Como **jefe de mantenimiento**, quiero ver por máquina el número de averías, las horas de parada y el MTTR para decidir dónde invertir en mantenimiento preventivo. | ✅ MVP |

**Backlog** (fuera del MVP a propósito): base de datos compartida con usuarios y login, exportar a CSV o Excel, avisos al técnico (correo o notificación), indicadores MTBF y OEE, y una pantalla para dar de alta máquinas.

**Qué hace cada pantalla**

- **Registrar** (`/`): formulario pensado para móvil. Valida los campos en español y recuerda el nombre del operario para el siguiente aviso.
- **Averías** (`/breakdowns`): pendientes ordenadas por prioridad, después las que tienen la máquina parada y después las más antiguas. Cada una se puede pasar a *En reparación* o a *Resuelta*. Incluye una pestaña de historial con las resueltas.
- **Indicadores** (`/indicators`): averías totales, pendientes, horas de parada y MTTR de la planta, más una tabla por máquina ordenada por horas de parada.

**Cómo se calculan los indicadores**

- **Horas de parada.** Solo cuentan las averías con *máquina parada*, desde el aviso hasta la resolución. Si siguen abiertas, cuentan hasta ahora.
- **MTTR** (*Mean Time To Repair*). Tiempo medio desde el aviso hasta la resolución de las averías resueltas.

| Registrar (móvil) | Averías pendientes (móvil) |
| --- | --- |
| ![Registrar](docs/screenshots/mobile-report.png) | ![Lista](docs/screenshots/mobile-list.png) |

## 3. Cómo ejecutarlo

**URL pública:** `https://[tu-proyecto].vercel.app` *(se completa al desplegar en Vercel)*

Hay un **modo demostración** en el pie de la página: *Cargar datos de ejemplo* rellena la app con 14 averías realistas de una planta de film plástico, y *Borrar todos los datos* la deja vacía.

### Requisitos

- Node.js 20 o superior, **o** Docker, **o** VS Code con la extensión Dev Containers.
- No necesita variables de entorno. El `.env.example` documenta las que harán falta cuando haya base de datos.

### Opción A · Node.js

```bash
npm install
npm run dev        # http://localhost:5173
```

### Opción B · Docker

```bash
docker compose up                                        # desarrollo -> http://localhost:5173
docker build --target prod -t breakdown-log . \
  && docker run -p 8080:80 breakdown-log                 # producción con Nginx -> http://localhost:8080
```

### Opción C · DevContainer

Abre la carpeta en VS Code y elige **Reopen in Container**. El contenedor trae Node 22, Git, GitHub CLI y las extensiones de Vue, Tailwind y Vitest, y ejecuta `npm install` él solo.

### Tests y calidad

```bash
npm test           # 50 tests con Vitest (dominio, servicio, store, componentes y vistas)
npm run lint       # comprobación de tipos con vue-tsc
npm run build      # build de producción en dist/
```

GitHub Actions (`.github/workflows/ci.yml`) ejecuta los tres en cada push y en cada pull request a `main` y `develop`.

### Despliegue en Vercel

1. Vercel → **Add New → Project** → importar este repositorio.
2. Vercel detecta Vite: comando `npm run build`, salida `dist`, rama de producción `main` → **Deploy**.
3. `vercel.json` redirige todas las rutas a `index.html` (la app usa rutas del navegador). `/api/health` es una función que responde `{"status":"ok"}` para vigilar la web con UptimeRobot.

### Estructura

```
src/
  views/        páginas: ReportView, BreakdownsView, IndicatorsView
  components/   BreakdownForm, BreakdownCard, KpiTile, DemoBar
  stores/       Pinia: estado de las averías
  services/     acceso a datos: la ÚNICA capa que toca el almacenamiento
  domain/       lógica pura y testeada: validación, orden, estados, MTTR
  types/  data/ modelos, máquinas de la planta y datos de ejemplo
tests/          50 tests, con la misma estructura que src/
api/health.ts   función de Vercel para la monitorización
docs/           proceso con IA y capturas
```

## 4. Cómo se construyó con IA

Lo construí con **Claude** (Anthropic) como agente, siguiendo el flujo de trabajo del curso: *requisito → prompt → plan → ejecución y prueba → commit*.

**Mi papel:** definir el problema a partir de mi experiencia en planta, elegir la idea y el alcance, decidir qué quedaba fuera del MVP y revisar el resultado. **El papel del agente:** proponer y escribir el código, los tests y la configuración, y probarlo todo en un navegador real antes de cada merge.

**Entorno para el agente**

- [`CLAUDE.md`](CLAUDE.md) con el problema, las historias de usuario, el stack, la arquitectura, las definiciones de los indicadores y las reglas de trabajo. Por ejemplo: *"implement only the user story requested"*, *"never change a test just to make it pass"* o *"UI in Spanish, code in English"*.
- Ramas: `main` (producción) y `develop` (integración). Cada historia en su propia rama `feature/…`, unida con `--no-ff`. Commits en formato Conventional Commits.
- DevContainer, Docker multi-etapa y CI en GitHub Actions desde el primer día, antes de escribir funcionalidades.

**El ciclo de cada historia** (detalle y prompts completos en [`docs/ai-workflow.md`](docs/ai-workflow.md))

1. Prompt con la historia y sus criterios de aceptación, en una rama `feature/` creada desde `develop`.
2. El agente implementa y escribe los tests de casos normales, límite y errores.
3. Se ejecutan la suite completa, la comprobación de tipos y el build.
4. Se prueba en un navegador real con Playwright (móvil y escritorio) y se revisan capturas.
5. Commit, merge a `develop` y la siguiente historia.

**El prompt de US-02** (plantilla 4.1 del curso, adaptada a la historia):

> I want to build this feature: As a maintenance technician, I want to see the open breakdowns sorted by priority and change their status (open → in progress → resolved), so that I know what to attend to first. Acceptance criteria: high priority first, then stopped machines, then the oldest; a resolved breakdown cannot be reopened; a quick fix can go straight from open to resolved; every change is saved. Create a feature/breakdown-list branch from develop. Before writing any code, explain your plan and which files you will touch. Follow the conventions in CLAUDE.md and don't add anything that is not in the criteria.

**Qué funcionó bien**

- **Separar la lógica pura** (`src/domain/`) de la interfaz permitió probar las reglas de negocio (orden de prioridad, transiciones de estado, MTTR) con tests rápidos y deterministas: 50 tests en unos 3 segundos.
- **La revisión visual** encontró lo que los tests no veían. En US-02, la tarjeta de una avería urgente salía con un borde negro en lugar de solo el borde rojo, y se corrigió antes del merge.
- **Escribir las definiciones** de "horas de parada" y "MTTR" en el CLAUDE.md evitó ambigüedades: el agente y los tests usan exactamente las mismas fórmulas.

**Qué costó o no salió como esperaba**

- **Los datos viven en un solo navegador.** Al probar con dos navegadores distintos se vio claro: lo que registra el operario en su móvil **no aparece en el PC del técnico**. El MVP funciona como un *terminal compartido* (una tablet en el taller o en la línea), pero el valor completo necesita una base de datos compartida. La capa `services/` está aislada justo para cambiar `localStorage` por una API sin tocar vistas ni stores.
- **Docker y el DevContainer no se pudieron ejecutar** en el entorno del agente, que no tenía acceso a Docker Hub. Los archivos siguen la estructura vista en el curso, pero se validan en mi equipo.
- **Para la demo hacían falta datos realistas.** Con la app vacía, los indicadores no enseñan nada, así que se añadió un cargador de datos de ejemplo, también con tests que comprueban que las fechas son coherentes.

## 5. Estado y próximos pasos

**Estado: MVP v0.1.0 completo.** Las 3 historias funcionan en móvil y escritorio, con 50 tests en verde, comprobación de tipos y build correctos, y la configuración de Vercel, Docker, DevContainer y CI preparada.

**Lo que no hace todavía:** compartir datos entre dispositivos, identificar usuarios, avisar al técnico ni dar de alta máquinas (están en `src/data/machines.ts`).

**Siguiente paso natural (v0.2.0):** una **base de datos compartida** (Vercel Postgres o Supabase) a través de funciones en `/api`. Así el aviso del operario llega de verdad al técnico en otro dispositivo, que es la promesa principal del producto. Después vendrían el login por rol (operario, técnico y jefe), exportar a CSV o Excel y los indicadores MTBF y OEE.
