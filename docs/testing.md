# Testing E2E — Reactor Rush v1.0

> Especificación completa de los 6 tests E2E requeridos.
> Cada test tiene una rama local/CI y, cuando aplica, una rama de producción.

---

## Configuración general

### Instalación de Playwright

```bash
npx playwright install chromium
```

### Configuración (`tests/playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

const isProd = process.env.TEST_ENV === 'production';

export default defineConfig({
  testDir: './tests/e2e',
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

### Ejecución

```bash
# Local headless (CI)
NODE_ENV=test node backend/dist/index.js &
npm run test:e2e

# Local headed (visual)
NODE_ENV=test node backend/dist/index.js &
npm run test:e2e:headed

# Contra producción
TEST_ENV=production PRODUCTION_URL=<PRODUCTION_URL> npm run test:e2e
```

### data-testid requeridos en el frontend

Los tests dependen de estos atributos. Deben estar presentes en los componentes:

| Atributo | Componente | Descripción |
|---|---|---|
| `data-testid="start-button"` | `StartScreen` | Botón iniciar partida |
| `data-testid="arena"` | `Arena` | Contenedor de la cuadrícula |
| `data-testid="player-player1"` | `PlayerSprite` | Sprite del jugador 1 |
| `data-testid="player-player2"` | `PlayerSprite` | Sprite del jugador 2 |
| `data-testid="time-remaining"` | `TimeDisplay` | Tiempo restante (texto numérico en segundos) |
| `data-testid="reactor-warning"` | `TimeDisplay` | Advertencia del Reactor Pulse |
| `data-testid="error-player1"` | `PlayerHUD` | Mensaje de error del jugador 1 |
| `data-testid="error-player2"` | `PlayerHUD` | Mensaje de error del jugador 2 |
| `data-testid="result-screen"` | `ResultScreen` | Pantalla de resultado |

**IMPORTANTE sobre `time-remaining`:** el elemento con `data-testid="time-remaining"` debe contener el tiempo como un número entero de segundos (ej. `"87"`), no en formato `MM:SS`. El formato `MM:SS` puede mostrarse visualmente al lado, pero el valor numérico debe estar accesible para los tests. Si se usa un elemento separado para el número, ese es el que lleva el `data-testid`.

Alternativa aceptable: renderizar el tiempo como `"87"` en el elemento con `data-testid` y usar CSS para formatearlo visualmente si es necesario. Lo importante es que `Number(await page.getByTestId('time-remaining').textContent())` devuelva un número válido.

---

## Helper BFS para tests de producción

Archivo: `tests/e2e/helpers/bfs.ts`

```typescript
import type { CellType, Direction } from '../../frontend/src/types';

export function findPath(
  grid: CellType[][],
  from: { x: number; y: number },
  to:   { x: number; y: number }
): Direction[] | null {
  // BFS estándar sobre el grid
  // Devuelve la secuencia de Direction[] para llegar de from a to
  // Retorna null si no existe camino
  // Celdas transitables: 'empty' y 'destructible' NO (solo 'empty')
}
```

Este helper es exclusivo de los tests. No se importa en código de producción.

---

## T-01 — Inicio de partida

**Archivo:** `tests/e2e/start.spec.ts`

**Objetivo:** Verificar que la pantalla de inicio se renderiza y que al pulsar el botón aparece la arena con los jugadores.

**Aplica en:** local/CI y producción.

```typescript
test('T-01: inicio de partida', async ({ page }) => {
  await page.goto('/');

  // La pantalla de inicio debe mostrar el nombre del juego
  await expect(page.getByText('Reactor Rush')).toBeVisible();

  // El botón de inicio debe estar presente
  await expect(page.getByTestId('start-button')).toBeVisible();

  // Al hacer clic, debe aparecer la arena
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible({ timeout: 3000 });

  // Ambos jugadores deben estar en la arena
  await expect(page.getByTestId('player-player1')).toBeVisible();
  await expect(page.getByTestId('player-player2')).toBeVisible();
});
```

**Criterios de aceptación:**
- La pantalla de inicio muestra "Reactor Rush".
- El botón de inicio está visible.
- Tras el clic, la arena aparece en menos de 3 segundos.
- Ambos jugadores son visibles en la arena.

---

## T-02 — Movimiento de jugador

**Archivo:** `tests/e2e/movement.spec.ts`

**Objetivo:** Verificar que enviar una acción `move` actualiza la posición del jugador en el estado.

**Aplica en:** local/CI y producción.

```typescript
test('T-02: movimiento válido', async ({ request }) => {
  // Crear partida
  const createRes = await request.post('/api/game', {
    data: {}
  });
  expect(createRes.ok()).toBe(true);
  const { gameId, state } = await createRes.json();

  const initialX = state.players.player1.x; // 1
  const initialY = state.players.player1.y; // 1

  // Mover player1 a la derecha
  const moveRes = await request.post(`/api/game/${gameId}/action`, {
    data: {
      playerId: 'player1',
      type: 'move',
      payload: { direction: 'right' }
    }
  });
  expect(moveRes.ok()).toBe(true);
  const { success, state: newState } = await moveRes.json();

  expect(success).toBe(true);
  expect(newState.players.player1.x).toBe(initialX + 1);
  expect(newState.players.player1.y).toBe(initialY);
});
```

**Criterios de aceptación:**
- La respuesta tiene `success: true`.
- `player1.x` aumenta en 1.
- `player1.y` no cambia.

---

## T-03 — Polling y sincronización de estado

**Archivo:** `tests/e2e/polling.spec.ts`

**Objetivo:** Verificar que la API devuelve la estructura correcta de `GameState` y que el tiempo en la UI decrece.

**Aplica en:** local/CI y producción.

```typescript
test('T-03: estructura del estado', async ({ request }) => {
  const res = await request.post('/api/game', { data: {} });
  const { state } = await res.json();

  // Verificar campos requeridos de GameState
  expect(state).toHaveProperty('gameId');
  expect(state).toHaveProperty('status', 'playing');
  expect(state).toHaveProperty('timeRemaining');
  expect(state).toHaveProperty('result', null);
  expect(state).toHaveProperty('players.player1');
  expect(state).toHaveProperty('players.player2');
  expect(state).toHaveProperty('bombs');
  expect(state).toHaveProperty('cores');
  expect(state).toHaveProperty('resources');
  expect(state).toHaveProperty('grid');
  expect(state).toHaveProperty('arenaEventActive');
  expect(state).toHaveProperty('arenaEventCountdown');

  // Verificar valores iniciales de los jugadores
  expect(state.players.player1.x).toBe(1);
  expect(state.players.player1.y).toBe(1);
  expect(state.players.player1.hp).toBe(3);
  expect(state.players.player1.energy).toBe(5);
  expect(state.players.player1.score).toBe(0);
  expect(state.players.player1.alive).toBe(true);

  expect(state.players.player2.x).toBe(13);
  expect(state.players.player2.y).toBe(9);

  // Grid tiene dimensiones correctas
  expect(state.grid).toHaveLength(11);
  expect(state.grid[0]).toHaveLength(15);
});

test('T-03: tiempo decrece (polling UI)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  // Leer tiempo inicial
  const t1text = await page.getByTestId('time-remaining').textContent();
  expect(t1text).not.toBeNull();           // null-guard: el elemento debe existir y tener texto
  const t1 = Number(t1text!.trim());
  expect(Number.isNaN(t1)).toBe(false);    // guard: asegurar que es un número válido, no NaN
  expect(t1).toBeGreaterThan(0);

  // Esperar más de 1 segundo
  await page.waitForTimeout(1600);

  // El tiempo debe haber decrementado
  const t2text = await page.getByTestId('time-remaining').textContent();
  expect(t2text).not.toBeNull();
  const t2 = Number(t2text!.trim());
  expect(Number.isNaN(t2)).toBe(false);
  expect(t2).toBeLessThan(t1);
});
```

**Criterios de aceptación:**
- Todos los campos de `GameState` están presentes.
- Los valores iniciales de jugadores son correctos.
- El tiempo en la UI decrece después de 1.6 segundos.

**Nota importante:** `data-testid="time-remaining"` debe contener el tiempo como número entero de segundos (ej. `"87"`). `Number("87")` debe devolver 87. No usar `Number("01:15")` ya que devuelve `NaN`.

---

## T-04 — Captura de núcleo

**Archivo:** `tests/e2e/capture.spec.ts`

### Rama local/CI (`NODE_ENV=test`)

```typescript
test('T-04 (local): captura de núcleo determinista', async ({ request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  // Crear partida con escenario determinista:
  // - Sin destructibles
  // - Núcleo en (3,1)
  // - Sin recursos menores
  const res = await request.post('/api/game', {
    data: {
      scenario: {
        destructibles: [],
        cores: [{ x: 3, y: 1 }],
        resources: []
      }
    }
  });
  expect(res.ok()).toBe(true);
  const { gameId, state } = await res.json();

  // Verificar posición inicial de P1 y núcleo
  expect(state.players.player1.x).toBe(1);
  expect(state.players.player1.y).toBe(1);
  expect(state.cores).toHaveLength(1);
  expect(state.cores[0].x).toBe(3);
  expect(state.cores[0].y).toBe(1);

  // Mover P1 dos veces a la derecha: (1,1) → (2,1) → (3,1)
  for (let i = 0; i < 2; i++) {
    const moveRes = await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'move', payload: { direction: 'right' } }
    });
    expect(moveRes.ok()).toBe(true);
  }

  // Capturar el núcleo
  const captureRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'capture_core' }
  });
  expect(captureRes.ok()).toBe(true);
  const { success, state: finalState } = await captureRes.json();

  expect(success).toBe(true);
  expect(finalState.players.player1.score).toBe(5);     // +5 por captura
  expect(finalState.players.player1.energy).toBe(7);    // 5 inicial + 2
  expect(finalState.cores).toHaveLength(0);              // núcleo desaparecido (en respawn)
});
```

### Rama producción (`TEST_ENV=production`)

```typescript
test('T-04 (prod): captura de núcleo adaptativa', async ({ request }) => {
  if (process.env.TEST_ENV !== 'production') test.skip();

  // Crear partida normal (sin scenario)
  const res = await request.post('/api/game', { data: {} });
  const { gameId, state: initial } = await res.json();

  // Verificar que hay núcleos disponibles
  expect(initial.cores.length).toBeGreaterThan(0);

  // Encontrar el núcleo más cercano a P1 (distancia Manhattan)
  const p1 = initial.players.player1;
  let target = initial.cores[0];
  for (const core of initial.cores) {
    const distCurrent = Math.abs(target.x - p1.x) + Math.abs(target.y - p1.y);
    const distNew     = Math.abs(core.x - p1.x)   + Math.abs(core.y - p1.y);
    if (distNew < distCurrent) target = core;
  }

  // Calcular ruta BFS desde P1 hasta el núcleo
  const path = findPath(initial.grid, p1, target);
  expect(path).not.toBeNull();

  // Ejecutar los movimientos
  for (const direction of path!) {
    const r = await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'move', payload: { direction } }
    });
    // Si un movimiento falla (por carambola de estados), continuar
    // El estado del mapa puede cambiar durante el camino
  }

  // Capturar el núcleo
  const captureRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'capture_core' }
  });

  if (captureRes.ok()) {
    const { state: finalState } = await captureRes.json();
    // Verificar que se acumuló puntuación (puede haber recogido recursos en el camino)
    expect(finalState.players.player1.score).toBeGreaterThanOrEqual(5);
  } else {
    // Si el núcleo fue destruido/capturado antes de llegar, el test sigue siendo válido
    // siempre que la API responda correctamente
    const body = await captureRes.json();
    expect(body.error).toBe('CORE_NOT_PRESENT');
  }
});
```

**Criterios de aceptación (local/CI):**
- `player1.score === 5` exactamente.
- `player1.energy === 7` exactamente.
- `cores.length === 0`.

**Criterios de aceptación (producción):**
- Si la captura es exitosa: `player1.score >= 5`.
- Si el núcleo ya no existe: se recibe `CORE_NOT_PRESENT` (comportamiento correcto).

---

## T-05 — Acción inválida (energía insuficiente)

**Archivo:** `tests/e2e/invalid-action.spec.ts`

**Objetivo:** Verificar que intentar `special_action` sin suficiente energía devuelve error y que el mensaje aparece en la UI.

**Aplica en:** local/CI y producción.

```typescript
test('T-05 (API): special_action con energía insuficiente', async ({ request }) => {
  const scenario = process.env.TEST_ENV !== 'production'
    ? { scenario: { destructibles: [], cores: [], resources: [] } }
    : {};

  const res = await request.post('/api/game', { data: scenario });
  const { gameId } = await res.json();
  // Energy inicial: 5

  // Usar special_action una vez → energy: 5 - 3 = 2
  await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'special_action' }
  });

  // Intentar de nuevo → energy: 2 < 3 → error
  const errRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'special_action' }
  });

  expect(errRes.status()).toBe(400);
  const body = await errRes.json();
  expect(body.success).toBe(false);
  expect(body.error).toBe('ENERGY_INSUFFICIENT');
  expect(body.message).toBeTruthy();
});

test('T-05 (UI): mensaje de error visible', async ({ page, request }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  // Nota: la partida que crea la UI puede ser diferente a la del request.
  // Para garantizar que P1 tiene energy < 3:
  // Presionar E dos veces (primera vez gasta 3 energy → energy=2; segunda vez falla)
  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  await page.keyboard.press('e');

  // El mensaje de error debe aparecer en el HUD del jugador 1
  await expect(page.getByTestId('error-player1')).toBeVisible({ timeout: 3000 });
  const errorText = await page.getByTestId('error-player1').textContent();
  expect(errorText).toBeTruthy();
  expect(errorText!.length).toBeGreaterThan(0);
});
```

**Criterios de aceptación:**
- La API devuelve HTTP 400 con `error: 'ENERGY_INSUFFICIENT'`.
- El mensaje de error aparece en `data-testid="error-player1"`.

---

## T-06 — Finalización de partida

**Archivo:** `tests/e2e/finish.spec.ts`

### Rama local/CI — usando `force-end`

```typescript
test('T-06 (local): finalización via force-end', async ({ page, request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  // Crear partida desde la UI
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  // Obtener el gameId actual desde la API
  // (la UI crea la partida al hacer clic; necesitamos el gameId)
  // Estrategia: crear otra partida desde request y forzar su fin
  const res = await request.post('/api/game', { data: {} });
  const { gameId } = await res.json();

  // Forzar fin de partida
  const forceRes = await request.post(`/api/game/${gameId}/test/force-end`);
  expect(forceRes.ok()).toBe(true);
  const { state } = await forceRes.json();
  expect(state.status).toBe('finished');
  expect(['player1_wins', 'player2_wins', 'draw']).toContain(state.result);
});

test('T-06 (local): pantalla de resultado via polling', async ({ page, request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  // Interceptar la respuesta de POST /api/game que hace el frontend al pulsar el botón,
  // para obtener el gameId que el frontend está usando en su polling.
  let frontendGameId: string | null = null;

  page.waitForResponse(
    res => res.url().includes('/api/game') && res.request().method() === 'POST' && !res.url().includes('/action') && !res.url().includes('/force-end')
  ).then(async res => {
    const body = await res.json();
    frontendGameId = body.gameId ?? null;
  }).catch(() => { /* ignorar si la promesa no resuelve antes del timeout */ });

  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible({ timeout: 3000 });

  // Esperar a que frontendGameId esté disponible (la respuesta debe haber llegado ya)
  expect(frontendGameId).not.toBeNull();

  // Forzar el fin de la partida que el frontend está observando
  const forceRes = await request.post(`/api/game/${frontendGameId}/test/force-end`);
  expect(forceRes.ok()).toBe(true);

  // El frontend detectará finished en el siguiente poll (máx 500 ms)
  await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('result-screen')).toContainText(
    /jugador|empate/i
  );
  await expect(page.getByRole('button', { name: /nueva partida/i })).toBeVisible();
});
```

### Rama producción — acumulación real de puntos

```typescript
test('T-06 (prod): finalización por victoria anticipada', async ({ page, request }) => {
  if (process.env.TEST_ENV !== 'production') test.skip();

  const res = await request.post('/api/game', { data: {} });
  const { gameId, state: initial } = await res.json();

  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  let current = initial;
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  // Capturar núcleos hasta llegar a 25 puntos (5 capturas × 5 pts)
  while (
    current.players.player1.score < 25 &&
    current.status === 'playing' &&
    attempts < MAX_ATTEMPTS
  ) {
    attempts++;

    // Si no hay núcleos, esperar respawn
    if (current.cores.length === 0) {
      await new Promise(r => setTimeout(r, 1000));
      const poll = await request.get(`/api/game/${gameId}`);
      current = await poll.json();
      continue;
    }

    // Encontrar núcleo más cercano
    const p1 = current.players.player1;
    let target = current.cores[0];
    for (const core of current.cores) {
      const d1 = Math.abs(target.x - p1.x) + Math.abs(target.y - p1.y);
      const d2 = Math.abs(core.x - p1.x)   + Math.abs(core.y - p1.y);
      if (d2 < d1) target = core;
    }

    // Calcular ruta
    const path = findPath(current.grid, p1, target);
    if (!path) {
      await new Promise(r => setTimeout(r, 500));
      const poll = await request.get(`/api/game/${gameId}`);
      current = await poll.json();
      continue;
    }

    // Seguir ruta
    for (const direction of path) {
      const r = await request.post(`/api/game/${gameId}/action`, {
        data: { playerId: 'player1', type: 'move', payload: { direction } }
      });
      const b = await r.json();
      if (b.state) current = b.state;
      if (current.status === 'finished') break;
    }

    if (current.status === 'finished') break;

    // Capturar
    const cap = await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'capture_core' }
    });
    const capBody = await cap.json();
    if (capBody.state) current = capBody.state;
  }

  // Verificar que la pantalla de resultado aparece
  await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 5000 });
  expect(current.status).toBe('finished');
}, { timeout: 120_000 });
```

**Criterios de aceptación (local/CI):**
- `force-end` devuelve `status: 'finished'` con un resultado válido.
- La pantalla de resultado aparece en ≤ 2 segundos.

**Criterios de aceptación (producción):**
- Se acumulan 25 puntos mediante capturas reales.
- La pantalla de resultado aparece.
- No se usan endpoints de test.

---

## Resumen de los 6 tests

| Test | Archivo | Modo | Descripción |
|---|---|---|---|
| T-01 | `start.spec.ts` | Ambos | Inicio de partida y aparición de arena |
| T-02 | `movement.spec.ts` | Ambos | Movimiento válido actualiza posición |
| T-03 | `polling.spec.ts` | Ambos | Estructura de GameState y decremento de tiempo |
| T-04 | `capture.spec.ts` | Local: determinista / Prod: BFS adaptativo | Captura de núcleo |
| T-05 | `invalid-action.spec.ts` | Ambos | Acción inválida por energía insuficiente |
| T-06 | `finish.spec.ts` | Local: force-end / Prod: acumulación real | Finalización de partida |
