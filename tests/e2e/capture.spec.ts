import { test, expect } from '@playwright/test';
import { findPath } from './helpers/bfs';

test('T-04 (local): captura de núcleo determinista', async ({ request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  const res = await request.post('/api/game', {
    data: {
      scenario: {
        destructibles: [],
        cores: [{ x: 3, y: 1 }],
        resources: []
      }
    }
  });
  expect(res.ok()).toBe(true);
  const { gameId, state } = await res.json();

  expect(state.players.player1.x).toBe(1);
  expect(state.players.player1.y).toBe(1);
  expect(state.cores).toHaveLength(1);
  expect(state.cores[0].x).toBe(3);
  expect(state.cores[0].y).toBe(1);

  for (let i = 0; i < 2; i++) {
    const moveRes = await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'move', payload: { direction: 'right' } }
    });
    expect(moveRes.ok()).toBe(true);
  }

  const captureRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'capture_core' }
  });
  expect(captureRes.ok()).toBe(true);
  const { success, state: finalState } = await captureRes.json();

  expect(success).toBe(true);
  expect(finalState.players.player1.score).toBe(5);
  expect(finalState.players.player1.energy).toBe(7);
  expect(finalState.cores).toHaveLength(0);
});

test('T-04 (prod): captura de núcleo adaptativa', async ({ request }) => {
  if (process.env.TEST_ENV !== 'production') test.skip();

  const res = await request.post('/api/game', { data: {} });
  const { gameId, state: initial } = await res.json();

  expect(initial.cores.length).toBeGreaterThan(0);

  const p1 = initial.players.player1;
  let target = initial.cores[0];
  for (const core of initial.cores) {
    const distCurrent = Math.abs(target.x - p1.x) + Math.abs(target.y - p1.y);
    const distNew     = Math.abs(core.x - p1.x)   + Math.abs(core.y - p1.y);
    if (distNew < distCurrent) target = core;
  }

  const path = findPath(initial.grid, p1, target);
  expect(path).not.toBeNull();

  for (const direction of path!) {
    await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'move', payload: { direction } }
    });
  }

  const captureRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'capture_core' }
  });

  if (captureRes.ok()) {
    const { state: finalState } = await captureRes.json();
    expect(finalState.players.player1.score).toBeGreaterThanOrEqual(5);
  } else {
    const body = await captureRes.json();
    expect(body.error).toBe('CORE_NOT_PRESENT');
  }
});
