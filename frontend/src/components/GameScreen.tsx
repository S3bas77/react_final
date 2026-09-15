import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionResponse, GameState, PlayerId } from '../types';
import { usePolling } from '../hooks/usePolling';
import { useKeyboard } from '../hooks/useKeyboard';
import Arena from './Arena';
import PlayerHUD from './PlayerHUD';
import TimeDisplay from './TimeDisplay';
import './GameScreen.css';

export default function GameScreen({
  gameId,
  initialState,
  onFinish,
}: {
  gameId: string;
  initialState: GameState;
  onFinish: (state: GameState) => void;
}) {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [errors, setErrors] = useState<{ player1: string | null; player2: string | null }>({
    player1: null,
    player2: null,
  });
  const timeoutsRef = useRef<number[]>([]);

  const handleState = useCallback(
    (state: GameState) => {
      setGameState(state);
      if (state.status === 'finished') onFinish(state);
    },
    [onFinish]
  );

  const handleResult = useCallback((res: ActionResponse, playerId: PlayerId) => {
    if (res.success) return;
    setErrors((prev) => ({ ...prev, [playerId]: res.message }));
    const t = window.setTimeout(() => {
      setErrors((prev) => ({ ...prev, [playerId]: null }));
    }, 2000);
    timeoutsRef.current.push(t);
  }, []);

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  usePolling(gameId, handleState);
  useKeyboard(gameId, handleResult);

  return (
    <div className="game-screen">
      <div className="game-screen__top">
        <TimeDisplay
          timeRemaining={gameState.timeRemaining}
          arenaEventActive={gameState.arenaEventActive}
          arenaEventCountdown={gameState.arenaEventCountdown}
        />
      </div>
      <div className="game-screen__left">
        <PlayerHUD
          player={gameState.players.player1}
          label="Jugador 1"
          errorMessage={errors.player1}
        />
      </div>
      <div className="game-screen__arena">
        <Arena state={gameState} />
      </div>
      <div className="game-screen__right">
        <PlayerHUD
          player={gameState.players.player2}
          label="Jugador 2"
          errorMessage={errors.player2}
        />
      </div>
    </div>
  );
}
