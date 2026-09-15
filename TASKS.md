# TASKS.md — Reactor Rush v1.0
# Plan de implementación para OpenCode + DeepSeek API

## RESTRICCIONES ABSOLUTAS

OpenCode NO puede usar bajo ninguna circunstancia:
- WebSockets, SSE, ni ninguna comunicación bidireccional
- Base de datos (PostgreSQL, MongoDB, Redis, SQLite, etc.)
- Autenticación, sesiones, matchmaking
- React Router, Redux, Zustand ni ninguna librería de estado externa
- Axios — solo `fetch` nativo del navegador
- Bootstrap, Tailwind, Material UI ni ningún framework de CSS
- Phaser, Three.js, Matter.js, Cannon.js, Babylon.js ni ningún motor de juego
- Canvas API para renderizado (usar HTML/CSS/SVG)
- Librerías externas de lógica de juego
- Debounce como mecanismo principal de control de entrada
- Movimiento continuo (el juego es de acciones discretas)
- Múltiples partidas simultáneas
- IA como jugador, modo single player

OpenCode SÍ debe usar:
- React + TypeScript (frontend)
- Express + TypeScript (backend)
- Vite (bundler frontend)
- `fetch` nativo (comunicación HTTP)
- CSS propio para todos los estilos
- Playwright para tests E2E
- GitHub Actions para CI/CD
- Estado del juego en memoria del proceso Node.js
- `constants.ts` como única fuente de valores configurables

Toda decisión técnica ya está tomada en `docs/decisiones.md`.
OpenCode no debe reinterpretar las reglas del juego — están en `docs/reglas.md`.
OpenCode no debe cambiar el modelo de datos — está en `docs/modelo-datos.md`.
OpenCode no debe cambiar la API — está en `docs/api.md`.

---

## REFERENCIA RÁPIDA DE CONSTANTES

Todos los valores numéricos del juego vienen de `backend/src/game/constants.ts`:

| Constante | Valor |
|---|---|
| `GRID_COLS` | 15 |
| `GRID_ROWS` | 11 |
| `P1_SPAWN` | `{ x:1, y:1 }` |
| `P2_SPAWN` | `{ x:13, y:9 }` |
| `INITIAL_HP` / `MAX_HP` | 3 |
| `INITIAL_ENERGY` / `MAX_ENERGY` | 5 / 10 |
| `GAME_DURATION_S` | 120 |
| `VICTORY_SCORE` | 25 |
| `BOMB_TIMER_S` | 3 |
| `BOMB_RADIUS` | 2 |
| `SHIELD_DURATION_MS` | 4000 |
| `SCORE_CAPTURE_CORE` | 5 |
| `SCORE_KILL` | 10 |
| `SCORE_PICKUP_RESOURCE` | 1 |
| `SCORE_SPECIAL_HIT` | 2 |
| `ENERGY_CAPTURE_CORE` | 2 |
| `ENERGY_SPECIAL_COST` | 3 |
| `ENERGY_SPECIAL_HIT_DRAIN` | 2 |
| `ENERGY_PACK_REGEN` | 2 |
| `REPAIR_KIT_REGEN` | 1 |
| `CORE_RESPAWN_MS` | 8000 |
| `INITIAL_CORE_COUNT` | 3 |
| `MAX_CORE_COUNT` | 3 |
| `INITIAL_RESOURCE_COUNT` | 4 |
| `DESTRUCTIBLE_MIN` | 15 |
| `DESTRUCTIBLE_MAX` | 25 |
| `REACTOR_PULSE_MIN_S` | 45 |
| `REACTOR_PULSE_MAX_S` | 75 |
| `REACTOR_PULSE_WARNING_S` | 5 |
| `RESOURCE_SPAWN_CHANCE` | 0.5 |
| `CHAIN_REACTION_MAX_DEPTH` | 5 |
| `POLLING_INTERVAL_MS` | 500 |

---

## FASE 0 — Preparación del proyecto

---

### TASK-001 · Monorepo raíz y estructura de carpetas

**Objetivo:** Crear la estructura de carpetas completa y el `package.json` raíz con workspaces. Sin lógica de negocio.

**Archivos a crear:**
```
package.json
.gitignore
.env.example
backend/               (vacío)
frontend/              (vacío)
docs/                  (ya existe)
tests/e2e/             (vacío)
tests/e2e/helpers/     (vacío)
.github/workflows/     (vacío)
```

**Implementar exactamente:**

`package.json` raíz (versión inicial — se añade `devDependencies` en TASK-037):
```json
{
  "name": "reactor-rush",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "build": "npm run build --workspace=backend && npm run build --workspace=frontend",
    "start": "node backend/dist/index.js",
    "lint": "npm run lint --workspace=backend && npm run lint --workspace=frontend",
    "test:e2e": "playwright test --config=tests/playwright.config.ts",
    "test:e2e:headed": "playwright test --config=tests/playwright.config.ts --headed"
  }
}
```

`.gitignore`: incluir `node_modules/`, `dist/`, `.env`, `playwright-report/`, `test-results/`.

`.env.example`:
```
PORT=3000
NODE_ENV=development
VITE_API_BASE=/api
PRODUCTION_URL=
TEST_ENV=
```

**Restricciones:** no agregar dependencias todavía. No agregar lógica.

**Criterios de aceptación:**
- La estructura de carpetas existe.
- `package.json` raíz tiene `workspaces`, `build`, `start`, `lint`, `test:e2e`.
- `.env.example` tiene las 5 variables.

**Resultado esperado:** esqueleto del monorepo listo para instalar dependencias.

---

### TASK-002 · Backend: package.json y tsconfig.json

**Objetivo:** Configurar el paquete backend con dependencias correctas y TypeScript estricto.

**Archivos a crear:**
```
backend/package.json
backend/tsconfig.json
backend/src/             (vacío)
backend/src/game/        (vacío)
backend/src/routes/      (vacío)
```

**`backend/package.json`:**
```json
{
  "name": "reactor-rush-backend",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev --respawn src/index.ts",
    "start": "node dist/index.js",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.0",
    "ts-node-dev": "^2.0.0",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0"
  }
}
```

**`backend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Restricciones:** NO agregar axios, socket.io, sequelize, mongoose, redux ni ninguna librería prohibida.

**Criterios de aceptación:**
- `cd backend && npm install` termina sin errores.
- `cd backend && npx tsc --version` muestra versión 5.x.
- `grep -E "axios|socket|redux|sequelize" backend/package.json` retorna vacío.

---

### TASK-003 · Backend: entrada mínima con health check

**Objetivo:** `backend/src/index.ts` arranca Express con `/health` y compila correctamente.

**Archivos a crear:**
```
backend/src/index.ts
```

**Implementar:**
```typescript
import express from 'express';
import path from 'path';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Reactor Rush backend running on port ${PORT}`);
});

export default app;
```

**Restricciones:** no agregar rutas de juego todavía. No agregar static serving todavía (se añade en TASK-026 después del build del frontend).

**Criterios de aceptación:**
- `cd backend && npm run build` termina sin errores TypeScript.
- `node backend/dist/index.js &` + `curl http://localhost:3000/health` retorna `{"status":"ok"}`.

**Validación:**
```bash
cd backend && npm run build
node backend/dist/index.js &
sleep 1 && curl -s http://localhost:3000/health
kill %1
```

---

### TASK-004 · Frontend: package.json, tsconfig.json, vite.config.ts

**Objetivo:** Configurar el paquete frontend con React, TypeScript y Vite.

**Archivos a crear:**
```
frontend/package.json
frontend/tsconfig.json
frontend/vite.config.ts
frontend/index.html
frontend/src/
frontend/src/components/
frontend/src/hooks/
frontend/src/api/
```

**`frontend/package.json`:**
```json
{
  "name": "reactor-rush-frontend",
  "version": "1.0.0",
  "scripts": {
    "build": "vite build",
    "dev": "vite",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "vite": "^5.0.12",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

**Restricciones:** NO agregar react-router-dom, redux, axios, tailwindcss, bootstrap.

**`frontend/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

**`frontend/vite.config.ts`:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: 'dist'
  }
});
```

**`frontend/index.html`:**
```html
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reactor Rush</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Criterios de aceptación:**
- `cd frontend && npm install` sin errores.
- `grep -E "react-router|redux|axios|tailwind|bootstrap" frontend/package.json` retorna vacío.

---

### TASK-005 · Frontend: entrada mínima React

**Objetivo:** `frontend/src/main.tsx` y `frontend/src/App.tsx` compilables con placeholder.

**Archivos a crear:**
```
frontend/src/main.tsx
frontend/src/App.tsx
```

**`frontend/src/main.tsx`:**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**`frontend/src/App.tsx`** (placeholder, se reemplaza en Fase 14):
```typescript
export default function App() {
  return <h1>Reactor Rush</h1>;
}
```

**Criterios de aceptación:**
- `cd frontend && npm run build` produce `frontend/dist/index.html`.
- `cd frontend && npm run typecheck` pasa sin errores.

---

### TASK-006 · ESLint en backend y frontend

**Objetivo:** Lint funcional en ambos paquetes con reglas TypeScript.

**Archivos a crear:**
```
backend/.eslintrc.json
frontend/.eslintrc.json
```

**`backend/.eslintrc.json`:**
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "env": { "node": true, "es2020": true },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "no-console": "warn"
  }
}
```

**`frontend/.eslintrc.json`:**
```json
{
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react-hooks"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"],
  "env": { "browser": true, "es2020": true },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

**Criterios de aceptación:**
- `npm run lint --workspace=backend` pasa con código 0.
- `npm run lint --workspace=frontend` pasa con código 0.
- Introducir `const x: any = 1` causa fallo de lint.

**Validación:**
```bash
npm run lint
```

---

## FASE 1 — Contrato de datos

---

### TASK-007 · Tipos del backend (`state.ts`)

**Objetivo:** Definir todos los tipos TypeScript del dominio en `backend/src/game/state.ts`.

**Archivos a crear:**
```
backend/src/game/state.ts
```

**Implementar exactamente estos tipos (sin añadir ni quitar campos):**

```typescript
export type CellType     = 'empty' | 'wall' | 'destructible';
export type GameStatus   = 'playing' | 'finished';
export type GameResult   = 'player1_wins' | 'player2_wins' | 'draw' | null;
export type PlayerId     = 'player1' | 'player2';
export type ActionType   = 'move' | 'place_bomb' | 'capture_core' | 'special_action';
export type Direction    = 'up' | 'down' | 'left' | 'right';
export type ResourceType = 'energy_pack' | 'repair_kit';

export interface PlayerState {
  id:            PlayerId;
  x:             number;
  y:             number;
  hp:            number;
  energy:        number;
  resources:     number;
  score:         number;
  bombAvailable: boolean;
  shieldActive:  boolean;
  alive:         boolean;
}

export interface BombState {
  id:             string;
  playerId:       PlayerId;
  x:              number;
  y:              number;
  timerRemaining: number;
}

export interface CoreState {
  id: string;
  x:  number;
  y:  number;
}

export interface ResourceState {
  id:   string;
  x:    number;
  y:    number;
  type: ResourceType;
}

export interface GameState {
  gameId:              string;
  status:              GameStatus;
  timeRemaining:       number;
  result:              GameResult;
  players: {
    player1: PlayerState;
    player2: PlayerState;
  };
  bombs:               BombState[];
  cores:               CoreState[];
  resources:           ResourceState[];
  grid:                CellType[][];
  arenaEventActive:    boolean;
  arenaEventCountdown: number | null;
}

export interface ActionRequest {
  playerId: PlayerId;
  type:     ActionType;
  payload?: { direction?: Direction };
}

export class GameActionError extends Error {
  constructor(
    public readonly code:       string,
    public readonly message:    string,
    public readonly httpStatus: number
  ) {
    super(message);
    this.name = 'GameActionError';
  }
}

export interface TestScenario {
  destructibles: Array<{ x: number; y: number }>;
  cores:         Array<{ x: number; y: number }>;
  resources:     Array<{ x: number; y: number; type: ResourceType }>;
}
```

**Restricciones:** no usar `any`. No añadir campos adicionales no especificados.

**Criterios de aceptación:**
- `cd backend && npx tsc --noEmit` pasa sin errores.
- Todos los campos del `GameState` de `docs/modelo-datos.md` están presentes.

---

### TASK-008 · Constantes del juego (`constants.ts`)

**Objetivo:** Crear `backend/src/game/constants.ts` con todos los valores configurables.

**Archivos a crear:**
```
backend/src/game/constants.ts
```

**Implementar exactamente:**
```typescript
export const GRID_COLS  = 15;
export const GRID_ROWS  = 11;

export const P1_SPAWN = { x: 1,  y: 1  } as const;
export const P2_SPAWN = { x: 13, y: 9  } as const;

export const INITIAL_HP     = 3;
export const MAX_HP         = 3;
export const INITIAL_ENERGY = 5;
export const MAX_ENERGY     = 10;

export const GAME_DURATION_S = 120;
export const VICTORY_SCORE   = 25;

export const BOMB_TIMER_S = 3;
export const BOMB_RADIUS  = 2;

export const SHIELD_DURATION_MS = 4_000;

export const SCORE_CAPTURE_CORE    = 5;
export const SCORE_KILL            = 10;
export const SCORE_PICKUP_RESOURCE = 1;
export const SCORE_SPECIAL_HIT     = 2;

export const ENERGY_CAPTURE_CORE     = 2;
export const ENERGY_SPECIAL_COST     = 3;
export const ENERGY_SPECIAL_HIT_DRAIN = 2;

export const ENERGY_PACK_REGEN = 2;
export const REPAIR_KIT_REGEN  = 1;

export const CORE_RESPAWN_MS        = 8_000;
export const INITIAL_CORE_COUNT     = 3;
export const MAX_CORE_COUNT         = 3;
export const INITIAL_RESOURCE_COUNT = 4;

export const DESTRUCTIBLE_MIN = 15;
export const DESTRUCTIBLE_MAX = 25;

export const REACTOR_PULSE_MIN_S     = 45;
export const REACTOR_PULSE_MAX_S     = 75;
export const REACTOR_PULSE_WARNING_S = 5;

export const RESOURCE_SPAWN_CHANCE    = 0.5;
export const CHAIN_REACTION_MAX_DEPTH = 5;
export const POLLING_INTERVAL_MS      = 500;
```

**Restricciones:** este archivo no debe importar nada. Es la única fuente de números del juego. No dispersar números mágicos en otros módulos.

**Criterios de aceptación:**
- `cd backend && npx tsc --noEmit` pasa.
- No hay números literales (ej. `120`, `25`, `3`, `0.5`) en ningún otro archivo de `backend/src/game/` excepto este.

---

### TASK-009 · Tipos del frontend (`types.ts`)

**Objetivo:** Replicar manualmente los tipos del backend en el frontend.

**Archivos a crear:**
```
frontend/src/types.ts
```

**Implementar:** copiar exactamente los mismos tipos de TASK-007 más los siguientes adicionales:

```typescript
// ... (todos los tipos de state.ts)

export type ActionResponse =
  | { success: true;  state: GameState }
  | { success: false; error: string; message: string };

export interface CreateGameResponse {
  gameId: string;
  state:  GameState;
}
```

**Restricciones:** NO hacer `import` desde `../../backend`. Los tipos se mantienen sincronizados manualmente. No usar `any`.

**Criterios de aceptación:**
- `cd frontend && npm run typecheck` pasa.
- `grep "from.*backend" frontend/src/types.ts` retorna vacío.

---

## FASE 2 — Backend base: store y arranque

---

### TASK-010 · Store en memoria (`store.ts`)

**Objetivo:** Gestión centralizada del estado de la partida y registro de timers.

**Archivos a crear:**
```
backend/src/store.ts
```

**Implementar:**

```typescript
import { GameState } from './game/state';

interface GameTimerEntry {
  interval:        NodeJS.Timeout | null;
  timeouts:        NodeJS.Timeout[];
  respawningCores: Set<string>;
}

const gameStore  = new Map<string, GameState>();
const timerStore = new Map<string, GameTimerEntry>();
let   currentGameId: string | null = null;

export function getGame(id: string): GameState | undefined {
  return gameStore.get(id);
}

export function setGame(id: string, state: GameState): void {
  gameStore.set(id, state);
}

export function deleteGame(id: string): void {
  gameStore.delete(id);
}

export function getCurrentGameId(): string | null {
  return currentGameId;
}

export function setCurrentGameId(id: string | null): void {
  currentGameId = id;
}

export function initGameTimers(gameId: string): void {
  timerStore.set(gameId, { interval: null, timeouts: [], respawningCores: new Set() });
}

export function getGameTimers(gameId: string): GameTimerEntry | undefined {
  return timerStore.get(gameId);
}

export function clearGameTimers(gameId: string): void {
  const entry = timerStore.get(gameId);
  if (!entry) return;
  if (entry.interval) clearInterval(entry.interval);
  for (const t of entry.timeouts) clearTimeout(t);
  entry.respawningCores.clear();
  timerStore.delete(gameId);
}
```

**Criterios de aceptación:**
- `setGame` + `getGame` devuelve el mismo objeto.
- `clearGameTimers` en id inexistente no lanza error.
- `clearGameTimers` en id existente cancela todos los timers.
- `cd backend && npx tsc --noEmit` pasa.

---

### TASK-011 · Ruta `POST /api/game` básica (stub)

**Objetivo:** El endpoint existe y responde con estructura válida. La lógica completa se añade en TASK-021.

**Archivos a crear:**
```
backend/src/routes/game.ts
```

**Archivos a modificar:**
```
backend/src/index.ts
```

**Implementar en `routes/game.ts`:**
```typescript
import { Router } from 'express';

const router = Router();

router.post('/', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.get('/:gameId', (req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

router.post('/:gameId/action', (_req, res) => {
  res.status(501).json({ error: 'Not implemented yet' });
});

export default router;
```

**Modificar `index.ts`:** añadir después de `app.use(express.json())`:
```typescript
import gameRouter from './routes/game';
app.use('/api/game', gameRouter);
```

**Criterios de aceptación:**
- `POST /api/game` devuelve 501.
- `GET /api/game/test` devuelve 501.
- `cd backend && npm run build` pasa.

---

## FASE 3 — Generación de arena

---

### TASK-012 · BFS utilities (`bfs.ts`)

**Objetivo:** Funciones de conectividad y accesibilidad para el grid.

**Archivos a crear:**
```
backend/src/game/bfs.ts
```

**Implementar:**

```typescript
import { CellType } from './state';
import { GRID_COLS, GRID_ROWS } from './constants';

const DIRS = [[0,-1],[0,1],[-1,0],[1,0]];

export function bfsReachable(
  grid: CellType[][],
  from: { x: number; y: number },
  to:   { x: number; y: number }
): boolean {
  // BFS estándar. Celdas transitables: solo 'empty'.
  // Retorna true si existe camino de from a to.
}

export function getReachableCells(
  grid: CellType[][],
  from: { x: number; y: number }
): Set<string> {
  // BFS desde from. Retorna Set de "x,y" para todas las celdas 'empty' alcanzables.
}
```

**Reglas de implementación:**
- Solo las celdas `'empty'` son transitables en el BFS.
- Las celdas `'wall'` y `'destructible'` bloquean el paso.
- Usar cola (array con shift) o similar.
- Marcar visitados para evitar ciclos.

**Criterios de aceptación:**
- Grid abierto: `bfsReachable` de `(1,1)` a `(13,9)` retorna `true`.
- Grid con fila completa de walls bloqueando: retorna `false`.
- `getReachableCells` de `(1,1)` en grid abierto incluye `(2,1)`, `(1,2)`.
- `cd backend && npx tsc --noEmit` pasa.

---

### TASK-013 · Generación de grid (`factory.ts` — solo grid)

**Objetivo:** `generateGrid()` produce el grid 15×11 con borde, patrón interno y destructibles.

**Archivos a crear:**
```
backend/src/game/factory.ts
```

**Implementar `generateGrid(destructibleOverride?: Array<{x:number,y:number}>): CellType[][]`:**

1. Crear `grid[y][x]` = `'empty'` para todos (11 filas × 15 columnas).
2. Borde exterior: todas las celdas donde `x===0`, `x===14`, `y===0`, `y===10` → `'wall'`.
3. Patrón interno: posiciones donde `x % 2 === 0 && y % 2 === 0` con `x ∈ [2,12]` e `y ∈ [2,8]` → `'wall'`.
4. Si `destructibleOverride` está presente: marcar esas posiciones como `'destructible'` y retornar.
5. Si no: continuar con paso 6.
6. Calcular zonas de seguridad: celdas `(1,1)`, `(2,1)`, `(0,1)`, `(1,0)`, `(1,2)` y `(13,9)`, `(14,9)`, `(12,9)`, `(13,8)`, `(13,10)`.
7. Candidatos: celdas `'empty'` interiores no en zona de seguridad.
8. Seleccionar aleatoriamente N = `randomInt(DESTRUCTIBLE_MIN, DESTRUCTIBLE_MAX)` candidatos → `'destructible'`.
9. Verificar `bfsReachable(grid, P1_SPAWN, P2_SPAWN)`. Si false: eliminar destructibles bloqueantes hasta que sea true (máximo 50 iteraciones; si supera 50, convertir todos a `'empty'`).
10. Retornar grid.

**Helper:** `function randomInt(min: number, max: number): number` (inclusivo ambos extremos).

**Criterios de aceptación:**
- Grid retornado tiene 11 filas, cada una con 15 elementos.
- `grid[0]` todos `'wall'`. `grid[10]` todos `'wall'`.
- `grid[1][0]` = `'wall'`. `grid[1][14]` = `'wall'`.
- `grid[1][1]` = `'empty'` (spawn P1). `grid[9][13]` = `'empty'` (spawn P2).
- `grid[2][2]` = `'wall'` (patrón interno).
- Con override vacío `[]`: ningún destructible.
- Llamar 50 veces: siempre `bfsReachable` pasa.
- Zonas de seguridad nunca contienen `'destructible'`.

**Validación:** ejecutar `generateGrid()` en un script de test y verificar invariantes.

---

### TASK-014 · `createGame()` — estado inicial completo

**Objetivo:** `createGame()` genera el `GameState` completo con jugadores, núcleos, recursos e inicia los timers.

**Archivos a modificar:**
```
backend/src/game/factory.ts
```

**Dependencias:** TASK-007, TASK-008, TASK-010, TASK-012, TASK-013.

**Implementar `createGame(scenario?: TestScenario): GameState`:**

1. Limpiar partida anterior:
   ```typescript
   const existing = getCurrentGameId();
   if (existing) { clearGameTimers(existing); deleteGame(existing); setCurrentGameId(null); }
   ```
2. `gameId = crypto.randomUUID()`.
3. `grid = generateGrid(scenario?.destructibles)`.
4. `reachable = getReachableCells(grid, P1_SPAWN)`.
5. Cores: si `scenario?.cores` → usar esas posiciones. Si no → elegir `INITIAL_CORE_COUNT` posiciones aleatorias de `reachable` que no sean spawns.
6. Resources: si `scenario?.resources` → usar esas. Si no → elegir `INITIAL_RESOURCE_COUNT` posiciones aleatorias de `reachable` distintas de spawns y cores. Tipo aleatorio (50/50).
7. Construir `GameState`:
   - `player1`: `{ id:'player1', x:P1_SPAWN.x, y:P1_SPAWN.y, hp:INITIAL_HP, energy:INITIAL_ENERGY, resources:0, score:0, bombAvailable:true, shieldActive:false, alive:true }`.
   - `player2`: ídem con `P2_SPAWN`.
   - `status:'playing'`, `timeRemaining:GAME_DURATION_S`, `result:null`.
   - `bombs:[]`, `arenaEventActive:false`, `arenaEventCountdown:null`.
8. `setGame(gameId, state)`, `setCurrentGameId(gameId)`, `initGameTimers(gameId)`.
9. Llamar `startGameLoop(gameId)` (importado de `engine.ts` — stub hasta TASK-016).
10. Llamar `scheduleReactorPulse(gameId)` (importado de `arenaEvent.ts` — stub hasta TASK-029).
11. Retornar `state`.

**Nota sobre TestScenario:** si `NODE_ENV !== 'test'`, el parámetro `scenario` debe ignorarse aunque se pase. Implementar:
```typescript
const effectiveScenario = process.env.NODE_ENV === 'test' ? scenario : undefined;
```

**Criterios de aceptación:**
- `createGame()` retorna `GameState` con `status:'playing'`.
- `players.player1.x === 1`, `players.player1.y === 1`.
- `players.player2.x === 13`, `players.player2.y === 9`.
- Con `scenario = { destructibles:[], cores:[{x:3,y:1}], resources:[] }` en modo test: `cores[0].x === 3`.
- En modo producción: el `scenario` es ignorado.
- Al crear segunda partida: `getGame(oldId)` retorna `undefined`.

---

## FASE 4 — Motor de partida

---

### TASK-015 · `checkVictory()` y `applyDamage()`

**Objetivo:** Funciones centrales de lógica de juego en `engine.ts`.

**Archivos a crear:**
```
backend/src/game/engine.ts
```

**Implementar `checkVictory(state: GameState): void`:**
```typescript
export function checkVictory(state: GameState): void {
  if (state.status !== 'playing') return;
  const s1 = state.players.player1.score;
  const s2 = state.players.player2.score;
  if (s1 >= VICTORY_SCORE) { state.status = 'finished'; state.result = 'player1_wins'; return; }
  if (s2 >= VICTORY_SCORE) { state.status = 'finished'; state.result = 'player2_wins'; return; }
  if (state.timeRemaining <= 0) {
    state.status = 'finished';
    state.result = s1 > s2 ? 'player1_wins' : s2 > s1 ? 'player2_wins' : 'draw';
  }
}
```

**Implementar `applyDamage(state, targetId, amount, attackerId, bypassShield=false): void`:**
```typescript
export function applyDamage(
  state:        GameState,
  targetId:     PlayerId,
  amount:       number,
  attackerId:   PlayerId | null,
  bypassShield: boolean = false
): void {
  const target = state.players[targetId];
  if (!target.alive) return;
  if (!bypassShield && target.shieldActive) {
    target.shieldActive = false;
    return;
  }
  target.hp = Math.max(0, target.hp - amount);
  if (target.hp === 0) {
    target.alive = false;
    if (attackerId !== null && attackerId !== targetId) {
      state.players[attackerId].score += SCORE_KILL;
    }
    checkVictory(state);
  }
}
```

**Criterios de aceptación:**
- `checkVictory`: scores 25/10 → `player1_wins`. 10/25 → `player2_wins`. 10/10 tiempo 0 → `draw`.
- `checkVictory` llamado dos veces no cambia resultado.
- `applyDamage` con `alive:false`: no efecto.
- `applyDamage` con escudo (no bypass): escudo consumido, hp sin cambio.
- `applyDamage` con escudo + bypass: hp decrementado normalmente.
- `applyDamage` llevando hp a 0: `alive=false`, atacante `+SCORE_KILL`.
- Autogolpe (`attackerId === targetId`): no suma puntos.

---

### TASK-016 · Game loop (`startGameLoop`)

**Objetivo:** Tick de 1 segundo que gestiona tiempo, timers visuales y detecta fin de partida.

**Archivos a modificar:**
```
backend/src/game/engine.ts
```

**Implementar `startGameLoop(gameId: string): void`:**
```typescript
export function startGameLoop(gameId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;

  timers.interval = setInterval(() => {
    const state = getGame(gameId);
    if (!state || state.status !== 'playing') {
      clearGameTimers(gameId);
      return;
    }
    // 1. Decrementar tiempo
    state.timeRemaining = Math.max(0, state.timeRemaining - 1);
    // 2. Decrementar timerRemaining de bombas (visual)
    for (const bomb of state.bombs) {
      bomb.timerRemaining = Math.max(0, bomb.timerRemaining - 1);
    }
    // 3. Decrementar arenaEventCountdown
    if (state.arenaEventCountdown !== null && state.arenaEventCountdown > 0) {
      state.arenaEventCountdown -= 1;
    }
    // 4. Detectar victoria
    checkVictory(state);
    // 5. Persistir
    setGame(gameId, state);
    // 6. Limpiar si terminó
    if (state.status === 'finished') {
      clearGameTimers(gameId);
    }
  }, 1000);
}
```

**Criterios de aceptación:**
- Después de 2 segundos reales: `state.timeRemaining === GAME_DURATION_S - 2`.
- Cuando `status` pasa a `'finished'`: el interval se auto-cancela.
- `cd backend && npx tsc --noEmit` pasa.

---

## FASE 5 — Movimiento y acciones base

---

### TASK-017 · Infraestructura de acciones (`actions.ts`)

**Objetivo:** `processAction()` con validaciones comunes y despacho a funciones específicas.

**Archivos a crear:**
```
backend/src/game/actions.ts
```

**Implementar:**

```typescript
import { GameState, ActionRequest, PlayerId, GameActionError } from './state';
import { getGame, setGame } from '../store';
import { checkVictory } from './engine';

function validateCommon(state: GameState, playerId: PlayerId): void {
  if (state.status !== 'playing')
    throw new GameActionError('GAME_NOT_PLAYING', 'La partida ya ha terminado.', 409);
  if (!state.players[playerId].alive)
    throw new GameActionError('PLAYER_ELIMINATED', 'El jugador ha sido eliminado y no puede actuar.', 400);
}

export function processAction(gameId: string, req: ActionRequest): GameState {
  const state = getGame(gameId);
  if (!state)
    throw new GameActionError('GAME_NOT_FOUND', 'Partida no encontrada.', 404);

  validateCommon(state, req.playerId);
  const player = state.players[req.playerId];

  switch (req.type) {
    case 'move':           processMove(state, player, req.payload?.direction!); break;
    case 'place_bomb':     processPlaceBomb(state, player); break;
    case 'capture_core':   processCaptureCore(state, player); break;
    case 'special_action': processSpecialAction(state, player); break;
    default:
      throw new GameActionError('UNKNOWN_ACTION', 'Tipo de acción desconocido.', 400);
  }

  setGame(gameId, state);
  return state;
}
```

Las cuatro funciones `process*` son stubs que lanzan `'NOT_IMPLEMENTED'` hasta las tareas siguientes.

**Criterios de aceptación:**
- `processAction` con `status:'finished'` lanza `GAME_NOT_PLAYING` con `httpStatus:409`.
- `processAction` con `alive:false` lanza `PLAYER_ELIMINATED` con `httpStatus:400`.
- `processAction` con `gameId` inexistente lanza con `httpStatus:404`.
- `cd backend && npx tsc --noEmit` pasa.

---

### TASK-018 · Acción `move`

**Objetivo:** Movimiento con todas las validaciones y recolección automática de recursos.

**Archivos a modificar:**
```
backend/src/game/actions.ts
```

**Implementar `processMove(state, player, direction)`:**

1. Calcular `nx`, `ny` desde `direction`:
   - `'up'`: `ny = player.y - 1`
   - `'down'`: `ny = player.y + 1`
   - `'left'`: `nx = player.x - 1`
   - `'right'`: `nx = player.x + 1`
2. Bounds: `nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS` → `MOVE_OUT_OF_BOUNDS` (400).
3. Cell type: `grid[ny][nx] === 'wall' || grid[ny][nx] === 'destructible'` → `MOVE_BLOCKED` (400).
4. Rival: rival está en `(nx, ny)` → `MOVE_OCCUPIED` (400).
5. Actualizar: `player.x = nx`, `player.y = ny`.
6. Resource pickup: buscar en `state.resources` donde `r.x === nx && r.y === ny`. Si existe:
   - `'energy_pack'`: `player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_PACK_REGEN)`.
   - `'repair_kit'`: `player.hp = Math.min(MAX_HP, player.hp + REPAIR_KIT_REGEN)`.
   - `player.score += SCORE_PICKUP_RESOURCE`.
   - `player.resources += 1`.
   - Eliminar del array: `state.resources = state.resources.filter(r => !(r.x === nx && r.y === ny))`.

**Criterios de aceptación:**
- Mover a celda `'empty'` libre: posición actualizada.
- Mover a `'wall'`: error `MOVE_BLOCKED`.
- Mover a `'destructible'`: error `MOVE_BLOCKED`.
- Mover a celda del rival: error `MOVE_OCCUPIED`.
- Mover fuera del grid: error `MOVE_OUT_OF_BOUNDS`.
- Mover sobre `energy_pack`: energy `+= ENERGY_PACK_REGEN`, score `+= 1`, resource eliminado.
- Mover sobre `repair_kit`: hp `+= REPAIR_KIT_REGEN`, score `+= 1`, resource eliminado.
- Energy nunca supera `MAX_ENERGY`. HP nunca supera `MAX_HP`.

---

### TASK-019 · Acción `place_bomb`

**Objetivo:** Registrar bomba en el estado con timer visual.

**Archivos a modificar:**
```
backend/src/game/actions.ts
backend/src/game/bombs.ts  (crear stub)
```

**Crear `bombs.ts` con stub:**
```typescript
// Stub — implementación real en TASK-022
export function scheduleBomb(_gameId: string, _bombId: string): void {}
export function triggerExplosion(_gameId: string, _bombId: string, _depth?: number): void {}
```

**Implementar `processPlaceBomb(state, player)`:**
1. `if (!player.bombAvailable)` → `BOMB_ALREADY_ACTIVE` (400).
2. Crear `BombState`: `{ id: crypto.randomUUID(), playerId: player.id, x: player.x, y: player.y, timerRemaining: BOMB_TIMER_S }`.
3. `state.bombs.push(bomb)`.
4. `player.bombAvailable = false`.
5. Llamar `scheduleBomb(state.gameId, bomb.id)`.

**Criterios de aceptación:**
- Después de `place_bomb`: `state.bombs.length === 1`, `player.bombAvailable === false`.
- `timerRemaining === BOMB_TIMER_S`.
- Segundo `place_bomb` inmediato: error `BOMB_ALREADY_ACTIVE`.

---

### TASK-020 · Acción `capture_core`

**Objetivo:** Captura explícita de núcleo con puntuación y respawn.

**Archivos a modificar:**
```
backend/src/game/actions.ts
backend/src/game/cores.ts  (crear stub)
```

**Crear `cores.ts` con stub:**
```typescript
export function scheduleRespawn(_gameId: string, _coreId: string, _delayMs: number): void {}
```

**Implementar `processCaptureCore(state, player)`:**
1. `core = state.cores.find(c => c.x === player.x && c.y === player.y)`.
2. Si no existe → `CORE_NOT_PRESENT` (400).
3. `state.cores = state.cores.filter(c => c.id !== core.id)`.
4. `player.score += SCORE_CAPTURE_CORE`.
5. `player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_CAPTURE_CORE)`.
6. Llamar `scheduleRespawn(state.gameId, core.id, CORE_RESPAWN_MS)`.
7. Llamar `checkVictory(state)`.

**Criterios de aceptación:**
- Con núcleo en celda del jugador: `score += 5`, `energy += 2` (máx 10), core eliminado del array.
- Sin núcleo: error `CORE_NOT_PRESENT`.
- Captura que lleva score a `VICTORY_SCORE`: `status === 'finished'`.

---

### TASK-021 · Acción `special_action`

**Objetivo:** Ataque ofensivo o escudo defensivo con coste de energía.

**Archivos a modificar:**
```
backend/src/game/actions.ts
```

**Implementar `processSpecialAction(state, player)`:**
1. `if (player.energy < ENERGY_SPECIAL_COST)` → `ENERGY_INSUFFICIENT` (400).
2. `player.energy -= ENERGY_SPECIAL_COST`.
3. `rivalId`: el otro `PlayerId`.
4. `rival = state.players[rivalId]`.
5. `dist = Math.abs(player.x - rival.x) + Math.abs(player.y - rival.y)`.
6. Si `dist === 1`:
   - `applyDamage(state, rivalId, 1, player.id, true)` (bypass shield).
   - `rival.energy = Math.max(0, rival.energy - ENERGY_SPECIAL_HIT_DRAIN)`.
   - `player.score += SCORE_SPECIAL_HIT`.
   - `checkVictory(state)`.
7. Si `dist > 1`:
   - `player.shieldActive = true`.
   - Registrar timeout: `setTimeout(() => { player.shieldActive = false; setGame(state.gameId, state); }, SHIELD_DURATION_MS)`. Guardarlo en `getGameTimers(state.gameId)!.timeouts.push(t)`.

**Criterios de aceptación:**
- Rival adyacente: rival `-1 hp` (bypassShield), rival `-2 energy`, jugador `+2 score`, jugador `-3 energy`.
- Escudo del rival no lo protege (bypassShield=true).
- Rival no adyacente: `player.shieldActive = true`.
- Después de `SHIELD_DURATION_MS`: `player.shieldActive = false`.
- `energy < 3`: error `ENERGY_INSUFFICIENT`.
- Energía del rival nunca baja de 0.

---

## FASE 6 — Bombas y explosiones

---

### TASK-022 · `scheduleBomb` y `triggerExplosion`

**Objetivo:** Reemplazar los stubs de `bombs.ts` con implementación completa.

**Archivos a modificar:**
```
backend/src/game/bombs.ts
```

**Implementar `scheduleBomb(gameId, bombId)`:**
```typescript
export function scheduleBomb(gameId: string, bombId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  const t = setTimeout(() => triggerExplosion(gameId, bombId, 0), BOMB_TIMER_S * 1000);
  timers.timeouts.push(t);
}
```

**Implementar `computeAffectedCells(grid, bx, by): Set<string>`:**
- Desde `(bx, by)` recorrer las 4 direcciones cardinales.
- Hasta `BOMB_RADIUS` pasos en cada dirección.
- Si la celda es `'wall'`: stop (no incluir la wall).
- Si la celda es `'destructible'`: incluir en el set, luego stop.
- Si la celda es `'empty'`: incluir en el set, continuar.
- Retornar `Set<string>` con claves `"x,y"`.

**Implementar `triggerExplosion(gameId, bombId, depth=0)`:**
1. Si `depth > CHAIN_REACTION_MAX_DEPTH`: return.
2. `state = getGame(gameId)`. Si !state o `status !== 'playing'`: return.
3. `bomb = state.bombs.find(b => b.id === bombId)`. Si !bomb: return.
4. `affected = computeAffectedCells(state.grid, bomb.x, bomb.y)`.
5. **Destructibles:** para cada `"x,y"` en affected donde `grid[y][x] === 'destructible'`:
   - `state.grid[y][x] = 'empty'`.
   - Si `Math.random() < RESOURCE_SPAWN_CHANCE`: `state.resources.push(createRandomResource(x, y))`.
6. **Jugadores:** para cada id en `['player1','player2'] as PlayerId[]`:
   - Si `"px,py"` en affected: `applyDamage(state, id, 1, bomb.playerId, false)`.
7. **Núcleos:** para cada core donde `"cx,cy"` en affected:
   - Eliminar del array.
   - `scheduleRespawn(state.gameId, core.id, CORE_RESPAWN_MS)`.
8. **Reacción en cadena:** colectar otras bombas donde `"bx,by"` en affected. Para cada una:
   - Eliminar del array.
   - `state.players[otherBomb.playerId].bombAvailable = true`.
   - `triggerExplosion(gameId, otherBomb.id, depth + 1)`.
9. Eliminar bomba original: `state.bombs = state.bombs.filter(b => b.id !== bombId)`.
10. `state.players[bomb.playerId].bombAvailable = true`.
11. `checkVictory(state)`.
12. `setGame(gameId, state)`.

**Helper `createRandomResource(x, y): ResourceState`:**
```typescript
function createRandomResource(x: number, y: number): ResourceState {
  return {
    id:   crypto.randomUUID(),
    x, y,
    type: Math.random() < 0.5 ? 'energy_pack' : 'repair_kit'
  };
}
```

**Criterios de aceptación:**
- Después de `BOMB_TIMER_S * 1000` ms: bomba eliminada de `state.bombs`.
- `bombAvailable` vuelve a `true`.
- Jugador en radio: `hp - 1`. Jugador fuera: sin cambio.
- Jugador con escudo en radio: escudo consumido, hp sin cambio.
- `destructible` en radio: pasa a `'empty'`.
- Núcleo en radio: eliminado, sin puntos.
- Segunda bomba en radio: explota (reacción en cadena, depth 1).
- Un jugador nunca recibe más de 1 daño por explosión (garantizado por `alive` check en `applyDamage`).

---

## FASE 7 — Núcleos, recursos y Reactor Pulse

---

### TASK-023 · Respawn de núcleos (`cores.ts`)

**Objetivo:** Implementar ciclo completo de respawn con anti-duplicado y respeto del máximo.

**Archivos a modificar:**
```
backend/src/game/cores.ts
```

**Implementar `scheduleRespawn(gameId, coreId, delayMs)`:**
```typescript
export function scheduleRespawn(gameId: string, coreId: string, delayMs: number): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  if (timers.respawningCores.has(coreId)) return; // anti-duplicado
  timers.respawningCores.add(coreId);
  const t = setTimeout(() => respawnCore(gameId, coreId), delayMs);
  timers.timeouts.push(t);
}
```

**Implementar `respawnCore(gameId, coreId)`:**
```typescript
function respawnCore(gameId: string, coreId: string): void {
  const timers = getGameTimers(gameId);
  if (timers) timers.respawningCores.delete(coreId);

  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  if (state.cores.length >= MAX_CORE_COUNT) return;

  const occupied = new Set<string>([
    ...state.cores.map(c => `${c.x},${c.y}`),
    ...state.resources.map(r => `${r.x},${r.y}`),
    `${state.players.player1.x},${state.players.player1.y}`,
    `${state.players.player2.x},${state.players.player2.y}`,
    ...state.bombs.map(b => `${b.x},${b.y}`),
  ]);

  // Buscar celda 'empty' libre aleatoria
  const candidates: Array<{x:number,y:number}> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.grid[y][x] === 'empty' && !occupied.has(`${x},${y}`)) {
        candidates.push({x, y});
      }
    }
  }
  if (candidates.length === 0) return;
  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  state.cores.push({ id: coreId, x: pos.x, y: pos.y });
  setGame(gameId, state);
}
```

**Criterios de aceptación:**
- Después de `CORE_RESPAWN_MS` ms: núcleo reaparece en `state.cores`.
- Llamar `scheduleRespawn` dos veces para el mismo `coreId`: solo un respawn.
- Si `cores.length >= MAX_CORE_COUNT` al respawnear: no se añade núcleo extra.
- El núcleo reaparece en celda `'empty'` no ocupada.

---

### TASK-024 · Reactor Pulse (`arenaEvent.ts`)

**Objetivo:** Evento único de arena con advertencia y efecto sobre el grid.

**Archivos a crear:**
```
backend/src/game/arenaEvent.ts
```

**Implementar `scheduleReactorPulse(gameId)`:**
```typescript
export function scheduleReactorPulse(gameId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  const delaySec = REACTOR_PULSE_MIN_S + Math.floor(Math.random() * (REACTOR_PULSE_MAX_S - REACTOR_PULSE_MIN_S + 1));
  const delayMs  = delaySec * 1000;
  const warnMs   = delayMs - REACTOR_PULSE_WARNING_S * 1000;
  const t1 = setTimeout(() => activateWarning(gameId), warnMs);
  const t2 = setTimeout(() => triggerReactorPulse(gameId), delayMs);
  timers.timeouts.push(t1, t2);
}
```

**Implementar `activateWarning(gameId)`:**
```typescript
function activateWarning(gameId: string): void {
  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  state.arenaEventActive    = true;
  state.arenaEventCountdown = REACTOR_PULSE_WARNING_S;
  setGame(gameId, state);
}
```

**Implementar `triggerReactorPulse(gameId)`:**
```typescript
export function triggerReactorPulse(gameId: string): void {
  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.grid[y][x] === 'destructible' && (x % 2 === 0 || y % 2 === 0)) {
        state.grid[y][x] = 'empty';
        if (Math.random() < RESOURCE_SPAWN_CHANCE) {
          state.resources.push({ id: crypto.randomUUID(), x, y, type: Math.random() < 0.5 ? 'energy_pack' : 'repair_kit' });
        }
      }
    }
  }
  state.arenaEventActive    = false;
  state.arenaEventCountdown = null;
  setGame(gameId, state);
  // NO se vuelve a llamar scheduleReactorPulse — evento único.
}
```

**Criterios de aceptación:**
- `arenaEventCountdown` baja de 5 a 0 en 5 segundos (decrementado por tick de engine).
- Tras el pulso: todos los `destructible` con x par o y par → `'empty'`.
- `arenaEventActive === false`, `arenaEventCountdown === null` después del pulso.
- El pulso no se repite.
- Si la partida termina antes: `clearGameTimers` cancela los timeouts pendientes.

---

## FASE 8 — API REST completa

---

### TASK-025 · Implementar los tres endpoints principales

**Objetivo:** `POST /api/game`, `GET /api/game/:gameId`, `POST /api/game/:gameId/action` completamente funcionales.

**Archivos a modificar:**
```
backend/src/routes/game.ts
```

**Reemplazar los stubs de TASK-011 con:**

```typescript
import { Router } from 'express';
import { createGame } from '../game/factory';
import { getGame } from '../store';
import { processAction } from '../game/actions';
import { GameActionError, ActionRequest, TestScenario } from '../game/state';

const router = Router();

// POST /api/game
router.post('/', (req, res) => {
  const scenario: TestScenario | undefined =
    process.env.NODE_ENV === 'test' ? req.body?.scenario : undefined;
  const state = createGame(scenario);
  res.status(200).json({ gameId: state.gameId, state });
});

// GET /api/game/:gameId
router.get('/:gameId', (req, res) => {
  const state = getGame(req.params.gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  res.status(200).json(state);
});

// POST /api/game/:gameId/action
router.post('/:gameId/action', (req, res) => {
  try {
    const state = processAction(req.params.gameId, req.body as ActionRequest);
    res.status(200).json({ success: true, state });
  } catch (err) {
    if (err instanceof GameActionError) {
      return res.status(err.httpStatus).json({
        success: false,
        error:   err.code,
        message: err.message
      });
    }
    res.status(500).json({ success: false, error: 'INTERNAL', message: 'Error interno.' });
  }
});

export default router;
```

**Criterios de aceptación:**
- `POST /api/game` → 200 con `{ gameId, state }`. `state.status === 'playing'`.
- `GET /api/game/:gameId` → 200 con `GameState` completo.
- `GET /api/game/invalid` → 404 `{ error: 'Game not found' }`.
- `POST /api/game/:gameId/action` con movimiento válido → 200 `{ success:true, state }`.
- `POST /api/game/:gameId/action` con movimiento inválido → 400 `{ success:false, error:'MOVE_BLOCKED', message:'...' }`.
- `POST /api/game/:gameId/action` con partida terminada → 409 `{ success:false, error:'GAME_NOT_PLAYING' }`.

**Validación:**
```bash
cd backend && npm run build
node backend/dist/index.js &
GAME_ID=$(curl -s -X POST http://localhost:3000/api/game -H "Content-Type: application/json" -d '{}' | jq -r .gameId)
curl -s http://localhost:3000/api/game/$GAME_ID | jq .status
curl -s -X POST http://localhost:3000/api/game/$GAME_ID/action \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player1","type":"move","payload":{"direction":"right"}}' | jq .success
kill %1
```

---

### TASK-026 · Endpoint `force-end` y static serving

**Objetivo:** Endpoint test-only y servicio de estáticos del frontend.

**Archivos a crear:**
```
backend/src/routes/test.ts
```

**Archivos a modificar:**
```
backend/src/index.ts
```

**`backend/src/routes/test.ts`:**
```typescript
import { Router } from 'express';
import { getGame, setGame } from '../store';
import { checkVictory } from '../game/engine';

const router = Router();

router.post('/:gameId/test/force-end', (req, res) => {
  const state = getGame(req.params.gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  state.timeRemaining = 0;
  checkVictory(state);
  setGame(req.params.gameId, state);
  res.status(200).json({ success: true, state });
});

export default router;
```

**Modificar `backend/src/index.ts`** — la versión completa y definitiva del archivo debe quedar así:

```typescript
import express from 'express';
import path from 'path';
import gameRouter from './routes/game';
import testRouter from './routes/test';   // importación estática — la ruta solo se registra si NODE_ENV=test

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/game', gameRouter);

// Solo en modo test: registrar la ruta de test
// El módulo se importa estáticamente pero la ruta NO se registra en producción,
// por lo que el endpoint POST .../test/force-end no existe ni es accesible fuera de test.
if (process.env.NODE_ENV === 'test') {
  app.use('/api/game', testRouter);
}

// Servir frontend compilado (DESPUÉS de todas las rutas API)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Reactor Rush backend running on port ${PORT}`);
});

export default app;
```

**Nota sobre la importación estática de `testRouter`:** el módulo `routes/test.ts` se importa siempre en tiempo de compilación, pero la ruta `POST .../test/force-end` solo se registra en Express cuando `NODE_ENV === 'test'`. En producción el módulo está cargado en memoria pero ninguna URL lleva a él, por lo que el endpoint es efectivamente inaccesible. Esta estrategia elimina la necesidad de `require()` dinámico y es compatible con las reglas ESLint del proyecto (`@typescript-eslint/no-var-requires` no aplica a imports estáticos).

**Criterios de aceptación:**
- `NODE_ENV=test`: `POST .../test/force-end` → 200 con `state.status === 'finished'`.
- `NODE_ENV=production`: el endpoint no existe (la URL devuelve HTML del frontend o 404 sin JSON de juego).
- `npm run build` + `node backend/dist/index.js` sirve el frontend en `/`.
- `/api` sigue respondiendo JSON.

**Validación:**
```bash
npm run build
NODE_ENV=test node backend/dist/index.js &
GAME_ID=$(curl -s -X POST http://localhost:3000/api/game | jq -r .gameId)
curl -s -X POST http://localhost:3000/api/game/$GAME_ID/test/force-end | jq .state.status
# → "finished"
curl -s http://localhost:3000 | grep "Reactor Rush"
# → HTML con el título
kill %1
```

---

## FASE 9 — API client y estado de la aplicación frontend

---

### TASK-027 · Cliente API fetch (`client.ts`)

**Objetivo:** Tres funciones HTTP con `fetch` nativo. Sin Axios.

**Archivos a crear:**
```
frontend/src/api/client.ts
```

**Implementar:**
```typescript
import { GameState, ActionRequest, ActionResponse, CreateGameResponse, TestScenario } from '../types';

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api';

export async function postGame(scenario?: TestScenario): Promise<CreateGameResponse> {
  const res = await fetch(`${BASE}/game`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(scenario ? { scenario } : {})
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<CreateGameResponse>;
}

export async function getGame(gameId: string): Promise<GameState> {
  const res = await fetch(`${BASE}/game/${gameId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<GameState>;
}

export async function postAction(gameId: string, req: ActionRequest): Promise<ActionResponse> {
  const res = await fetch(`${BASE}/game/${gameId}/action`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req)
  });
  return res.json() as Promise<ActionResponse>;
}
```

**Restricciones:** NO importar axios. NO importar ninguna librería HTTP externa. Usar solo `fetch`.

**Criterios de aceptación:**
- `grep "axios" frontend/src/api/client.ts` retorna vacío.
- `cd frontend && npm run typecheck` pasa.
- Las tres funciones están tipadas con los tipos de `types.ts`.

---

### TASK-028 · App state machine (`App.tsx`)

**Objetivo:** Máquina de estados que gestiona las tres pantallas.

**Archivos a modificar:**
```
frontend/src/App.tsx
frontend/src/App.css  (crear)
```

**Implementar `App.tsx`:**
```typescript
import { useState } from 'react';
import { GameState } from './types';
import { postGame } from './api/client';
import StartScreen  from './components/StartScreen';
import GameScreen   from './components/GameScreen';
import ResultScreen from './components/ResultScreen';
import './App.css';

type Screen = 'start' | 'game' | 'result';

export default function App() {
  const [screen,    setScreen]    = useState<Screen>('start');
  const [gameId,    setGameId]    = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);

  function handleStart(gId: string, state: GameState) {
    setGameId(gId);
    setGameState(state);
    setScreen('game');
  }

  function handleFinish(state: GameState) {
    setGameState(state);
    setScreen('result');
  }

  async function handleNewGame() {
    const { gameId: gId, state } = await postGame();
    handleStart(gId, state);
  }

  if (screen === 'start')  return <StartScreen onStart={handleStart} />;
  if (screen === 'game')   return <GameScreen gameId={gameId!} initialState={gameState!} onFinish={handleFinish} />;
  if (screen === 'result') return <ResultScreen state={gameState!} onNewGame={handleNewGame} />;
  return null;
}
```

**`App.css`:**
```css
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
  font-family: sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
}
#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

Los componentes `StartScreen`, `GameScreen`, `ResultScreen` son stubs vacíos hasta Fase 11.

**Criterios de aceptación:**
- `cd frontend && npm run typecheck` pasa.
- `cd frontend && npm run build` pasa.
- No se importa `react-router`, `redux` ni similares.

---

## FASE 10 — Controles y polling

---

### TASK-029 · Hook `useKeyboard`

**Objetivo:** Captura de teclas, filtrado de `event.repeat`, mapeo a acciones.

**Archivos a crear:**
```
frontend/src/hooks/useKeyboard.ts
```

**Implementar:**
```typescript
import { useEffect } from 'react';
import { ActionRequest, ActionResponse } from '../types';
import { postAction } from '../api/client';

const KEY_MAP: Record<string, ActionRequest> = {
  'w': { playerId:'player1', type:'move', payload:{direction:'up'} },
  'a': { playerId:'player1', type:'move', payload:{direction:'left'} },
  's': { playerId:'player1', type:'move', payload:{direction:'down'} },
  'd': { playerId:'player1', type:'move', payload:{direction:'right'} },
  'f': { playerId:'player1', type:'place_bomb' },
  'g': { playerId:'player1', type:'capture_core' },
  'e': { playerId:'player1', type:'special_action' },
  'ArrowUp':    { playerId:'player2', type:'move', payload:{direction:'up'} },
  'ArrowLeft':  { playerId:'player2', type:'move', payload:{direction:'left'} },
  'ArrowDown':  { playerId:'player2', type:'move', payload:{direction:'down'} },
  'ArrowRight': { playerId:'player2', type:'move', payload:{direction:'right'} },
  'l': { playerId:'player2', type:'place_bomb' },
  'k': { playerId:'player2', type:'capture_core' },
  'o': { playerId:'player2', type:'special_action' },
};

export function useKeyboard(
  gameId:   string,
  onResult: (res: ActionResponse, playerId: PlayerId) => void
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;                      // ignorar repetición automática
      const action = KEY_MAP[e.key];
      if (!action) return;
      e.preventDefault();
      postAction(gameId, action)
        .then(res => onResult(res, action.playerId))
        .catch(console.error);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameId, onResult]);
}
```

**Restricciones:**
- NO usar `setTimeout` ni ningún debounce.
- El único filtro es `if (e.repeat) return`.
- Cada `keydown` distinto genera exactamente un `fetch`.

**Criterios de aceptación:**
- `event.repeat === true`: no se genera request.
- Tecla sin mapeo: no se genera request.
- `W` → `{ playerId:'player1', type:'move', payload:{direction:'up'} }`.
- `ArrowUp` → `{ playerId:'player2', type:'move', payload:{direction:'up'} }`.
- El callback `onResult` recibe tanto la respuesta como el `playerId` de la acción ejecutada.
- `cd frontend && npm run typecheck` pasa.
- `grep "debounce\|setTimeout" frontend/src/hooks/useKeyboard.ts` retorna vacío.

---

### TASK-030 · Hook `usePolling`

**Objetivo:** Polling a 500 ms con cleanup y detención automática.

**Archivos a crear:**
```
frontend/src/hooks/usePolling.ts
```

**Implementar:**
```typescript
import { useEffect } from 'react';
import { GameState } from '../types';
import { getGame } from '../api/client';

export function usePolling(
  gameId:     string,
  onState:    (state: GameState) => void,
  intervalMs: number = 500
): void {
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const state = await getGame(gameId);
        onState(state);
        if (state.status === 'finished') {
          clearInterval(id);
        }
      } catch {
        // error de red transitorio — continuar polling
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [gameId, onState, intervalMs]);
}
```

**Criterios de aceptación:**
- El interval se limpia al desmontar el componente (cleanup del useEffect).
- Se detiene automáticamente cuando `status === 'finished'`.
- `cd frontend && npm run typecheck` pasa.

---

## FASE 11 — Arena y componentes UI

---

### TASK-031 · Componentes de sprites

**Objetivo:** `PlayerSprite`, `BombSprite`, `CoreSprite`, `ResourceSprite`.

**Archivos a crear:**
```
frontend/src/components/PlayerSprite.tsx
frontend/src/components/PlayerSprite.css
frontend/src/components/BombSprite.tsx
frontend/src/components/CoreSprite.tsx
frontend/src/components/ResourceSprite.tsx
frontend/src/components/Sprites.css
```

**`PlayerSprite.tsx`:**
```typescript
import { PlayerState } from '../types';
import './PlayerSprite.css';

export default function PlayerSprite({ player }: { player: PlayerState }) {
  const classes = [
    'player',
    `player--${player.id}`,
    player.shieldActive ? 'player--shielded' : '',
    !player.alive       ? 'player--dead'     : '',
  ].filter(Boolean).join(' ');

  return <div className={classes} data-testid={`player-${player.id}`} />;
}
```

**`PlayerSprite.css`:**
```css
.player {
  width: 80%; height: 80%;
  margin: 10%;
  border-radius: 50%;
  position: absolute;
  top: 0; left: 0;
}
.player--player1 { background: #3b82f6; }
.player--player2 { background: #f97316; }
.player--shielded { box-shadow: 0 0 8px 4px #fff; animation: shield-pulse 0.5s infinite alternate; }
.player--dead { opacity: 0.3; }
@keyframes shield-pulse { from { box-shadow: 0 0 4px 2px #fff; } to { box-shadow: 0 0 12px 6px #88f; } }
```

**`BombSprite.tsx`:** render `<div>` con clase según `timerRemaining`:
- 3: `bomb--safe` (gris)
- 2: `bomb--warn` (amarillo)
- 1 o 0: `bomb--danger` (rojo, ligeramente más grande)

**`CoreSprite.tsx`:** caja amarilla brillante rotada 45° con `data-testid="core"`.

**`ResourceSprite.tsx`:** props `type: ResourceType`. `energy_pack` → cyan. `repair_kit` → verde. `data-testid="resource"`.

**Sprites.css:** definir `.bomb-safe`, `.bomb-warn`, `.bomb-danger`, `.core`, `.resource-energy_pack`, `.resource-repair_kit`.

**Criterios de aceptación:**
- P1 azul, P2 naranja.
- `data-testid="player-player1"` y `data-testid="player-player2"` presentes en DOM.
- Bomba con `timerRemaining=1` tiene clase `bomb--danger`.
- Core y resources visualmente distintos entre sí.
- `cd frontend && npm run typecheck` pasa.

---

### TASK-032 · Arena (`Arena.tsx`)

**Objetivo:** Cuadrícula 15×11 con todos los elementos superpuestos.

**Archivos a crear:**
```
frontend/src/components/Arena.tsx
frontend/src/components/Arena.css
```

**Implementar:**
- `Arena({ state }: { state: GameState })` renderiza un `<div data-testid="arena" className="arena">`.
- Dentro: un `<div>` por cada `(x, y)` del grid, en orden row-major (y exterior, x interior).
- Cada celda: `<div className={`cell cell--${state.grid[y][x]}`} data-cell-x={x} data-cell-y={y}>`.
- Dentro de la celda, en este orden: `PlayerSprite` si algún jugador está en `(x,y)`, `BombSprite` si hay bomba, `CoreSprite` si hay núcleo, `ResourceSprite` si hay recurso.

**`Arena.css`:**
```css
.arena {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  width: 100%;
  height: 100%;
}
.cell {
  aspect-ratio: 1;
  position: relative;
  box-sizing: border-box;
}
.cell--wall        { background: #444; }
.cell--destructible { background: #7a5020; border: 1px solid #5a3810; }
.cell--empty        { background: #2d4a1e; }
```

**Criterios de aceptación:**
- La arena renderiza exactamente 165 celdas (15×11).
- Jugador en `(1,1)` está en la celda con `data-cell-x="1" data-cell-y="1"`.
- Bomba con `timerRemaining=1` tiene clase `bomb--danger` visible.
- `cd frontend && npm run typecheck` pasa.

---

### TASK-033 · PlayerHUD y TimeDisplay

**Objetivo:** Paneles laterales con todos los atributos del jugador y el display de tiempo.

**Archivos a crear:**
```
frontend/src/components/PlayerHUD.tsx
frontend/src/components/PlayerHUD.css
frontend/src/components/TimeDisplay.tsx
frontend/src/components/TimeDisplay.css
```

**`PlayerHUD.tsx`:**
- Props: `player: PlayerState`, `label: string`, `errorMessage: string | null`.
- HP: renderizar `MAX_HP` iconos, llenos o vacíos según `player.hp`.
- Energy: barra `<div style={{ width: `${(player.energy/MAX_ENERGY)*100}%` }}>`.
- Resources: número.
- Score: número.
- Bomb: `💣 ✓` o `💣 ✗` según `player.bombAvailable`.
- Shield: indicador visible cuando `player.shieldActive`.
- Error: `<div data-testid={`error-${player.id}`} className="hud__error">` — visible solo cuando `errorMessage !== null`.
- Si `!player.alive`: mostrar `ELIMINADO`.

**`TimeDisplay.tsx`:**
- Props: `timeRemaining: number`, `arenaEventActive: boolean`, `arenaEventCountdown: number | null`.
- `<span data-testid="time-remaining">{timeRemaining}</span>` — número entero de segundos (para los tests).
- Mostrar también en formato visual `MM:SS` si se desea.
- Si `arenaEventCountdown !== null`: `<div data-testid="reactor-warning" className="reactor-warning">⚡ PULSO EN {arenaEventCountdown}s</div>`.

**IMPORTANTE:** `data-testid="time-remaining"` debe contener el número como texto plano (`"87"`, no `"01:27"`). `Number(await page.getByTestId('time-remaining').textContent())` debe retornar un número válido.

**Criterios de aceptación:**
- `hp === 2`: 2 corazones llenos, 1 vacío.
- `bombAvailable === false`: indicador muestra ✗.
- `errorMessage !== null`: elemento visible con el texto del error.
- `data-testid="error-player1"` y `data-testid="error-player2"` presentes.
- `data-testid="time-remaining"` contiene número entero.
- `data-testid="reactor-warning"` visible cuando `arenaEventCountdown !== null`.

---

### TASK-034 · StartScreen y ResultScreen

**Objetivo:** Pantallas de inicio y resultado completamente funcionales.

**Archivos a crear:**
```
frontend/src/components/StartScreen.tsx
frontend/src/components/StartScreen.css
frontend/src/components/ResultScreen.tsx
frontend/src/components/ResultScreen.css
```

**`StartScreen.tsx`:**
- Props: `onStart: (gameId: string, state: GameState) => void`.
- Mostrar: nombre del juego, descripción del objetivo, tabla de controles P1 y P2.
- Botón: `<button data-testid="start-button" onClick={handleStart}>Iniciar partida</button>`.
- `handleStart`: llama `postGame()`, en éxito llama `onStart(gameId, state)`. Manejar error con estado local.

**`ResultScreen.tsx`:**
- Props: `state: GameState`, `onNewGame: () => void`.
- `<div data-testid="result-screen">`.
- Texto según `state.result`:
  - `'player1_wins'`: "¡Jugador 1 gana!"
  - `'player2_wins'`: "¡Jugador 2 gana!"
  - `'draw'`: "EMPATE"
- Mostrar scores de ambos jugadores.
- Botón "Nueva partida" llama `onNewGame`.

**Criterios de aceptación:**
- `data-testid="start-button"` presente.
- `data-testid="result-screen"` presente.
- `result === 'draw'` → texto contiene "EMPATE".
- `result === 'player1_wins'` → texto contiene "Jugador 1".
- Botón nueva partida presente y funcional.

---

### TASK-035 · GameScreen

**Objetivo:** Composición del juego completo con layout CSS Grid.

**Archivos a crear:**
```
frontend/src/components/GameScreen.tsx
frontend/src/components/GameScreen.css
```

**`GameScreen.tsx`:**
- Props: `gameId: string`, `initialState: GameState`, `onFinish: (state: GameState) => void`.
- Estado local: `gameState: GameState`, `errors: { player1: string|null, player2: string|null }`.
- `usePolling(gameId, handleState)`.
- `useKeyboard(gameId, handleResult)`.
- `handleState`: actualiza `gameState`; si `state.status === 'finished'` → `onFinish(state)`.
- `handleResult`: si `!res.success` → set error para el jugador correspondiente + `setTimeout(2000, clearError)`.
  - El `playerId` del jugador que realizó la acción llega directamente como segundo argumento del callback, gracias a la firma definida en TASK-029: `onResult: (res: ActionResponse, playerId: PlayerId) => void`.
- Layout de `GameScreen.css`:
```css
.game-screen {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr;
  height: 100vh;
  gap: 4px;
  padding: 4px;
  box-sizing: border-box;
}
.game-screen__top {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
}
.game-screen__left  { /* HUD P1 */ }
.game-screen__arena { /* arena, flex grow */ }
.game-screen__right { /* HUD P2 */ }
```

**Criterios de aceptación:**
- Arena ocupa el espacio central.
- HUDs visibles a ambos lados.
- Tiempo decrece visiblemente.
- Mensaje de error aparece en HUD correcto tras acción inválida.
- Error desaparece después de ~2 segundos.
- Al terminar la partida, `onFinish` se llama en el siguiente poll.

---

## FASE 12 — Integración completa

---

### TASK-036 · Integración end-to-end y verificación de timer cleanup

**Objetivo:** Verificar que el juego completo funciona de extremo a extremo y que los timers se limpian al reiniciar.

**Archivos a modificar:** ninguno (verificación de comportamiento).

**Pasos de verificación manual:**

1. `npm run build`
2. `NODE_ENV=development node backend/dist/index.js &`
3. Abrir `http://localhost:3000` en el navegador.
4. Verificar:
   - La pantalla de inicio muestra "Reactor Rush" y el botón "Iniciar partida".
   - Al hacer clic, aparece la arena con ambos jugadores.
   - W/A/S/D mueve a P1, flechas mueven a P2 (visible en el siguiente poll ≤500ms).
   - F coloca bomba visible en la arena con timer visual.
   - Después de 3s, la bomba explota (desaparece).
   - G sobre un núcleo captura y el score de P1 aumenta.
   - E dos veces → el segundo intento muestra error en el HUD.
   - El tiempo decrece cada segundo.
   - Al terminar (esperar 120s o llegar a 25 pts), aparece la pantalla de resultado.
   - "Nueva partida" reinicia correctamente.

5. **Verificación de timer cleanup:**
```bash
GAME1=$(curl -s -X POST http://localhost:3000/api/game | jq -r .gameId)
sleep 5
T1=$(curl -s http://localhost:3000/api/game/$GAME1 | jq .timeRemaining)
echo "Game1 timeRemaining: $T1"   # ~115

GAME2=$(curl -s -X POST http://localhost:3000/api/game | jq -r .gameId)
sleep 5
HTTP=$(curl -o /dev/null -w "%{http_code}" http://localhost:3000/api/game/$GAME1)
echo "Game1 after replace: $HTTP" # debe ser 404
T2=$(curl -s http://localhost:3000/api/game/$GAME2 | jq .timeRemaining)
echo "Game2 timeRemaining: $T2"   # ~115, independiente
```

**Criterios de aceptación:**
- El juego es completamente jugable.
- `Game1` retorna 404 después de crear `Game2`.
- No hay logs de error en el servidor relacionados con timers.

---

## FASE 13 — Testing E2E

---

### TASK-037 · Configuración de Playwright

**Objetivo:** Playwright instalado y configurado para modos local/CI y producción.

**Archivos a crear:**
```
tests/playwright.config.ts
tests/e2e/helpers/bfs.ts
```

**Modificar `package.json` raíz** — agregar el campo `devDependencies`. El archivo queda así:

```json
{
  "name": "reactor-rush",
  "private": true,
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "build": "npm run build --workspace=backend && npm run build --workspace=frontend",
    "start": "node backend/dist/index.js",
    "lint": "npm run lint --workspace=backend && npm run lint --workspace=frontend",
    "test:e2e": "playwright test --config=tests/playwright.config.ts",
    "test:e2e:headed": "playwright test --config=tests/playwright.config.ts --headed"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "wait-on": "^7.2.0"
  }
}
```

**`tests/playwright.config.ts`:**
```typescript
import { defineConfig } from '@playwright/test';

const isProd = process.env.TEST_ENV === 'production';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL: isProd
      ? (process.env.PRODUCTION_URL ?? 'http://localhost:3000')
      : 'http://localhost:3000',
    headless: true,
  },
  reporter: [['html', { open: 'never' }], ['list']],
  timeout: 30_000,
});
```

> **Nota:** `playwright.config.ts` vive en `tests/`, y Playwright resuelve `testDir`
> relativo al directorio del config, por lo que el valor correcto es `'./e2e'`.
> `workers: 1` es obligatorio porque el juego soporta una sola partida activa
> (`docs/decisiones.md` §16) y los tests no pueden correr en paralelo sin pisarse.

**`tests/e2e/helpers/bfs.ts`:** Implementar `findPath(grid, from, to): Direction[] | null`.
- BFS estándar sobre el grid. Celdas transitables: solo `'empty'`.
- Retorna secuencia de `Direction[]` o `null` si no existe camino.
- Este helper es EXCLUSIVO de los tests. NO se importa en código de producción.

**Instalar browsers:**
```bash
npx playwright install chromium
```

**Criterios de aceptación:**
- `npm run test:e2e` lanza Playwright sin error de configuración.
- `cd tests && npx tsc --noEmit` pasa (si hay tsconfig en tests/).

---

### TASK-038 · T-01: inicio de partida

**Archivo:** `tests/e2e/start.spec.ts`

**Implementar exactamente:**
```typescript
import { test, expect } from '@playwright/test';

test('T-01: inicio de partida', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Reactor Rush')).toBeVisible();
  await expect(page.getByTestId('start-button')).toBeVisible();

  await page.getByTestId('start-button').click();

  await expect(page.getByTestId('arena')).toBeVisible({ timeout: 3000 });
  await expect(page.getByTestId('player-player1')).toBeVisible();
  await expect(page.getByTestId('player-player2')).toBeVisible();
});
```

**Criterios de aceptación:**
- Test pasa en headless local con `NODE_ENV=test`.
- Test pasa contra producción.

**Validación:**
```bash
npm run build && NODE_ENV=test node backend/dist/index.js &
sleep 2 && npm run test:e2e -- tests/e2e/start.spec.ts
kill %1
```

---

### TASK-039 · T-02: movimiento de jugador

**Archivo:** `tests/e2e/movement.spec.ts`

**Implementar:**
```typescript
import { test, expect } from '@playwright/test';

test('T-02: movimiento válido actualiza posición', async ({ request }) => {
  const createRes = await request.post('/api/game', { data: {} });
  const { gameId, state } = await createRes.json();
  const initialX = state.players.player1.x; // 1

  const moveRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'move', payload: { direction: 'right' } }
  });
  expect(moveRes.ok()).toBe(true);
  const { success, state: newState } = await moveRes.json();

  expect(success).toBe(true);
  expect(newState.players.player1.x).toBe(initialX + 1);
  expect(newState.players.player1.y).toBe(1);
});
```

---

### TASK-040 · T-03: polling y estructura del estado

**Archivo:** `tests/e2e/polling.spec.ts`

**Implementar:**
```typescript
import { test, expect } from '@playwright/test';

test('T-03: estructura del GameState', async ({ request }) => {
  const res  = await request.post('/api/game', { data: {} });
  const { state } = await res.json();

  for (const key of ['gameId','status','timeRemaining','result','players','bombs','cores','resources','grid','arenaEventActive','arenaEventCountdown']) {
    expect(state).toHaveProperty(key);
  }
  expect(state.status).toBe('playing');
  expect(state.players.player1.x).toBe(1);
  expect(state.players.player1.y).toBe(1);
  expect(state.players.player2.x).toBe(13);
  expect(state.players.player2.y).toBe(9);
  expect(state.grid).toHaveLength(11);
  expect(state.grid[0]).toHaveLength(15);
});

test('T-03: tiempo decrece con polling UI', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  const t1 = Number(await page.getByTestId('time-remaining').textContent());
  expect(t1).toBeGreaterThan(0);

  await page.waitForTimeout(1600);

  const t2 = Number(await page.getByTestId('time-remaining').textContent());
  expect(t2).toBeLessThan(t1);
});
```

**IMPORTANTE:** `Number(textContent)` solo funciona si `time-remaining` contiene un número puro (ej. `"87"`). NO usar si el formato es `"01:27"`.

---

### TASK-041 · T-04: captura de núcleo (ambos modos)

**Archivo:** `tests/e2e/capture.spec.ts`

**Implementar ambas ramas en el mismo archivo según la especificación completa de `docs/testing.md` T-04.**

Rama local/CI:
- `POST /api/game` con `scenario: { destructibles:[], cores:[{x:3,y:1}], resources:[] }`.
- Mover P1 dos veces a la derecha.
- `capture_core`.
- Verificar `score === 5`, `energy === 7`, `cores.length === 0`.

Rama producción:
- `POST /api/game` sin scenario.
- BFS desde `(1,1)` hasta el núcleo más cercano.
- Navegar y capturar.
- Verificar `score >= 5`.

**Importar `findPath` de `./helpers/bfs`.**

---

### TASK-042 · T-05: acción inválida

**Archivo:** `tests/e2e/invalid-action.spec.ts`

**Implementar según `docs/testing.md` T-05:**
- API: `special_action` dos veces (segunda falla con 400 `ENERGY_INSUFFICIENT`).
- UI: presionar `E` dos veces y verificar `error-player1` visible.

---

### TASK-043 · T-06: finalización (ambos modos)

**Archivo:** `tests/e2e/finish.spec.ts`

**Implementar ambas ramas según `docs/testing.md` T-06:**

Local/CI:
- `POST /api/game`.
- `POST .../test/force-end`.
- Verificar `state.status === 'finished'` y resultado válido.
- **Segunda prueba UI local (pantalla de resultado):** usar `page.waitForResponse()` para capturar la respuesta del `POST /api/game` que hace el frontend al pulsar el botón de inicio, y así obtener el `gameId` real que el frontend está usando. Ver implementación completa en `docs/testing.md` T-06.
- Verificar `data-testid="result-screen"` visible en ≤2s.

Producción:
- Sin `force-end`.
- Acumular 25 puntos mediante capturas reales.
- Timeout: 120 000 ms.

---

## FASE 14 — GitHub Actions

---

### TASK-044 · Workflow `lint.yml`

**Archivo:** `.github/workflows/lint.yml`

**Implementar:**
```yaml
name: Lint

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Lint backend
        run: npm run lint --workspace=backend
      - name: Lint frontend
        run: npm run lint --workspace=frontend
```

**Criterios de aceptación:**
- Aparece en GitHub Actions en cada push.
- Falla si ESLint reporta errores.
- Pasa con código limpio.

---

### TASK-045 · Workflow `e2e.yml`

**Archivo:** `.github/workflows/e2e.yml`

**Implementar:**
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      - name: Start server
        run: NODE_ENV=test node backend/dist/index.js &
      - name: Wait for server
        run: npx wait-on http://localhost:3000/health --timeout 15000
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NODE_ENV: test
      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

**Criterios de aceptación:**
- Los 6 tests pasan en CI.
- El reporte HTML se sube como artifact.
- El workflow falla si algún test falla.

---

### TASK-046 · Workflow `deploy.yml`

**Archivo:** `.github/workflows/deploy.yml`
**Archivo:** `railway.toml`

**`railway.toml`:**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
```

**`.github/workflows/deploy.yml`:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      - name: Deploy to Railway
        run: railway up --service reactor-rush --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

**Secret requerido en GitHub:** `RAILWAY_TOKEN` (obtener en Railway → Account Settings → Tokens).

**Variable en Railway dashboard:** `NODE_ENV=production`.

**Criterios de aceptación:**
- Push a `main` dispara el workflow.
- `<PRODUCTION_URL>/health` responde `{"status":"ok"}` tras el deploy.
- `<PRODUCTION_URL>` sirve el frontend React.

---

## FASE 15 — Deployment

---

### TASK-047 · Configurar Railway y verificar deployment

**Objetivo:** Primera deploymiento funcional con URL pública verificable.

**Pasos:**
1. Crear proyecto en Railway (dashboard o `railway init`).
2. Vincular repositorio GitHub.
3. Configurar variables de entorno en Railway dashboard: `NODE_ENV=production`.
4. Primer deploy manual: `railway up`.
5. Obtener URL pública.
6. Actualizar `<PRODUCTION_URL>` en `README.md` y `docs/deployment.md`.

**Verificación:**
```bash
curl <PRODUCTION_URL>/health
# → {"status":"ok"}

curl -s -X POST <PRODUCTION_URL>/api/game \
  -H "Content-Type: application/json" \
  -d '{}' | jq .gameId
# → UUID válido

# Verificar que force-end NO existe en producción
curl -s -X POST <PRODUCTION_URL>/api/game/test/test/force-end | jq .state.status 2>/dev/null
# NO debe retornar "finished"
```

**Criterios de aceptación:**
- URL pública funciona.
- Frontend React se sirve en `/`.
- API funciona en `/api/`.
- `force-end` no es accesible en producción.

---

### TASK-048 · Tests E2E contra producción

**Objetivo:** Ejecutar T-01 a T-06 contra la URL pública. Verificar que T-04 y T-06 funcionan sin mecanismos de test.

```bash
TEST_ENV=production \
PRODUCTION_URL=<PRODUCTION_URL> \
npm run test:e2e

# T-06 con timeout extendido
TEST_ENV=production \
PRODUCTION_URL=<PRODUCTION_URL> \
npm run test:e2e -- --timeout 120000 tests/e2e/finish.spec.ts
```

**Criterios de aceptación:**
- T-01, T-02, T-03, T-05 pasan sin configuración especial.
- T-04 calcula ruta BFS y captura núcleo real.
- T-06 acumula 25 puntos con acciones reales.

---

## FASE 16 — Documentación

---

### TASK-049 · Completar tabla de uso de IA en `docs/investigacion.md`

**Objetivo:** Registrar todas las interacciones con IA que ocurrieron durante la implementación.

**Archivos a modificar:**
```
docs/investigacion.md
```

**Para cada interacción real con una herramienta de IA durante la implementación:**
- Añadir una fila a la tabla de la Sección 4 de `investigacion.md`.
- Completar todas las columnas: Prompt, Respuesta relevante, Qué se incorporó, Verificación, Modificaciones.
- Las filas marcadas `[EJEMPLO]` son plantillas; reemplazarlas con interacciones reales.

**Criterios de aceptación:**
- La tabla tiene al menos una fila completada con interacción real.
- Ninguna fila está marcada como `[EJEMPLO]` en el documento final.

---

### TASK-050 · Auditoría final de implementación y actualizar `docs/rubrica.md`

**Objetivo:** Verificar que el código implementado es coherente con la documentación aprobada, y actualizar `docs/rubrica.md` con los estados reales del proyecto.

**Archivos a modificar:**
```
docs/rubrica.md
```

**Paso 1 — Auditoría cruzada del código real contra documentación**

Antes de actualizar `rubrica.md`, verificar explícitamente que:

1. **`backend/src/game/constants.ts`** — todos los valores coinciden con la tabla de constantes de TASKS.md (sección "REFERENCIA RÁPIDA DE CONSTANTES"). Ningún número mágico disperso en otros módulos.
2. **`backend/src/game/state.ts`** — todos los tipos coinciden exactamente con `docs/modelo-datos.md`. Sin campos extra ni faltantes.
3. **`frontend/src/types.ts`** — es un mirror fiel de `state.ts`. Sin importaciones de `../../backend`.
4. **`backend/src/routes/game.ts`** — los tres endpoints principales coinciden con `docs/api.md`: códigos HTTP, campos de respuesta, errores.
5. **`backend/src/routes/test.ts`** — `force-end` solo accesible en `NODE_ENV=test`. Verificar que en producción la URL devuelve HTML o 404, no JSON de juego.
6. **`frontend/src/hooks/useKeyboard.ts`** — `KEY_MAP` coincide exactamente con las tablas de controles de `docs/requisitos.md` RF-04.1 y RF-04.2. `event.repeat` filtrado. Sin `setTimeout` ni debounce.
7. **`frontend/src/hooks/usePolling.ts`** — intervalo de 500 ms. Se detiene cuando `status === 'finished'`. Cleanup del `useEffect`.
8. **`frontend/src/components/TimeDisplay.tsx`** — `data-testid="time-remaining"` contiene número entero de segundos (no `MM:SS`). `Number(textContent)` devuelve un número válido.
9. **`tests/e2e/`** — los 6 archivos de test existen y coinciden con las especificaciones de `docs/testing.md`. Los `data-testid` usados en los tests existen en los componentes.
10. **`.github/workflows/`** — `lint.yml`, `e2e.yml`, `deploy.yml` existen y coinciden con `docs/deployment.md`.
11. **`railway.toml`** — `buildCommand = "npm run build"`, `startCommand = "npm start"`, `healthcheckPath = "/health"`.
12. **`npm run build`** — compila sin errores TypeScript en backend y frontend.
13. **`npm run lint`** — pasa sin errores en backend y frontend.
14. **`npm run test:e2e`** (con servidor en `NODE_ENV=test`) — los 6 tests pasan.

**Paso 2 — Actualizar `docs/rubrica.md`**

Para cada ítem marcado como DOCUMENTADO:
- Cambiar a **IMPLEMENTADO** cuando el código existe y compila.
- Cambiar a **VERIFICADO** cuando los tests, el lint o el build lo confirman explícitamente.

**Paso 3 — Actualizar `docs/investigacion.md`**

Completar la tabla de uso de IA de la Sección 4: reemplazar todas las filas marcadas `[EJEMPLO]` con interacciones reales ocurridas durante la implementación.

**Criterios de aceptación:**
- Todos los ítems de `rubrica.md` tienen estado IMPLEMENTADO o VERIFICADO al terminar.
- No quedan ítems en PENDIENTE salvo `<PRODUCTION_URL>` (requiere primer deploy) y los ítems de deployment que dependen de la URL pública.
- La tabla de auditoría del Paso 1 se ha verificado punto a punto — si algún ítem no coincide con la documentación, se corrige el código (no la documentación) antes de marcar como VERIFICADO.
- `docs/investigacion.md` no tiene filas marcadas como `[EJEMPLO]`.

---

