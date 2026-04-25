import { expect, test } from '@playwright/test';

const roomLandings = [
  { path: '/studio', heading: 'The Studio', navLabel: 'Studio' },
  { path: '/garden', heading: 'The Garden', navLabel: 'Garden' },
  { path: '/study', heading: 'The Study', navLabel: 'Study' },
  { path: '/salon', heading: 'The Salon', navLabel: 'Salon' },
] as const;

const mobileCriticalPages = [
  '/',
  '/studio',
  '/garden',
  '/study',
  '/salon',
  '/salon/arvo-part-and-the-room-between-notes',
] as const;

test('home navigation reaches each room landing', async ({ page }) => {
  for (const room of roomLandings) {
    await page.goto('/');
    await page.getByRole('link', { name: room.navLabel }).click();
    await expect(page).toHaveURL(new RegExp(`${room.path}/?$`));
    await expect(page.getByRole('heading', { name: room.heading })).toBeVisible();
  }
});

test('salon sample rows open detail pages and return to the room', async ({ page }) => {
  await page.goto('/salon');

  await page.locator('a[href="/salon/arvo-part-and-the-room-between-notes"]').click();
  await expect(page).toHaveURL(/\/salon\/arvo-part-and-the-room-between-notes\/?$/);
  await expect(
    page.getByRole('heading', { name: /Arvo Pärt and the room between notes/i }),
  ).toBeVisible();

  await page.getByRole('link', { name: /← The Salon/i }).click();
  await expect(page).toHaveURL(/\/salon\/?$/);
  await expect(page.getByRole('heading', { name: 'The Salon' })).toBeVisible();
});

test('critical pages stay within the viewport without horizontal overflow', async ({ page }) => {
  for (const path of mobileCriticalPages) {
    await page.goto(path);

    const metrics = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const main = document.querySelector('main');
      const navBox = nav?.getBoundingClientRect();
      const mainBox = main?.getBoundingClientRect();

      return {
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        navLeft: navBox?.left ?? 0,
        navRight: navBox?.right ?? 0,
        mainLeft: mainBox?.left ?? 0,
        mainRight: mainBox?.right ?? 0,
      };
    });

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
    expect(metrics.navLeft).toBeGreaterThanOrEqual(-1);
    expect(metrics.mainLeft).toBeGreaterThanOrEqual(-1);
    expect(metrics.navRight).toBeLessThanOrEqual(metrics.innerWidth + 1);
    expect(metrics.mainRight).toBeLessThanOrEqual(metrics.innerWidth + 1);
  }
});
