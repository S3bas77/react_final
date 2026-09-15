import { BombState } from '../types';
import './Sprites.css';

export default function BombSprite({ bomb }: { bomb: BombState }) {
  const variant =
    bomb.timerRemaining >= 3 ? 'bomb--safe'
    : bomb.timerRemaining === 2 ? 'bomb--warn'
    : 'bomb--danger';

  return <div className={`bomb ${variant}`} />;
}
