import { GameState } from '../types';
import PlayerSprite from './PlayerSprite';
import BombSprite from './BombSprite';
import CoreSprite from './CoreSprite';
import ResourceSprite from './ResourceSprite';
import './Arena.css';

export default function Arena({ state }: { state: GameState }) {
  const cells = [];

  for (let y = 0; y < state.grid.length; y++) {
    for (let x = 0; x < state.grid[y].length; x++) {
      const player = [state.players.player1, state.players.player2].find(
        (p) => p.x === x && p.y === y
      );
      const bomb = state.bombs.find((b) => b.x === x && b.y === y);
      const core = state.cores.find((c) => c.x === x && c.y === y);
      const resource = state.resources.find((r) => r.x === x && r.y === y);

      cells.push(
        <div
          key={`${x},${y}`}
          className={`cell cell--${state.grid[y][x]}`}
          data-cell-x={x}
          data-cell-y={y}
        >
          {player && <PlayerSprite player={player} />}
          {bomb && <BombSprite bomb={bomb} />}
          {core && <CoreSprite />}
          {resource && <ResourceSprite type={resource.type} />}
        </div>
      );
    }
  }

  return (
    <div data-testid="arena" className="arena">
      {cells}
    </div>
  );
}
