// Shared test setup. Import { test, expect } from here instead of '@playwright/test':
//   - every test automatically FAILS if the page throws an uncaught JavaScript error
//   - confirm() dialogs are auto-accepted
//   - web fonts and the Supabase CDN script are stubbed (no internet needed)
//   - `fake` is a fresh in-memory Supabase; `newDevice()` opens another browser
//     "device" wired to it (to test sign-in and syncing between devices)
const base = require('@playwright/test');
const { FakeSupabase } = require('./fake-supabase');
const { expect } = base;

async function stubExternal(context) {
  await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await context.route(/cdn\.jsdelivr\.net/, r => r.fulfill({ status: 200, contentType: 'text/javascript', body: '/* stubbed in tests */' }));
}

const test = base.test.extend({
  // The default page has NO Supabase library, like opening the app offline.
  page: async ({ page, context }, use) => {
    const errors = [];
    await stubExternal(context);
    page.on('pageerror', e => errors.push(String(e)));
    page.on('dialog', d => d.accept());
    await use(page);
    expect(errors, 'the app threw uncaught JavaScript errors').toEqual([]);
  },

  fake: async ({}, use) => { await use(new FakeSupabase()); },

  // newDevice('phone') -> a fresh browser profile signed in to nothing, wired to `fake`.
  newDevice: async ({ browser, fake, baseURL }, use) => {
    const contexts = [], errors = [];
    await use(async (name = 'device') => {
      const context = await browser.newContext({ baseURL, viewport: { width: 420, height: 900 }, serviceWorkers: 'block' });
      contexts.push(context);
      await fake.install(context);
      await stubExternal(context);
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(`[${name}] ${e}`));
      page.on('dialog', d => d.accept());
      await startApp(page);
      return page;
    });
    await Promise.all(contexts.map(c => c.close()));
    expect(errors, 'the app threw uncaught JavaScript errors').toEqual([]);
  }
});

// ---- small UI helpers ----

// Open the app and answer the one-time "choose a Bible version" prompt.
async function startApp(page, { path = '/index.html', chooseVersion = true } = {}) {
  await page.goto(path);
  if (chooseVersion) {
    const modal = page.locator('#versionModal');
    if (await modal.isVisible()) {
      await page.locator('#versionModalGrid .version-btn').first().click();
      await expect(modal).toBeHidden();
    }
  }
  await expect(page.locator('.view.active')).toHaveCount(1);
}

// page.evaluate that waits out a page reload (sign-out, import and reset all
// reload the page) and waits for the app to finish starting up first. Without
// that, a check can land in the instant after the scripts load but before the
// app has read its saved data, and see an empty Storage.state.
async function evalSafe(page, fn, arg) {
  for (let i = 0; i < 40; i++) {
    try {
      await page.waitForFunction(() => document.readyState === 'complete' && typeof Storage !== 'undefined' && !!Storage.state);
      return await page.evaluate(fn, arg);
    } catch (e) {
      if (!/Execution context was destroyed|navigat/i.test(String(e))) throw e;
      await page.waitForLoadState('load').catch(() => {});
      await page.waitForTimeout(100);
    }
  }
  throw new Error('the page kept navigating and never settled');
}

const tab = (page, name) => page.locator(`.bottom-nav [data-tab="${name}"]`).click();
const expectView = (page, id) => expect(page.locator('.view.active')).toHaveAttribute('id', id);
const evalApp = (page, fn, arg) => page.evaluate(fn, arg);

// Mark every Story stop complete so all Library games are unlocked.
const unlockEverything = page => page.evaluate(() => {
  StoryEngine.allBeatsFlat().forEach(b => Storage.completeBeat(b.id, { silent: true }));
  Storage.save();
});

module.exports = { test, expect, startApp, tab, expectView, evalApp, evalSafe, unlockEverything };
