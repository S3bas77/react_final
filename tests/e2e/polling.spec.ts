import { test, expect } from '@playwright/test';

test('T-03: estructura del estado', async ({ request }) => {
  const res = await request.post('/api/game', { data: {} });
  const { state } = await res.json();

  expect(state).toHaveProperty('gameId');
  expect(state).toHaveProperty('status', 'playing');
  expect(state).toHaveProperty('timeRemaining');
  expect(state).toHaveProperty('result', null);
  expect(state).toHaveProperty('players.player1');
  expect(state).toHaveProperty('players.player2');
  expect(state).toHaveProperty('bombs');
  expect(state).toHaveProperty('cores');
  expect(state).toHaveProperty('resources');
  expect(state).toHaveProperty('grid');
  expect(state).toHaveProperty('arenaEventActive');
  expect(state).toHaveProperty('arenaEventCountdown');

  expect(state.players.player1.x).toBe(1);
  expect(state.players.player1.y).toBe(1);
  expect(state.players.player1.hp).toBe(3);
  expect(state.players.player1.energy).toBe(5);
  expect(state.players.player1.score).toBe(0);
  expect(state.players.player1.alive).toBe(true);

  expect(state.players.player2.x).toBe(13);
  expect(state.players.player2.y).toBe(9);

  expect(state.grid).toHaveLength(11);
  expect(state.grid[0]).toHaveLength(15);
});

test('T-03: tiempo decrece (polling UI)', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  const t1text = await page.getByTestId('time-remaining').textContent();
  expect(t1text).not.toBeNull();
  const t1 = Number(t1text!.trim());
  expect(Number.isNaN(t1)).toBe(false);
  expect(t1).toBeGreaterThan(0);

  await page.waitForTimeout(1600);

  const t2text = await page.getByTestId('time-remaining').textContent();
  expect(t2text).not.toBeNull();
  const t2 = Number(t2text!.trim());
  expect(Number.isNaN(t2)).toBe(false);
  expect(t2).toBeLessThan(t1);
});
