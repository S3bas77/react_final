import { PlayerState } from '../types';
import './PlayerSprite.css';

export default function PlayerSprite({ player }: { player: PlayerState }) {
  const classes = [
    'player',
    `player--${player.id}`,
    player.shieldActive ? 'player--shielded' : '',
    !player.alive       ? 'player--dead'     : '',
  ].filter(Boolean).join(' ');

  return <div className={classes} data-testid={`player-${player.id}`} />;
}
