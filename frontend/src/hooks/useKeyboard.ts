import { useEffect } from 'react';
import { ActionRequest, ActionResponse, PlayerId } from '../types';
import { postAction } from '../api/client';

const KEY_MAP: Record<string, ActionRequest> = {
  'w': { playerId:'player1', type:'move', payload:{direction:'up'} },
  'a': { playerId:'player1', type:'move', payload:{direction:'left'} },
  's': { playerId:'player1', type:'move', payload:{direction:'down'} },
  'd': { playerId:'player1', type:'move', payload:{direction:'right'} },
  'f': { playerId:'player1', type:'place_bomb' },
  'g': { playerId:'player1', type:'capture_core' },
  'e': { playerId:'player1', type:'special_action' },
  'ArrowUp':    { playerId:'player2', type:'move', payload:{direction:'up'} },
  'ArrowLeft':  { playerId:'player2', type:'move', payload:{direction:'left'} },
  'ArrowDown':  { playerId:'player2', type:'move', payload:{direction:'down'} },
  'ArrowRight': { playerId:'player2', type:'move', payload:{direction:'right'} },
  'l': { playerId:'player2', type:'place_bomb' },
  'k': { playerId:'player2', type:'capture_core' },
  'o': { playerId:'player2', type:'special_action' },
};

export function useKeyboard(
  gameId:   string,
  onResult: (res: ActionResponse, playerId: PlayerId) => void
): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const action = KEY_MAP[e.key];
      if (!action) return;
      e.preventDefault();
      postAction(gameId, action)
        .then(res => onResult(res, action.playerId))
        .catch(console.error);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameId, onResult]);
}
