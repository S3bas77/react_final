import { GameState, ActionRequest, PlayerId, PlayerState, Direction, GameActionError } from './state';
import { getGame, setGame, getGameTimers } from '../store';
import { checkVictory, applyDamage } from './engine';
import { scheduleBomb } from './bombs';
import { scheduleRespawn } from './cores';
import {
  GRID_COLS,
  GRID_ROWS,
  MAX_ENERGY,
  MAX_HP,
  SCORE_PICKUP_RESOURCE,
  ENERGY_PACK_REGEN,
  REPAIR_KIT_REGEN,
  SCORE_CAPTURE_CORE,
  ENERGY_CAPTURE_CORE,
  CORE_RESPAWN_MS,
  ENERGY_SPECIAL_COST,
  ENERGY_SPECIAL_HIT_DRAIN,
  SCORE_SPECIAL_HIT,
  SHIELD_DURATION_MS,
  BOMB_TIMER_S,
} from './constants';

function validateCommon(state: GameState, playerId: PlayerId): void {
  if (state.status !== 'playing')
    throw new GameActionError('GAME_NOT_PLAYING', 'La partida ya ha terminado.', 409);
  if (!state.players[playerId].alive)
    throw new GameActionError('PLAYER_ELIMINATED', 'El jugador ha sido eliminado y no puede actuar.', 400);
}

export function processAction(gameId: string, req: ActionRequest): GameState {
  const state = getGame(gameId);
  if (!state)
    throw new GameActionError('GAME_NOT_FOUND', 'Partida no encontrada.', 404);

  validateCommon(state, req.playerId);
  const player = state.players[req.playerId];

  switch (req.type) {
    case 'move':           processMove(state, player, req.payload?.direction as Direction); break;
    case 'place_bomb':     processPlaceBomb(state, player); break;
    case 'capture_core':   processCaptureCore(state, player); break;
    case 'special_action': processSpecialAction(state, player); break;
    default:
      throw new GameActionError('UNKNOWN_ACTION', 'Tipo de acción desconocido.', 400);
  }

  setGame(gameId, state);
  return state;
}

export function processMove(
  state: GameState,
  player: PlayerState,
  direction: 'up' | 'down' | 'left' | 'right'
): void {
  let nx = player.x;
  let ny = player.y;

  if (direction === 'up')         ny = player.y - 1;
  else if (direction === 'down')  ny = player.y + 1;
  else if (direction === 'left')  nx = player.x - 1;
  else if (direction === 'right') nx = player.x + 1;

  if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) {
    throw new GameActionError('MOVE_OUT_OF_BOUNDS', 'La celda destino está fuera del tablero.', 400);
  }

  if (state.grid[ny][nx] === 'wall' || state.grid[ny][nx] === 'destructible') {
    throw new GameActionError('MOVE_BLOCKED', 'No puedes moverte a esa celda.', 400);
  }

  const rival = player.id === 'player1' ? state.players.player2 : state.players.player1;
  if (rival.x === nx && rival.y === ny) {
    throw new GameActionError('MOVE_OCCUPIED', 'La celda destino está ocupada por el rival.', 400);
  }

  player.x = nx;
  player.y = ny;

  const resource = state.resources.find((r) => r.x === nx && r.y === ny);
  if (resource) {
    if (resource.type === 'energy_pack') {
      player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_PACK_REGEN);
    } else {
      player.hp = Math.min(MAX_HP, player.hp + REPAIR_KIT_REGEN);
    }
    player.score += SCORE_PICKUP_RESOURCE;
    player.resources += 1;
    state.resources = state.resources.filter((r) => !(r.x === nx && r.y === ny));
  }
}

export function processPlaceBomb(state: GameState, player: PlayerState): void {
  if (!player.bombAvailable) {
    throw new GameActionError('BOMB_ALREADY_ACTIVE', 'Ya tienes una bomba activa.', 400);
  }

  const bomb = {
    id: crypto.randomUUID(),
    playerId: player.id,
    x: player.x,
    y: player.y,
    timerRemaining: BOMB_TIMER_S,
  };

  state.bombs.push(bomb);
  player.bombAvailable = false;
  scheduleBomb(state.gameId, bomb.id);
}

export function processCaptureCore(state: GameState, player: PlayerState): void {
  const core = state.cores.find((c) => c.x === player.x && c.y === player.y);
  if (!core) {
    throw new GameActionError('CORE_NOT_PRESENT', 'No hay ningún núcleo en tu posición.', 400);
  }

  state.cores = state.cores.filter((c) => c.id !== core.id);
  player.score += SCORE_CAPTURE_CORE;
  player.energy = Math.min(MAX_ENERGY, player.energy + ENERGY_CAPTURE_CORE);
  scheduleRespawn(state.gameId, core.id, CORE_RESPAWN_MS);
  checkVictory(state);
}

export function processSpecialAction(state: GameState, player: PlayerState): void {
  if (player.energy < ENERGY_SPECIAL_COST) {
    throw new GameActionError('ENERGY_INSUFFICIENT', 'No tienes suficiente energía para usar la acción especial.', 400);
  }

  player.energy -= ENERGY_SPECIAL_COST;

  const rivalId: PlayerId = player.id === 'player1' ? 'player2' : 'player1';
  const rival = state.players[rivalId];
  const dist = Math.abs(player.x - rival.x) + Math.abs(player.y - rival.y);

  if (dist === 1) {
    applyDamage(state, rivalId, 1, player.id, true);
    rival.energy = Math.max(0, rival.energy - ENERGY_SPECIAL_HIT_DRAIN);
    player.score += SCORE_SPECIAL_HIT;
    checkVictory(state);
  } else if (dist > 1) {
    player.shieldActive = true;
    const timers = getGameTimers(state.gameId);
    if (timers) {
      const t = setTimeout(() => {
        player.shieldActive = false;
        setGame(state.gameId, state);
      }, SHIELD_DURATION_MS);
      timers.timeouts.push(t);
    }
  }
}
