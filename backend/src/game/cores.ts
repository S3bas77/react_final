import { getGame, setGame, getGameTimers } from '../store';
import { GRID_COLS, GRID_ROWS, MAX_CORE_COUNT } from './constants';

export function scheduleRespawn(gameId: string, coreId: string, delayMs: number): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  if (timers.respawningCores.has(coreId)) return;
  timers.respawningCores.add(coreId);
  const t = setTimeout(() => respawnCore(gameId, coreId), delayMs);
  timers.timeouts.push(t);
}

function respawnCore(gameId: string, coreId: string): void {
  const timers = getGameTimers(gameId);
  if (timers) timers.respawningCores.delete(coreId);

  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;
  if (state.cores.length >= MAX_CORE_COUNT) return;

  const occupied = new Set<string>([
    ...state.cores.map((c) => `${c.x},${c.y}`),
    ...state.resources.map((r) => `${r.x},${r.y}`),
    `${state.players.player1.x},${state.players.player1.y}`,
    `${state.players.player2.x},${state.players.player2.y}`,
    ...state.bombs.map((b) => `${b.x},${b.y}`),
  ]);

  const candidates: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (state.grid[y][x] === 'empty' && !occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) return;
  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  state.cores.push({ id: coreId, x: pos.x, y: pos.y });
  setGame(gameId, state);
}
