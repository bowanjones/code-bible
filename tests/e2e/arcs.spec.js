// The Story arcs, played the way a reader would: the path runs from Genesis 1
// through Genesis 50, every stop opens, and every finale crossword can be solved.
const fs = require('node:fs');
const path = require('node:path');
const { test, expect, startApp, tab, expectView } = require('./helpers/fixtures');

const kjvDir = fs.readdirSync(path.join(__dirname, '..', '..', 'versions', 'KJV')).find(d => d.endsWith('-Genesis'));
const verseCount = chapter => JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'versions', 'KJV', kjvDir, 'Chapters', `Genesis-${chapter}.json`), 'utf8')).verses.length;

test('@smoke the Story carries on past Genesis 9: finishing Noah leads to Babel', async ({ page }) => {
  await startApp(page);
  await page.evaluate(() => {
    STORY_ARCS.slice(0, 3).forEach(a => a.beats.forEach(b => Storage.completeBeat(b.id, { silent: true })));
    Storage.save();
  });
  await tab(page, 'story');
  await expect(page.locator('#storyContinueBtn')).toBeVisible();
  await page.click('#storyContinueBtn');
  await expectView(page, 'view-story-read');
  await expect(page.locator('#storyReadTitle')).toHaveText('Genesis 10');
  await expect(page.locator('#storyReadBody .verse')).toHaveCount(verseCount(10));
  await page.click('#storyReadNextBtn');
  await expectView(page, 'view-arcade');                                       // the word search that follows
  await expect(page.locator('.ws-cell')).toHaveCount(169);
});

test('every stop in the Story opens and shows its passage, recap or game', async ({ page }) => {
  test.setTimeout(240_000);
  await startApp(page);
  const beats = await page.evaluate(() => STORY_ARCS.flatMap(a => a.beats.map(b => ({
    id: b.id, type: b.type, gameId: b.gameId, chapter: b.chapters && b.chapters[0][1], verses: b.verses || null,
    recap: b.recap || null, words: b.crossword ? b.crossword.length : 0
  }))));
  expect(beats.length).toBeGreaterThanOrEqual(170);

  for (const b of beats) {
    await page.evaluate(id => runBeatAction(STORY_ARCS.flatMap(a => a.beats).find(x => x.id === id)), b.id);
    if (b.type === 'read') {
      await expectView(page, 'view-story-read');
      const expected = b.verses ? b.verses[1] - b.verses[0] + 1 : verseCount(b.chapter);
      await expect(page.locator('#storyReadBody .verse'), `${b.id} shows its verses`).toHaveCount(expected);
    } else if (b.type === 'summary') {
      await expectView(page, 'view-story-read');
      await expect(page.locator('#storyReadBody .devotional-reflection'), `${b.id} shows its recap`).toContainText(b.recap.slice(0, 40));
    } else {
      await expectView(page, 'view-arcade');
      await expect(page.locator('#arcadeMount > *').first(), `${b.id} draws something`).toBeAttached();
      if (b.gameId === 'wordsearch') await expect(page.locator('.ws-cell'), `${b.id} grid`).toHaveCount(169);
      if (b.gameId === 'unscramble') await expect(page.locator('.unscramble-bank'), `${b.id} letter bank`).toBeAttached();
      if (b.gameId === 'crossword') await expect(page.locator('.cw-clue'), `${b.id} clues`).toHaveCount(b.words);
    }
  }
});

test('every finale crossword can be solved by typing its answers', async ({ page }) => {
  test.setTimeout(180_000);
  await startApp(page);
  const ids = await page.evaluate(() => STORY_ARCS.flatMap(a => a.beats.filter(b => b.crossword).map(b => b.id)));
  expect(ids.length).toBeGreaterThanOrEqual(13);
  for (const id of ids) {
    const cw = await page.evaluate(i => { const b = STORY_ARCS.flatMap(a => a.beats).find(x => x.id === i); runBeatAction(b); return b.crossword; }, id);
    await expect(page.locator('.cw-grid')).toBeVisible();
    // Like a player: type into each empty square (squares shared with a solved word are locked).
    const at = (w, k) => [w.row + (w.dir === 'down' ? k : 0), w.col + (w.dir === 'across' ? k : 0)];
    const keys = new Set(cw.flatMap(w => [...w.word].map((_, k) => at(w, k).join(','))));
    const order = [...keys].sort((a, b) => { const [ar, ac] = a.split(',').map(Number), [br, bc] = b.split(',').map(Number); return ar - br || ac - bc; });
    for (const w of cw) for (let k = 0; k < w.word.length; k++) {
      const input = page.locator('.cw-input').nth(order.indexOf(at(w, k).join(',')));
      if (await input.inputValue()) continue;
      await input.click();
      await page.keyboard.type(w.word[k]);
    }
    await expect(page.locator('.cw-clue-solved'), `${id}: every clue should be solved`).toHaveCount(cw.length);
  }
});
