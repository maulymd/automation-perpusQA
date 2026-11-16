import { test, expect } from '@playwright/test';

test('seed - login sebagai admin perpus/Pustakawan', async ({ page }) => {
  await page.goto('https://playground.aminhamzah.com/login-perpus.html');
  await page.getByLabel('Username').fill('pustakawan');
  await page.getByLabel('Password').fill('pustaka123');
  await page.getByRole('button', { name: 'Masuk' }).click();
});