# Guía de defensa oral — Reactor Rush v1.0

> Esta guía prepara la defensa individual de aproximadamente 10 minutos.
> Cada sección indica el tiempo sugerido y los archivos a mostrar.

---

## Script de 10 minutos

### Minuto 1 — Concepto del juego

**Qué decir:**

"Reactor Rush es un juego web competitivo para dos jugadores locales. No es un clon de Bomberman. Aunque usa una arena y bombas como mecánica base, el objetivo principal es capturar núcleos de energía para acumular puntos, no eliminar al rival. La eliminación otorga puntos pero no termina la partida. Gana quien llegue a 25 puntos primero, o quien tenga más puntos cuando expiren los 120 segundos."

**Lo que distingue el juego:**
- Sistema de captura de núcleos como objetivo principal.
- Acción especial con comportamiento dual: ataque o escudo según la posición del rival.
- Reactor Pulse: evento único de arena que destruye parte del escenario y redistribuye recursos.

**Archivos a mostrar:** `docs/introduccion.md`, pantalla de inicio en el navegador.

---

### Minuto 2 — Arquitectura general

**Qué decir:**

"La arquitectura es cliente-servidor simple. Express con TypeScript en el backend mantiene todo el estado del juego en memoria. React con TypeScript en el frontend solo renderiza y envía acciones. La comunicación es HTTP REST con polling cada 500 ms. No hay WebSockets, no hay base de datos, no hay librerías de juego externas."

```
Frontend (React) → fetch POST /action → Backend (Express)
Frontend (React) ← fetch GET  /game   ← Backend (Express)   cada 500 ms
```

**Archivos a mostrar:** `docs/arquitectura.md`, diagrama de estructura de carpetas.

---

### Minuto 3 — `constants.ts`: demostración en vivo

**Qué decir:**

"Todos los valores configurables del juego están centralizados en un solo archivo. Si el docente pide cambiar cualquier valor, solo hay que modificar una línea aquí."

**Demostración sugerida:** abrir `backend/src/game/constants.ts` y señalar:

```typescript
export const GAME_DURATION_S = 120;   // "Para cambiar la duración, aquí"
export const VICTORY_SCORE   = 25;    // "Para cambiar el puntaje de victoria, aquí"
export const BOMB_RADIUS     = 2;     // "Para cambiar el radio de la bomba, aquí"
export const BOMB_TIMER_S    = 3;     // "Para cambiar el timer de la bomba, aquí"
export const REACTOR_PULSE_MIN_S = 45; // "Para cambiar el timing del pulso, aquí"
```

**Punto clave:** "No hay números mágicos dispersos en el código. Todo el juego usa estas constantes."

---

### Minuto 4 — Backend: `engine.ts` y `actions.ts`

**Qué decir:**

"El backend toma todas las decisiones importantes. En `engine.ts` está el loop de un segundo que descuenta el tiempo, el decremento visual del timer de la bomba, y `checkVictory` que detecta si alguien llegó a 25 puntos o si el tiempo llegó a cero. También está `applyDamage`, que centraliza toda la lógica de daño: shield, eliminación, puntos de kill."

"En `actions.ts` está el punto de entrada de todas las acciones: movimiento, bomba, captura de núcleo y acción especial. Cada una valida antes de ejecutar y lanza un `GameActionError` tipado que el router convierte en respuesta HTTP con código correcto."

**Archivos a mostrar:** `backend/src/game/engine.ts`, `backend/src/game/actions.ts`.

**Punto clave:** "El frontend nunca decide si una acción es válida. Eso siempre lo hace Express."

---

### Minuto 5 — `bombs.ts`: timers en el backend

**Qué decir:**

"Cuando un jugador coloca una bomba, el backend registra un `setTimeout` de 3 segundos. Cuando ese timeout se ejecuta, `triggerExplosion` calcula las celdas afectadas con un `Set` para garantizar unicidad, aplica los efectos en orden: destructibles, jugadores, núcleos, otras bombas. El daño a jugadores usa `applyDamage`, que garantiza máximo 1 daño por jugador por explosión. La reacción en cadena tiene profundidad máxima de 5 para evitar recursión infinita."

"Todos los timers se registran en `gameTimers` del store. Al crear una nueva partida o al terminar la actual, `clearGameTimers` los cancela todos."

**Archivos a mostrar:** `backend/src/game/bombs.ts`, `backend/src/store.ts`.

**Punto clave:** "El timer de la bomba está en Express, no en React. El jugador no puede manipularlo desde la consola del navegador."

---

### Minuto 6 — Frontend: `useKeyboard` y `usePolling`

**Qué decir:**

"`useKeyboard` captura eventos `keydown` en `window`. Lo primero que hace es `if (event.repeat) return` para ignorar la repetición automática del teclado. Luego mapea la tecla a una acción con su `playerId` y llama `postAction`. No hay debounce. Cada pulsación distinta es exactamente una acción."

"`usePolling` llama `GET /api/game/:id` cada 500 ms con `setInterval`. Cuando el estado devuelto tiene `status: 'finished'`, limpia el interval y el componente padre muestra la pantalla de resultado. El cleanup del `useEffect` también lo cancela si el componente se desmonta."

**Archivos a mostrar:** `frontend/src/hooks/useKeyboard.ts`, `frontend/src/hooks/usePolling.ts`.

---

### Minuto 7 — Testing: 6 tests E2E

**Qué decir:**

"Hay 6 tests con Playwright. T-01 verifica que la partida arranca. T-02 verifica que el movimiento actualiza la posición. T-03 verifica la estructura de GameState y que el tiempo decrece. T-04 verifica la captura de núcleo. T-05 verifica que una acción inválida devuelve error visible. T-06 verifica la finalización."

"Los tests tienen dos modos: en local y CI usan `NODE_ENV=test` con escenarios deterministas y el endpoint `force-end`. Contra producción no usan ningún mecanismo especial: T-04 calcula la ruta hasta el núcleo con BFS desde el estado real, y T-06 acumula puntos con capturas reales."

**Archivos a mostrar:** `tests/e2e/capture.spec.ts` (ambas ramas), `docs/testing.md`.

---

### Minuto 8 — GitHub Actions y deployment

**Qué decir:**

"Hay tres workflows. `lint.yml` ejecuta ESLint en backend y frontend en cada push. `e2e.yml` hace build completo, arranca el servidor en modo test, espera con `wait-on` y ejecuta Playwright headless. `deploy.yml` hace build y despliega en Railway automáticamente en cada push a `main`."

"Railway usa `railway.toml` con comando de build `npm run build` y start `npm start`. El health check es `GET /health`. La URL pública está en la variable `PRODUCTION_URL`."

**Archivos a mostrar:** `.github/workflows/`, `railway.toml`, URL pública en el navegador.

---

### Minuto 9 — Reactor Pulse y variabilidad

**Qué decir:**

"El Reactor Pulse es el evento de arena. Ocurre una sola vez por partida en un momento aleatorio entre 45 y 75 segundos. Cinco segundos antes activa la advertencia en la UI con countdown. Cuando ocurre, `triggerReactorPulse` destruye todos los destructibles donde la coordenada x o y sea par, con 50% de probabilidad de generar un recurso en cada celda destruida. Después del pulso, el mapa cambia completamente y los recursos redistribuidos crean una segunda fase de competencia."

**Archivos a mostrar:** `backend/src/game/arenaEvent.ts`, advertencia del pulso en el frontend.

---

### Minuto 10 — Preguntas del docente

Ver sección siguiente.

---

## Preguntas frecuentes y respuestas

### "¿Por qué polling y no WebSocket?"

"WebSocket requiere gestión de conexiones persistentes, reconexión automática y estado de sesión, lo que aumenta la complejidad del backend significativamente. Con dos jugadores en el mismo dispositivo, 500 ms de latencia visual es completamente aceptable. REST + polling es más simple, más explicable y cumple todos los requisitos del proyecto."

**Referencia:** `docs/decisiones.md` §1

---

### "¿Por qué no usar base de datos?"

"El proyecto no requiere persistencia entre sesiones. Cada partida es efímera y dura máximo 120 segundos. Una base de datos añadiría configuración, migraciones y complejidad de deployment que está fuera del alcance. El estado en memoria de Node.js es más rápido, más simple y completamente suficiente."

**Referencia:** `docs/decisiones.md` §2

---

### "¿Cómo garantizan que una explosión no hace dos veces daño al mismo jugador?"

"Las celdas afectadas por la explosión se acumulan en un `Set<string>` con clave `'x,y'`. Esto garantiza que cada coordenada solo aparece una vez. Pero además, `applyDamage` comprueba `if (!target.alive) return` al inicio. Si un jugador ya fue procesado y su HP llegó a 0, la segunda llamada no tiene efecto. En la práctica, con el Set de coordenadas, la posición de cada jugador se evalúa como máximo una vez por explosión."

**Referencia:** `docs/requisitos.md` RF-08.8, `backend/src/game/bombs.ts`

---

### "¿Qué pasa si ambos jugadores intentan capturar el mismo núcleo al mismo tiempo?"

"Node.js procesa los callbacks del event loop de forma secuencial, sin paralelismo real. El primer request que llega al event loop captura el núcleo y lo elimina del array. El segundo request, al ejecutarse después, no encuentra ningún núcleo en esa celda y recibe `CORE_NOT_PRESENT`. No hay race condition porque el event loop es single-threaded."

**Referencia:** `docs/decisiones.md` §17, `docs/requisitos.md` RF-06.3

---

### "¿Cómo funciona el Reactor Pulse?"

"Al crear la partida, `scheduleReactorPulse` programa dos `setTimeout`: uno a `delay - 5000 ms` que activa la advertencia visual, y otro al momento exacto que ejecuta `triggerReactorPulse`. Esta función recorre el grid completo, destruye los `destructible` cuya coordenada x o y sea par, con 50% de probabilidad de generar un recurso, y luego pone `arenaEventActive = false` y `arenaEventCountdown = null`. El evento no se reprograma. Si la partida termina antes, `clearGameTimers` cancela ambos timeouts."

**Referencia:** `backend/src/game/arenaEvent.ts`, `docs/reglas.md` §10

---

### "¿Por qué `force-end` no está disponible en producción?"

"Porque si lo estuviera, cualquier usuario podría terminar partidas ajenas o en general manipular el estado del juego desde la consola del navegador con un simple `fetch`. La solución es no registrar la ruta en Express cuando `NODE_ENV !== 'test'`. El módulo `routes/test.ts` se importa estáticamente, pero la llamada `app.use('/api/game', testRouter)` solo se ejecuta dentro del bloque `if (process.env.NODE_ENV === 'test')`. En producción el módulo está cargado en memoria pero ninguna URL lleva a él, por lo que el endpoint es efectivamente inaccesible."

**Referencia:** `docs/decisiones.md` §12, `backend/src/index.ts`

---

### "¿Cómo se cambia la duración de la partida?"

"En `backend/src/game/constants.ts`, cambiar `GAME_DURATION_S`. Todos los módulos que usan la duración importan esta constante. No hay que buscar el número 120 en ningún otro archivo."

**Demostración:** mostrar `constants.ts` y hacer la búsqueda `grep -r "120" backend/src/game/ --include="*.ts"` para confirmar que solo aparece en `constants.ts`.

---

### "¿Cómo se cambia el radio de la bomba?"

"En `constants.ts`, cambiar `BOMB_RADIUS`. La función `computeAffectedCells` en `bombs.ts` usa `BOMB_RADIUS` como límite del loop."

---

### "¿Cómo se garantiza la conectividad del mapa?"

"Después de colocar los destructibles aleatorios, `generateGrid` ejecuta BFS desde el spawn de P1 hasta el spawn de P2. Si no existe camino, elimina destructibles bloqueantes uno a uno hasta que el camino existe. Con un máximo de 50 intentos de eliminación y un fallback que limpia todos los destructibles, el mapa siempre es jugable."

**Referencia:** `backend/src/game/bfs.ts`, `docs/decisiones.md` §9

---

### "¿Dónde se toman las decisiones importantes del juego?"

"Todas en el backend. La validación de movimientos, el cálculo de explosiones, la detección de victoria, los puntos de eliminación, el respawn de núcleos, el Reactor Pulse: todo ocurre en Express. El frontend es puramente reactivo: recibe el estado, lo renderiza, captura teclas y envía requests. No tiene lógica de juego propia."

**Referencia:** `docs/arquitectura.md` §responsabilidades

---

### "¿Cómo se evita que el frontend haga trampa modificando reglas?"

"El frontend no tiene acceso a las reglas. No sabe cuántos puntos vale capturar un núcleo, no sabe el radio de la bomba, no sabe cuándo termina la partida. Solo envía requests al backend y recibe el estado resultante. Toda la validación ocurre en el servidor. El frontend podría enviar cualquier acción, pero si no es válida, el backend la rechaza con 400 o 409."

---

## Modificaciones que el docente puede pedir

Todas se hacen cambiando una constante en `backend/src/game/constants.ts` y haciendo `npm run build`:

| Solicitud | Constante | Valor actual |
|---|---|---|
| Cambiar duración | `GAME_DURATION_S` | `120` |
| Cambiar puntaje de victoria | `VICTORY_SCORE` | `25` |
| Cambiar radio de bomba | `BOMB_RADIUS` | `2` |
| Cambiar timer de bomba | `BOMB_TIMER_S` | `3` |
| Cambiar puntos por núcleo | `SCORE_CAPTURE_CORE` | `5` |
| Cambiar puntos por kill | `SCORE_KILL` | `10` |
| Cambiar puntos por recurso | `SCORE_PICKUP_RESOURCE` | `1` |
| Cambiar timing del Reactor Pulse | `REACTOR_PULSE_MIN_S`, `REACTOR_PULSE_MAX_S` | `45`, `75` |
| Cambiar duración del escudo | `SHIELD_DURATION_MS` | `4000` |
| Cambiar tiempo de respawn de núcleo | `CORE_RESPAWN_MS` | `8000` |
