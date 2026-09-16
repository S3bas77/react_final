import { useState } from 'react';
import { GameState } from '../types';
import { postGame } from '../api/client';
import './StartScreen.css';

export default function StartScreen({
  onStart,
}: {
  onStart: (gameId: string, state: GameState) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const { gameId, state } = await postGame();
      onStart(gameId, state);
    } catch {
      setError('No se pudo iniciar la partida. Comprueba la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="start-screen">
      <h1 className="start-screen__title">Reactor Rush</h1>
      <p className="start-screen__subtitle">
        Los dos jugadores compiten en la misma arena por capturar núcleos de energía.
        Gana quien alcance 25 puntos o lidere cuando termine el tiempo.
      </p>

      <div className="start-screen__controls">
        <div className="controls-card">
          <h2>Jugador 1</h2>
          <ul>
            <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Moverse</li>
            <li><kbd>F</kbd> Colocar bomba</li>
            <li><kbd>G</kbd> Capturar núcleo</li>
            <li><kbd>E</kbd> Acción especial</li>
          </ul>
        </div>
        <div className="controls-card">
          <h2>Jugador 2</h2>
          <ul>
            <li><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> Moverse</li>
            <li><kbd>L</kbd> Colocar bomba</li>
            <li><kbd>K</kbd> Capturar núcleo</li>
            <li><kbd>O</kbd> Acción especial</li>
          </ul>
        </div>
      </div>

      <button
        data-testid="start-button"
        className="start-screen__button"
        onClick={handleStart}
        disabled={loading}
      >
        Iniciar partida
      </button>

      {error !== null && <div className="start-screen__error">{error}</div>}
    </div>
  );
}
