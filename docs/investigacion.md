# Investigación — Reactor Rush v1.0

---

## 1. Playwright — Investigación y configuración

### ¿Qué es Playwright?

Playwright es un framework de testing E2E desarrollado por Microsoft. Permite controlar navegadores reales (Chromium, Firefox, WebKit) de forma programática, tanto en modo headless como con interfaz visual.

A diferencia de herramientas como Cypress, Playwright ofrece:
- Soporte para múltiples navegadores en el mismo test.
- Un fixture `request` que permite hacer llamadas HTTP directas a la API sin pasar por el navegador.
- Ejecución en paralelo configurable.
- Generación de informes HTML.

### Estrategia de selectores

Para que los tests sean robustos frente a cambios de estilo o de texto, se usa la estrategia de `data-testid`:

```html
<div data-testid="arena">...</div>
<div data-testid="player-player1">...</div>
<div data-testid="start-button">...</div>
<div data-testid="result-screen">...</div>
<div data-testid="error-player1">...</div>
<div data-testid="time-remaining">...</div>
<div data-testid="reactor-warning">...</div>
```

En los tests se accede con:

```typescript
page.getByTestId('arena')
page.getByTestId('player-player1')
```

Evitar selectores frágiles como:
- `page.locator('.arena-grid')` (depende de nombre de clase CSS)
- `page.getByText('Arena')` (depende de texto exacto)
- `page.locator('div:nth-child(3)')` (depende del DOM)

### Fixture `request` vs interacción de UI

Playwright ofrece dos formas de interactuar con la aplicación:

**`page` (UI):**
- Navega con `page.goto('/')`.
- Hace clic con `page.click(...)`.
- Lee texto con `page.textContent(...)`.
- Usado en T-01 (verificar que la arena aparece) y T-05 (verificar mensaje de error en HUD).

**`request` (API directa):**
- Hace llamadas HTTP sin navegador: `request.post('/api/game')`.
- Más rápido y determinista que la UI.
- Usado en T-02, T-03, T-04, T-06 para enviar acciones al backend.

Ambos fixtures pueden usarse en el mismo test.

### Headless vs headed

**Headless (CI y por defecto):**
```bash
npm run test:e2e
```
El navegador no es visible. Requerido para GitHub Actions.

**Headed (demostración local):**
```bash
npm run test:e2e:headed
```
El navegador es visible. Útil para depuración y para la defensa oral.

### `wait-on` para CI

En GitHub Actions, el servidor necesita unos segundos para arrancar después del build. Se usa `wait-on` para esperar hasta que el servidor esté disponible:

```bash
npx wait-on http://localhost:3000/health --timeout 15000
```

`wait-on` hace polling al endpoint `/health` hasta que responde con 200 o hasta que expira el timeout.

### Configuración de Playwright (`playwright.config.ts`)

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

### Tests locales vs producción

Los tests tienen dos modos de ejecución:

**Modo local/CI (`TEST_ENV` no definido):**
- Usa `NODE_ENV=test` en el servidor.
- Puede usar `TestScenario` para posiciones deterministas.
- Puede usar `force-end` para finalización rápida.

**Modo producción (`TEST_ENV=production`):**
- Usa la URL pública (`PRODUCTION_URL`).
- No puede usar `TestScenario` ni `force-end`.
- T-04 calcula la ruta con BFS desde el estado real devuelto por la API.
- T-06 acumula puntos con acciones reales hasta alcanzar 25.

Los tests detectan el modo con:
```typescript
if (process.env.TEST_ENV === 'production') { /* rama producción */ }
if (process.env.TEST_ENV !== 'production') { /* rama local/CI */ }
```

### Helper BFS para tests de producción

El archivo `tests/e2e/helpers/bfs.ts` implementa un BFS simple para calcular la ruta desde la posición de P1 hasta un núcleo, dado el grid real devuelto por la API:

```typescript
export function findPath(
  grid: CellType[][],
  from: { x: number; y: number },
  to:   { x: number; y: number }
): Direction[] | null
```

Este helper es código de test, no de producción. No se importa en ningún módulo del backend ni del frontend.

### Tiempo de ejecución esperado

| Test | Modo local/CI | Modo producción |
|---|---|---|
| T-01 | ~2 s | ~2 s |
| T-02 | ~1 s | ~1 s |
| T-03 | ~3 s | ~3 s |
| T-04 | ~2 s | ~5-15 s (movimientos variables) |
| T-05 | ~3 s | ~3 s |
| T-06 | ~2 s (force-end) | ~30-60 s (accumulación real) |

Para T-06 en producción usar `--timeout 120000`.

---

## 2. Railway — Investigación y configuración

### ¿Por qué Railway?

Railway es una plataforma de deployment como servicio (PaaS) que:
- Soporta aplicaciones Node.js con detección automática (Nixpacks).
- No requiere Dockerfile para proyectos simples.
- Permite configurar build/start commands en `railway.toml`.
- Tiene integración con GitHub para deployments automáticos.
- Ofrece un plan gratuito suficiente para proyectos académicos.
- Proporciona URLs públicas estables con HTTPS automático.

### Alternativas consideradas y descartadas

| Plataforma | Motivo de descarte |
|---|---|
| Heroku | Plan gratuito eliminado; requiere tarjeta de crédito |
| Vercel | Orientado a serverless; Express persistente con estado en memoria no es compatible |
| Render | Válida alternativa, pero Railway tiene mejor CLI para CI/CD |
| Fly.io | Requiere Dockerfile y configuración más compleja |

### Configuración `railway.toml`

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
```

### Variables de entorno en Railway

Se configuran en el dashboard de Railway (no en el repositorio):
- `NODE_ENV=production`
- `PORT` es inyectado automáticamente por Railway.

### ¿Por qué no Docker?

Docker añadiría un `Dockerfile`, posiblemente un `docker-compose.yml` y conocimiento de contenedores que está fuera del alcance del proyecto. Nixpacks de Railway detecta automáticamente un proyecto Node.js con `package.json` y genera el build sin configuración adicional.

### GitHub Actions y Railway

El deployment automático se realiza con el CLI de Railway:

```yaml
- run: npm install -g @railway/cli
- run: railway up --service reactor-rush --detach
  env:
    RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

El `RAILWAY_TOKEN` se obtiene en el dashboard de Railway y se guarda como secret en GitHub.

---

## 3. GitHub Actions — Investigación

### Workflow de lint (`lint.yml`)

Se ejecuta en cada push y pull request. Instala dependencias, ejecuta ESLint en backend y frontend. Falla si hay errores de lint.

### Workflow de E2E (`e2e.yml`)

Se ejecuta en cada push y pull request:
1. Checkout del código.
2. Setup Node 20.
3. `npm ci` (instalación limpia).
4. `npm run build` (compila backend + frontend).
5. Instala browsers de Playwright: `npx playwright install --with-deps chromium`.
6. Arranca el servidor en background: `NODE_ENV=test node backend/dist/index.js &`.
7. Espera disponibilidad: `npx wait-on http://localhost:3000/health`.
8. Ejecuta tests: `npm run test:e2e`.
9. Sube reporte HTML como artifact (incluso si los tests fallan).

### Workflow de deploy (`deploy.yml`)

Se ejecuta solo en push a `main`:
1. Build completo.
2. Deploy a Railway con CLI.
3. Verificación opcional del health check.

---

## 4. Uso de inteligencia artificial

El siguiente registro documenta el uso de herramientas de IA durante el desarrollo del proyecto.

| # | Prompt / Solicitud al agente | Respuesta relevante (resumen) | Qué se incorporó | Qué verificó el estudiante | Modificaciones posteriores |
|---|---|---|---|---|---|
| 1 | "Implementa Reactor Rush v1.0 siguiendo estrictamente `TASKS.md` y los documentos de `docs/`, sin cambiar reglas ni añadir funcionalidades." | El agente ejecutó el plan por fases: estructura del monorepo, backend Express+TypeScript con estado en memoria, frontend React+Vite con polling, y tests E2E con Playwright. | Todo el código de `backend/src/`, `frontend/src/`, `tests/e2e/` y los workflows de `.github/workflows/`. | Se ejecutaron `npm run build`, `npm run lint` y `npm run test:e2e` en local tras cada bloque. | Ajustes en tipos y constantes para que el proyecto compilara bajo TypeScript estricto. |
| 2 | "Mantén `backend/src/game/constants.ts` como fuente única para los valores configurables definidos por el diseño." | El agente centralizó HP, energía, puntuaciones, timers, radio de bomba y probabilidades, importándolos en el resto de módulos del juego. | `backend/src/game/constants.ts` y sus importaciones en `factory.ts`, `actions.ts`, `bombs.ts`, `cores.ts`, `arenaEvent.ts` y `engine.ts`. | Revisión de que los valores de la tabla de constantes coinciden y de que no se dispersaron valores de diseño. | Ninguna. |
| 3 | "El endpoint `force-end` debe existir únicamente para tests y nunca quedar registrado como ruta disponible en producción." | Registro condicional de `testRouter` bajo `if (process.env.NODE_ENV === 'test')`, con import estático del módulo. | `backend/src/routes/test.ts` y el registro condicional en `backend/src/index.ts`. | Se arrancó el servidor en `NODE_ENV=production` y se comprobó que `POST /api/game/:id/test/force-end` no devuelve JSON de juego (responde HTML 404 del SPA). | Ninguna. |
| 4 | "Respeta los 6 tests E2E definidos en `docs/testing.md` y no los sustituyas por versiones más simples." | El agente implementó las ramas local/CI y de producción, con helper BFS para T-04/T-06 de producción y `page.waitForResponse` para la pantalla de resultado de T-06 local. | `tests/e2e/start.spec.ts`, `movement.spec.ts`, `polling.spec.ts`, `capture.spec.ts`, `invalid-action.spec.ts`, `finish.spec.ts` y `tests/e2e/helpers/bfs.ts`. | `NODE_ENV=test node backend/dist/index.js` + `npm run test:e2e`: 9 tests passed y 2 ramas de producción omitidas por diseño. | Ninguna en los tests; ajustes de configuración descritos en la fila 5. |
| 5 | "¿Por qué fallan T-02 y T-04 al ejecutar los tests?" | El agente detectó que Playwright ejecuta los archivos en paralelo con varios workers y que la aplicación soporta exactamente una partida activa (`docs/decisiones.md` §16): crear una partida cancela la anterior y corrompe el estado de otros tests. | `tests/playwright.config.ts` → `workers: 1`. | Se repitieron los tests: pasaron de 2 fallos a 9/9 en modo local/CI. | Se mantuvo la configuración documentada y solo se añadió `workers: 1` como requisito del diseño de partida única. |
| 6 | "Si `TASKS.md` describe `testDir: './tests/e2e'` con el config dentro de `tests/`, ¿por qué Playwright no encuentra tests?" | Playwright resuelve `testDir` de forma relativa a la ubicación del archivo de configuración; `./tests/e2e` apuntaba a `tests/tests/e2e`. | `tests/playwright.config.ts` → `testDir: './e2e'`. | `npm run test:e2e` encontró y ejecutó los 6 archivos de test. | Corrección mínima de configuración, justificada por el comportamiento real de Playwright. |
| 7 | "¿Cómo se gestionan los timers al reiniciar una partida para evitar fugas?" | El agente implementó `clearGameTimers(gameId)` en `store.ts`, que cancela el `interval` del loop y todos los `timeouts` registrados (bombas, respawn de núcleos, escudo y Reactor Pulse) antes de crear la nueva partida. | `backend/src/store.ts` y la limpieza previa en `createGame()` de `factory.ts`. | Se creó una partida, se esperó 5 s, se creó una segunda partida y se comprobó que la antigua devuelve 404 y la nueva mantiene su propio tiempo. | Ninguna. |
