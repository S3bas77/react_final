import { test, expect } from '@playwright/test';

test('T-05 (API): special_action con energía insuficiente', async ({ request }) => {
  const scenario = process.env.TEST_ENV !== 'production'
    ? { scenario: { destructibles: [], cores: [], resources: [] } }
    : {};

  const res = await request.post('/api/game', { data: scenario });
  const { gameId } = await res.json();

  await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'special_action' }
  });

  const errRes = await request.post(`/api/game/${gameId}/action`, {
    data: { playerId: 'player1', type: 'special_action' }
  });

  expect(errRes.status()).toBe(400);
  const body = await errRes.json();
  expect(body.success).toBe(false);
  expect(body.error).toBe('ENERGY_INSUFFICIENT');
  expect(body.message).toBeTruthy();
});

test('T-05 (UI): mensaje de error visible', async ({ page, request }) => {
  await page.goto('/');
  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible();

  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  await page.keyboard.press('e');

  await expect(page.getByTestId('error-player1')).toBeVisible({ timeout: 3000 });
  const errorText = await page.getByTestId('error-player1').textContent();
  expect(errorText).toBeTruthy();
  expect(errorText!.length).toBeGreaterThan(0);
});
