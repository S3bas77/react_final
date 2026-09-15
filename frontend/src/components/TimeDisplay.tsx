import './TimeDisplay.css';

export default function TimeDisplay({
  timeRemaining,
  arenaEventActive,
  arenaEventCountdown,
}: {
  timeRemaining: number;
  arenaEventActive: boolean;
  arenaEventCountdown: number | null;
}) {
  const mm = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
  const ss = (timeRemaining % 60).toString().padStart(2, '0');

  return (
    <div className={`time-display${arenaEventActive ? ' time-display--warning' : ''}`}>
      <span className="time-display__clock">{mm}:{ss}</span>
      <span data-testid="time-remaining">{timeRemaining}</span>

      {arenaEventCountdown !== null && (
        <div data-testid="reactor-warning" className="reactor-warning">
          ⚡ PULSO EN {arenaEventCountdown}s
        </div>
      )}
    </div>
  );
}
