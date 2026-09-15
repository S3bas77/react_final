import { test, expect } from '@playwright/test';

test('T-02: movimiento válido', async ({ request }) => {
  const createRes = await request.post('/api/game', {
    data: {}
  });
  expect(createRes.ok()).toBe(true);
  const { gameId, state } = await createRes.json();

  const initialX = state.players.player1.x;
  const initialY = state.players.player1.y;

  const moveRes = await request.post(`/api/game/${gameId}/action`, {
    data: {
      playerId: 'player1',
      type: 'move',
      payload: { direction: 'right' }
    }
  });
  expect(moveRes.ok()).toBe(true);
  const { success, state: newState } = await moveRes.json();

  expect(success).toBe(true);
  expect(newState.players.player1.x).toBe(initialX + 1);
  expect(newState.players.player1.y).toBe(initialY);
});
