import { expect, test } from '@playwright/test';

test('the home page loads and shows that the API is up through the Vite proxy', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Welcome' })).toBeVisible();
  await expect(page.getByText('The API is up.')).toBeVisible();
});

test('GET /api/health answers { status: "ok" }', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
});

test('an unknown route shows the 404 page', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
