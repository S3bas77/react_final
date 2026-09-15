# API REST — Reactor Rush v1.0

> Especificación completa y definitiva de todos los endpoints.
> El frontend usa exclusivamente `fetch` nativo. No se usa Axios.

---

## Base URL

**Desarrollo:** `http://localhost:3000/api`

**Producción:** `https://reactor-rush-production.up.railway.app/api`

En desarrollo, Vite hace proxy de `/api` → `http://localhost:3000`. En producción, Express sirve directamente.

---

## Códigos HTTP utilizados

| Código | Significado en este proyecto |
|---|---|
| `200 OK` | Operación exitosa |
| `400 Bad Request` | Acción inválida (error de lógica de juego) |
| `404 Not Found` | Partida no encontrada |
| `409 Conflict` | Acción enviada con partida en estado `finished` |
| `500 Internal Server Error` | Error inesperado del servidor |

---

## Endpoint 1 — Crear partida

### `POST /api/game`

Crea una nueva partida. Si ya existe una partida activa, la cancela (limpia todos sus timers) y crea una nueva.

#### Request

**Headers:** `Content-Type: application/json`

**Body (producción):** vacío `{}` o sin body. Cualquier campo `scenario` es ignorado.

**Body (solo `NODE_ENV=test`):**
```json
{
  "scenario": {
    "destructibles": [{ "x": 5, "y": 3 }, { "x": 7, "y": 5 }],
    "cores": [{ "x": 3, "y": 1 }],
    "resources": [{ "x": 5, "y": 1, "type": "energy_pack" }]
  }
}
```

El campo `scenario` es opcional incluso en modo test. Si se omite, se genera aleatoriamente.

#### Response `200 OK`

```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "state": {
    "gameId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "playing",
    "timeRemaining": 120,
    "result": null,
    "players": {
      "player1": {
        "id": "player1",
        "x": 1, "y": 1,
        "hp": 3, "energy": 5,
        "resources": 0, "score": 0,
        "bombAvailable": true,
        "shieldActive": false,
        "alive": true
      },
      "player2": {
        "id": "player2",
        "x": 13, "y": 9,
        "hp": 3, "energy": 5,
        "resources": 0, "score": 0,
        "bombAvailable": true,
        "shieldActive": false,
        "alive": true
      }
    },
    "bombs": [],
    "cores": [
      { "id": "core-1", "x": 7, "y": 3 },
      { "id": "core-2", "x": 3, "y": 7 },
      { "id": "core-3", "x": 11, "y": 5 }
    ],
    "resources": [
      { "id": "res-1", "x": 5, "y": 2, "type": "energy_pack" },
      { "id": "res-2", "x": 9, "y": 4, "type": "repair_kit" },
      { "id": "res-3", "x": 3, "y": 6, "type": "energy_pack" },
      { "id": "res-4", "x": 11, "y": 8, "type": "repair_kit" }
    ],
    "grid": [
      ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"],
      ["wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","wall"],
      ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
      ["wall","empty","empty","destructible","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","wall"],
      ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
      ["wall","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","wall"],
      ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
      ["wall","empty","destructible","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","empty","wall"],
      ["wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall","empty","wall"],
      ["wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","empty","empty","wall","empty","wall"],
      ["wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall","wall"]
    ],
    "arenaEventActive": false,
    "arenaEventCountdown": null
  }
}
```

> Nota: el grid mostrado es un ejemplo simplificado. El grid real tiene 11 filas × 15 columnas con el patrón de paredes completo.

#### curl

```bash
curl -s -X POST http://localhost:3000/api/game \
  -H "Content-Type: application/json" \
  -d '{}' | jq .gameId
```

---

## Endpoint 2 — Obtener estado

### `GET /api/game/:gameId`

Devuelve el estado completo y actual de la partida. Usado por el polling del frontend.

#### Request

Sin body. Sin headers especiales.

#### Response `200 OK`

```json
{
  "gameId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "playing",
  "timeRemaining": 87,
  "result": null,
  "players": {
    "player1": {
      "id": "player1",
      "x": 3, "y": 1,
      "hp": 2, "energy": 7,
      "resources": 1, "score": 5,
      "bombAvailable": true,
      "shieldActive": false,
      "alive": true
    },
    "player2": {
      "id": "player2",
      "x": 11, "y": 9,
      "hp": 3, "energy": 3,
      "resources": 0, "score": 0,
      "bombAvailable": false,
      "shieldActive": false,
      "alive": true
    }
  },
  "bombs": [
    {
      "id": "bomb-abc123",
      "playerId": "player2",
      "x": 11, "y": 9,
      "timerRemaining": 2
    }
  ],
  "cores": [
    { "id": "core-2", "x": 3, "y": 7 },
    { "id": "core-3", "x": 11, "y": 5 }
  ],
  "resources": [
    { "id": "res-2", "x": 9, "y": 4, "type": "repair_kit" }
  ],
  "grid": ["..."],
  "arenaEventActive": true,
  "arenaEventCountdown": 3
}
```

#### Response `404 Not Found`

```json
{
  "error": "Game not found"
}
```

#### curl

```bash
GAME_ID="550e8400-e29b-41d4-a716-446655440000"
curl -s http://localhost:3000/api/game/$GAME_ID | jq '{status, timeRemaining}'
```

---

## Endpoint 3 — Enviar acción

### `POST /api/game/:gameId/action`

Envía una acción de un jugador. El backend la valida, la procesa y devuelve el nuevo estado.

#### Request

**Headers:** `Content-Type: application/json`

**Body — acción `move`:**
```json
{
  "playerId": "player1",
  "type": "move",
  "payload": { "direction": "right" }
}
```

Valores válidos de `direction`: `"up"`, `"down"`, `"left"`, `"right"`.

**Body — acción `place_bomb`:**
```json
{
  "playerId": "player2",
  "type": "place_bomb"
}
```

**Body — acción `capture_core`:**
```json
{
  "playerId": "player1",
  "type": "capture_core"
}
```

**Body — acción `special_action`:**
```json
{
  "playerId": "player2",
  "type": "special_action"
}
```

#### Response `200 OK` — Acción exitosa

```json
{
  "success": true,
  "state": { "...GameState completo..." }
}
```

#### Response `400 Bad Request` — Acción inválida

```json
{
  "success": false,
  "error": "MOVE_BLOCKED",
  "message": "No puedes moverte a esa celda."
}
```

#### Response `400` — Energy insuficiente

```json
{
  "success": false,
  "error": "ENERGY_INSUFFICIENT",
  "message": "No tienes suficiente energía para usar la acción especial."
}
```

#### Response `400` — Bomba ya activa

```json
{
  "success": false,
  "error": "BOMB_ALREADY_ACTIVE",
  "message": "Ya tienes una bomba activa."
}
```

#### Response `400` — Sin núcleo

```json
{
  "success": false,
  "error": "CORE_NOT_PRESENT",
  "message": "No hay ningún núcleo en tu posición."
}
```

#### Response `400` — Jugador eliminado

```json
{
  "success": false,
  "error": "PLAYER_ELIMINATED",
  "message": "El jugador ha sido eliminado y no puede actuar."
}
```

#### Response `409 Conflict` — Partida terminada

```json
{
  "success": false,
  "error": "GAME_NOT_PLAYING",
  "message": "La partida ya ha terminado."
}
```

#### Response `404 Not Found`

```json
{
  "error": "Game not found"
}
```

#### Todos los códigos de error

| Código | HTTP | Condición |
|---|---|---|
| `MOVE_BLOCKED` | 400 | Destino es `wall` o `destructible` |
| `MOVE_OCCUPIED` | 400 | Destino está ocupado por el otro jugador |
| `MOVE_OUT_OF_BOUNDS` | 400 | Destino fuera del grid |
| `BOMB_ALREADY_ACTIVE` | 400 | `bombAvailable === false` |
| `CORE_NOT_PRESENT` | 400 | No hay núcleo en la celda del jugador |
| `ENERGY_INSUFFICIENT` | 400 | `energy < 3` al usar `special_action` |
| `PLAYER_ELIMINATED` | 400 | `alive === false` |
| `GAME_NOT_PLAYING` | 409 | `status !== 'playing'` |
| `GAME_NOT_FOUND` | 404 | `gameId` no existe en el store |

#### curl — movimiento válido

```bash
GAME_ID="550e8400-e29b-41d4-a716-446655440000"
curl -s -X POST http://localhost:3000/api/game/$GAME_ID/action \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player1","type":"move","payload":{"direction":"right"}}' | jq .success
```

#### curl — acción inválida

```bash
curl -s -X POST http://localhost:3000/api/game/$GAME_ID/action \
  -H "Content-Type: application/json" \
  -d '{"playerId":"player1","type":"move","payload":{"direction":"left"}}' | jq .
# Desde (1,1) mover izquierda → pared → MOVE_BLOCKED
```

---

## Endpoint 4 — Force End (solo test)

### `POST /api/game/:gameId/test/force-end`

**SOLO disponible cuando `NODE_ENV === 'test'`.**

En cualquier otro entorno este endpoint no existe. No se registra la ruta. No es accesible.

Fuerza la finalización de la partida estableciendo `timeRemaining = 0` y ejecutando `checkVictory()`. Usado exclusivamente por los tests E2E para evitar esperar 120 segundos.

#### Request

Sin body.

#### Response `200 OK` (solo en `NODE_ENV=test`)

```json
{
  "success": true,
  "state": {
    "gameId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "finished",
    "timeRemaining": 0,
    "result": "draw",
    "players": { "..." },
    "...resto del estado..."
  }
}
```

#### Comportamiento en producción

El endpoint no existe. La URL recibirá la respuesta del SPA fallback de Express (HTML del frontend), no una respuesta JSON. No hay forma de llamarlo en producción porque no está registrado.

#### curl (solo en modo test)

```bash
NODE_ENV=test node backend/dist/index.js &
GAME_ID=$(curl -s -X POST http://localhost:3000/api/game | jq -r .gameId)
curl -s -X POST http://localhost:3000/api/game/$GAME_ID/test/force-end | jq .state.status
# → "finished"
```

---

## TestScenario — Solo en `NODE_ENV=test`

Cuando `NODE_ENV === 'test'`, el endpoint `POST /api/game` acepta un campo `scenario` en el body que permite crear una partida con estado inicial determinista.

### Estructura

```typescript
interface TestScenario {
  destructibles: Array<{ x: number; y: number }>;
  cores:         Array<{ x: number; y: number }>;
  resources:     Array<{ x: number; y: number; type: 'energy_pack' | 'repair_kit' }>;
}
```

### Comportamiento

- Si `scenario` está presente y `NODE_ENV=test`: se usan esas posiciones en lugar de las aleatorias.
- Si `scenario` tiene arrays vacíos: se usan sin obstáculos, sin núcleos o sin recursos respectivamente.
- La verificación BFS sigue ejecutándose para garantizar que la arena es válida.
- El game loop se inicia normalmente.
- En `NODE_ENV=production`: el campo `scenario` es completamente ignorado.

### Ejemplo para T-04

```json
{
  "scenario": {
    "destructibles": [],
    "cores": [{ "x": 3, "y": 1 }],
    "resources": []
  }
}
```

Crea una partida sin destructibles, con un núcleo en `(3,1)` y sin recursos menores. P1 está en `(1,1)`. Dos movimientos `right` llevan a P1 hasta el núcleo.

---

## Flujo completo de polling

El frontend hace:

```
GET /api/game/:gameId  cada 500ms
```

Y actualiza el estado del componente `GameScreen`. La transición `playing → finished` se detecta en el polling y dispara el cambio de pantalla a `ResultScreen`.

El polling se detiene cuando `state.status === 'finished'` para no hacer requests innecesarios.

---

## Resumen de endpoints

| Método | Endpoint | Disponible | Descripción |
|---|---|---|---|
| `POST` | `/api/game` | Siempre | Crear/reiniciar partida |
| `GET` | `/api/game/:gameId` | Siempre | Polling del estado |
| `POST` | `/api/game/:gameId/action` | Siempre | Enviar acción |
| `POST` | `/api/game/:gameId/test/force-end` | Solo `NODE_ENV=test` | Forzar fin de partida |
