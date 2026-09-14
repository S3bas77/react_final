# Reglas del juego — Reactor Rush v1.0

> Este documento es la referencia definitiva de las reglas del juego.
> Cualquier contradicción con documentos anteriores debe resolverse a favor de este documento.

---

## 1. Arena

La arena es una cuadrícula de **15 columnas × 11 filas**.

Las coordenadas se expresan como `(x, y)` donde `x` es la columna (0-14) e `y` es la fila (0-10). El grid se almacena como `grid[y][x]`.

### Tipos de celda

| Tipo | Descripción |
|---|---|
| `wall` | Obstáculo indestructible. No transitable. Detiene explosiones. |
| `destructible` | Obstáculo destruible. No transitable. Detiene explosiones pero se destruye al ser alcanzado. |
| `empty` | Celda libre. Transitable. |

### Estructura fija

- El borde exterior completo (fila 0, fila 10, columna 0, columna 14) es siempre `wall`.
- Las posiciones interiores donde `x % 2 === 0` y `y % 2 === 0`, con `x ∈ [2,12]` e `y ∈ [2,8]`, son siempre `wall`.
- Esta estructura interna es idéntica en todas las partidas.

### Destructibles aleatorios

- Entre 15 y 25 celdas interiores elegibles se marcan como `destructible` en cada partida de forma aleatoria.
- Las zonas de seguridad de los spawns están protegidas: las celdas `(1,1)`, `(2,1)`, `(0,1)`, `(1,0)`, `(1,2)` y las celdas `(13,9)`, `(14,9)`, `(12,9)`, `(13,8)`, `(13,10)` nunca contienen `destructible`.
- El backend verifica mediante BFS que existe un camino de `(1,1)` a `(13,9)`. Si no existe, elimina destructibles bloqueantes hasta que se garantice la conectividad.

---

## 2. Spawns

| Jugador | Posición inicial |
|---|---|
| Jugador 1 (P1) | `(1, 1)` |
| Jugador 2 (P2) | `(13, 9)` |

---

## 3. Estado inicial de cada jugador

| Atributo | Valor inicial | Máximo |
|---|---|---|
| HP | 3 | 3 |
| Energy | 5 | 10 |
| Resources | 0 | ilimitado |
| Score | 0 | ilimitado |
| Bomb available | `true` | — |
| Shield active | `false` | — |
| Alive | `true` | — |

---

## 4. Movimiento

Cada pulsación de tecla de movimiento desplaza al jugador exactamente **una celda** en la dirección indicada.

### Reglas de movimiento

- Solo se puede mover a celdas `empty`.
- No se puede atravesar `wall`.
- No se puede atravesar `destructible`.
- No se puede salir del mapa.
- No se puede mover a una celda ocupada por el otro jugador.

### Recolección automática

Si el jugador se mueve a una celda que contiene un recurso menor (`energy_pack` o `repair_kit`), lo recoge automáticamente como parte del mismo movimiento.

Si el jugador se mueve a una celda que contiene un núcleo, **NO lo captura automáticamente**. Debe usar explícitamente la acción `G` (P1) o `K` (P2).

### Errores de movimiento

| Código | Condición |
|---|---|
| `MOVE_BLOCKED` | La celda destino es `wall` o `destructible` |
| `MOVE_OCCUPIED` | La celda destino está ocupada por el otro jugador |
| `MOVE_OUT_OF_BOUNDS` | La coordenada destino está fuera del grid (x < 0, x > 14, y < 0, y > 10) |

---

## 5. Núcleos de energía

### Estado inicial

Al inicio de la partida se colocan **3 núcleos** en posiciones `empty` alcanzables.

### Captura

1. El jugador debe estar en la misma celda `(x, y)` que el núcleo.
2. El jugador debe presionar `G` (P1) o `K` (P2) para ejecutar `capture_core`.
3. El primer request válido captura el núcleo. Un segundo request simultáneo recibe `CORE_NOT_PRESENT`.

### Efecto de la captura

- `+5 score`
- `+2 energy` (máximo 10)
- El núcleo desaparece del estado inmediatamente.
- El núcleo reaparece en una posición `empty` aleatoria después de **8 segundos**.

### Destrucción por explosión

- Si una explosión alcanza un núcleo, el núcleo desaparece.
- No se otorgan puntos por destruir un núcleo con una bomba.
- El núcleo reaparece después de **8 segundos** igual que si hubiera sido capturado.

### Límites

- Máximo 3 núcleos activos simultáneamente.
- Si al ejecutar el respawn ya existen 3 núcleos activos, el respawn no se ejecuta.
- No puede haber doble respawn del mismo núcleo.

### Error

| Código | Condición |
|---|---|
| `CORE_NOT_PRESENT` | No hay núcleo en la celda actual del jugador |

---

## 6. Recursos menores

### Estado inicial

Al inicio de la partida se colocan **4 recursos menores** en posiciones `empty` alcanzables.

### Tipos y efectos

| Tipo | Efecto | Score | Resources++ |
|---|---|---|---|
| `energy_pack` | `+2 energy` (máximo 10) | `+1` | `+1` |
| `repair_kit` | `+1 hp` (máximo 3) | `+1` | `+1` |

### Recolección

- Los recursos se recogen **automáticamente** al entrar en su celda durante un movimiento.
- No requieren acción explícita.
- Al recogerlo, el recurso desaparece del estado permanentemente (no tiene respawn).

### Generación durante la partida

- Cuando una explosión destruye un `destructible`: **50% de probabilidad** de que aparezca un recurso menor aleatorio en esa celda.
- El Reactor Pulse también puede generar recursos menores con 50% de probabilidad al destruir destructibles.

---

## 7. Bombas

### Disponibilidad

- Cada jugador comienza con `bombAvailable = true`.
- Solo puede haber **1 bomba activa por jugador** a la vez.
- Colocar una bomba hace `bombAvailable = false`.
- Cuando la bomba explota, `bombAvailable` vuelve a `true`.
- Colocar una bomba **NO** consume `resources` ni `energy`.

### Colocación

- La bomba se coloca en la celda actual del jugador.
- Si `bombAvailable = false`: error `BOMB_ALREADY_ACTIVE`.

### Temporizador

- La bomba explota después de **3 segundos**.
- El campo `timerRemaining` de la bomba se decrementa visualmente cada segundo (solo para el frontend).
- El temporizador real es un `setTimeout` en Express.

### Radio de explosión

- La explosión se propaga en **forma de cruz**: arriba, abajo, izquierda, derecha.
- Radio: **2 celdas** en cada dirección.
- Las `wall` **detienen** la explosión (no se incluyen en las celdas afectadas).
- Los `destructible` **son alcanzados** por la explosión pero **detienen** la propagación posterior en esa dirección.
- No hay explosión diagonal.

### Efectos de la explosión (procesados en orden)

1. **Destructibles**: cada `destructible` en el radio → pasa a `empty`. 50% de probabilidad de generar recurso menor.
2. **Jugadores**: cada jugador cuya posición `(x,y)` esté en el radio → pierde 1 HP (máximo 1 daño por jugador por explosión).
3. **Núcleos**: cada núcleo en el radio → desaparece, programa respawn en 8 s. Sin puntos.
4. **Otras bombas**: cada bomba en el radio → explota (reacción en cadena).

### Daño único garantizado

Una sola explosión causa como máximo **1 punto de daño a cada jugador**, independientemente de cuántas celdas del radio coincidan con la posición del jugador.

### Daño propio

El jugador que colocó la bomba puede recibir daño de su propia explosión si está en el radio.

### Reacción en cadena

Si una explosión alcanza otra bomba activa, esa bomba también explota. Profundidad máxima de recursión: **5 niveles**.

### Error

| Código | Condición |
|---|---|
| `BOMB_ALREADY_ACTIVE` | El jugador ya tiene una bomba activa (`bombAvailable = false`) |

---

## 8. Daño, escudo y eliminación

### Función applyDamage

Toda reducción de HP pasa por `applyDamage(state, targetId, amount, attackerId, bypassShield)`.

### Escudo

- `shieldActive = true` bloquea 1 daño de explosión de bomba.
- Al absorber el daño, el escudo se consume (`shieldActive = false`).
- El escudo **NO protege** contra el ataque especial ofensivo del rival (`bypassShield = true`).

### Eliminación

Cuando HP llega a 0:
- `alive = false` inmediatamente.
- El jugador no puede realizar ninguna acción más.
- Si el atacante es distinto al jugador eliminado: el atacante recibe `+10 score`.
- El bonus de +10 se otorga exactamente una vez por eliminación.

### Eliminación simultánea

Si una misma explosión elimina a ambos jugadores:
- Se procesan en orden fijo `[player1, player2]`.
- El dueño de la bomba recibe +10 por cada jugador efectivamente eliminado.
- La condición `alive === true` antes de procesar garantiza que no se otorga el bonus dos veces.

### La partida continúa

La eliminación de un jugador **no termina la partida**. El juego continúa hasta que se alcancen 25 puntos o expire el tiempo.

---

## 9. Acción especial

### Costo

- Siempre cuesta **3 energy**.
- Si `energy < 3`: error `ENERGY_INSUFFICIENT`. La acción no se ejecuta.

### Comportamiento ofensivo (rival adyacente)

Si la distancia Manhattan al rival es exactamente 1:
- El rival pierde **1 HP** (bypass del escudo).
- El rival pierde **2 energy** (mínimo 0).
- El jugador gana **+2 score**.

El ataque ofensivo ignora el escudo del rival.

### Comportamiento defensivo (rival no adyacente)

Si la distancia Manhattan al rival es mayor que 1:
- El jugador obtiene `shieldActive = true`.
- El escudo dura **4 segundos**.
- Después de 4 segundos, `shieldActive` vuelve a `false` automáticamente.

### Error

| Código | Condición |
|---|---|
| `ENERGY_INSUFFICIENT` | `energy < 3` |

---

## 10. Reactor Pulse

### Descripción

El Reactor Pulse es un evento especial de la arena que ocurre **una sola vez por partida**.

### Programación

- El momento exacto se elige aleatoriamente entre **45 y 75 segundos** de partida.
- 5 segundos antes del evento se activa la advertencia visual.

### Advertencia

- `arenaEventActive = true`
- `arenaEventCountdown = 5`
- El contador decrece 1 por segundo.
- El frontend debe mostrar el countdown de forma prominente.

### Efecto

Al ocurrir el pulso, la función `triggerReactorPulse()` ejecuta:
- Para cada celda `(x,y)` del grid donde `grid[y][x] === 'destructible'` y (`x % 2 === 0` OR `y % 2 === 0`): la celda pasa a `empty`. 50% probabilidad de generar recurso menor.
- `arenaEventActive = false`
- `arenaEventCountdown = null`

### Lo que NO afecta

- `wall` (no se destruyen).
- Jugadores (no reciben daño).
- Núcleos (no desaparecen).
- Recursos ya colocados (no desaparecen).

### Una sola vez

El evento no se repite. No hay segundo Reactor Pulse en la misma partida.

---

## 11. Puntuación

| Evento | Puntos | Receptor |
|---|---|---|
| Capturar núcleo | +5 | Jugador que ejecuta `capture_core` |
| Recoger recurso menor | +1 | Jugador que se mueve a la celda |
| Eliminar rival (hp → 0) | +10 | Jugador cuya acción causó la eliminación |
| Ataque especial exitoso | +2 | Jugador que usa `special_action` con rival adyacente |

---

## 12. Condiciones de finalización

### Duración

La partida dura **120 segundos**. El tiempo decrece 1 segundo por tick del backend.

### Victoria anticipada

Si un jugador alcanza **25 puntos**, la partida termina inmediatamente con ese jugador como ganador.

### Fin por tiempo

Cuando `timeRemaining` llega a 0:
- Mayor puntuación → ganador.
- Puntuación igual → empate.

### Resultados posibles

| Resultado | Condición |
|---|---|
| `player1_wins` | P1 tiene más puntos al terminar, o P1 llega a 25 primero |
| `player2_wins` | P2 tiene más puntos al terminar, o P2 llega a 25 primero |
| `draw` | Ambos jugadores tienen la misma puntuación cuando el tiempo llega a 0 |

---

## 13. Errores globales

Además de los errores específicos de cada acción, todas las acciones comparten estas validaciones:

| Código | Condición | HTTP |
|---|---|---|
| `GAME_NOT_PLAYING` | `status !== 'playing'` | 409 |
| `PLAYER_ELIMINATED` | `alive === false` | 400 |
| `GAME_NOT_FOUND` | El `gameId` no existe | 404 |

---

## 14. Decisiones de diseño confirmadas

### CORE_ALREADY_CAPTURED no existe

Dado que Node.js procesa requests de forma secuencial, el segundo request que intenta capturar el mismo núcleo simplemente encontrará que ya no existe en la celda. El error devuelto es `CORE_NOT_PRESENT`. No se implementa un código separado `CORE_ALREADY_CAPTURED`.

### BOMB_NOT_AVAILABLE no existe

Este código es redundante con `BOMB_ALREADY_ACTIVE`. Solo se usa `BOMB_ALREADY_ACTIVE`.

### No hay movimiento continuo

El juego es de acciones discretas. Cada `keydown` es exactamente una acción. Se filtra `event.repeat` para evitar repetición automática del sistema operativo.

### No hay activePlayer

Ambos jugadores pueden actuar simultáneamente. No hay concepto de turno ni de jugador activo.
