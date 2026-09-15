import { test, expect } from '@playwright/test';
import { findPath } from './helpers/bfs';

test('T-06 (local): finalización via force-end', async ({ page, request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  const res = await request.post('/api/game', { data: {} });
  const { gameId } = await res.json();

  const forceRes = await request.post(`/api/game/${gameId}/test/force-end`);
  expect(forceRes.ok()).toBe(true);
  const { state } = await forceRes.json();
  expect(state.status).toBe('finished');
  expect(['player1_wins', 'player2_wins', 'draw']).toContain(state.result);
});

test('T-06 (local): pantalla de resultado via polling', async ({ page, request }) => {
  if (process.env.TEST_ENV === 'production') test.skip();

  const responsePromise = page.waitForResponse(
    res => res.url().includes('/api/game') && res.request().method() === 'POST' && !res.url().includes('/action') && !res.url().includes('/force-end')
  );

  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible({ timeout: 3000 });

  const response = await responsePromise;
  const body = await response.json();
  const frontendGameId: string = body.gameId;
  expect(frontendGameId).toBeTruthy();

  const forceRes = await request.post(`/api/game/${frontendGameId}/test/force-end`);
  expect(forceRes.ok()).toBe(true);

  await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 2000 });
  await expect(page.getByTestId('result-screen')).toContainText(
    /jugador|empate/i
  );
  await expect(page.getByRole('button', { name: /nueva partida/i })).toBeVisible();
});

test('T-06 (prod): finalización por victoria anticipada', async ({ page, request }) => {
  if (process.env.TEST_ENV !== 'production') test.skip();

  // Capturar el gameId real de la partida que el frontend crea al pulsar "Iniciar partida",
  // para jugar sobre ESA misma partida y no crear una segunda (modelo de partida única).
  const responsePromise = page.waitForResponse(
    res => res.url().includes('/api/game') && res.request().method() === 'POST' && !res.url().includes('/action') && !res.url().includes('/force-end')
  );

  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  const response = await responsePromise;
  const body = await response.json();
  const gameId: string = body.gameId;
  expect(gameId).toBeTruthy();

  let current = body.state;
  let attempts = 0;
  const MAX_ATTEMPTS = 100;

  while (
    current.players.player1.score < 25 &&
    current.status === 'playing' &&
    attempts < MAX_ATTEMPTS
  ) {
    attempts++;

    if (current.cores.length === 0) {
      await new Promise(r => setTimeout(r, 1000));
      const poll = await request.get(`/api/game/${gameId}`);
      current = await poll.json();
      continue;
    }

    const p1 = current.players.player1;
    let target = current.cores[0];
    for (const core of current.cores) {
      const d1 = Math.abs(target.x - p1.x) + Math.abs(target.y - p1.y);
      const d2 = Math.abs(core.x - p1.x)   + Math.abs(core.y - p1.y);
      if (d2 < d1) target = core;
    }

    const path = findPath(current.grid, p1, target);
    if (!path) {
      await new Promise(r => setTimeout(r, 500));
      const poll = await request.get(`/api/game/${gameId}`);
      current = await poll.json();
      continue;
    }

    for (const direction of path) {
      const r = await request.post(`/api/game/${gameId}/action`, {
        data: { playerId: 'player1', type: 'move', payload: { direction } }
      });
      const b = await r.json();
      if (b.state) current = b.state;
      if (current.status === 'finished') break;
    }

    if (current.status === 'finished') break;

    const cap = await request.post(`/api/game/${gameId}/action`, {
      data: { playerId: 'player1', type: 'capture_core' }
    });
    const capBody = await cap.json();
    if (capBody.state) current = capBody.state;
  }

  await expect(page.getByTestId('result-screen')).toBeVisible({ timeout: 5000 });
  expect(current.status).toBe('finished');
}, { timeout: 120_000 });
