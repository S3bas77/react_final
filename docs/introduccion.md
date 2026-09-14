# Introducción — Reactor Rush v1.0

## Concepto

Reactor Rush es un juego web competitivo original para dos jugadores locales. Ambos jugadores compiten en una arena de energía nuclear durante una partida limitada por tiempo, intentando acumular más puntos que el rival.

El juego no es un clon de Bomberman. Aunque comparte la mecánica de arenas y bombas como inspiración, las reglas, objetivos y sistema de puntuación son propios:

- El objetivo principal es **capturar núcleos de energía**, no eliminar al rival.
- La eliminación del rival es una acción secundaria que otorga puntos pero no termina la partida.
- Los jugadores deben decidir estratégicamente entre atacar, defender, capturar o controlar zonas.
- El **Reactor Pulse** es un evento de arena propio que cambia el escenario una vez por partida.

## Objetivo del juego

Ganar el jugador que tenga más puntos cuando termine el tiempo de la partida (120 segundos).

La partida puede terminar antes si un jugador alcanza **25 puntos** (victoria anticipada).

Si el tiempo llega a 0 con la misma puntuación para ambos jugadores, el resultado es **empate**.

## Jugadores

- **Jugador 1**: comienza en la esquina superior izquierda `(1,1)`.
- **Jugador 2**: comienza en la esquina inferior derecha `(13,9)`.
- Ambos juegan en el mismo dispositivo usando el mismo teclado.
- No existen turnos. Ambos jugadores pueden actuar de forma simultánea e independiente.

## Controles

### Jugador 1

| Tecla | Acción |
|---|---|
| `W` | Mover arriba |
| `A` | Mover izquierda |
| `S` | Mover abajo |
| `D` | Mover derecha |
| `F` | Colocar bomba |
| `G` | Capturar núcleo de energía |
| `E` | Acción especial |

### Jugador 2

| Tecla | Acción |
|---|---|
| `↑` | Mover arriba |
| `←` | Mover izquierda |
| `↓` | Mover abajo |
| `→` | Mover derecha |
| `L` | Colocar bomba |
| `K` | Capturar núcleo de energía |
| `O` | Acción especial |

## Pantallas

### Pantalla de inicio

Muestra el nombre del juego, el objetivo, los controles de ambos jugadores y el botón "Iniciar partida".

### Pantalla de juego

Ocupa toda la ventana del navegador. Contiene:

- Arena central (cuadrícula 15×11).
- HUD del Jugador 1 (izquierda): HP, energía, recursos, puntuación, estado de bomba, estado de escudo.
- HUD del Jugador 2 (derecha): mismos campos.
- Tiempo restante centrado en la parte superior.
- Área de mensajes: errores y advertencias del evento de arena.

### Pantalla de resultado

Muestra el ganador (o "EMPATE"), las puntuaciones finales de ambos jugadores y el botón "Nueva partida".

## Propuesta original del juego

Reactor Rush presenta tres elementos que lo distinguen de los juegos existentes:

1. **Sistema de captura de núcleos**: los núcleos son el principal objetivo de puntuación. El jugador debe navegar hasta ellos, posicionarse sobre la celda y ejecutar la acción explícita. Los núcleos reaparecen periódicamente, creando competencia continua.

2. **Acción especial dual**: la misma tecla tiene comportamiento diferente según la posición del rival. Si el rival está adyacente, es un ataque. Si no lo está, activa un escudo defensivo. Esta mecánica obliga al jugador a leer constantemente la posición del oponente.

3. **Reactor Pulse**: un evento de arena que ocurre una vez por partida en un momento aleatorio, destruyendo parte del escenario y redistribuyendo recursos. Este evento puede cambiar radicalmente la dinámica de los últimos minutos y genera variabilidad entre partidas.

## Variabilidad entre partidas

Cada partida es diferente gracias a:

- Posiciones aleatorias de destructibles (15-25 por partida).
- Posiciones aleatorias de núcleos y recursos iniciales.
- Timing aleatorio del Reactor Pulse (entre 45 y 75 segundos).
- Recursos que aparecen al destruir destructibles (50% probabilidad).
