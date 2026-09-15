# Arquitectura — Reactor Rush v1.0

---

## Visión general

Reactor Rush es una aplicación web de página única (SPA) con arquitectura cliente-servidor.

- El **backend** (Express + TypeScript) mantiene el estado del juego en memoria, valida acciones, ejecuta la lógica de juego y sirve el frontend compilado.
- El **frontend** (React + TypeScript + Vite) renderiza el estado, captura la entrada del teclado, envía acciones al backend y actualiza la interfaz mediante polling.
- La comunicación es exclusivamente **HTTP REST + JSON**.
- No hay WebSockets. No hay base de datos.

```
┌────────────────────────────────────────┐
│             NAVEGADOR                   │
│                                        │
│  React + TypeScript + CSS              │
│  ┌──────────────────────────────────┐  │
│  │  useKeyboard → POST /action      │  │
│  │  usePolling  → GET  /game/:id    │  │
│  └──────────────────────────────────┘  │
└───────────────┬────────────────────────┘
                │ HTTP fetch (JSON)
                │ polling 500 ms
┌───────────────▼────────────────────────┐
│             EXPRESS (Node.js)           │
│                                        │
│  routes/game.ts   → API endpoints      │
│  routes/test.ts   → solo NODE_ENV=test │
│  game/actions.ts  → lógica de juego    │
│  game/engine.ts   → tiempo + victoria  │
│  game/bombs.ts    → explosiones        │
│  game/cores.ts    → respawn de núcleos │
│  game/arenaEvent.ts → Reactor Pulse    │
│  store.ts         → estado en memoria  │
│                                        │
│  static → frontend/dist/              │
└────────────────────────────────────────┘
```

---

## Estructura del proyecto

```
reactor-rush/
├── package.json                  # scripts raíz (workspaces)
├── .env.example
├── .gitignore
├── README.md
├── TASKS.md
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts              # Express app, static, rutas
│       ├── store.ts              # estado en memoria + timers
│       ├── game/
│       │   ├── state.ts          # tipos TypeScript del juego
│       │   ├── constants.ts      # valores configurables
│       │   ├── factory.ts        # createGame(), generateGrid()
│       │   ├── bfs.ts            # bfsReachable(), getReachableCells()
│       │   ├── engine.ts         # startGameLoop(), checkVictory(), applyDamage()
│       │   ├── actions.ts        # processAction() y las 4 acciones
│       │   ├── bombs.ts          # scheduleBomb(), triggerExplosion()
│       │   ├── cores.ts          # scheduleRespawn(), respawnCore()
│       │   └── arenaEvent.ts     # scheduleReactorPulse(), triggerReactorPulse()
│       └── routes/
│           ├── game.ts           # POST /api/game, GET /api/game/:id, POST /api/game/:id/action
│           └── test.ts           # POST /api/game/:id/test/force-end (solo NODE_ENV=test)
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               # máquina de estados: start | game | result
│       ├── App.css
│       ├── types.ts              # mirror de backend/src/game/state.ts
│       ├── vite-env.d.ts         # tipos de Vite (import.meta.env)
│       ├── api/
│       │   └── client.ts         # postGame(), getGame(), postAction() con fetch nativo
│       ├── hooks/
│       │   ├── usePolling.ts     # GET /api/game/:id cada 500 ms
│       │   └── useKeyboard.ts    # keydown → postAction, filtra event.repeat
│       └── components/
│           ├── StartScreen.tsx
│           ├── StartScreen.css
│           ├── GameScreen.tsx
│           ├── GameScreen.css
│           ├── Arena.tsx
│           ├── Arena.css
│           ├── PlayerHUD.tsx
│           ├── PlayerHUD.css
│           ├── TimeDisplay.tsx
│           ├── TimeDisplay.css
│           ├── BombSprite.tsx
│           ├── CoreSprite.tsx
│           ├── ResourceSprite.tsx
│           ├── PlayerSprite.tsx
│           ├── PlayerSprite.css
│           ├── Sprites.css        # estilos de bomba, núcleo y recursos
│           ├── ResultScreen.tsx
│           └── ResultScreen.css
│
├── tests/
│   ├── playwright.config.ts
│   └── e2e/
│       ├── helpers/
│       │   └── bfs.ts            # BFS auxiliar para tests de producción
│       ├── start.spec.ts         # T-01
│       ├── movement.spec.ts      # T-02
│       ├── polling.spec.ts       # T-03
│       ├── capture.spec.ts       # T-04
│       ├── invalid-action.spec.ts # T-05
│       └── finish.spec.ts        # T-06
│
├── docs/
│   ├── requisitos.md
│   ├── introduccion.md
│   ├── reglas.md
│   ├── arquitectura.md           # este archivo
│   ├── api.md
│   ├── modelo-datos.md
│   ├── decisiones.md
│   ├── investigacion.md
│   ├── testing.md
│   ├── deployment.md
│   ├── rubrica.md
│   ├── trazabilidad.md
│   └── guia-defensa.md
│
└── .github/
    └── workflows/
        ├── lint.yml
        ├── e2e.yml
        └── deploy.yml
```

---

## Responsabilidades del backend

El backend es la única fuente de verdad del estado del juego. Todas las decisiones de lógica ocurren aquí.

| Módulo | Responsabilidad |
|---|---|
| `store.ts` | Almacena el estado en memoria. Gestiona el registro de timers (interval + timeouts + respawning cores). |
| `game/constants.ts` | Todos los valores configurables del juego. Única fuente de verdad para números. |
| `game/state.ts` | Definición de todos los tipos TypeScript del dominio. |
| `game/factory.ts` | Genera el estado inicial: grid, destructibles, núcleos, recursos, jugadores. Verifica BFS. |
| `game/bfs.ts` | BFS para verificar conectividad del mapa y accesibilidad de celdas. |
| `game/engine.ts` | Loop de 1 segundo: decrementa tiempo, `timerRemaining` de bombas, `arenaEventCountdown`. Detecta victoria. Centraliza `applyDamage`. |
| `game/actions.ts` | Punto de entrada de todas las acciones. Valida y despacha a la función correspondiente. |
| `game/bombs.ts` | `scheduleBomb`: registra timeout de explosión. `triggerExplosion`: calcula radio, aplica efectos en orden correcto, gestiona cadena. |
| `game/cores.ts` | `scheduleRespawn`: programa reaparición de núcleo con protección anti-duplicado. `respawnCore`: coloca el núcleo en posición libre. |
| `game/arenaEvent.ts` | `scheduleReactorPulse`, `activateWarning`, `triggerReactorPulse`. Evento único por partida. |
| `routes/game.ts` | Tres endpoints principales de la API. |
| `routes/test.ts` | Endpoint `force-end`, solo en `NODE_ENV=test`. |
| `index.ts` | Inicializa Express, registra middlewares, rutas y sirve estáticos. |

---

## Responsabilidades del frontend

El frontend es puramente reactivo. No toma decisiones de lógica de juego.

| Módulo | Responsabilidad |
|---|---|
| `types.ts` | Mirror de los tipos del backend. Sincronizado manualmente. |
| `api/client.ts` | `postGame()`, `getGame()`, `postAction()` usando `fetch` nativo. Sin Axios. |
| `hooks/usePolling.ts` | Llama `getGame` cada 500 ms. Actualiza estado. Se detiene con `status === 'finished'`. |
| `hooks/useKeyboard.ts` | Captura `keydown`, filtra `event.repeat`, mapea teclas a acciones, llama `postAction`. |
| `App.tsx` | Máquina de estados de pantalla: `start`, `game`, `result`. |
| `components/StartScreen.tsx` | Pantalla de inicio. Botón que llama `postGame()`. |
| `components/GameScreen.tsx` | Compone la pantalla de juego. Usa `usePolling` y `useKeyboard`. Gestiona mensajes de error. |
| `components/Arena.tsx` | Renderiza la cuadrícula 15×11. Superpone jugadores, bombas, núcleos y recursos. |
| `components/PlayerHUD.tsx` | Muestra HP, energy, resources, score, bomb, shield y errores del jugador. |
| `components/TimeDisplay.tsx` | Muestra tiempo restante y advertencia del Reactor Pulse. |
| `components/BombSprite.tsx` | Visual de bomba con cambio de color según `timerRemaining`. |
| `components/CoreSprite.tsx` | Visual del núcleo de energía. |
| `components/ResourceSprite.tsx` | Visual diferenciado por tipo de recurso. |
| `components/PlayerSprite.tsx` | Visual del jugador con indicador de escudo. |
| `components/ResultScreen.tsx` | Pantalla de resultado: ganador/empate, puntuaciones, botón nueva partida. |

---

## Gestión de timers

El backend usa un registro centralizado de timers por partida para evitar fugas.

```
gameTimers: Map<gameId, {
  interval:        NodeJS.Timeout | null,   // loop de 1 segundo
  timeouts:        NodeJS.Timeout[],        // bombas, respawn, shield, pulso
  respawningCores: Set<string>              // coreIds en respawn activo
}>
```

Al crear una nueva partida o al terminar la actual, se llama `clearGameTimers(gameId)` que:
1. Cancela el `interval` del loop.
2. Cancela todos los `timeouts` registrados.
3. Limpia `respawningCores`.
4. Elimina la entrada del mapa.

---

## Flujo de una acción completa

```
1. Usuario presiona tecla (ej. W)
2. useKeyboard captura keydown (filtra event.repeat)
3. Mapea W → { playerId: 'player1', type: 'move', payload: { direction: 'up' } }
4. fetch POST /api/game/:gameId/action
5. Express recibe request
6. processAction(gameId, req.body)
   → validateCommon: status playing? player alive?
   → processMove: bounds? wall? occupied? → actualiza x/y → recoge recurso si hay
7. setGame(gameId, state)
8. Responde { success: true, state }
9. React actualiza estado local con la respuesta
10. Simultáneamente: usePolling cada 500 ms hace GET /api/game/:gameId
    → React re-renderiza Arena con nueva posición
```

---

## Deployment

En producción Express sirve el build de Vite:

```
GET /api/*  → rutas de la API
GET *       → frontend/dist/index.html (SPA fallback)
```

Ambos frontend y backend están en el mismo proceso, mismo dominio y mismo puerto. No hay CORS necesario.

---

## Variables de entorno

| Variable | Usado en | Descripción | Default |
|---|---|---|---|
| `PORT` | backend | Puerto del servidor | `3000` |
| `NODE_ENV` | backend | `development` / `test` / `production` | `development` |
| `VITE_API_BASE` | frontend build | Prefijo de la API | `/api` |
| `PRODUCTION_URL` | tests E2E | URL pública para tests contra producción | — |
| `TEST_ENV` | tests E2E | `production` activa rama adaptativa en tests | — |
