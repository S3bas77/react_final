# Matriz de trazabilidad — Reactor Rush v1.0

> Cada requisito aprobado está mapeado a: regla → módulo backend → componente frontend → endpoint → test → documentación.
> Permite verificar que ningún requisito quedó sin representación en el proyecto.
>
> Estado tras la auditoría final de OpenCode (TASK-050): todos los módulos backend y
> componentes frontend referenciados en esta matriz existen e integran el build. Los
> endpoints están implementados y devuelven los códigos documentados. Los tests T-01 a
> T-06 están implementados y las ramas local/CI se ejecutan en verde (`npm run test:e2e`).
> Las ramas de producción (T-04 y T-06 adaptativos) se ejecutaron en TASK-048 contra el
> deployment activo en `https://reactor-rush-production.up.railway.app`: 8 passed, 0 failed,
> 3 skipped (ramas locales).

---

## Formato de cada entrada

```
Requisito ID | Regla | Backend | Frontend | Endpoint | Test | Doc
```

---

## Partida y ciclo de vida

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Crear partida | RF-01.4 | `factory.ts` → `createGame()` | `StartScreen` → `postGame()` | `POST /api/game` | T-01 | `api.md`, `requisitos.md` |
| Una partida activa | RF-01.2 | `store.ts` → `currentGameId` | — | — | — | `decisiones.md` §16 |
| Limpiar timers al reiniciar | RF-01.10 | `store.ts` → `clearGameTimers()` | — | `POST /api/game` | — | `arquitectura.md` §timers |
| Pantalla start | RF-15.2 | — | `StartScreen.tsx` | — | T-01 | `requisitos.md` RF-15 |
| Pantalla game | RF-15.2 | — | `GameScreen.tsx` | — | T-01 | `requisitos.md` RF-15 |
| Pantalla result | RF-15.2 | — | `ResultScreen.tsx` | — | T-06 | `requisitos.md` RF-15 |
| Polling 500 ms | RF-15.4 | — | `usePolling.ts` | `GET /api/game/:id` | T-03 | `requisitos.md` RF-15.4 |
| Detener polling al terminar | RF-15.5 | — | `usePolling.ts` limpia interval | — | T-06 | `testing.md` |

---

## Arena y grid

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Grid 15×11 | RF-02.1 | `factory.ts` → `generateGrid()` | `Arena.tsx` (15 cols, 11 filas) | — | T-03 | `reglas.md` §1 |
| Borde wall | RF-02.3 | `generateGrid()` | `Arena.tsx` clase `cell--wall` | — | T-03 | `reglas.md` §1 |
| Patrón interno wall | RF-02.4 | `generateGrid()` | `Arena.tsx` | — | — | `reglas.md` §1 |
| Destructibles aleatorios (15-25) | RF-02.5 | `generateGrid()` | `Arena.tsx` clase `cell--destructible` | — | — | `reglas.md` §1 |
| Zona de seguridad spawns | RF-02.6 | `generateGrid()` | — | — | — | `reglas.md` §1 |
| BFS conectividad | RF-02.7 | `bfs.ts` → `bfsReachable()` | — | — | — | `arquitectura.md`, `decisiones.md` §9 |
| Accesibilidad núcleos/recursos | RF-02.8 | `bfs.ts` → `getReachableCells()` | — | — | — | `reglas.md` §1 |
| Destructible → empty al explotar | RF-02.9 | `bombs.ts` → `triggerExplosion()` | `Arena.tsx` re-renderiza grid | — | — | `reglas.md` §7 |

---

## Jugadores

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Spawns P1(1,1) P2(13,9) | RF-03.1 | `factory.ts` → `createGame()` | `Arena.tsx` posición inicial | — | T-03 | `reglas.md` §2 |
| HP inicial 3, max 3 | RF-03.2 | `constants.ts` `INITIAL_HP`, `MAX_HP` | `PlayerHUD.tsx` corazones | — | T-03 | `reglas.md` §3 |
| Energy inicial 5, max 10 | RF-03.2 | `constants.ts` | `PlayerHUD.tsx` barra | — | T-04 | `reglas.md` §3 |
| Score inicial 0 | RF-03.2 | `factory.ts` | `PlayerHUD.tsx` | — | T-04 | `reglas.md` §3 |
| bombAvailable inicial true | RF-03.2 | `factory.ts` | `PlayerHUD.tsx` indicador bomba | — | — | `reglas.md` §3 |
| alive=false cuando hp=0 | RF-03.4 | `engine.ts` → `applyDamage()` | `PlayerSprite.tsx` clase dead | — | — | `reglas.md` §8 |
| Sin misma celda | RF-03.5 | `actions.ts` error `MOVE_OCCUPIED` | — | `POST .../action` | — | `reglas.md` §4 |
| Sin turnos / simultáneo | RF-03.6 | No hay `activePlayer` | Ambos `keydown` activos | — | — | `decisiones.md` §17 |

---

## Controles e input

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Teclas P1 WASD+FGE | RF-04.1 | `actions.ts` recibe `playerId:'player1'` | `useKeyboard.ts` KEY_MAP | `POST .../action` | T-02 | `reglas.md` §controles |
| Teclas P2 flechas+LKO | RF-04.2 | `actions.ts` recibe `playerId:'player2'` | `useKeyboard.ts` KEY_MAP | `POST .../action` | T-02 | `reglas.md` §controles |
| Filtrar event.repeat | RF-04.4 | — | `useKeyboard.ts` `if (e.repeat) return` | — | — | `requisitos.md` RF-04.4 |
| Sin debounce | RF-04.5 | — | `useKeyboard.ts` sin setTimeout | — | — | `decisiones.md` §controles |

---

## Movimiento

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| 1 celda por acción | RF-05.1 | `processMove()` delta ±1 | — | `POST .../action` | T-02 | `reglas.md` §4 |
| Error MOVE_OUT_OF_BOUNDS | RF-05.2 | `processMove()` bounds check | `GameScreen` muestra error | `POST .../action` | — | `reglas.md` §4 |
| Error MOVE_BLOCKED | RF-05.2 | `processMove()` cell type check | `GameScreen` muestra error | `POST .../action` | — | `reglas.md` §4 |
| Error MOVE_OCCUPIED | RF-05.2 | `processMove()` rival check | `GameScreen` muestra error | `POST .../action` | — | `reglas.md` §4 |
| Auto-recolectar recurso al mover | RF-05.3 | `processMove()` resource pickup | `PlayerHUD` actualiza stats | `POST .../action` | — | `reglas.md` §4 |
| No auto-captura núcleo | RF-05.4 | `processMove()` no captura | — | — | T-04 | `reglas.md` §4 |

---

## Núcleos

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| 3 núcleos iniciales | RF-06.1 | `factory.ts` `INITIAL_CORE_COUNT` | `Arena.tsx` `CoreSprite` | — | T-04 | `reglas.md` §5 |
| capture_core explícito | RF-06.2 | `processCaptureCore()` | `useKeyboard` G/K | `POST .../action` | T-04 | `reglas.md` §5 |
| Primer request gana (CORE_NOT_PRESENT) | RF-06.3 | `processCaptureCore()` busca en array | — | — | — | `decisiones.md` §17 |
| +5 score +2 energy en captura | RF-06.4 | `processCaptureCore()` | `PlayerHUD` | — | T-04 | `reglas.md` §11 |
| Respawn 8s tras captura | RF-06.5 | `cores.ts` → `scheduleRespawn()` | `Arena.tsx` reaparece | — | — | `reglas.md` §5 |
| Max 3 núcleos activos | RF-06.6 | `cores.ts` → `respawnCore()` check | — | — | — | `reglas.md` §5 |
| Respawn 8s tras explosión | RF-06.7 | `bombs.ts` → `scheduleRespawn()` | — | — | — | `reglas.md` §5 |
| Sin puntos por destruir núcleo | RF-06.7 | `triggerExplosion()` no suma score | — | — | — | `reglas.md` §5 |
| Sin doble respawn | RF-06.8 | `store.ts` → `respawningCores: Set` | — | — | — | `arquitectura.md` §timers |

---

## Recursos

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| 4 recursos iniciales | RF-07.1 | `factory.ts` `INITIAL_RESOURCE_COUNT` | `Arena.tsx` `ResourceSprite` | — | — | `reglas.md` §6 |
| energy_pack +2 energy +1 score | RF-07.3 | `processMove()` pickup | `PlayerHUD` | — | — | `reglas.md` §6 |
| repair_kit +1 hp +1 score | RF-07.3 | `processMove()` pickup | `PlayerHUD` | — | — | `reglas.md` §6 |
| Auto-recolección al pisar | RF-07.4 | `processMove()` | — | — | — | `reglas.md` §6 |
| Recurso desaparece al recoger | RF-07.5 | `processMove()` filter | `Arena.tsx` | — | — | `reglas.md` §6 |
| 50% recurso al destruir destructible | RF-07.6 | `triggerExplosion()` | `Arena.tsx` | — | — | `reglas.md` §6 |
| 50% recurso en Reactor Pulse | RF-07.7 | `triggerReactorPulse()` | `Arena.tsx` | — | — | `reglas.md` §6 |

---

## Bombas

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Max 1 bomba activa | RF-08.1 | `processPlaceBomb()` `bombAvailable` | `PlayerHUD` indicador | — | — | `reglas.md` §7 |
| Sin coste de resources | RF-08.2 | `processPlaceBomb()` no resta | — | — | — | `reglas.md` §7 |
| BombState registrado con timer | RF-08.3 | `processPlaceBomb()` push | `Arena.tsx` `BombSprite` | — | — | `reglas.md` §7 |
| timerRemaining decrementado por tick | RF-08.4 | `engine.ts` tick | `BombSprite` color | — | — | `reglas.md` §7 |
| Explosión radio 2 en cruz | RF-08.5 | `bombs.ts` → `computeAffectedCells()` | — | — | — | `reglas.md` §7 |
| Wall detiene explosión | RF-08.5 | `computeAffectedCells()` break | — | — | — | `reglas.md` §7 |
| Error BOMB_ALREADY_ACTIVE | RF-08.3 | `processPlaceBomb()` | `GameScreen` error | — | — | `reglas.md` §7 |
| Max 1 daño por jugador | RF-08.8 | `triggerExplosion()` Set + alive check | — | — | — | `reglas.md` §7 |
| Daño propio posible | RF-08.9 | `applyDamage()` no excluye owner | — | — | — | `reglas.md` §7 |
| Reacción en cadena max 5 | RF-08.10 | `triggerExplosion(depth)` | — | — | — | `reglas.md` §7 |
| Restaurar bombAvailable tras explosión | RF-08.11 | `triggerExplosion()` al final | `PlayerHUD` | — | — | `reglas.md` §7 |

---

## Daño y eliminación

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| applyDamage centralizado | RF-09.1 | `engine.ts` → `applyDamage()` | — | — | — | `requisitos.md` RF-09 |
| Idempotente si alive=false | RF-09.2 | `if (!target.alive) return` | — | — | — | `requisitos.md` RF-09 |
| Shield absorbe (no bypass) | RF-09.3 | `applyDamage(bypassShield=false)` | `PlayerSprite` shield | — | — | `reglas.md` §8 |
| bypassShield ignora shield | RF-09.4 | `applyDamage(bypassShield=true)` | — | — | — | `reglas.md` §8 |
| alive=false cuando hp=0 | RF-09.5 | `applyDamage()` | `PlayerSprite` dead | — | — | `reglas.md` §8 |
| +10 al atacante por kill | RF-09.5 | `applyDamage()` `attackerId` | `PlayerHUD` score | — | — | `reglas.md` §11 |
| +10 solo una vez (alive check) | RF-09.6 | `applyDamage()` `alive===true` guard | — | — | — | `requisitos.md` RF-09 |
| Eliminación simultánea determinista | RF-09.7 | Orden fijo `[p1, p2]` en `triggerExplosion` | — | — | — | `reglas.md` §8 |
| PLAYER_ELIMINATED | RF-09.8 | `validateCommon()` | `GameScreen` error | — | T-05 | `requisitos.md` RF-13 |
| Partida continúa tras eliminación | RF-09.9 | `applyDamage()` no llama `checkVictory` early | — | — | — | `reglas.md` §8 |

---

## Acción especial

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Costo 3 energy | RF-10.2 | `processSpecialAction()` | `PlayerHUD` energy | — | T-05 | `reglas.md` §9 |
| ENERGY_INSUFFICIENT | RF-10.1 | `processSpecialAction()` | `GameScreen` error | — | T-05 | `reglas.md` §9 |
| Ataque si dist Manhattan=1 | RF-10.4 | `processSpecialAction()` | — | — | — | `reglas.md` §9 |
| Rival -1 HP bypassShield | RF-10.4 | `applyDamage(bypassShield=true)` | — | — | — | `reglas.md` §9 |
| Rival -2 energy (min 0) | RF-10.4 | `processSpecialAction()` | — | — | — | `reglas.md` §9 |
| Atacante +2 score | RF-10.4 | `processSpecialAction()` | `PlayerHUD` | — | — | `reglas.md` §11 |
| Escudo si dist>1 | RF-10.5 | `processSpecialAction()` shield=true | `PlayerSprite` shield indicator | — | — | `reglas.md` §9 |
| Shield 4s → false | RF-10.5 | `setTimeout(4000)` en `actions.ts` | — | — | — | `reglas.md` §9 |
| Shield NO protege vs special_action | RF-10.7 | `bypassShield=true` | — | — | — | `reglas.md` §9 |

---

## Reactor Pulse

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| Una vez por partida | RF-11.1 | `arenaEvent.ts` no reprograma | — | — | — | `reglas.md` §10 |
| Random 45-75 segundos | RF-11.2 | `scheduleReactorPulse()` | — | — | — | `reglas.md` §10 |
| Advertencia 5s antes | RF-11.3 | `activateWarning()` | `TimeDisplay` `reactor-warning` | — | — | `reglas.md` §10 |
| arenaEventCountdown decrece | RF-11.4 | `engine.ts` tick | `TimeDisplay` | — | T-03 | `reglas.md` §10 |
| triggerReactorPulse() aislado | RF-11.5 | `arenaEvent.ts` función separada | — | — | — | `decisiones.md` §11 |
| Solo x par OR y par | RF-11.5 | `triggerReactorPulse()` condition | `Arena.tsx` refleja grid | — | — | `reglas.md` §10 |
| 50% recurso al pulso | RF-11.5 | `createRandomResource()` | `Arena.tsx` | — | — | `reglas.md` §6 |
| No afecta wall/jugadores/cores/resources | RF-11.6 | `triggerReactorPulse()` solo destructible | — | — | — | `reglas.md` §10 |
| Limpieza si partida termina antes | RF-11.7 | `clearGameTimers()` cancela timeout | — | — | — | `arquitectura.md` §timers |
| Estado arenaEvent documentado | RF-11.8 | `GameState.arenaEventActive/Countdown` | `TimeDisplay` | — | T-03 | `modelo-datos.md` |

---

## API y validaciones

| Requisito | Regla de referencia | Módulo backend | Componente frontend | Endpoint | Test | Documento |
|---|---|---|---|---|---|---|
| GAME_NOT_PLAYING → 409 | RF-13, RF-01.3 | `validateCommon()` | — | Todos los POST | — | `api.md` |
| GAME_NOT_FOUND → 404 | RF-13 | Router check | — | Todos | — | `api.md` |
| Respuesta con `{ success, error, message }` | `docs/api.md` | Router `catch` | `GameScreen` error display | — | T-05 | `api.md` |
| Error visible 2 segundos | RF-13.1 | — | `GameScreen.tsx` setTimeout | — | T-05 | `requisitos.md` RF-13.1 |
| TestScenario solo en test | RF-14 | `factory.ts` condicional | — | `POST /api/game` | T-04 local | `api.md`, `decisiones.md` §12 |
| force-end solo en test | RF-14 | `index.ts` condicional | — | `.../test/force-end` | T-06 local | `api.md`, `decisiones.md` §12 |

---

## Constantes configurables (defensa oral)

| Constante | Valor | Archivo | Efecto al cambiar |
|---|---|---|---|
| `GAME_DURATION_S` | 120 | `constants.ts` | Duración total de la partida |
| `VICTORY_SCORE` | 25 | `constants.ts` | Puntos para victoria anticipada |
| `BOMB_TIMER_S` | 3 | `constants.ts` | Segundos hasta explosión |
| `BOMB_RADIUS` | 2 | `constants.ts` | Celdas de radio de explosión |
| `SHIELD_DURATION_MS` | 4000 | `constants.ts` | Duración del escudo en ms |
| `SCORE_CAPTURE_CORE` | 5 | `constants.ts` | Puntos por capturar núcleo |
| `SCORE_KILL` | 10 | `constants.ts` | Puntos por eliminar rival |
| `SCORE_PICKUP_RESOURCE` | 1 | `constants.ts` | Puntos por recoger recurso |
| `SCORE_SPECIAL_HIT` | 2 | `constants.ts` | Puntos por ataque especial exitoso |
| `REACTOR_PULSE_MIN_S` | 45 | `constants.ts` | Límite mínimo del pulso |
| `REACTOR_PULSE_MAX_S` | 75 | `constants.ts` | Límite máximo del pulso |
| `CORE_RESPAWN_MS` | 8000 | `constants.ts` | Tiempo de respawn de núcleos |
| `INITIAL_CORE_COUNT` | 3 | `constants.ts` | Núcleos al iniciar |
| `INITIAL_RESOURCE_COUNT` | 4 | `constants.ts` | Recursos al iniciar |
