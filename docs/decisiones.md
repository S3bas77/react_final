# Decisiones técnicas — Reactor Rush v1.0

> Este documento explica y justifica cada decisión técnica relevante del proyecto.
> Sirve como referencia para la defensa oral y para OpenCode al implementar.

---

## 1. REST + polling en lugar de WebSocket

**Decisión:** El frontend hace polling cada 500 ms con `GET /api/game/:gameId`. No se usan WebSockets ni SSE.

**Justificación:**
- Los WebSockets requieren gestión de conexiones persistentes, reconexión y estado de sesión, lo que aumenta significativamente la complejidad del backend.
- Con dos jugadores en el mismo dispositivo, la latencia de 500 ms es completamente aceptable. No hay jugadores remotos.
- REST + polling es arquitectura estándar, explicable en 30 segundos durante una defensa.
- El requisito académico especifica explícitamente `fetch` y JSON. WebSocket está fuera del alcance.
- La sincronización de bombas, respawn de núcleos y Reactor Pulse funciona correctamente con 500 ms de delay visual porque la lógica crítica ocurre en el backend con timers precisos.

**Tradeoff aceptado:** el estado visual puede tener hasta 500 ms de retraso. Esto es visible pero aceptable para un juego local de dos jugadores.

---

## 2. Estado en memoria en lugar de base de datos

**Decisión:** El estado de la partida reside en un objeto `Map` en memoria del proceso Node.js. No hay base de datos.

**Justificación:**
- El proyecto no requiere persistencia entre sesiones. Cada partida es efímera.
- Una base de datos (PostgreSQL, MongoDB, Redis) añadiría configuración, migraciones, variables de entorno adicionales y complejidad de deployment que excede el alcance del proyecto.
- El estado en memoria es más rápido y más simple de mantener y explicar.
- Una sola partida activa a la vez elimina la necesidad de gestión multiusuario.

**Tradeoff aceptado:** si el proceso Node.js se reinicia, la partida activa se pierde. Esto es aceptable para el contexto académico.

---

## 3. Dos jugadores en el mismo teclado

**Decisión:** Ambos jugadores juegan en el mismo dispositivo usando el mismo teclado.

**Justificación:**
- Elimina la necesidad de red, autenticación, sesiones o sincronización entre dispositivos.
- El frontend puede conocer el `playerId` de cada tecla mediante un mapa estático de teclas.
- Simplifica el modelo de comunicación: cualquier tecla genera un request HTTP al backend con su `playerId` correspondiente.
- Compatible con el contexto de evaluación universitaria donde hay un solo ordenador disponible.

**Tradeoff aceptado:** ambos jugadores deben compartir el mismo espacio físico y teclado. No hay soporte multidispositivo.

---

## 4. React + TypeScript en el frontend

**Decisión:** React con TypeScript. Sin React Router, sin Redux, sin librerías de estado externas.

**Justificación:**
- React es el framework especificado por los requisitos académicos.
- TypeScript garantiza que los tipos del contrato de API se respeten en tiempo de compilación.
- El estado de la aplicación es simple (tres pantallas, un estado de juego) y no requiere Redux. `useState` en `App.tsx` es suficiente.
- Sin React Router porque la navegación es trivial: tres pantallas manejadas por un campo `screen` en el estado local.
- Sin librerías de UI para demostrar dominio de CSS y HTML semántico.

---

## 5. Express + TypeScript en el backend

**Decisión:** Express con TypeScript. Sin ORM, sin librerías de lógica de juego, sin motores de física.

**Justificación:**
- Express es minimalista y permite implementar exactamente los endpoints necesarios sin opiniones adicionales.
- TypeScript en el backend garantiza consistencia de tipos con el frontend (aunque los tipos se mantengan sincronizados manualmente).
- Toda la lógica de juego está en módulos TypeScript propios, lo que hace que el código sea completamente explicable durante la defensa.

---

## 6. `fetch` nativo en lugar de Axios

**Decisión:** Toda comunicación HTTP desde el frontend usa `fetch` nativo del navegador.

**Justificación:**
- Axios está explícitamente prohibido por los requisitos del proyecto.
- `fetch` está disponible en todos los navegadores modernos sin dependencias adicionales.
- Los tres endpoints son simples (POST sin configuración especial, GET sin headers) y no requieren las utilidades extra de Axios.
- Demuestra dominio de las APIs nativas del navegador.

---

## 7. Vite como bundler del frontend

**Decisión:** Vite para desarrollo y build del frontend.

**Justificación:**
- Vite es el bundler estándar para proyectos React + TypeScript modernos.
- HMR (Hot Module Replacement) en desarrollo.
- El proxy `/api` → `http://localhost:3000` de Vite elimina problemas de CORS en desarrollo.
- `vite build` produce un build optimizado que Express puede servir estáticamente.

---

## 8. CSS propio sin frameworks

**Decisión:** CSS Grid y CSS personalizado. Sin Tailwind, Bootstrap ni CSS-in-JS.

**Justificación:**
- Tailwind y Bootstrap están explícitamente prohibidos por los requisitos.
- CSS Grid es idóneo para renderizar la cuadrícula 15×11 de la arena.
- `aspect-ratio: 1` en las celdas garantiza que sean cuadradas sin JavaScript.
- El diseño visual es simple y manejable sin un framework de CSS.

---

## 9. BFS para validación de conectividad

**Decisión:** Después de generar destructibles aleatorios, se ejecuta BFS desde `(1,1)` hasta `(13,9)` para garantizar que existe un camino transitable.

**Justificación:**
- Sin esta verificación, la aleatoriedad podría generar mapas donde un jugador queda completamente encerrado, haciendo el juego imposible.
- BFS es el algoritmo más simple para verificar conectividad en un grid 2D.
- También se usa para calcular las celdas alcanzables desde `(1,1)` y así garantizar que núcleos y recursos se colocan en posiciones accesibles.

---

## 10. Timers en el backend

**Decisión:** Los timers de bombas, respawn de núcleos, escudo y Reactor Pulse son `setTimeout`/`setInterval` en Express, no en React.

**Justificación:**
- Si los timers estuvieran en el frontend, el jugador podría manipularlos desde la consola del navegador.
- El backend es la única fuente de verdad del estado. Los timers deben estar donde está el estado.
- El frontend solo usa `timerRemaining` de la bomba (decrementado por el tick del backend) para el visual. La explosión real ocurre en el servidor.
- Cumple el requisito de que "la lógica crítica no debe existir únicamente en React".

---

## 11. `constants.ts` como única fuente de verdad de valores

**Decisión:** Todos los valores numéricos configurables del juego están en `backend/src/game/constants.ts`. No hay números mágicos en otros módulos.

**Justificación:**
- Durante la defensa oral el docente puede pedir cambiar un valor (duración de la partida, radio de bomba, puntos de victoria). Con `constants.ts` el cambio es en un solo archivo.
- Facilita el mantenimiento y la comprensión del código.
- Previene inconsistencias cuando el mismo valor se usa en múltiples módulos.

**Valores configurables incluidos:**
```
GAME_DURATION_S, VICTORY_SCORE, BOMB_TIMER_S, BOMB_RADIUS,
SHIELD_DURATION_MS, SCORE_*, ENERGY_*, CORE_RESPAWN_MS,
INITIAL_CORE_COUNT, MAX_CORE_COUNT, INITIAL_RESOURCE_COUNT,
DESTRUCTIBLE_MIN, DESTRUCTIBLE_MAX, REACTOR_PULSE_MIN_S,
REACTOR_PULSE_MAX_S, REACTOR_PULSE_WARNING_S, RESOURCE_SPAWN_CHANCE,
CHAIN_REACTION_MAX_DEPTH, POLLING_INTERVAL_MS
```

---

## 12. TestScenario y force-end solo en `NODE_ENV=test`

**Decisión:** El endpoint `POST /api/game/:gameId/test/force-end` y el parámetro `scenario` en `POST /api/game` solo existen cuando `NODE_ENV === 'test'`. En producción no están registrados ni son accesibles.

**Justificación:**
- Los tests E2E necesitan escenarios deterministas (T-04: núcleo en posición conocida) y finalización acelerada (T-06: sin esperar 120 s).
- Exponer estos mecanismos en producción permitiría que cualquier usuario termine partidas o controle el estado inicial, rompiendo la integridad del juego.
- La implementación importa `routes/test.ts` estáticamente en `index.ts`, pero registra la ruta `app.use('/api/game', testRouter)` únicamente dentro del bloque `if (process.env.NODE_ENV === 'test')`. En producción el módulo está en memoria pero el endpoint no está registrado en Express y por tanto es inaccesible desde cualquier URL.

---

## 13. Railway como plataforma de deployment

**Decisión:** El proyecto se despliega en Railway.

**Justificación:**
- Railway soporta aplicaciones Node.js directamente con Nixpacks, sin necesidad de Dockerfile.
- Permite configurar el comando de build (`npm run build`) y start (`npm start`) desde `railway.toml`.
- Integración nativa con GitHub Actions vía CLI y token.
- Plan gratuito suficiente para el contexto académico.
- La URL pública es estable y no requiere configuración adicional de dominio.

---

## 14. Playwright para testing E2E

**Decisión:** Playwright para los 6 tests E2E requeridos.

**Justificación:**
- Playwright es la herramienta de testing E2E más completa disponible, con soporte para requests de API (`request` fixture), navegación y assertions de UI.
- Permite ejecutar los mismos tests en modo headless (CI) y headed (demostración local).
- El fixture `request` de Playwright permite hacer llamadas HTTP directamente al backend sin pasar por la UI, lo que hace los tests más rápidos y robustos.
- Compatible con GitHub Actions sin configuración adicional.

---

## 15. Tipos duplicados (no compartidos) entre backend y frontend

**Decisión:** Los tipos TypeScript se definen en `backend/src/game/state.ts` y se replican manualmente en `frontend/src/types.ts`. No hay un paquete compartido.

**Justificación:**
- Un paquete compartido requeriría configuración adicional de workspaces con `tsconfig` de referencias de proyectos o un paquete `@reactor-rush/types`, añadiendo complejidad.
- Los tipos del proyecto son estables y cambian raramente.
- El proyecto es pequeño: mantener dos archivos sincronizados es trivial y el compilador TypeScript detecta inmediatamente cualquier desincronización.
- Mantiene la arquitectura simple y explicable.

---

## 16. Una partida activa a la vez

**Decisión:** El sistema soporta exactamente una partida en memoria. Crear una nueva partida destruye la anterior.

**Justificación:**
- Matchmaking, múltiples partidas, lobbies y salas están fuera del alcance del proyecto.
- Simplifica enormemente el store, la gestión de timers y los endpoints.
- En el contexto de evaluación, siempre hay dos personas en la misma máquina jugando una partida.

---

## 17. Procesamiento secuencial de acciones

**Decisión:** No hay mecanismo de bloqueo o mutex explícito para acciones concurrentes. Se confía en el event loop single-thread de Node.js.

**Justificación:**
- Node.js procesa callbacks del event loop de forma secuencial (sin paralelismo real de I/O síncrono).
- Dos requests casi simultáneos para capturar el mismo núcleo se procesan uno después del otro. El segundo encontrará el núcleo ya eliminado y recibirá `CORE_NOT_PRESENT`.
- Esto hace que `CORE_ALREADY_CAPTURED` sea redundante con `CORE_NOT_PRESENT` y no se implementa como código separado.
- Para el volumen de requests de este proyecto (dos jugadores, acciones discretas) el event loop es más que suficiente.

---

## 18. Monorepo con npm workspaces

**Decisión:** Backend y frontend en el mismo repositorio con npm workspaces.

**Justificación:**
- Simplifica la gestión de dependencias: `npm install` en la raíz instala todo.
- Los scripts de build, lint y test se pueden ejecutar desde la raíz.
- GitHub Actions puede compilar y desplegar todo desde un solo checkout.
- Facilita la revisión del código por parte del docente.

---

## Cambios respecto a versiones anteriores del diseño

| Cambio | Versión anterior | Versión final |
|---|---|---|
| `CORE_ALREADY_CAPTURED` | Contemplado como código de error | Eliminado. Cubierto por `CORE_NOT_PRESENT` |
| `BOMB_NOT_AVAILABLE` | Mencionado como alternativa | Eliminado. Solo existe `BOMB_ALREADY_ACTIVE` |
| `enforceMinCores()` | Existía para mantener mínimo de núcleos | Eliminado. No hay mínimo instantáneo; respawn en 8 s |
| `activePlayer` | Mencionado en primeros borradores | Eliminado completamente. Juego simultáneo |
| Debounce de 100 ms | Propuesto inicialmente | Eliminado. Se filtra `event.repeat` en su lugar |
| Prioridad por energía en captura simultánea | Propuesta inicial | Eliminado. Primer request gana (Node.js sequential) |

---

## Variables de entorno

| Variable | Entorno | Descripción | Default |
|---|---|---|---|
| `PORT` | Backend | Puerto de Express | `3000` |
| `NODE_ENV` | Backend | `development` / `test` / `production` | `development` |
| `VITE_API_BASE` | Frontend (build time) | Prefijo de la API | `/api` |
| `PRODUCTION_URL` | Tests E2E | URL pública para rama de producción | — |
| `TEST_ENV` | Tests E2E | `production` activa tests adaptativos | — |

**Secrets de GitHub Actions:**

| Secret | Uso |
|---|---|
| `RAILWAY_TOKEN` | Token de autenticación para el CLI de Railway en el workflow de deploy |

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Timer leak al reiniciar partida | Media | Alto | `clearGameTimers` limpia todos los timers antes de crear nueva partida |
| Doble daño por explosión | Media | Medio | Set de celdas afectadas + check `alive` en `applyDamage` |
| Doble respawn de núcleo | Baja | Bajo | `respawningCores: Set<string>` en el timer registry |
| BFS infinito por mapa bloqueado | Baja | Alto | Límite de 50 intentos de eliminación de destructibles; fallback: limpiar todos |
| Mapa con celdas inaccesibles para núcleos | Baja | Medio | `getReachableCells()` filtra posiciones antes de colocar elementos |
| Test E2E frágil por posiciones aleatorias | Alta en CI | Alto | `TestScenario` determinista en `NODE_ENV=test`; BFS adaptativo en producción |
