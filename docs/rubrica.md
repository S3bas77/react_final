# Rúbrica y estado del proyecto — Reactor Rush v1.0

> Este documento mapea cada criterio del examen a la evidencia en el proyecto.
> Estado de cada ítem: DOCUMENTADO / IMPLEMENTADO / VERIFICADO / PENDIENTE
>
> Al momento de crear este documento, el proyecto está en fase de especificación.
> OpenCode aún no ha implementado el código. Por tanto, la mayoría de los ítems
> están en estado DOCUMENTADO (especificados) o PENDIENTE (por implementar).
> Este documento debe actualizarse conforme avanza la implementación.

---

## Categoría 1 — Reglas y experiencia jugable

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Juego original (no clon de Bomberman) | `docs/introduccion.md`, `docs/reglas.md` | Mecánica de captura de núcleos, Reactor Pulse, acción especial dual | DOCUMENTADO |
| Dos jugadores | `docs/requisitos.md` RF-03 | `PlayerState × 2` | DOCUMENTADO |
| Objetivo competitivo de puntuación | `docs/reglas.md` §11 | `score`, `VICTORY_SCORE` | DOCUMENTADO |
| Condición de victoria (25 puntos) | `docs/requisitos.md` RF-01.5 | `checkVictory()` en `engine.ts` | DOCUMENTADO |
| Condición de victoria (tiempo) | `docs/requisitos.md` RF-01.5 | `checkVictory()` cuando `timeRemaining <= 0` | DOCUMENTADO |
| Condición de empate | `docs/reglas.md` §12 | `result: 'draw'` | DOCUMENTADO |
| Eliminación no termina la partida | `docs/requisitos.md` RF-09.9 | `applyDamage` no llama `finishGame` | DOCUMENTADO |
| Pantalla de inicio | `docs/requisitos.md` RF-15.2 | `StartScreen.tsx` | DOCUMENTADO |
| Pantalla de juego | `docs/requisitos.md` RF-15.2 | `GameScreen.tsx` | DOCUMENTADO |
| Pantalla de resultado | `docs/requisitos.md` RF-15.2 | `ResultScreen.tsx` | DOCUMENTADO |
| Nueva partida desde resultado | `docs/requisitos.md` RF-01.9 | Botón en `ResultScreen` | DOCUMENTADO |

---

## Categoría 2 — Interacción de jugadores y movimiento

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Movimiento discreto (no continuo) | `docs/reglas.md` §4 | `useKeyboard` filtra `event.repeat` | DOCUMENTADO |
| Teclas P1 (WASD+FGE) | `docs/requisitos.md` RF-04.1 | `KEY_MAP` en `useKeyboard.ts` | DOCUMENTADO |
| Teclas P2 (flechas+LKO) | `docs/requisitos.md` RF-04.2 | `KEY_MAP` en `useKeyboard.ts` | DOCUMENTADO |
| Validación de movimiento en backend | `docs/requisitos.md` RF-05.2 | `processMove()` en `actions.ts` | DOCUMENTADO |
| Jugadores no pueden ocupar misma celda | `docs/requisitos.md` RF-03.5 | Error `MOVE_OCCUPIED` | DOCUMENTADO |
| Recolección automática de recursos | `docs/requisitos.md` RF-05.3 | `processMove()` verifica recursos | DOCUMENTADO |
| No auto-captura de núcleos | `docs/requisitos.md` RF-05.4 | Solo `capture_core` captura | DOCUMENTADO |
| Sin debounce (filtra event.repeat) | `docs/requisitos.md` RF-04.5 | `if (event.repeat) return` | DOCUMENTADO |
| Elementos visuales móviles (jugadores) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` re-renderiza con polling | DOCUMENTADO |
| Elementos visuales móviles (bombas timer) | `docs/requisitos.md` RF-15.6 | `BombSprite.tsx` cambia clase por `timerRemaining` | DOCUMENTADO |
| Elementos visuales móviles (núcleos) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` lee `state.cores` | DOCUMENTADO |
| Elementos visuales móviles (recursos) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` lee `state.resources` | DOCUMENTADO |
| Elementos visuales móviles (Reactor Pulse) | `docs/requisitos.md` RF-15.6 | `TimeDisplay.tsx` + `Arena.tsx` refleja grid | DOCUMENTADO |

---

## Categoría 3 — React + TypeScript

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| React como framework frontend | `docs/arquitectura.md` | `frontend/src/` | DOCUMENTADO |
| TypeScript en frontend | `docs/arquitectura.md` | `tsconfig.json`, `.tsx`/`.ts` | DOCUMENTADO |
| Sin React Router | `docs/decisiones.md` §4 | No instalado en `package.json` | DOCUMENTADO |
| Sin Redux | `docs/decisiones.md` §4 | No instalado en `package.json` | DOCUMENTADO |
| Sin Axios | `docs/decisiones.md` §6 | `fetch` nativo en `client.ts` | DOCUMENTADO |
| Sin librerías de UI (Bootstrap/Tailwind) | `docs/decisiones.md` §8 | CSS propio | DOCUMENTADO |
| CSS propio para toda la UI | `docs/arquitectura.md` | `*.css` en `components/` | DOCUMENTADO |
| Tres pantallas (start/game/result) | `docs/requisitos.md` RF-15.2 | `App.tsx` state machine | DOCUMENTADO |
| HUD con HP, energy, resources, score | `docs/requisitos.md` RF-15 | `PlayerHUD.tsx` | DOCUMENTADO |
| Mensajes de error en HUD (2 segundos) | `docs/requisitos.md` RF-13.1 | `GameScreen.tsx` con `setTimeout` | DOCUMENTADO |
| Polling 500 ms | `docs/requisitos.md` RF-15.4 | `usePolling.ts` | DOCUMENTADO |

---

## Categoría 4 — Express + TypeScript

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Express como framework backend | `docs/arquitectura.md` | `backend/src/index.ts` | DOCUMENTADO |
| TypeScript en backend | `docs/arquitectura.md` | `tsconfig.json`, `.ts` | DOCUMENTADO |
| Estado del juego en backend | `docs/decisiones.md` §2 | `store.ts` + `Map<gameId, GameState>` | DOCUMENTADO |
| Lógica crítica en backend | `docs/arquitectura.md` | `engine.ts`, `actions.ts`, `bombs.ts` | DOCUMENTADO |
| Timers de bomba en backend | `docs/requisitos.md` RF-08.3 | `setTimeout` en `bombs.ts` | DOCUMENTADO |
| Validaciones en backend | `docs/requisitos.md` RF-13 | `validateCommon()`, `processMove()` etc. | DOCUMENTADO |
| Limpieza de timers al reiniciar | `docs/requisitos.md` RF-01.10 | `clearGameTimers()` en `store.ts` | DOCUMENTADO |
| constants.ts centralizado | `docs/decisiones.md` §11 | `backend/src/game/constants.ts` | DOCUMENTADO |
| BFS para conectividad del mapa | `docs/arquitectura.md` | `bfs.ts` | DOCUMENTADO |

---

## Categoría 5 — Integración HTTP REST

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| `POST /api/game` | `docs/api.md` | `routes/game.ts` | DOCUMENTADO |
| `GET /api/game/:gameId` | `docs/api.md` | `routes/game.ts` | DOCUMENTADO |
| `POST /api/game/:gameId/action` | `docs/api.md` | `routes/game.ts` | DOCUMENTADO |
| Respuestas JSON correctas | `docs/api.md` | Router con `res.json()` | DOCUMENTADO |
| Códigos HTTP correctos (200/400/404/409) | `docs/api.md` | Router captura `GameActionError` | DOCUMENTADO |
| `fetch` nativo sin Axios | `docs/decisiones.md` §6 | `api/client.ts` | DOCUMENTADO |
| Express sirve frontend compilado | `docs/arquitectura.md` | `express.static` + SPA fallback | DOCUMENTADO |
| Misma URL para API y frontend | `docs/arquitectura.md` | Puerto único en producción | DOCUMENTADO |
| `force-end` solo en `NODE_ENV=test` | `docs/api.md`, `docs/decisiones.md` §12 | Importación condicional en `index.ts` | DOCUMENTADO |

---

## Categoría 6 — GitHub Actions / Lint

| Criterio | Archivo de evidencia | Archivo de workflow | Estado |
|---|---|---|---|
| Workflow de lint | `docs/testing.md` §CI | `.github/workflows/lint.yml` | DOCUMENTADO |
| ESLint en backend | `docs/arquitectura.md` | `backend/.eslintrc.json` | DOCUMENTADO |
| ESLint en frontend | `docs/arquitectura.md` | `frontend/.eslintrc.json` | DOCUMENTADO |
| Lint en push y PR | `.github/workflows/lint.yml` | Trigger: push, pull_request | DOCUMENTADO |
| Al menos 3 workflows diferenciados | `docs/testing.md` | lint.yml, e2e.yml, deploy.yml | DOCUMENTADO |

---

## Categoría 7 — Testing E2E

| Criterio | Archivo de evidencia | Archivo de test | Estado |
|---|---|---|---|
| T-01 inicio de partida | `docs/testing.md` T-01 | `tests/e2e/start.spec.ts` | DOCUMENTADO |
| T-02 movimiento | `docs/testing.md` T-02 | `tests/e2e/movement.spec.ts` | DOCUMENTADO |
| T-03 polling | `docs/testing.md` T-03 | `tests/e2e/polling.spec.ts` | DOCUMENTADO |
| T-04 captura núcleo | `docs/testing.md` T-04 | `tests/e2e/capture.spec.ts` | DOCUMENTADO |
| T-05 acción inválida | `docs/testing.md` T-05 | `tests/e2e/invalid-action.spec.ts` | DOCUMENTADO |
| T-06 finalización | `docs/testing.md` T-06 | `tests/e2e/finish.spec.ts` | DOCUMENTADO |
| Tests headless en CI | `docs/testing.md` §CI | `e2e.yml` | DOCUMENTADO |
| Tests headed localmente | `docs/testing.md` §headless | `npm run test:e2e:headed` | DOCUMENTADO |
| Tests contra producción (T-04 adaptativo) | `docs/testing.md` T-04 prod | BFS en `helpers/bfs.ts` | DOCUMENTADO |
| Tests contra producción (T-06 real) | `docs/testing.md` T-06 prod | Acumulación de puntos | DOCUMENTADO |
| Sin uso de `force-end` en producción | `docs/decisiones.md` §12 | Ramas condicionales en tests | DOCUMENTADO |
| `data-testid` en componentes | `docs/testing.md` §selectores | Componentes de React | DOCUMENTADO |

---

## Categoría 8 — Deployment

| Criterio | Archivo de evidencia | Archivo/Recurso | Estado |
|---|---|---|---|
| Deployment en Railway | `docs/deployment.md` | `railway.toml` | DOCUMENTADO |
| URL pública accesible | `docs/deployment.md` | `<PRODUCTION_URL>` | PENDIENTE (tras primer deploy) |
| Build automático en CI/CD | `docs/deployment.md` | `.github/workflows/deploy.yml` | DOCUMENTADO |
| Variables de entorno documentadas | `docs/deployment.md`, `docs/decisiones.md` | `docs/deployment.md` §variables | DOCUMENTADO |
| Health check funcional | `docs/deployment.md` | `GET /health` en `index.ts` | DOCUMENTADO |
| `NODE_ENV=production` en deploy | `docs/deployment.md` | Railway dashboard | DOCUMENTADO |

---

## Categoría 9 — Repositorio y documentación

| Criterio | Archivo de evidencia | Estado |
|---|---|---|
| README completo | `README.md` | DOCUMENTADO |
| `docs/introduccion.md` | `docs/introduccion.md` | DOCUMENTADO |
| `docs/reglas.md` | `docs/reglas.md` | DOCUMENTADO |
| `docs/api.md` | `docs/api.md` | DOCUMENTADO |
| `docs/decisiones.md` | `docs/decisiones.md` | DOCUMENTADO |
| `docs/investigacion.md` | `docs/investigacion.md` | DOCUMENTADO |
| Tabla de uso de IA | `docs/investigacion.md` §4 | DOCUMENTADO (filas de ejemplo; completar durante implementación) |
| `docs/arquitectura.md` | `docs/arquitectura.md` | DOCUMENTADO |
| `docs/modelo-datos.md` | `docs/modelo-datos.md` | DOCUMENTADO |
| `docs/testing.md` | `docs/testing.md` | DOCUMENTADO |
| `docs/deployment.md` | `docs/deployment.md` | DOCUMENTADO |
| `TASKS.md` con plan de implementación | `TASKS.md` | DOCUMENTADO |

---

## Categoría 10 — Defensa individual y modificación

| Criterio | Archivo de evidencia | Estado |
|---|---|---|
| Arquitectura explicable en 10 minutos | `docs/guia-defensa.md` | DOCUMENTADO |
| Cambiar duración de partida | `backend/src/game/constants.ts` → `GAME_DURATION_S` | DOCUMENTADO |
| Cambiar radio de bomba | `backend/src/game/constants.ts` → `BOMB_RADIUS` | DOCUMENTADO |
| Cambiar puntuación de victoria | `backend/src/game/constants.ts` → `VICTORY_SCORE` | DOCUMENTADO |
| Cambiar valor de recurso | `backend/src/game/constants.ts` → `SCORE_PICKUP_RESOURCE` | DOCUMENTADO |
| Cambiar timing del Reactor Pulse | `backend/src/game/constants.ts` → `REACTOR_PULSE_MIN_S`, `REACTOR_PULSE_MAX_S` | DOCUMENTADO |
| Preguntas frecuentes de defensa | `docs/guia-defensa.md` | DOCUMENTADO |

---

## Checklist de cumplimiento de restricciones

| Restricción | Estado |
|---|---|
| Sin WebSockets | DOCUMENTADO — no instalados |
| Sin base de datos | DOCUMENTADO — estado en memoria |
| Sin autenticación | DOCUMENTADO — no aplica |
| Sin React Router | DOCUMENTADO — no en package.json |
| Sin Redux | DOCUMENTADO — no en package.json |
| Sin Axios | DOCUMENTADO — fetch nativo |
| Sin Bootstrap/Tailwind | DOCUMENTADO — CSS propio |
| Sin motor de juego | DOCUMENTADO — React + CSS |
| Sin Phaser/Three.js/Canvas | DOCUMENTADO — HTML/CSS/SVG |
| Sin modo single player | DOCUMENTADO — dos jugadores |
| Sin IA como jugador | DOCUMENTADO — no aplica |
| Sin múltiples partidas simultáneas | DOCUMENTADO — una partida activa |
| Sin sonido | DOCUMENTADO — no aplica |
| Sin matchmaking | DOCUMENTADO — no aplica |
| `force-end` solo en test | DOCUMENTADO — importación condicional |

---

## Leyenda de estados

| Estado | Significado |
|---|---|
| DOCUMENTADO | Especificado en documentación; pendiente de implementación por OpenCode |
| IMPLEMENTADO | Código escrito por OpenCode |
| VERIFICADO | Probado y confirmado que funciona (E2E, lint, build) |
| PENDIENTE | Requiere acción antes de poder documentar o implementar |
