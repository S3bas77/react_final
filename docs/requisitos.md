# Requisitos funcionales y no funcionales — Reactor Rush v1.0

> Documento de referencia definitivo. Todos los requisitos aquí documentados han sido aprobados.
> OpenCode debe implementar exactamente lo que está especificado. No agregar funcionalidades fuera de este documento.

---

## RF-01 — Ciclo de vida de la partida

**RF-01.1** El sistema soporta exactamente una partida activa en memoria a la vez.

**RF-01.2** El `gameId` es generado por el backend al crear la partida usando `crypto.randomUUID()`.

**RF-01.3** El estado de la partida tiene tres valores posibles: `playing`, `finished`.

**RF-01.4** Al llamar `POST /api/game`, el backend genera el estado inicial y responde con `{ gameId, state }`. La partida pasa inmediatamente a `playing`.

**RF-01.5** La partida pasa a `finished` cuando:
- el tiempo restante llega a 0, o
- un jugador alcanza 25 puntos (victoria anticipada).

**RF-01.6** Al terminar, el backend calcula el resultado: `player1_wins`, `player2_wins` o `draw`.

**RF-01.7** Empate: ambos jugadores tienen la misma puntuación cuando el tiempo llega a 0.

**RF-01.8** El frontend detecta `status: 'finished'` mediante polling y muestra la pantalla de resultado.

**RF-01.9** Desde la pantalla de resultado existe un botón "Nueva partida" que llama `POST /api/game` y reinicia el ciclo.

**RF-01.10** Al crear una nueva partida, todos los timers de la partida anterior deben cancelarse antes de iniciar los nuevos.

---

## RF-02 — Arena

**RF-02.1** La arena es una cuadrícula de 15 columnas × 11 filas. Coordenadas `(x, y)`. El grid se indexa como `grid[y][x]`.

**RF-02.2** Tipos de celda: `empty`, `wall`, `destructible`.

**RF-02.3** El borde exterior completo (fila 0, fila 10, columna 0, columna 14) es siempre `wall`.

**RF-02.4** Las posiciones interiores donde `x` es par y `y` es par (con `x ∈ [2,12]` y `y ∈ [2,8]`) son siempre `wall`. Este patrón es fijo y no varía entre partidas.

**RF-02.5** Entre 15 y 25 celdas interiores elegibles se marcan como `destructible` de forma aleatoria en cada partida.

**RF-02.6** Las celdas adyacentes ortogonales a cada spawn (y los propios spawns) nunca contienen `destructible`. Zona de seguridad P1: `(1,1)` y sus 4 vecinos. Zona de seguridad P2: `(13,9)` y sus 4 vecinos.

**RF-02.7** Después de colocar destructibles, se ejecuta BFS desde `(1,1)` hasta `(13,9)` para verificar conectividad. Si no existe camino, se eliminan destructibles bloqueantes hasta que exista.

**RF-02.8** Los núcleos y recursos solo se colocan en celdas `empty` alcanzables desde `(1,1)` según el BFS.

**RF-02.9** Las explosiones convierten celdas `destructible` en `empty`. Las celdas `wall` no son afectadas.

---

## RF-03 — Jugadores

**RF-03.1** Jugador 1 (P1) comienza en `(1,1)`. Jugador 2 (P2) comienza en `(13,9)`.

**RF-03.2** Estado inicial de cada jugador:

| Atributo | Valor inicial | Máximo |
|---|---|---|
| `hp` | 3 | 3 |
| `energy` | 5 | 10 |
| `resources` | 0 | sin límite |
| `score` | 0 | sin límite |
| `bombAvailable` | `true` | — |
| `shieldActive` | `false` | — |
| `alive` | `true` | — |

**RF-03.3** Los atributos `hp`, `energy`, `resources` y `score` son conceptos completamente separados. Ninguno se convierte automáticamente en otro.

**RF-03.4** Cuando `hp` llega a 0, `alive` pasa inmediatamente a `false`. El jugador no puede realizar ninguna acción más.

**RF-03.5** Dos jugadores no pueden ocupar la misma celda simultáneamente.

**RF-03.6** Ambos jugadores actúan de forma simultánea e independiente. No existen turnos ni campo `activePlayer`.

---

## RF-04 — Controles

**RF-04.1** Controles de Jugador 1:

| Tecla | Acción |
|---|---|
| `W` | Mover arriba |
| `A` | Mover izquierda |
| `S` | Mover abajo |
| `D` | Mover derecha |
| `F` | Colocar bomba |
| `G` | Capturar núcleo |
| `E` | Acción especial |

**RF-04.2** Controles de Jugador 2:

| Tecla | Acción |
|---|---|
| `ArrowUp` | Mover arriba |
| `ArrowLeft` | Mover izquierda |
| `ArrowDown` | Mover abajo |
| `ArrowRight` | Mover derecha |
| `L` | Colocar bomba |
| `K` | Capturar núcleo |
| `O` | Acción especial |

**RF-04.3** El frontend captura eventos `keydown`. Cada tecla genera exactamente un request `POST /api/game/:gameId/action`.

**RF-04.4** Se debe ignorar `event.repeat === true` para evitar repetición automática del sistema operativo.

**RF-04.5** No se debe usar debounce como mecanismo principal de control de acciones. El juego es de acciones discretas.

---

## RF-05 — Movimiento

**RF-05.1** Cada acción de movimiento desplaza al jugador exactamente una celda en la dirección indicada.

**RF-05.2** El backend valida que la celda destino sea transitable. Un movimiento es inválido si:
- la celda destino está fuera del grid → `MOVE_OUT_OF_BOUNDS`
- la celda destino es `wall` o `destructible` → `MOVE_BLOCKED`
- la celda destino está ocupada por el otro jugador → `MOVE_OCCUPIED`

**RF-05.3** Si un jugador se mueve a una celda con un recurso menor, lo recoge automáticamente como parte del mismo request.

**RF-05.4** Un jugador NO recoge automáticamente un núcleo al pisar su celda. La captura requiere la acción explícita `capture_core`.

---

## RF-06 — Núcleos de energía

**RF-06.1** Al iniciar la partida se colocan exactamente 3 núcleos en posiciones `empty` alcanzables.

**RF-06.2** Capturar un núcleo requiere que el jugador esté en la misma celda que el núcleo y envíe la acción `capture_core`.

**RF-06.3** El primer request `capture_core` válido que llegue al backend captura el núcleo. Si dos requests llegan casi simultáneamente para el mismo núcleo, el primero captura y el segundo recibe error `CORE_NOT_PRESENT` (el núcleo ya no existe en la celda porque fue eliminado por el primer request).

**RF-06.4** Capturar un núcleo otorga: `+5 score` y `+2 energy` (máximo 10).

**RF-06.5** Tras ser capturado, el núcleo desaparece del estado. El backend programa su reaparición en una posición `empty` aleatoria después de 8 segundos.

**RF-06.6** El máximo de núcleos activos simultáneos es 3. Si al ejecutar el respawn ya existen 3 núcleos activos, el respawn no crea un núcleo adicional.

**RF-06.7** Una explosión que alcanza un núcleo lo destruye. El núcleo desaparece y reaparece después de 8 segundos. Destruir un núcleo con una bomba NO otorga puntos.

**RF-06.8** No debe existir doble respawn del mismo núcleo. Si un respawn ya está programado para un `coreId`, no se programa otro.

**Nota sobre `CORE_ALREADY_CAPTURED`**: este código de error fue considerado para el caso en que dos jugadores capturen simultáneamente. Dado que el backend procesa los requests de forma secuencial (Node.js single thread), el segundo request encontrará que el núcleo ya no está en la celda, recibiendo `CORE_NOT_PRESENT`. El código `CORE_ALREADY_CAPTURED` es por tanto redundante con `CORE_NOT_PRESENT` en este diseño y NO se implementa como código separado. Solo existe `CORE_NOT_PRESENT`.

---

## RF-07 — Recursos menores

**RF-07.1** Al iniciar la partida se colocan exactamente 4 recursos menores en posiciones `empty` alcanzables distintas a los núcleos.

**RF-07.2** El tipo de cada recurso se asigna aleatoriamente al generarse con probabilidad 50/50: `energy_pack` o `repair_kit`.

**RF-07.3** Efectos al recoger:

| Tipo | Efecto | Score | Resources++ |
|---|---|---|---|
| `energy_pack` | `+2 energy` (máx 10) | `+1` | `+1` |
| `repair_kit` | `+1 hp` (máx 3) | `+1` | `+1` |

**RF-07.4** Los recursos se recogen automáticamente cuando el jugador se mueve a su celda. No requieren acción explícita.

**RF-07.5** Al ser recogido, el recurso desaparece del estado permanentemente. Los recursos menores no tienen respawn.

**RF-07.6** Cuando una explosión destruye un `destructible`, existe una probabilidad del 50% de que aparezca un recurso menor aleatorio en esa celda.

**RF-07.7** El evento Reactor Pulse también genera recursos menores con 50% de probabilidad al destruir destructibles.

---

## RF-08 — Bombas

**RF-08.1** Cada jugador comienza con `bombAvailable = true` y puede tener como máximo 1 bomba activa simultáneamente.

**RF-08.2** Colocar una bomba no consume `resources` ni `energy`. Solo requiere `bombAvailable = true`.

**RF-08.3** Al colocar una bomba:
- se registra `BombState { id, playerId, x, y, timerRemaining: 3 }` en el estado
- `bombAvailable` del jugador pasa a `false`
- el backend inicia un `setTimeout` de 3000 ms para la explosión

**RF-08.4** `timerRemaining` de la bomba se decrementa en el tick de 1 segundo del engine. Este valor es únicamente visual para el frontend.

**RF-08.5** La explosión tiene radio 2 en forma de cruz (arriba, abajo, izquierda, derecha). No hay explosión diagonal. Se calcula hasta 2 celdas en cada dirección, deteniéndose al encontrar `wall` (el `wall` no se incluye en las celdas afectadas).

**RF-08.6** Las celdas afectadas se acumulan en un `Set<string>` con clave `"x,y"` para garantizar unicidad.

**RF-08.7** Efectos de explosión por tipo de elemento en las celdas afectadas (se procesan en este orden):
1. `destructible` → `empty`. 50% probabilidad de generar recurso menor.
2. Jugadores: si `"px,py"` está en el set → `applyDamage` con máximo 1 daño por jugador por explosión.
3. Núcleos: si están en el set → desaparecen, se programa respawn en 8 s. Sin puntos.
4. Otras bombas: si están en el set → reacción en cadena.

**RF-08.8** Una explosión puede causar como máximo 1 punto de daño a cada jugador, independientemente de cuántas celdas del radio afecten a su posición.

**RF-08.9** El propietario de la bomba puede recibir daño de su propia explosión si está en el radio.

**RF-08.10** Si una explosión alcanza otra bomba activa, esa bomba también explota (reacción en cadena). Profundidad máxima de reacción en cadena: 5 niveles.

**RF-08.11** Después de la explosión: la bomba desaparece del estado y `bombAvailable` del jugador dueño vuelve a `true`.

---

## RF-09 — Daño y eliminación

**RF-09.1** La función `applyDamage(state, targetId, amount, attackerId, bypassShield)` centraliza todo el daño recibido.

**RF-09.2** Si el jugador ya tiene `alive = false` al recibir `applyDamage`, la función retorna sin efecto (idempotente).

**RF-09.3** Si `shieldActive = true` y `bypassShield = false`:
- el escudo se consume (`shieldActive = false`)
- no se aplica daño de hp
- la función retorna

**RF-09.4** Si `bypassShield = true`, el escudo no protege y el daño se aplica normalmente.

**RF-09.5** Cuando `hp` llega a 0:
- `alive = false` inmediatamente
- si `attackerId !== null` y `attackerId !== targetId`: `attacker.score += 10`
- si `attackerId === targetId` (suicidio): no se suman puntos de kill

**RF-09.6** La condición `alive === true` se comprueba antes de asignar `alive = false`, garantizando que el bono de +10 solo se otorga una vez aunque `applyDamage` sea llamado múltiples veces.

**RF-09.7** Eliminación simultánea (ambos jugadores alcanzados por la misma explosión): se procesan en orden fijo `[player1, player2]`. El dueño de la bomba recibe +10 por cada jugador que elimine. Si el dueño también es eliminado en la misma explosión, recibe el daño y sus puntos de kill se acumulan igual.

**RF-09.8** Un jugador con `alive = false` no puede ejecutar ninguna acción. Cualquier intento devuelve `PLAYER_ELIMINATED`.

**RF-09.9** La eliminación de un jugador NO termina la partida. La partida continúa hasta 25 puntos o tiempo 0.

---

## RF-10 — Acción especial

**RF-10.1** Precondición: `energy >= 3`, `alive = true`, `status = 'playing'`. Si no: `ENERGY_INSUFFICIENT`.

**RF-10.2** Coste: `-3 energy` siempre (tanto en modo ofensivo como defensivo).

**RF-10.3** Se calcula la distancia Manhattan al rival: `|px - rx| + |py - ry|`.

**RF-10.4** Modo ofensivo (distancia Manhattan = 1):
- rival pierde `-1 hp` (llamando `applyDamage` con `bypassShield = true`)
- rival pierde `-2 energy` (mínimo 0)
- jugador gana `+2 score`
- el escudo del rival NO protege contra este ataque

**RF-10.5** Modo defensivo (distancia Manhattan > 1):
- `shieldActive = true` para el jugador
- el escudo dura 4 segundos
- el backend registra un `setTimeout` de 4000 ms para desactivar `shieldActive = false`
- el timeout se registra en el registro central de timers de la partida

**RF-10.6** El escudo bloquea el daño de explosiones de bomba (`bypassShield = false`).

**RF-10.7** El escudo NO bloquea el daño del ataque especial ofensivo del rival (`bypassShield = true`).

**RF-10.8** Cuando el escudo absorbe una explosión: se consume (`shieldActive = false`) y el jugador no pierde HP.

---

## RF-11 — Reactor Pulse

**RF-11.1** Ocurre exactamente una vez por partida.

**RF-11.2** El momento exacto se elige aleatoriamente entre 45 y 75 segundos de partida.

**RF-11.3** 5 segundos antes del evento, el backend activa la advertencia:
- `arenaEventActive = true`
- `arenaEventCountdown = 5`

**RF-11.4** El tick del engine decrementa `arenaEventCountdown` cada segundo mientras sea > 0.

**RF-11.5** Al ocurrir el evento, la función `triggerReactorPulse()` ejecuta:
- Para cada celda `(x,y)` donde `grid[y][x] === 'destructible'` y (`x % 2 === 0` OR `y % 2 === 0`): convertir a `empty`. 50% probabilidad de generar recurso menor.
- `arenaEventActive = false`
- `arenaEventCountdown = null`
- El evento NO se reprograma.

**RF-11.6** El evento no afecta: `wall`, jugadores, núcleos ni recursos ya colocados.

**RF-11.7** Si la partida termina antes de que ocurra el evento, los timeouts pendientes se cancelan junto con todos los demás timers.

**RF-11.8** Estado del campo `arenaEventCountdown`:

| `arenaEventActive` | `arenaEventCountdown` | Significado |
|---|---|---|
| `false` | `null` | Sin evento activo |
| `true` | `5..1` | Advertencia activa, cuenta regresiva |
| `true` | `0` | Pulso ocurriendo en este tick |
| `false` | `null` | Post-pulso (idéntico al inicial) |

---

## RF-12 — Puntuación

| Evento | Puntos otorgados a |
|---|---|
| Capturar un núcleo (+5) | jugador que ejecuta `capture_core` |
| Recoger recurso menor (+1) | jugador que se mueve a la celda |
| Eliminar al rival (+10) | jugador cuya acción causó `hp = 0` del rival |
| Ataque especial exitoso (+2) | jugador que usa `special_action` con rival adyacente |

---

## RF-13 — Validaciones y errores

El backend responde con los siguientes códigos de error:

| Código | Condición | HTTP |
|---|---|---|
| `MOVE_BLOCKED` | Celda destino es `wall` o `destructible` | 400 |
| `MOVE_OCCUPIED` | Celda destino está ocupada por el otro jugador | 400 |
| `MOVE_OUT_OF_BOUNDS` | Coordenada destino fuera del grid | 400 |
| `BOMB_ALREADY_ACTIVE` | El jugador ya tiene una bomba activa (`bombAvailable = false`) | 400 |
| `CORE_NOT_PRESENT` | No hay núcleo en la celda actual del jugador | 400 |
| `ENERGY_INSUFFICIENT` | `energy < 3` al usar `special_action` | 400 |
| `PLAYER_ELIMINATED` | El jugador tiene `alive = false` | 400 |
| `GAME_NOT_PLAYING` | `status !== 'playing'` | 409 |
| `GAME_NOT_FOUND` | El `gameId` no existe en el store | 404 |

**Nota sobre `BOMB_NOT_AVAILABLE`**: Este código fue mencionado en versiones anteriores del diseño como alternativa a `BOMB_ALREADY_ACTIVE`. Son el mismo caso semántico. Se usa únicamente `BOMB_ALREADY_ACTIVE`. `BOMB_NOT_AVAILABLE` no se implementa.

**Nota sobre `CORE_ALREADY_CAPTURED`**: Ver RF-06. No se implementa como código separado. El caso queda cubierto por `CORE_NOT_PRESENT`.

**RF-13.1** El frontend debe mostrar el mensaje de error del jugador correspondiente durante al menos 2 segundos en el HUD del jugador que realizó la acción inválida.

---

## RF-14 — API REST

Ver documento completo en `docs/api.md`.

Endpoints requeridos:

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/game` | Crear nueva partida |
| `GET` | `/api/game/:gameId` | Obtener estado actual |
| `POST` | `/api/game/:gameId/action` | Enviar acción de jugador |
| `POST` | `/api/game/:gameId/test/force-end` | Solo `NODE_ENV=test`: forzar fin |

---

## RF-15 — Frontend

**RF-15.1** El frontend es una SPA React + TypeScript servida por Express en producción.

**RF-15.2** Pantallas: `start` (inicio), `game` (partida), `result` (resultado).

**RF-15.3** El frontend usa `fetch` nativo para toda comunicación con el backend. No se usa Axios.

**RF-15.4** El frontend hace polling cada 500 ms a `GET /api/game/:gameId` para actualizar el estado.

**RF-15.5** El polling se detiene automáticamente cuando `status === 'finished'`.

**RF-15.6** Elementos dinámicos que el frontend debe renderizar:
1. Jugadores cambiando de posición `(x, y)`.
2. Bombas con countdown visual basado en `timerRemaining` (color cambia en 3s, 2s, 1s).
3. Núcleos apareciendo y desapareciendo según `state.cores`.
4. Recursos apareciendo y desapareciendo según `state.resources`.
5. Reactor Pulse: advertencia cuando `arenaEventCountdown !== null`, cambio del grid tras el pulso.

**RF-15.7** El frontend NO interpola ni predice movimientos. Todo el estado viene del backend vía polling.

---

## RF-16 — Testing E2E

Ver documento completo en `docs/testing.md`.

Tests requeridos: T-01 a T-06. Ver sección de testing para especificación detallada.

---

## RF-17 — GitHub Actions

Tres workflows requeridos:

1. `lint.yml` — ESLint en backend y frontend.
2. `e2e.yml` — Build, arranque, Playwright headless.
3. `deploy.yml` — Build y deploy a Railway en push a `main`.

---

## RNF — Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | El estado del juego reside exclusivamente en memoria del proceso Express. No hay base de datos. |
| RNF-02 | Solo existe una partida activa en memoria a la vez. |
| RNF-03 | La aplicación completa es accesible desde una única URL (Express sirve el build de Vite). |
| RNF-04 | No se usan WebSockets, SSE ni ninguna comunicación bidireccional. |
| RNF-05 | No se usan: React Router, Redux, Axios, Bootstrap, Tailwind, motores de juego, librerías de física, librerías de lógica de juego. |
| RNF-06 | Todo el código está en TypeScript (backend y frontend). |
| RNF-07 | Los estilos son CSS propio. No se usan frameworks de CSS. |
| RNF-08 | Las decisiones críticas del juego (validaciones, puntuación, timers, explosiones) están en el backend. |
| RNF-09 | El polling del frontend tiene intervalo de 500 ms. |
| RNF-10 | Los valores configurables del juego están centralizados en `backend/src/game/constants.ts`. |

---

## Alcance excluido explícitamente

Lo siguiente NO forma parte del proyecto y NO debe implementarse:

- WebSockets o SSE
- Base de datos o persistencia entre sesiones
- Autenticación, sesiones o usuarios registrados
- Modo de un jugador o IA como oponente
- Múltiples partidas simultáneas
- Soporte multidispositivo (ambos jugadores en el mismo teclado)
- Sonido o música
- Animaciones complejas (CSS transitions simples son aceptables)
- Canvas, Phaser, Three.js, Matter.js o cualquier motor gráfico
- Matchmaking
- Chat entre jugadores
- Estadísticas persistentes
- Cualquier funcionalidad no mencionada explícitamente en este documento
