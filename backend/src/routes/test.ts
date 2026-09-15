import { Router } from 'express';
import { getGame, setGame } from '../store';
import { checkVictory } from '../game/engine';

const router = Router();

router.post('/:gameId/test/force-end', (req, res) => {
  const state = getGame(req.params.gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  state.timeRemaining = 0;
  checkVictory(state);
  setGame(req.params.gameId, state);
  res.status(200).json({ success: true, state });
});

export default router;
