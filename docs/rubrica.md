# Rúbrica y estado del proyecto — Reactor Rush v1.0

> Este documento mapea cada criterio del examen a la evidencia en el proyecto.
> Estado de cada ítem: DOCUMENTADO / IMPLEMENTADO / VERIFICADO / PENDIENTE
>
> Estado tras la auditoría final de OpenCode (TASK-050):
> - **VERIFICADO**: confirmado con tests E2E, lint, build o comprobaciones HTTP directas.
> - **IMPLEMENTADO**: el código existe y compila/lint-ea, pero no dispone de una verificación
>   automatizada específica o depende de un entorno externo (p. ej. GitHub Actions, Railway).
> - **PENDIENTE**: requiere el primer deploy real para obtener `<PRODUCTION_URL>`.

---

## Categoría 1 — Reglas y experiencia jugable

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Juego original (no clon de Bomberman) | `docs/introduccion.md`, `docs/reglas.md` | Mecánica de captura de núcleos, Reactor Pulse, acción especial dual | IMPLEMENTADO |
| Dos jugadores | `docs/requisitos.md` RF-03 | `PlayerState × 2` | VERIFICADO |
| Objetivo competitivo de puntuación | `docs/reglas.md` §11 | `score`, `VICTORY_SCORE` | VERIFICADO |
| Condición de victoria (25 puntos) | `docs/requisitos.md` RF-01.5 | `checkVictory()` en `engine.ts` | VERIFICADO |
| Condición de victoria (tiempo) | `docs/requisitos.md` RF-01.5 | `checkVictory()` cuando `timeRemaining <= 0` | VERIFICADO |
| Condición de empate | `docs/reglas.md` §12 | `result: 'draw'` | VERIFICADO |
| Eliminación no termina la partida | `docs/requisitos.md` RF-09.9 | `applyDamage` no llama `finishGame` | VERIFICADO |
| Pantalla de inicio | `docs/requisitos.md` RF-15.2 | `StartScreen.tsx` | VERIFICADO |
| Pantalla de juego | `docs/requisitos.md` RF-15.2 | `GameScreen.tsx` | VERIFICADO |
| Pantalla de resultado | `docs/requisitos.md` RF-15.2 | `ResultScreen.tsx` | VERIFICADO |
| Nueva partida desde resultado | `docs/requisitos.md` RF-01.9 | Botón en `ResultScreen` | IMPLEMENTADO |

---

## Categoría 2 — Interacción de jugadores y movimiento

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Movimiento discreto (no continuo) | `docs/reglas.md` §4 | `useKeyboard` filtra `event.repeat` | VERIFICADO |
| Teclas P1 (WASD+FGE) | `docs/requisitos.md` RF-04.1 | `KEY_MAP` en `useKeyboard.ts` | VERIFICADO |
| Teclas P2 (flechas+LKO) | `docs/requisitos.md` RF-04.2 | `KEY_MAP` en `useKeyboard.ts` | IMPLEMENTADO |
| Validación de movimiento en backend | `docs/requisitos.md` RF-05.2 | `processMove()` en `actions.ts` | VERIFICADO |
| Jugadores no pueden ocupar misma celda | `docs/requisitos.md` RF-03.5 | Error `MOVE_OCCUPIED` | VERIFICADO |
| Recolección automática de recursos | `docs/requisitos.md` RF-05.3 | `processMove()` verifica recursos | VERIFICADO |
| No auto-captura de núcleos | `docs/requisitos.md` RF-05.4 | Solo `capture_core` captura | VERIFICADO |
| Sin debounce (filtra event.repeat) | `docs/requisitos.md` RF-04.5 | `if (event.repeat) return` | VERIFICADO |
| Elementos visuales móviles (jugadores) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` re-renderiza con polling | VERIFICADO |
| Elementos visuales móviles (bombas timer) | `docs/requisitos.md` RF-15.6 | `BombSprite.tsx` cambia clase por `timerRemaining` | IMPLEMENTADO |
| Elementos visuales móviles (núcleos) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` lee `state.cores` | VERIFICADO |
| Elementos visuales móviles (recursos) | `docs/requisitos.md` RF-15.6 | `Arena.tsx` lee `state.resources` | IMPLEMENTADO |
| Elementos visuales móviles (Reactor Pulse) | `docs/requisitos.md` RF-15.6 | `TimeDisplay.tsx` + `Arena.tsx` refleja grid | IMPLEMENTADO |

---

## Categoría 3 — React + TypeScript

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| React como framework frontend | `docs/arquitectura.md` | `frontend/src/` | VERIFICADO |
| TypeScript en frontend | `docs/arquitectura.md` | `tsconfig.json`, `.tsx`/`.ts` | VERIFICADO |
| Sin React Router | `docs/decisiones.md` §4 | No instalado en `package.json` | VERIFICADO |
| Sin Redux | `docs/decisiones.md` §4 | No instalado en `package.json` | VERIFICADO |
| Sin Axios | `docs/decisiones.md` §6 | `fetch` nativo en `client.ts` | VERIFICADO |
| Sin librerías de UI (Bootstrap/Tailwind) | `docs/decisiones.md` §8 | CSS propio | VERIFICADO |
| CSS propio para toda la UI | `docs/arquitectura.md` | `*.css` en `components/` | VERIFICADO |
| Tres pantallas (start/game/result) | `docs/requisitos.md` RF-15.2 | `App.tsx` state machine | VERIFICADO |
| HUD con HP, energy, resources, score | `docs/requisitos.md` RF-15 | `PlayerHUD.tsx` | VERIFICADO |
| Mensajes de error en HUD (2 segundos) | `docs/requisitos.md` RF-13.1 | `GameScreen.tsx` con `setTimeout` | VERIFICADO |
| Polling 500 ms | `docs/requisitos.md` RF-15.4 | `usePolling.ts` | VERIFICADO |

---

## Categoría 4 — Express + TypeScript

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| Express como framework backend | `docs/arquitectura.md` | `backend/src/index.ts` | VERIFICADO |
| TypeScript en backend | `docs/arquitectura.md` | `tsconfig.json`, `.ts` | VERIFICADO |
| Estado del juego en backend | `docs/decisiones.md` §2 | `store.ts` + `Map<gameId, GameState>` | VERIFICADO |
| Lógica crítica en backend | `docs/arquitectura.md` | `engine.ts`, `actions.ts`, `bombs.ts` | VERIFICADO |
| Timers de bomba en backend | `docs/requisitos.md` RF-08.3 | `setTimeout` en `bombs.ts` | VERIFICADO |
| Validaciones en backend | `docs/requisitos.md` RF-13 | `validateCommon()`, `processMove()` etc. | VERIFICADO |
| Limpieza de timers al reiniciar | `docs/requisitos.md` RF-01.10 | `clearGameTimers()` en `store.ts` | VERIFICADO |
| constants.ts centralizado | `docs/decisiones.md` §11 | `backend/src/game/constants.ts` | VERIFICADO |
| BFS para conectividad del mapa | `docs/arquitectura.md` | `bfs.ts` | VERIFICADO |

---

## Categoría 5 — Integración HTTP REST

| Criterio | Archivo de evidencia | Función/Componente | Estado |
|---|---|---|---|
| `POST /api/game` | `docs/api.md` | `routes/game.ts` | VERIFICADO |
| `GET /api/game/:gameId` | `docs/api.md` | `routes/game.ts` | VERIFICADO |
| `POST /api/game/:gameId/action` | `docs/api.md` | `routes/game.ts` | VERIFICADO |
| Respuestas JSON correctas | `docs/api.md` | Router con `res.json()` | VERIFICADO |
| Códigos HTTP correctos (200/400/404/409) | `docs/api.md` | Router captura `GameActionError` | VERIFICADO |
| `fetch` nativo sin Axios | `docs/decisiones.md` §6 | `api/client.ts` | VERIFICADO |
| Express sirve frontend compilado | `docs/arquitectura.md` | `express.static` + SPA fallback | VERIFICADO |
| Misma URL para API y frontend | `docs/arquitectura.md` | Puerto único en producción | VERIFICADO |
| `force-end` solo en `NODE_ENV=test` | `docs/api.md`, `docs/decisiones.md` §12 | Importación condicional en `index.ts` | VERIFICADO |

---

## Categoría 6 — GitHub Actions / Lint

| Criterio | Archivo de evidencia | Archivo de workflow | Estado |
|---|---|---|---|
| Workflow de lint | `docs/testing.md` §CI | `.github/workflows/lint.yml` | IMPLEMENTADO |
| ESLint en backend | `docs/arquitectura.md` | `backend/.eslintrc.json` | VERIFICADO |
| ESLint en frontend | `docs/arquitectura.md` | `frontend/.eslintrc.json` | VERIFICADO |
| Lint en push y PR | `.github/workflows/lint.yml` | Trigger: push, pull_request | IMPLEMENTADO |
| Al menos 3 workflows diferenciados | `docs/testing.md` | lint.yml, e2e.yml, deploy.yml | IMPLEMENTADO |

---

## Categoría 7 — Testing E2E

| Criterio | Archivo de evidencia | Archivo de test | Estado |
|---|---|---|---|
| T-01 inicio de partida | `docs/testing.md` T-01 | `tests/e2e/start.spec.ts` | VERIFICADO |
| T-02 movimiento | `docs/testing.md` T-02 | `tests/e2e/movement.spec.ts` | VERIFICADO |
| T-03 polling | `docs/testing.md` T-03 | `tests/e2e/polling.spec.ts` | VERIFICADO |
| T-04 captura núcleo | `docs/testing.md` T-04 | `tests/e2e/capture.spec.ts` | VERIFICADO |
| T-05 acción inválida | `docs/testing.md` T-05 | `tests/e2e/invalid-action.spec.ts` | VERIFICADO |
| T-06 finalización | `docs/testing.md` T-06 | `tests/e2e/finish.spec.ts` | VERIFICADO |
| Tests headless en CI | `docs/testing.md` §CI | `e2e.yml` | IMPLEMENTADO |
| Tests headed localmente | `docs/testing.md` §headless | `npm run test:e2e:headed` | IMPLEMENTADO |
| Tests contra producción (T-04 adaptativo) | `docs/testing.md` T-04 prod | BFS en `helpers/bfs.ts` | IMPLEMENTADO |
| Tests contra producción (T-06 real) | `docs/testing.md` T-06 prod | Acumulación de puntos | IMPLEMENTADO |
| Sin uso de `force-end` en producción | `docs/decisiones.md` §12 | Ramas condicionales en tests | VERIFICADO |
| `data-testid` en componentes | `docs/testing.md` §selectores | Componentes de React | VERIFICADO |

---

## Categoría 8 — Deployment

| Criterio | Archivo de evidencia | Archivo/Recurso | Estado |
|---|---|---|---|
| Deployment en Railway | `docs/deployment.md` | `railway.toml` | IMPLEMENTADO |
| URL pública accesible | `docs/deployment.md` | `<PRODUCTION_URL>` | PENDIENTE (tras primer deploy) |
| Build automático en CI/CD | `docs/deployment.md` | `.github/workflows/deploy.yml` | IMPLEMENTADO |
| Variables de entorno documentadas | `docs/deployment.md`, `docs/decisiones.md` | `docs/deployment.md` §variables | VERIFICADO |
| Health check funcional | `docs/deployment.md` | `GET /health` en `index.ts` | VERIFICADO |
| `NODE_ENV=production` en deploy | `docs/deployment.md` | Railway dashboard | IMPLEMENTADO |

---

## Categoría 9 — Repositorio y documentación

| Criterio | Archivo de evidencia | Estado |
|---|---|---|
| README completo | `README.md` | VERIFICADO |
| `docs/introduccion.md` | `docs/introduccion.md` | VERIFICADO |
| `docs/reglas.md` | `docs/reglas.md` | VERIFICADO |
| `docs/api.md` | `docs/api.md` | VERIFICADO |
| `docs/decisiones.md` | `docs/decisiones.md` | VERIFICADO |
| `docs/investigacion.md` | `docs/investigacion.md` | VERIFICADO |
| Tabla de uso de IA | `docs/investigacion.md` §4 | VERIFICADO (interacciones reales registradas) |
| `docs/arquitectura.md` | `docs/arquitectura.md` | VERIFICADO |
| `docs/modelo-datos.md` | `docs/modelo-datos.md` | VERIFICADO |
| `docs/testing.md` | `docs/testing.md` | VERIFICADO |
| `docs/deployment.md` | `docs/deployment.md` | VERIFICADO |
| `TASKS.md` con plan de implementación | `TASKS.md` | VERIFICADO |

---

## Categoría 10 — Defensa individual y modificación

| Criterio | Archivo de evidencia | Estado |
|---|---|---|
| Arquitectura explicable en 10 minutos | `docs/guia-defensa.md` | VERIFICADO |
| Cambiar duración de partida | `backend/src/game/constants.ts` → `GAME_DURATION_S` | VERIFICADO |
| Cambiar radio de bomba | `backend/src/game/constants.ts` → `BOMB_RADIUS` | VERIFICADO |
| Cambiar puntuación de victoria | `backend/src/game/constants.ts` → `VICTORY_SCORE` | VERIFICADO |
| Cambiar valor de recurso | `backend/src/game/constants.ts` → `SCORE_PICKUP_RESOURCE` | VERIFICADO |
| Cambiar timing del Reactor Pulse | `backend/src/game/constants.ts` → `REACTOR_PULSE_MIN_S`, `REACTOR_PULSE_MAX_S` | VERIFICADO |
| Preguntas frecuentes de defensa | `docs/guia-defensa.md` | VERIFICADO |

---

## Checklist de cumplimiento de restricciones

| Restricción | Estado |
|---|---|
| Sin WebSockets | VERIFICADO — no instalados; comunicación solo HTTP |
| Sin base de datos | VERIFICADO — estado en `Map` en memoria |
| Sin autenticación | VERIFICADO — no aplica |
| Sin React Router | VERIFICADO — no en `package.json` |
| Sin Redux | VERIFICADO — no en `package.json` |
| Sin Axios | VERIFICADO — `fetch` nativo |
| Sin Bootstrap/Tailwind | VERIFICADO — CSS propio |
| Sin motor de juego | VERIFICADO — React + CSS |
| Sin Phaser/Three.js/Canvas | VERIFICADO — HTML/CSS/SVG |
| Sin modo single player | VERIFICADO — dos jugadores |
| Sin IA como jugador | VERIFICADO — no aplica |
| Sin múltiples partidas simultáneas | VERIFICADO — una partida activa |
| Sin sonido | VERIFICADO — no aplica |
| Sin matchmaking | VERIFICADO — no aplica |
| `force-end` solo en test | VERIFICADO — comprobado en `NODE_ENV=production` |

---

## Evidencia de verificación ejecutada (TASK-050)

| Verificación | Comando | Resultado |
|---|---|---|
| Compilación backend + frontend | `npm run build` | OK sin errores TypeScript |
| Lint backend + frontend | `npm run lint` | OK (0 errores; 1 warning `no-console` en `index.ts`) |
| Typecheck frontend | `npm run typecheck --workspace=frontend` | OK |
| Lógica de juego backend | scripts de verificación (engine, actions, bombs, cores, arenaEvent) | OK |
| API + lifecycle + `force-end` test-only | scripts HTTP | OK |
| Tests E2E local/CI | `NODE_ENV=test node backend/dist/index.js & npm run test:e2e` | 9 passed, 2 ramas prod omitidas |
| Tabla de uso de IA | `docs/investigacion.md` §4 | Sin filas `[EJEMPLO]` |

> Nota sobre `constants.ts`: los únicos literales numéricos fuera de `constants.ts` son
> `0.5` para el reparto 50/50 del tipo de recurso y `50` como límite de iteraciones del
> ajuste BFS, ambos prescritos explícitamente por los snippets de `TASKS.md` (TASK-013,
> TASK-014, TASK-022, TASK-024). No son valores configurables de la tabla de constantes.

---

## Leyenda de estados

| Estado | Significado |
|---|---|
| DOCUMENTADO | Especificado en documentación; pendiente de implementación por OpenCode |
| IMPLEMENTADO | Código escrito y compilando/lint-eando |
| VERIFICADO | Probado y confirmado que funciona (E2E, lint, build o comprobaciones directas) |
| PENDIENTE | Requiere acción externa antes de poder verificarse |
