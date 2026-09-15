import { test, expect } from '@playwright/test';

test('T-01: inicio de partida', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Reactor Rush')).toBeVisible();

  await expect(page.getByTestId('start-button')).toBeVisible();

  await page.getByTestId('start-button').click();
  await expect(page.getByTestId('arena')).toBeVisible({ timeout: 3000 });

  await expect(page.getByTestId('player-player1')).toBeVisible();
  await expect(page.getByTestId('player-player2')).toBeVisible();
});
