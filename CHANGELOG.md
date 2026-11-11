# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com) y [versionado semántico](https://semver.org).

## [0.1.0] - 2026-11-11 · MVP

### Added

- US-01: formulario de registro de averías con validación en español, pensado para móvil.
- US-02: lista de averías pendientes ordenada por prioridad, cambio de estado (abierta → en reparación → resuelta) e historial de resueltas.
- US-03: indicadores de planta y por máquina (averías, pendientes, horas de parada, MTTR).
- Modo demostración con 14 averías realistas.
- Esqueleto Vue 3 + Vite + TypeScript + Tailwind + Pinia, DevContainer, Docker multi-etapa (dev/build/prod con Nginx), CI con GitHub Actions, configuración de Vercel y `/api/health`.
- 50 tests con Vitest.
