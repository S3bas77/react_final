import { CellType, PlayerId, ResourceState } from './state';
import {
  BOMB_TIMER_S,
  BOMB_RADIUS,
  RESOURCE_SPAWN_CHANCE,
  CHAIN_REACTION_MAX_DEPTH,
  CORE_RESPAWN_MS,
} from './constants';
import { getGame, setGame, getGameTimers } from '../store';
import { applyDamage, checkVictory } from './engine';
import { scheduleRespawn } from './cores';

const DIRECTIONS = [[0, -1], [0, 1], [-1, 0], [1, 0]] as const;

function createRandomResource(x: number, y: number): ResourceState {
  return {
    id:   crypto.randomUUID(),
    x, y,
    type: Math.random() < 0.5 ? 'energy_pack' : 'repair_kit'
  };
}

export function computeAffectedCells(
  grid: CellType[][],
  bx: number,
  by: number
): Set<string> {
  const affected = new Set<string>([`${bx},${by}`]);

  for (const [dx, dy] of DIRECTIONS) {
    for (let step = 1; step <= BOMB_RADIUS; step++) {
      const x = bx + dx * step;
      const y = by + dy * step;

      if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) break;

      const cell = grid[y][x];
      if (cell === 'wall') break;
      if (cell === 'destructible') {
        affected.add(`${x},${y}`);
        break;
      }
      affected.add(`${x},${y}`);
    }
  }

  return affected;
}

export function scheduleBomb(gameId: string, bombId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;
  const t = setTimeout(() => triggerExplosion(gameId, bombId, 0), BOMB_TIMER_S * 1000);
  timers.timeouts.push(t);
}

export function triggerExplosion(gameId: string, bombId: string, depth: number = 0): void {
  if (depth > CHAIN_REACTION_MAX_DEPTH) return;

  const state = getGame(gameId);
  if (!state || state.status !== 'playing') return;

  const bomb = state.bombs.find((b) => b.id === bombId);
  if (!bomb) return;

  const affected = computeAffectedCells(state.grid, bomb.x, bomb.y);

  for (const key of affected) {
    const [x, y] = key.split(',').map(Number);
    if (state.grid[y][x] === 'destructible') {
      state.grid[y][x] = 'empty';
      if (Math.random() < RESOURCE_SPAWN_CHANCE) {
        state.resources.push(createRandomResource(x, y));
      }
    }
  }

  for (const id of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[id];
    if (affected.has(`${p.x},${p.y}`)) {
      applyDamage(state, id, 1, bomb.playerId, false);
    }
  }

  for (const core of [...state.cores]) {
    if (affected.has(`${core.x},${core.y}`)) {
      state.cores = state.cores.filter((c) => c.id !== core.id);
      scheduleRespawn(state.gameId, core.id, CORE_RESPAWN_MS);
    }
  }

  const otherBombs = state.bombs.filter((b) => b.id !== bombId && affected.has(`${b.x},${b.y}`));
  for (const otherBomb of otherBombs) {
    state.bombs = state.bombs.filter((b) => b.id !== otherBomb.id);
    state.players[otherBomb.playerId].bombAvailable = true;
    triggerExplosion(gameId, otherBomb.id, depth + 1);
  }

  state.bombs = state.bombs.filter((b) => b.id !== bombId);
  state.players[bomb.playerId].bombAvailable = true;

  checkVictory(state);
  setGame(gameId, state);
}
