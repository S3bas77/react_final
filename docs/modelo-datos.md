# Modelo de datos — Reactor Rush v1.0

> Definición completa de todos los tipos TypeScript usados en el proyecto.
> El backend en `backend/src/game/state.ts` es la fuente de verdad.
> El frontend en `frontend/src/types.ts` replica manualmente estos tipos (sin importar del backend).

---

## Tipos primitivos / enums

```typescript
// Tipo de celda en el grid
type CellType = 'empty' | 'wall' | 'destructible';

// Estado de la partida
type GameStatus = 'playing' | 'finished';

// Resultado final de la partida
type GameResult = 'player1_wins' | 'player2_wins' | 'draw' | null;

// Identificador de jugador
type PlayerId = 'player1' | 'player2';

// Tipo de acción que puede enviar un jugador
type ActionType = 'move' | 'place_bomb' | 'capture_core' | 'special_action';

// Dirección de movimiento
type Direction = 'up' | 'down' | 'left' | 'right';

// Tipo de recurso menor
type ResourceType = 'energy_pack' | 'repair_kit';
```

---

## PlayerState

Representa el estado completo de un jugador.

```typescript
interface PlayerState {
  id:            PlayerId;   // 'player1' o 'player2'
  x:             number;     // columna actual (0-14)
  y:             number;     // fila actual (0-10)
  hp:            number;     // puntos de vida (0-3)
  energy:        number;     // puntos de energía (0-10)
  resources:     number;     // contador de recursos recogidos (0+)
  score:         number;     // puntuación competitiva (0+)
  bombAvailable: boolean;    // true si puede colocar bomba
  shieldActive:  boolean;    // true si el escudo está activo
  alive:         boolean;    // false cuando hp llega a 0
}
```

**Valores iniciales:**
```json
{
  "id": "player1",
  "x": 1, "y": 1,
  "hp": 3, "energy": 5,
  "resources": 0, "score": 0,
  "bombAvailable": true,
  "shieldActive": false,
  "alive": true
}
```

**Invariantes:**
- `hp` siempre en rango [0, 3].
- `energy` siempre en rango [0, 10].
- `alive === false` implica `hp === 0`.
- `alive === false` → ninguna acción del jugador es válida.

---

## BombState

Representa una bomba activa en el mapa.

```typescript
interface BombState {
  id:             string;   // UUID único
  playerId:       PlayerId; // quién colocó la bomba
  x:              number;   // columna donde está la bomba
  y:              number;   // fila donde está la bomba
  timerRemaining: number;   // segundos restantes (visual, decrementado por el tick del engine)
}
```

**Ejemplo:**
```json
{
  "id": "bomb-550e8400",
  "playerId": "player1",
  "x": 5,
  "y": 3,
  "timerRemaining": 2
}
```

**Notas:**
- `timerRemaining` es solo para visualización. La explosión real la dispara un `setTimeout` en el backend.
- Una bomba solo existe en el estado mientras no ha explotado.
- Máximo 1 bomba por jugador a la vez.

---

## CoreState

Representa un núcleo de energía activo en el mapa.

```typescript
interface CoreState {
  id: string;  // UUID único (persiste entre capturas para rastrear respawn)
  x:  number;  // columna
  y:  number;  // fila
}
```

**Ejemplo:**
```json
{
  "id": "core-a1b2c3",
  "x": 7,
  "y": 5
}
```

**Notas:**
- El mismo `id` se reutiliza cuando el núcleo reaparece (permite al store evitar doble respawn).
- Un núcleo ausente del array `state.cores` está en período de respawn.

---

## ResourceState

Representa un recurso menor activo en el mapa.

```typescript
interface ResourceState {
  id:   string;       // UUID único
  x:    number;       // columna
  y:    number;       // fila
  type: ResourceType; // 'energy_pack' o 'repair_kit'
}
```

**Ejemplo:**
```json
{
  "id": "res-d4e5f6",
  "x": 9,
  "y": 4,
  "type": "energy_pack"
}
```

---

## GameState

Estado completo de la partida. Es lo que devuelven todos los endpoints.

```typescript
interface GameState {
  gameId:              string;
  status:              GameStatus;         // 'playing' | 'finished'
  timeRemaining:       number;             // segundos restantes (0-120)
  result:              GameResult;         // null mientras playing
  players: {
    player1:           PlayerState;
    player2:           PlayerState;
  };
  bombs:               BombState[];        // bombas activas (0-2 máximo)
  cores:               CoreState[];        // núcleos activos (0-3)
  resources:           ResourceState[];    // recursos menores en el mapa
  grid:                CellType[][];       // grid[y][x], 11 filas × 15 columnas
  arenaEventActive:    boolean;            // true durante la advertencia y el pulso
  arenaEventCountdown: number | null;      // null si no hay evento, 5..0 durante advertencia
}
```

**Estado inicial completo (ejemplo):**
```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "playing",
  "timeRemaining": 120,
  "result": null,
  "players": {
    "player1": {
      "id": "player1", "x": 1, "y": 1,
      "hp": 3, "energy": 5, "resources": 0, "score": 0,
      "bombAvailable": true, "shieldActive": false, "alive": true
    },
    "player2": {
      "id": "player2", "x": 13, "y": 9,
      "hp": 3, "energy": 5, "resources": 0, "score": 0,
      "bombAvailable": true, "shieldActive": false, "alive": true
    }
  },
  "bombs": [],
  "cores": [
    { "id": "core-001", "x": 7, "y": 3 },
    { "id": "core-002", "x": 3, "y": 7 },
    { "id": "core-003", "x": 11, "y": 5 }
  ],
  "resources": [
    { "id": "res-001", "x": 5, "y": 2, "type": "energy_pack" },
    { "id": "res-002", "x": 9, "y": 4, "type": "repair_kit" },
    { "id": "res-003", "x": 3, "y": 6, "type": "energy_pack" },
    { "id": "res-004", "x": 11, "y": 8, "type": "repair_kit" }
  ],
  "grid": [
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"],
    ["wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","wall"],
    ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
    ["wall","destructible","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","wall"],
    ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
    ["wall","empty","empty","destructible","empty","empty","empty","empty","empty","empty","empty","destructible","empty","empty","wall"],
    ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
    ["wall","empty","empty","empty","empty","destructible","empty","empty","empty","empty","empty","empty","empty","empty","wall"],
    ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
    ["wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","wall"],
    ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
  ],
  "arenaEventActive": false,
  "arenaEventCountdown": null
}
```

**Estado tras finalización:**
```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "finished",
  "timeRemaining": 0,
  "result": "player1_wins",
  "players": {
    "player1": { "score": 27, "alive": true, "..." },
    "player2": { "score": 15, "alive": true, "..." }
  },
  "..."
}
```

---

## ActionRequest

Cuerpo del request para `POST /api/game/:gameId/action`.

```typescript
interface ActionRequest {
  playerId: PlayerId;            // 'player1' o 'player2'
  type:     ActionType;          // 'move' | 'place_bomb' | 'capture_core' | 'special_action'
  payload?: {
    direction?: Direction;       // solo requerido para type === 'move'
  };
}
```

**Ejemplos:**
```json
{ "playerId": "player1", "type": "move", "payload": { "direction": "up" } }
{ "playerId": "player2", "type": "place_bomb" }
{ "playerId": "player1", "type": "capture_core" }
{ "playerId": "player2", "type": "special_action" }
```

---

## ActionResponse

Respuesta del endpoint `POST /api/game/:gameId/action`.

```typescript
// Éxito
type ActionResponse =
  | { success: true;  state: GameState }
  | { success: false; error: string; message: string };
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "state": { "...GameState completo..." }
}
```

**Respuesta con error:**
```json
{
  "success": false,
  "error": "ENERGY_INSUFFICIENT",
  "message": "No tienes suficiente energía para usar la acción especial."
}
```

---

## CreateGameResponse

Respuesta del endpoint `POST /api/game`.

```typescript
interface CreateGameResponse {
  gameId: string;
  state:  GameState;
}
```

---

## GameActionError

Clase de error utilizada internamente en el backend para señalar errores de validación al router.

```typescript
class GameActionError extends Error {
  constructor(
    public readonly code:       string,  // ej. 'ENERGY_INSUFFICIENT'
    public readonly message:    string,  // mensaje legible en español
    public readonly httpStatus: number   // 400, 409, 404
  ) {
    super(message);
  }
}
```

El router captura esta clase y convierte a respuesta HTTP con el código y mensaje correspondiente.

---

## TestScenario

Solo relevante cuando `NODE_ENV === 'test'`. Permite crear partidas con estado inicial determinista.

```typescript
interface TestScenario {
  destructibles: Array<{ x: number; y: number }>;
  cores:         Array<{ x: number; y: number }>;
  resources:     Array<{ x: number; y: number; type: ResourceType }>;
}
```

---

## GameTimerEntry (interno del store)

Estructura interna del backend para gestionar los timers de una partida. No se expone en la API.

```typescript
interface GameTimerEntry {
  interval:        NodeJS.Timeout | null;  // loop de 1 segundo
  timeouts:        NodeJS.Timeout[];       // bombas, respawn, shield, pulso, advertencia
  respawningCores: Set<string>;            // coreIds actualmente en período de respawn
}
```

---

## Tabla resumen de campos del GameState y sus responsables

| Campo | Tipo | Quién lo modifica |
|---|---|---|
| `gameId` | `string` | `factory.ts` al crear |
| `status` | `GameStatus` | `engine.ts` (`checkVictory`) |
| `timeRemaining` | `number` | `engine.ts` (tick) |
| `result` | `GameResult` | `engine.ts` (`checkVictory`) |
| `players.*.x/y` | `number` | `actions.ts` (`processMove`) |
| `players.*.hp` | `number` | `engine.ts` (`applyDamage`) |
| `players.*.energy` | `number` | `actions.ts` (capture, special), `engine.ts` (special hit drain) |
| `players.*.resources` | `number` | `actions.ts` (pickup) |
| `players.*.score` | `number` | `actions.ts`, `engine.ts` |
| `players.*.bombAvailable` | `boolean` | `actions.ts` (place_bomb), `bombs.ts` (after explosion) |
| `players.*.shieldActive` | `boolean` | `actions.ts` (special_action), `engine.ts` (applyDamage), timeout de shield |
| `players.*.alive` | `boolean` | `engine.ts` (`applyDamage`) |
| `bombs` | `BombState[]` | `actions.ts` (add), `bombs.ts` (remove after explosion) |
| `cores` | `CoreState[]` | `factory.ts` (init), `actions.ts` (capture remove), `bombs.ts` (explosion remove), `cores.ts` (respawn add) |
| `resources` | `ResourceState[]` | `factory.ts` (init), `actions.ts` (pickup remove), `bombs.ts` (spawn on destruction), `arenaEvent.ts` (spawn on pulse) |
| `grid` | `CellType[][]` | `factory.ts` (init), `bombs.ts` (destructible → empty), `arenaEvent.ts` (pulse) |
| `arenaEventActive` | `boolean` | `arenaEvent.ts` |
| `arenaEventCountdown` | `number\|null` | `arenaEvent.ts` (set), `engine.ts` (decrement) |
