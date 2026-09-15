import { GameState } from '../types';
import './ResultScreen.css';

function resultText(state: GameState): string {
  if (state.result === 'player1_wins') return '¡Jugador 1 gana!';
  if (state.result === 'player2_wins') return '¡Jugador 2 gana!';
  return 'EMPATE';
}

export default function ResultScreen({
  state,
  onNewGame,
}: {
  state: GameState;
  onNewGame: () => void;
}) {
  return (
    <div data-testid="result-screen" className="result-screen">
      <h1 className="result-screen__title">{resultText(state)}</h1>

      <div className="result-screen__scores">
        <div className="score-card score-card--player1">
          <h2>Jugador 1</h2>
          <span className="score-card__value">{state.players.player1.score}</span>
        </div>
        <div className="score-card score-card--player2">
          <h2>Jugador 2</h2>
          <span className="score-card__value">{state.players.player2.score}</span>
        </div>
      </div>

      <button className="result-screen__button" onClick={onNewGame}>
        Nueva partida
      </button>
    </div>
  );
}
