# Reactor Rush v1.0

Juego web competitivo para dos jugadores locales. Ambos jugadores compiten en la misma pantalla para capturar núcleos de energía, colocar bombas y acumular puntos durante 120 segundos.

## Descripción

Reactor Rush es un juego de arena original para dos jugadores que usan el mismo teclado. El objetivo es acumular más puntos que el rival capturando núcleos de energía, eliminando al oponente y recogiendo recursos. La partida termina cuando un jugador alcanza 25 puntos o cuando expiran los 120 segundos.

## Requisitos previos

- Node.js 20 o superior
- npm 9 o superior

## Instalación

```bash
# Desde la raíz del proyecto
npm install
```

## Desarrollo

Ejecutar backend y frontend por separado en dos terminales:

```bash
# Terminal 1 — backend
cd backend
npm run dev
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev
```

El frontend estará disponible en `http://localhost:5173` con proxy `/api` → `http://localhost:3000`.

## Build de producción

```bash
npm run build
```

Esto compila el backend TypeScript y el frontend Vite. El resultado queda en:

- `backend/dist/` — servidor Express compilado
- `frontend/dist/` — estáticos React

## Ejecutar producción local

```bash
# Requiere haber hecho build previamente
npm start
```

La aplicación completa estará disponible en `http://localhost:3000`.

## Lint

```bash
npm run lint
```

Ejecuta ESLint en backend y frontend.

## Tests E2E

### Modo local (headless)

```bash
# Requiere que el servidor esté corriendo en modo test
npm run build
NODE_ENV=test node backend/dist/index.js &
npm run test:e2e
```

### Modo local visual (headed)

```bash
npm run test:e2e:headed
```

### Contra producción

```bash
TEST_ENV=production PRODUCTION_URL=https://reactor-rush-production.up.railway.app npm run test:e2e
```

La URL pública del deployment activo es `https://reactor-rush-production.up.railway.app`.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor Express | `3000` |
| `NODE_ENV` | Entorno: `development`, `test`, `production` | `development` |
| `VITE_API_BASE` | Prefijo de la API para el build frontend | `/api` |
| `PRODUCTION_URL` | URL pública para tests E2E contra producción | — |
| `TEST_ENV` | Modo de tests: `production` activa rama adaptativa | — |

Copiar `.env.example` a `.env` para desarrollo local:

```bash
cp .env.example .env
```

## Deployment

El proyecto se despliega en Railway. Ver [`docs/deployment.md`](docs/deployment.md) para instrucciones completas.

URL pública: `https://reactor-rush-production.up.railway.app`

## Documentación

| Archivo | Contenido |
|---|---|
| [`docs/introduccion.md`](docs/introduccion.md) | Concepto, objetivo, jugadores |
| [`docs/reglas.md`](docs/reglas.md) | Reglas completas del juego |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Arquitectura técnica |
| [`docs/api.md`](docs/api.md) | Especificación completa de la API REST |
| [`docs/modelo-datos.md`](docs/modelo-datos.md) | Tipos y estructuras de datos |
| [`docs/decisiones.md`](docs/decisiones.md) | Decisiones técnicas y justificaciones |
| [`docs/testing.md`](docs/testing.md) | Estrategia de testing E2E |
| [`docs/deployment.md`](docs/deployment.md) | Guía de despliegue |
| [`docs/investigacion.md`](docs/investigacion.md) | Investigación y uso de IA |
| [`docs/rubrica.md`](docs/rubrica.md) | Mapa de requisitos y rúbrica |
| [`docs/trazabilidad.md`](docs/trazabilidad.md) | Matriz de trazabilidad |
| [`docs/guia-defensa.md`](docs/guia-defensa.md) | Guía para defensa oral |
| [`TASKS.md`](TASKS.md) | Plan de implementación para OpenCode |

## Controles

| Acción | Jugador 1 | Jugador 2 |
|---|---|---|
| Arriba | `W` | `↑` |
| Izquierda | `A` | `←` |
| Abajo | `S` | `↓` |
| Derecha | `D` | `→` |
| Bomba | `F` | `L` |
| Capturar núcleo | `G` | `K` |
| Acción especial | `E` | `O` |
