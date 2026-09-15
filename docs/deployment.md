# Deployment — Reactor Rush v1.0

> Plataforma elegida: **Railway**
> La URL pública definitiva se conocerá tras el primer deployment exitoso.
> En este documento se usa `<PRODUCTION_URL>` como placeholder.

---

## Arquitectura de deployment

En producción, Express sirve tanto la API como el frontend compilado:

```
<PRODUCTION_URL>/         → frontend/dist/index.html (SPA)
<PRODUCTION_URL>/api/*    → rutas de la API REST
<PRODUCTION_URL>/health   → { status: 'ok' }
```

No hay servidor de frontend separado. No hay proxy inverso adicional. Un solo proceso Node.js, un solo puerto.

---

## Requisitos previos

1. Cuenta en [Railway](https://railway.app).
2. CLI de Railway instalado: `npm install -g @railway/cli`.
3. Proyecto creado en Railway (desde el dashboard o con `railway init`).
4. Token de Railway para GitHub Actions.

---

## Configuración del proyecto en Railway

### `railway.toml`

Archivo en la raíz del repositorio:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
```

- `buildCommand`: ejecuta `npm run build` en la raíz, que compila backend + frontend.
- `startCommand`: ejecuta `npm start`, que inicia `node backend/dist/index.js`.
- `healthcheckPath`: Railway verifica `/health` después del deployment para confirmar que el servicio está activo.

### Variables de entorno en Railway

Configurar en el dashboard de Railway → Settings → Variables:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |

> `PORT` es inyectado automáticamente por Railway. No se necesita configurar.

---

## Build de producción

El script raíz `npm run build` ejecuta secuencialmente:

```bash
npm run build --workspace=backend   # tsc → backend/dist/
npm run build --workspace=frontend  # vite build → frontend/dist/
```

El servidor Express en `backend/dist/index.js` sirve los estáticos de `frontend/dist/` con:

```javascript
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
```

La ruta catch-all debe registrarse **después** de las rutas de la API para que `/api/*` tenga prioridad.

---

## Deployment manual (primera vez)

```bash
# 1. Login en Railway
railway login

# 2. Vincular el proyecto local con el proyecto de Railway
railway link

# 3. Build local
npm run build

# 4. Deploy
railway up
```

Tras el deployment, Railway proporciona la URL pública. Actualizar `<PRODUCTION_URL>` en:
- `README.md`
- `.env.example` (campo `PRODUCTION_URL`)
- `docs/deployment.md` (este archivo)

---

## Deployment automático (GitHub Actions)

El workflow `.github/workflows/deploy.yml` se ejecuta automáticamente en cada push a la rama `main`.

### Configuración del secret en GitHub

1. Ir a GitHub → Settings del repositorio → Secrets and variables → Actions.
2. Crear un nuevo secret: `RAILWAY_TOKEN`.
3. El valor es el token obtenido en Railway → Account Settings → Tokens.

### Workflow `deploy.yml`

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

      # Verificación del health check en producción.
      # ACTIVAR este paso después del primer deploy exitoso:
      # 1. Reemplazar <PRODUCTION_URL> por la URL real obtenida de Railway.
      # 2. Cambiar `if: false` por `if: true` (o eliminar la condición).
      - name: Verify health check
        if: false   # <- desactivado hasta tener PRODUCTION_URL real
        run: |
          sleep 10
          curl -f <PRODUCTION_URL>/health || exit 1
```

> Sustituir `<PRODUCTION_URL>` por la URL real tras el primer deployment.

---

## Verificación del deployment

Después de cada deployment, verificar:

```bash
# Health check
curl <PRODUCTION_URL>/health
# Respuesta esperada: {"status":"ok"}

# Frontend
curl -s <PRODUCTION_URL> | grep "Reactor Rush"
# Debe devolver el HTML con el título del juego

# API
curl -s -X POST <PRODUCTION_URL>/api/game \
  -H "Content-Type: application/json" \
  -d '{}' | jq .gameId
# Debe devolver un UUID válido

# Verificar que force-end NO existe en producción
curl -s -X POST <PRODUCTION_URL>/api/game/test-id/test/force-end \
  | grep -v '"status":"finished"'
# No debe devolver un estado finished en JSON
```

---

## Tests E2E contra producción

Una vez verificado el deployment:

```bash
TEST_ENV=production \
PRODUCTION_URL=<PRODUCTION_URL> \
npm run test:e2e
```

Para T-06 en producción (acumulación real de puntos), aumentar el timeout:

```bash
TEST_ENV=production \
PRODUCTION_URL=<PRODUCTION_URL> \
npm run test:e2e -- --timeout 120000
```

---

## Variables de entorno completas

| Variable | Entorno | Dónde se configura | Descripción |
|---|---|---|---|
| `PORT` | Railway (producción) | Railway dashboard (automático) | Puerto del servidor |
| `NODE_ENV` | Railway (producción) | Railway dashboard | Debe ser `production` |
| `NODE_ENV` | Local desarrollo | `.env` o terminal | `development` o `test` |
| `VITE_API_BASE` | Build frontend | `.env` o CI | Prefijo de la API (default: `/api`) |
| `PRODUCTION_URL` | Tests E2E | GitHub Actions / terminal | URL pública del deployment |
| `TEST_ENV` | Tests E2E | GitHub Actions / terminal | `production` para rama adaptativa |
| `RAILWAY_TOKEN` | GitHub Actions | GitHub Secrets | Token de autenticación Railway |

---

## Notas sobre Docker

Docker no es necesario para este proyecto. Railway utiliza Nixpacks, que detecta automáticamente un proyecto Node.js con `package.json` y genera el build sin configuración de contenedores. Esto simplifica el deployment y elimina la necesidad de mantener un `Dockerfile`.

Si en el futuro se necesita portabilidad adicional, se puede añadir un `Dockerfile` básico:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

Pero esto está fuera del alcance actual del proyecto.
