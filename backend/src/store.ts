import { GameState } from './game/state';

interface GameTimerEntry {
  interval:        NodeJS.Timeout | null;
  timeouts:        NodeJS.Timeout[];
  respawningCores: Set<string>;
}

const gameStore  = new Map<string, GameState>();
const timerStore = new Map<string, GameTimerEntry>();
let   currentGameId: string | null = null;

export function getGame(id: string): GameState | undefined {
  return gameStore.get(id);
}

export function setGame(id: string, state: GameState): void {
  gameStore.set(id, state);
}

export function deleteGame(id: string): void {
  gameStore.delete(id);
}

export function getCurrentGameId(): string | null {
  return currentGameId;
}

export function setCurrentGameId(id: string | null): void {
  currentGameId = id;
}

export function initGameTimers(gameId: string): void {
  timerStore.set(gameId, { interval: null, timeouts: [], respawningCores: new Set() });
}

export function getGameTimers(gameId: string): GameTimerEntry | undefined {
  return timerStore.get(gameId);
}

export function clearGameTimers(gameId: string): void {
  const entry = timerStore.get(gameId);
  if (!entry) return;
  if (entry.interval) clearInterval(entry.interval);
  for (const t of entry.timeouts) clearTimeout(t);
  entry.respawningCores.clear();
  timerStore.delete(gameId);
}
