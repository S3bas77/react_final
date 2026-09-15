import { useEffect } from 'react';
import { GameState } from '../types';
import { getGame } from '../api/client';

export function usePolling(
  gameId:     string,
  onState:    (state: GameState) => void,
  intervalMs: number = 500
): void {
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const state = await getGame(gameId);
        onState(state);
        if (state.status === 'finished') {
          clearInterval(id);
        }
      } catch {
        // error de red transitorio — continuar polling
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [gameId, onState, intervalMs]);
}
