import {
  CellType,
  CoreState,
  GameState,
  PlayerState,
  ResourceState,
  TestScenario,
} from './state';
import {
  GRID_COLS,
  GRID_ROWS,
  P1_SPAWN,
  P2_SPAWN,
  INITIAL_HP,
  INITIAL_ENERGY,
  GAME_DURATION_S,
  INITIAL_CORE_COUNT,
  INITIAL_RESOURCE_COUNT,
  DESTRUCTIBLE_MIN,
  DESTRUCTIBLE_MAX,
} from './constants';
import { bfsReachable, getReachableCells } from './bfs';
import {
  getCurrentGameId,
  clearGameTimers,
  deleteGame,
  setCurrentGameId,
  setGame,
  initGameTimers,
} from '../store';
import { startGameLoop } from './engine';
import { scheduleReactorPulse } from './arenaEvent';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function safetyZone(): Set<string> {
  return new Set<string>([
    '1,1', '2,1', '0,1', '1,0', '1,2',
    '13,9', '14,9', '12,9', '13,8', '13,10',
  ]);
}

export function generateGrid(destructibleOverride?: Array<{ x: number; y: number }>): CellType[][] {
  const grid: CellType[][] = [];

  for (let y = 0; y < GRID_ROWS; y++) {
    const row: CellType[] = [];
    for (let x = 0; x < GRID_COLS; x++) {
      if (x === 0 || x === GRID_COLS - 1 || y === 0 || y === GRID_ROWS - 1) {
        row.push('wall');
      } else if (x % 2 === 0 && y % 2 === 0 && x >= 2 && x <= 12 && y >= 2 && y <= 8) {
        row.push('wall');
      } else {
        row.push('empty');
      }
    }
    grid.push(row);
  }

  if (destructibleOverride) {
    for (const { x, y } of destructibleOverride) {
      if (x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS && grid[y][x] === 'empty') {
        grid[y][x] = 'destructible';
      }
    }
    return grid;
  }

  const safety = safetyZone();
  const candidates: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (grid[y][x] === 'empty' && !safety.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }

  const count = randomInt(DESTRUCTIBLE_MIN, DESTRUCTIBLE_MAX);
  const pool = [...candidates];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const { x, y } = pool.splice(idx, 1)[0];
    grid[y][x] = 'destructible';
  }

  let attempts = 0;
  while (!bfsReachable(grid, P1_SPAWN, P2_SPAWN) && attempts < 50) {
    const destructibles: Array<{ x: number; y: number }> = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (grid[y][x] === 'destructible') destructibles.push({ x, y });
      }
    }
    if (destructibles.length === 0) break;
    const pick = destructibles[Math.floor(Math.random() * destructibles.length)];
    grid[pick.y][pick.x] = 'empty';
    attempts++;
  }

  if (!bfsReachable(grid, P1_SPAWN, P2_SPAWN)) {
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (grid[y][x] === 'destructible') grid[y][x] = 'empty';
      }
    }
  }

  return grid;
}

function pickRandomPositions(
  reachable: Set<string>,
  count: number,
  excluded: Set<string>
): Array<{ x: number; y: number }> {
  const pool: Array<{ x: number; y: number }> = [];
  for (const key of reachable) {
    if (excluded.has(key)) continue;
    const [x, y] = key.split(',').map(Number);
    pool.push({ x, y });
  }

  const result: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

function createPlayer(id: 'player1' | 'player2', x: number, y: number): PlayerState {
  return {
    id,
    x,
    y,
    hp: INITIAL_HP,
    energy: INITIAL_ENERGY,
    resources: 0,
    score: 0,
    bombAvailable: true,
    shieldActive: false,
    alive: true,
  };
}

function randomResourceType(): 'energy_pack' | 'repair_kit' {
  return Math.random() < 0.5 ? 'energy_pack' : 'repair_kit';
}

export function createGame(scenario?: TestScenario): GameState {
  const existing = getCurrentGameId();
  if (existing) {
    clearGameTimers(existing);
    deleteGame(existing);
    setCurrentGameId(null);
  }

  const effectiveScenario = process.env.NODE_ENV === 'test' ? scenario : undefined;

  const gameId = crypto.randomUUID();
  const grid = generateGrid(effectiveScenario?.destructibles);
  const reachable = getReachableCells(grid, P1_SPAWN);

  const excluded = new Set<string>([
    `${P1_SPAWN.x},${P1_SPAWN.y}`,
    `${P2_SPAWN.x},${P2_SPAWN.y}`,
  ]);

  let cores: CoreState[];
  if (effectiveScenario?.cores) {
    cores = effectiveScenario.cores.map((c) => ({ id: crypto.randomUUID(), x: c.x, y: c.y }));
  } else {
    cores = pickRandomPositions(reachable, INITIAL_CORE_COUNT, excluded).map((p) => ({
      id: crypto.randomUUID(),
      x: p.x,
      y: p.y,
    }));
  }
  for (const core of cores) excluded.add(`${core.x},${core.y}`);

  let resources: ResourceState[];
  if (effectiveScenario?.resources) {
    resources = effectiveScenario.resources.map((r) => ({
      id: crypto.randomUUID(),
      x: r.x,
      y: r.y,
      type: r.type,
    }));
  } else {
    resources = pickRandomPositions(reachable, INITIAL_RESOURCE_COUNT, excluded).map((p) => ({
      id: crypto.randomUUID(),
      x: p.x,
      y: p.y,
      type: randomResourceType(),
    }));
  }

  const state: GameState = {
    gameId,
    status: 'playing',
    timeRemaining: GAME_DURATION_S,
    result: null,
    players: {
      player1: createPlayer('player1', P1_SPAWN.x, P1_SPAWN.y),
      player2: createPlayer('player2', P2_SPAWN.x, P2_SPAWN.y),
    },
    bombs: [],
    cores,
    resources,
    grid,
    arenaEventActive: false,
    arenaEventCountdown: null,
  };

  setGame(gameId, state);
  setCurrentGameId(gameId);
  initGameTimers(gameId);
  startGameLoop(gameId);
  scheduleReactorPulse(gameId);

  return state;
}
