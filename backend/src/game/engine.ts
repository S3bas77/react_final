import { GameState, PlayerId } from './state';
import { VICTORY_SCORE, SCORE_KILL } from './constants';
import { getGame, setGame, getGameTimers, clearGameTimers } from '../store';

export function checkVictory(state: GameState): void {
  if (state.status !== 'playing') return;
  const s1 = state.players.player1.score;
  const s2 = state.players.player2.score;
  if (s1 >= VICTORY_SCORE) { state.status = 'finished'; state.result = 'player1_wins'; return; }
  if (s2 >= VICTORY_SCORE) { state.status = 'finished'; state.result = 'player2_wins'; return; }
  if (state.timeRemaining <= 0) {
    state.status = 'finished';
    state.result = s1 > s2 ? 'player1_wins' : s2 > s1 ? 'player2_wins' : 'draw';
  }
}

export function applyDamage(
  state:        GameState,
  targetId:     PlayerId,
  amount:       number,
  attackerId:   PlayerId | null,
  bypassShield: boolean = false
): void {
  const target = state.players[targetId];
  if (!target.alive) return;
  if (!bypassShield && target.shieldActive) {
    target.shieldActive = false;
    return;
  }
  target.hp = Math.max(0, target.hp - amount);
  if (target.hp === 0) {
    target.alive = false;
    if (attackerId !== null && attackerId !== targetId) {
      state.players[attackerId].score += SCORE_KILL;
    }
    checkVictory(state);
  }
}

export function startGameLoop(gameId: string): void {
  const timers = getGameTimers(gameId);
  if (!timers) return;

  timers.interval = setInterval(() => {
    const state = getGame(gameId);
    if (!state || state.status !== 'playing') {
      clearGameTimers(gameId);
      return;
    }
    state.timeRemaining = Math.max(0, state.timeRemaining - 1);
    for (const bomb of state.bombs) {
      bomb.timerRemaining = Math.max(0, bomb.timerRemaining - 1);
    }
    if (state.arenaEventCountdown !== null && state.arenaEventCountdown > 0) {
      state.arenaEventCountdown -= 1;
    }
    checkVictory(state);
    setGame(gameId, state);
    if (getGame(gameId)?.status === 'finished') {
      clearGameTimers(gameId);
    }
  }, 1000);
}
