import { Router } from 'express';
import { createGame } from '../game/factory';
import { getGame } from '../store';
import { processAction } from '../game/actions';
import { GameActionError, ActionRequest, TestScenario } from '../game/state';

const router = Router();

router.post('/', (req, res) => {
  const scenario: TestScenario | undefined =
    process.env.NODE_ENV === 'test' ? req.body?.scenario : undefined;
  const state = createGame(scenario);
  res.status(200).json({ gameId: state.gameId, state });
});

router.get('/:gameId', (req, res) => {
  const state = getGame(req.params.gameId);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  res.status(200).json(state);
});

router.post('/:gameId/action', (req, res) => {
  try {
    const state = processAction(req.params.gameId, req.body as ActionRequest);
    res.status(200).json({ success: true, state });
  } catch (err) {
    if (err instanceof GameActionError) {
      return res.status(err.httpStatus).json({
        success: false,
        error:   err.code,
        message: err.message
      });
    }
    res.status(500).json({ success: false, error: 'INTERNAL', message: 'Error interno.' });
  }
});

export default router;
