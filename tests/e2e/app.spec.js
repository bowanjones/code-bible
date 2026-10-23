// The whole app, as a person uses it: Story, Bible, Library, Friends, Settings.
const { test, expect, startApp, tab, expectView, evalSafe } = require('./helpers/fixtures');

test.describe('start-up', () => {
  test('@smoke boots to the Story home with no errors and asks for a Bible version once', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('#versionModal')).toBeVisible();
    await page.locator('#versionModalGrid .version-btn').first().click();
    await expect(page.locator('#versionModal')).toBeHidden();
    await expectView(page, 'view-story');
    await page.reload();
    await expect(page.locator('#versionModal')).toBeHidden();          // remembered
  });

  test('@smoke works when hosted in a sub-folder, like GitHub Pages', async ({ page }) => {
    await startApp(page, { path: '/code-bible/' });
    await expectView(page, 'view-story');
    await page.click('#storyContinueBtn');
    await expectView(page, 'view-story-read');
    await expect(page.locator('#storyReadBody .verse').first()).toBeVisible();   // Bible text loaded from the sub-folder
  });

  test('all five tabs work', async ({ page }) => {
    await startApp(page);
    for (const [name, view] of [['bible', 'view-library'], ['hub', 'view-hub'], ['friends', 'view-friends'], ['settings', 'view-settings'], ['story', 'view-story']]) {
      await tab(page, name);
      await expectView(page, view);
    }
  });

  test('without the sign-in library the app still works and explains', async ({ page }) => {
    await startApp(page);
    await tab(page, 'settings');
    await expect(page.locator('#accountBody')).toContainText('isn’t available');
    await tab(page, 'bible');
    await expect(page.locator('#bookList .row').first()).toBeVisible();
  });
});

test.describe('Story mode', () => {
  test('@smoke read a stop, write a devotional, continue to the game, mark it complete', async ({ page }) => {
    await startApp(page);
    await page.click('#storyContinueBtn');
    await expectView(page, 'view-story-read');
    await expect(page.locator('#storyReadBody .verse')).toHaveCount(8);          // Genesis 1:1-8 only
    await expect(page.locator('#storyReadNextBar')).toBeVisible();

    await page.click('#storyReadTabs [data-tab="devotional"]');
    await page.fill('#devotionalText', 'God brings order to my chaos.');
    await page.click('#devotionalSaveBtn');
    await expect(page.locator('#devotionalStatus')).toContainText('Saved');
    expect(await page.evaluate(() => Storage.getDevotional('gen1a-read').text)).toBe('God brings order to my chaos.');

    await page.click('#storyReadNextBtn');
    await expectView(page, 'view-arcade');                                     // next stop is the fill-in-the-blank game
    expect(await page.evaluate(() => Storage.isBeatComplete('gen1a-read'))).toBe(true);
    await expect(page.locator('#arcadeBeatBar')).toBeVisible();

    await page.click('#beatBarBtn');
    expect(await page.evaluate(() => Storage.isBeatComplete('gen1a-game'))).toBe(true);
    await expectView(page, 'view-story');                                      // came in through Continue, so return to Story home
    await expect(page.locator('#storyContinueBtn')).toBeVisible();
  });

  test('finishing a stop opened from an arc list returns to that arc list', async ({ page }) => {
    await startApp(page);
    await page.locator('.arc-row').first().click();
    await expectView(page, 'view-arc');
    await page.locator('.beat-row').first().click();
    await expectView(page, 'view-story-read');
    await page.click('#storyReadNextBtn');
    await expectView(page, 'view-arcade');
    await page.click('#beatBarBtn');
    await expectView(page, 'view-arc');                                        // back where they started
    await expect(page.locator('.beat-row').nth(1)).not.toHaveClass(/locked/);
  });

  test('stops unlock in order and only the next one is open', async ({ page }) => {
    await startApp(page);
    await page.locator('.arc-row').first().click();
    await expectView(page, 'view-arc');
    const rows = page.locator('.beat-row');
    expect(await rows.count()).toBeGreaterThan(3);
    await expect(rows.nth(0)).not.toHaveClass(/locked/);
    await expect(rows.nth(2)).toHaveClass(/locked/);
  });

  test('revisiting a finished stop offers "catch up" and goes back to where you left off', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => { Storage.completeBeat('gen1a-read'); Storage.completeBeat('gen1a-game'); Storage.save(); });
    await page.reload();
    await page.locator('.arc-row').first().click();
    await page.locator('.beat-row').first().click();
    await expectView(page, 'view-story-read');
    await expect(page.locator('#storyReadCatchUpBtn')).toBeVisible();
    const upNext = await page.evaluate(() => { const n = StoryEngine.nextUp(); return { id: n.beat.id, type: n.beat.type, label: n.beat.label }; });
    expect(upNext.id).toBe('gen1b-read');                                     // the first stop they have not finished
    await page.click('#storyReadCatchUpBtn');
    // It jumps straight to that stop: a reading stop opens the reading screen on it.
    await expectView(page, 'view-story-read');
    await expect(page.locator('#storyReadLabel')).toHaveText(upNext.label);
    await expect(page.locator('#storyReadCatchUpBtn')).toBeHidden();         // this IS where they left off
  });
});

test.describe('Bible tab', () => {
  test('@smoke lists 66 books, searches, opens a chapter and shows its verses', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await expect(page.locator('#bookList .row')).toHaveCount(66);
    await page.fill('#bookSearch', 'john');
    await expect(page.locator('#bookList .row')).toHaveCount(4);               // John, 1 John, 2 John, 3 John
    await page.fill('#bookSearch', '');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await expect(page.locator('#chapterList .row')).toHaveCount(50);
    await page.locator('#chapterList .row').first().click();
    await expectView(page, 'view-detail');
    await expect(page.locator('#detailBody .verse')).toHaveCount(31);
    await expect(page.locator('#detailMeta')).toContainText('Chapter 1 of 50');
  });

  test('mark a chapter read, see progress, and undo', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await page.locator('#chapterList .row').first().click();
    await page.locator('#detailBody .toggle').click();
    expect(await page.evaluate(() => Storage.state.progress['Genesis-1'])).toBe(true);
    await page.click('#backToChapters');
    await expect(page.locator('#chapterList .row').first()).toContainText('Read');
    await page.click('#backToLibrary');
    await expect(page.locator('#bookList')).toContainText('1 of 1189 chapters read');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await page.click('#markBookUnreadBtn');
    expect(await page.evaluate(() => Object.keys(Storage.state.progress).length)).toBe(0);
  });

  test('verse notes: select a verse, add a note, see it listed, delete it', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await page.locator('#chapterList .row').first().click();
    await page.locator('#detailBody .verse[data-verse="1"]').click();
    await page.click('#noteFabBtn');
    await page.fill('#noteComposerText', 'In the beginning — the start of everything.');
    await page.click('#noteComposerSave');
    await page.click('#detailTabs [data-tab="notes"]');
    await expect(page.locator('#verseNotesList .note-card')).toHaveCount(1);
    await expect(page.locator('#verseNotesList')).toContainText('start of everything');
    await page.locator('#verseNotesList .note-card-del').click();
    await expect(page.locator('#verseNotesList .note-card')).toHaveCount(0);
  });

  test('general chapter notes save as you type and survive a reload', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Exodus' }).first().click();
    await page.locator('#chapterList .row').first().click();
    await page.click('#detailTabs [data-tab="notes"]');
    await page.fill('#notesArea', 'Moses and the burning bush');
    await page.reload();
    expect(await page.evaluate(() => Storage.state.notes['Exodus-1'])).toBe('Moses and the burning bush');
  });

  test('the chapter Game tab shows matching and a quiz for Genesis 1', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await page.locator('#chapterList .row').first().click();
    await page.click('#detailTabs [data-tab="game"]');
    await expect(page.locator('.match-item').first()).toBeVisible();
    await expect(page.locator('.quiz-opt').first()).toBeVisible();
  });

  test('every Genesis chapter has a Game tab that renders its own matching and quiz', async ({ page }) => {
    test.setTimeout(120_000);
    await startApp(page);
    for (let n = 1; n <= 50; n++) {
      await page.evaluate(c => goToChapterTab('Genesis', c, 'game'), n);
      const heading = await page.evaluate(c => Storage.getPack('Genesis-' + c).sections[0].heading, n);
      await expect(page.locator('#detailBody .section-heading').first(), `Genesis ${n} shows its own first section`).toHaveText(heading);
      expect(await page.locator('.match-item').count(), `Genesis ${n} matching items`).toBeGreaterThanOrEqual(6);
      await expect(page.locator('.quiz-opt'), `Genesis ${n} first quiz question has 4 options`).toHaveCount(4);
    }
  });

  test('the chapter list marks every Genesis chapter with a Game badge, and Exodus has none yet', async ({ page }) => {
    await startApp(page);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await expect(page.locator('#chapterList .row')).toHaveCount(50);
    await expect(page.locator('#chapterList .badge')).toHaveCount(50);
    await tab(page, 'bible');
    await page.locator('#bookList .row', { hasText: 'Exodus' }).first().click();
    await expect(page.locator('#chapterList .badge')).toHaveCount(0);
  });

  test('a pack the reader imports replaces the built-in one for that chapter only', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => goToChapterTab('Genesis', 30, 'game'));
    await page.fill('#importPackText', JSON.stringify({
      sections: [{ heading: 'My own section', matching: { prompt: 'Match them.', pairs: [['a', 'b'], ['c', 'd']] } }],
      quiz: []
    }));
    await page.click('#importPackBtn');
    await expect(page.locator('#detailBody .section-heading').first()).toHaveText('My own section');
    await page.evaluate(() => goToChapterTab('Genesis', 29, 'game'));
    await expect(page.locator('#detailBody .section-heading').first()).not.toHaveText('My own section');
    // Built-in packs are not copied into the reader's saved data (keeps backups and sync small).
    expect(await page.evaluate(() => Object.keys(Storage.state.gameData).sort())).toEqual(['Genesis-1', 'Genesis-30']);
  });
});

test.describe('Library', () => {
  test('Matching with "All chapters" draws on the built-in Genesis packs', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => { StoryEngine.isGameUnlocked = () => true; });
    await tab(page, 'hub');
    await page.locator('.game-card[data-game="matching"]').click();
    await expectView(page, 'view-arcade');
    await page.click('#matchScopeTabs [data-scope="all"]');
    await expect(page.locator('.match-item').first()).toBeVisible();
  });

  test('story-gated games start locked and say so', async ({ page }) => {
    await startApp(page);
    await tab(page, 'hub');
    const locked = page.locator('.game-card.locked');
    expect(await locked.count()).toBeGreaterThan(0);
    await locked.first().click();
    await expectView(page, 'view-hub');                                         // did not open
  });

  test('saved notes and devotionals appear together in Library > Notes', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => {
      Storage.addVerseNote('Genesis', 1, [1], 'verse note text');
      Storage.saveDevotional('gen1a-read', { book: 'Genesis', chapter: 1, label: 'x', question: 'q' }, 'devotional text');
      Storage.setNotes('Exodus', 2, 'chapter note text');
    });
    await tab(page, 'hub');
    await page.click('#hubTabs [data-hubtab="notes"]');
    // The app ships one sample note on Genesis 1, so expect it plus the three just added.
    await expect(page.locator('#notesList .note-card')).toHaveCount(4);
    await expect(page.locator('#notesList')).toContainText('verse note text');
    await expect(page.locator('#notesList')).toContainText('devotional text');
    await expect(page.locator('#notesList')).toContainText('chapter note text');
    await page.locator('#notesList .note-card', { hasText: 'chapter note text' }).locator('.note-card-del').click();
    await expect(page.locator('#notesList .note-card')).toHaveCount(3);
    await expect(page.locator('#notesList')).not.toContainText('chapter note text');
  });

  test('devotionals list opens an editor', async ({ page }) => {
    await startApp(page);
    await tab(page, 'hub');
    await page.click('#hubTabs [data-hubtab="devotionals"]');
    await page.locator('.devotional-list-row').first().click();
    await expect(page.locator('#devotionalModal')).toBeVisible();
    await page.fill('#devotionalText', 'my reflection');
    await page.click('#devotionalSaveBtn');
    await page.click('#closeDevotionalModal');
    await expect(page.locator('.devotional-list-row').first()).toContainText('Written');
  });
});

test.describe('Settings', () => {
  test('text size and dark mode apply immediately and persist', async ({ page }) => {
    await startApp(page);
    await tab(page, 'settings');
    await page.click('#textSizeTabs [data-size="large"]');
    await page.click('#themeToggleSettings');
    await expect(page.locator('body')).toHaveClass(/text-large/);
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    await page.reload();
    await expect(page.locator('body')).toHaveClass(/text-large/);
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
  });

  test('choosing a Bible version changes the text that loads', async ({ page }) => {
    await startApp(page);
    await tab(page, 'settings');
    await expect(page.locator('#versionGrid .version-btn')).toHaveCount(5);       // local dev: everything is available
    await page.locator('#versionGrid .version-btn', { hasText: 'ESV' }).click();
    expect(await page.evaluate(() => Storage.state.bibleVersion)).toBe('ESV');
  });

  test('@smoke a site that ships only KJV offers only KJV, even if another version was saved', async ({ page }) => {
    await page.route('**/versions/available.json', r => r.fulfill({ contentType: 'application/json', body: '["KJV"]' }));
    await page.addInitScript(() => localStorage.setItem('bible-companion-v1', JSON.stringify({ bibleVersion: 'ESV', versionChosen: true })));
    await startApp(page);
    await tab(page, 'settings');
    await expect(page.locator('#versionGrid .version-btn')).toHaveCount(1);
    await expect(page.locator('#versionGrid .version-btn')).toHaveText('KJV');
    await expect(page.locator('#versionGrid .version-btn.active')).toHaveText('KJV');
    await page.click('.bottom-nav [data-tab="bible"]');
    await page.locator('#bookList .row', { hasText: 'Genesis' }).first().click();
    await page.locator('#chapterList .row').first().click();
    await expect(page.locator('#detailBody .verse')).toHaveCount(31);              // KJV text loaded instead of failing
    await expect(page.locator('#detailMeta')).toContainText('KJV');
  });

  test('export then import restores everything', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => { Storage.markRead('John', 3); Storage.addFriend('Sam', ''); Storage.saveHighScore('flappy', 42); });
    await tab(page, 'settings');
    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#exportDataBtn')]);
    expect(download.suggestedFilename()).toMatch(/^code-bible-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file = await download.path();

    await page.evaluate(() => { localStorage.clear(); });
    await page.reload();
    await startApp(page);
    expect(await page.evaluate(() => Object.keys(Storage.state.progress).length)).toBe(0);

    await tab(page, 'settings');
    await page.setInputFiles('#importDataFile', file);
    await expect.poll(() => evalSafe(page, () => Storage.state.progress['John-3'])).toBe(true);   // import reloads the page
    expect(await evalSafe(page, () => Storage.getHighScore('flappy'))).toBe(42);
    expect(await evalSafe(page, () => Storage.state.friends.length)).toBe(1);
  });

  test('importing something that is not a backup is refused', async ({ page }, testInfo) => {
    await startApp(page);
    await tab(page, 'settings');
    const bad = testInfo.outputPath('bad.json');
    require('fs').writeFileSync(bad, '{"hello":"world"}');
    await page.setInputFiles('#importDataFile', bad);
    await expect(page.locator('#dataStatus')).toContainText('Import failed');
  });

  test('reset wipes progress, notes and friends', async ({ page }) => {
    await startApp(page);
    await page.evaluate(() => { Storage.markRead('John', 3); Storage.addFriend('Sam', ''); Storage.setNotes('John', 3, 'x'); });
    await tab(page, 'settings');
    await page.click('#resetProgressBtn');
    await page.waitForLoadState('load');
    await expect.poll(() => page.evaluate(() => Object.keys(Storage.state.progress).length)).toBe(0);
    expect(await page.evaluate(() => Storage.state.friends.length)).toBe(0);
  });
});

test.describe('Friends', () => {
  test('add and remove a friend; it survives a reload', async ({ page }) => {
    await startApp(page);
    await tab(page, 'friends');
    await page.fill('#newFriendName', 'Sam');
    await page.fill('#newFriendNote', 'from church');
    await page.click('#addFriendBtn');
    await expect(page.locator('.friend-card')).toHaveCount(1);
    await page.reload();
    await tab(page, 'friends');
    await expect(page.locator('.friend-card')).toContainText('Sam');
    await page.locator('.friend-card .note-card-del').click();
    await expect(page.locator('.friend-card')).toHaveCount(0);
  });

  test('a blank name is not added', async ({ page }) => {
    await startApp(page);
    await tab(page, 'friends');
    await page.click('#addFriendBtn');
    await expect(page.locator('.friend-card')).toHaveCount(0);
  });

  test('share a scripture: pick verses, then copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => { Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); });
    await startApp(page);
    await tab(page, 'friends');
    await expect(page.locator('#shareVerseBtn')).toBeDisabled();
    await page.selectOption('#shareVerseBook', 'Genesis');
    await page.selectOption('#shareVerseChapter', '1');
    await expect(page.locator('.share-verse-item')).toHaveCount(31);
    await page.locator('.share-verse-item').nth(0).locator('input').check();
    await page.locator('.share-verse-item').nth(1).locator('input').check();
    await expect(page.locator('#shareVerseBtn')).toBeEnabled();
    await page.click('#shareVerseBtn');
    await expect(page.locator('#shareVerseStatus')).toContainText('Copied');
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('Genesis 1:1-2');
  });
});
