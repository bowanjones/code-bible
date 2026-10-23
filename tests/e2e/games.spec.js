// Every game in the Library: it opens, draws something, runs for a moment without
// throwing, and goes back cleanly. Add a game and this covers it automatically.
const { test, expect, startApp, tab, expectView, unlockEverything } = require('./helpers/fixtures');

test('@smoke every game opens, runs briefly, and closes without errors', async ({ page }) => {
  test.setTimeout(180_000);
  await startApp(page);
  await unlockEverything(page);
  await tab(page, 'hub');
  await expect(page.locator('.game-card.locked')).toHaveCount(0);

  const ids = await page.$$eval('.game-card[data-game]', cards => cards.map(c => c.dataset.game));
  expect(ids.length).toBeGreaterThanOrEqual(15);

  for (const id of ids) {
    await test.step(`game: ${id}`, async () => {
      await page.locator(`.game-card[data-game="${id}"]`).click();
      await expectView(page, 'view-arcade');
      await expect(page.locator('#arcadeMount > *').first(), `${id} should draw something`).toBeAttached();
      await page.waitForTimeout(250);                       // let animation loops tick a few frames
      await page.click('#backFromArcade');
      await expectView(page, 'view-hub');
    });
  }
});

test('a game played from a Story stop shows the "mark complete" bar and finishes the stop', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => { Storage.completeBeat('gen1a-read'); Storage.save(); });
  await page.reload();
  await page.click('#storyContinueBtn');
  await expectView(page, 'view-arcade');
  await expect(page.locator('#arcadeBeatBar')).toContainText('Story activity');
  await page.click('#beatBarBtn');
  expect(await page.evaluate(() => Storage.isBeatComplete('gen1a-game'))).toBe(true);
});
