import { getGame, setGame, getGameTimers } from '../store';
import {
  GRID_COLS,
  GRID_ROWS,
  REACTOR_PULSE_MIN_S,
  REACTOR_PULSE_MAX_S,
  REACTOR_PULSE_WARNING_S,
  RESOURCE_SPAWN_CHANCE,
} from './constants';

export function scheduleReactorPulse(gameId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  const delaySec = REACTOR_PULSE_MIN_S + Math.floor(Math.random() * (REACTOR_PULSE_MAX_S - REACTOR_PULSE_MIN_S + 1));
  const delayMs  = delaySec * 1000;
  const warnMs   = delayMs - REACTOR_PULSE_WARNING_S * 1000;
  const t1 = setTimeout(() => activateWarning(gameId), warnMs);
  const t2 = setTimeout(() => triggerReactorPulse(gameId), delayMs);
  timers.timeouts.push(t1, t2);
}

function activateWarning(gameId: string): void {
  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  state.arenaEventActive    = true;
  state.arenaEventCountdown = REACTOR_PULSE_WARNING_S;
  setGame(gameId, state);
}

export function triggerReactorPulse(gameId: string): void {
  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.grid[y][x] === 'destructible' && (x % 2 === 0 || y % 2 === 0)) {
        state.grid[y][x] = 'empty';
        if (Math.random() < RESOURCE_SPAWN_CHANCE) {
          state.resources.push({
            id: crypto.randomUUID(),
            x, y,
            type: Math.random() < 0.5 ? 'energy_pack' : 'repair_kit',
          });
        }
      }
    }
  }
  state.arenaEventActive    = false;
  state.arenaEventCountdown = null;
  setGame(gameId, state);
}
