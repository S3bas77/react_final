import { PlayerState } from '../types';
import './PlayerHUD.css';

const MAX_HP = 3;
const MAX_ENERGY = 10;

export default function PlayerHUD({
  player,
  label,
  errorMessage,
}: {
  player: PlayerState;
  label: string;
  errorMessage: string | null;
}) {
  const energyPct = (player.energy / MAX_ENERGY) * 100;

  return (
    <div className={`hud hud--${player.id}`}>
      <h2 className="hud__label">{label}</h2>

      <div className="hud__row">
        <span className="hud__key">HP</span>
        <span className="hud__hearts">
          {Array.from({ length: MAX_HP }).map((_, i) => (
            <span key={i} className={i < player.hp ? 'heart heart--full' : 'heart heart--empty'}>
              ♥
            </span>
          ))}
        </span>
      </div>

      <div className="hud__row">
        <span className="hud__key">Energía</span>
        <span className="hud__energy">
          <span className="hud__energy-fill" style={{ width: `${energyPct}%` }} />
        </span>
        <span className="hud__value">{player.energy}</span>
      </div>

      <div className="hud__row">
        <span className="hud__key">Recursos</span>
        <span className="hud__value">{player.resources}</span>
      </div>

      <div className="hud__row">
        <span className="hud__key">Puntos</span>
        <span className="hud__value">{player.score}</span>
      </div>

      <div className="hud__row">
        <span className="hud__key">Bomba</span>
        <span className="hud__value">💣 {player.bombAvailable ? '✓' : '✗'}</span>
      </div>

      {player.shieldActive && <div className="hud__shield">🛡 Escudo activo</div>}

      {!player.alive && <div className="hud__eliminated">ELIMINADO</div>}

      {errorMessage !== null && (
        <div data-testid={`error-${player.id}`} className="hud__error">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
