# Testing and deploying

Two kinds of tests protect the app. Both run on your computer and on GitHub.

| Kind | Where | What it catches | Speed |
|---|---|---|---|
| **Unit and project checks** | `tests/unit/` (Node's built-in test runner, no browser) | Wrong merge/sync rules, broken story data, storage bugs, an empty or forgotten script, a stale service-worker list, a leaked secret, a database table without security, an unsafe workflow | ~2 seconds |
| **Browser tests** | `tests/e2e/` (Playwright, a real Chromium) | Anything a person would notice: tapping through Story, Bible, Library, Friends, Settings, every game, signing in, syncing two devices | ~1-2 minutes |

The browser tests never touch your real Supabase or the internet. Supabase is
replaced by an in-memory fake (`tests/e2e/helpers/fake-supabase.js`).

## Run them

One-time setup (needs Node 22 or newer):

```
npm install
npx playwright install chromium
```

Then:

```
npm test                              everything
npm run test:unit                     fast checks only
npm run test:e2e                      the whole app in a browser
npx playwright test --grep @smoke     just the quick "is it alive" checks
npx playwright test --ui              watch and debug interactively
npx playwright test cloud             only files whose name contains "cloud"
```

After a failure, `npx playwright show-trace <path to trace.zip>` (the path is printed
with the error, under `test-results/`) replays exactly what the browser did.

## When you change something

- **Fixed a bug?** Add a test that fails without the fix. That bug can then
  never quietly come back. (A blank `app.js` once broke the whole app; the
  "is not empty" check in `tests/unit/project.test.js` now catches that.)
- **Added a game?** Register it in `js/games/registry.js` and add its card.
  `tests/e2e/games.spec.js` opens and runs *every* registered game
  automatically, and a unit test checks every card has a game and vice versa.
- **Added or edited Story arcs?** `tests/unit/data.test.js` and `tests/unit/arcs.test.js`
  validate every stop: real chapters, verse splits that cover each chapter exactly once,
  labels that match, a recap and finale at the end of each arc, no placeholder games, usable
  word-search and unscramble words, and crossword grids whose letters agree and connect.
  `tests/e2e/arcs.spec.js` then opens every stop in a browser and solves every finale
  crossword. A new arc file is loaded in `index.html`, `sw.js` and `tests/unit/helpers/load.js`.
- **Added a script file?** Load it in `index.html` and list it in `sw.js`
  with the same `?v=` number. The project checks fail with a clear message if
  you forget either.
- **Changed the database?** Edit `supabase/schema.sql`. A check fails if a table
  is created without row-level security.
- **Changed what gets saved?** Update `mergeStates` in `js/cloud.js` so two
  devices can combine the new data, and add a case to
  `tests/unit/merge.test.js`.

## Adding a test

**Unit test** (`tests/unit/something.test.js`). It runs the app's real browser
scripts in a sandbox, so there is nothing to mock:

```js
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadCore } = require('./helpers/load');

test('marking a chapter read records it', () => {
  const { Storage } = loadCore();
  Storage.load();
  Storage.markRead('John', 3);
  assert.equal(Storage.state.progress['John-3'], true);
});
```

**Browser test** (`tests/e2e/something.spec.js`). Import from `./helpers/fixtures`,
never straight from `@playwright/test`. The fixtures make a test fail on any
uncaught JavaScript error, auto-accept confirm boxes, and give you a fake
Supabase and extra "devices":

```js
const { test, expect, startApp, tab, expectView } = require('./helpers/fixtures');

test('the Friends tab opens', async ({ page }) => {
  await startApp(page);                 // opens the app and answers the "Bible version" prompt
  await tab(page, 'friends');
  await expectView(page, 'view-friends');
});

test('two devices stay in sync', async ({ newDevice, fake }) => {
  const phone = await newDevice('phone');     // a fresh browser profile wired to `fake`
  const laptop = await newDevice('laptop');
  // ...sign both in with the same email (the "emailed" code is always 123456)
});
```

Tips:

- Tag the few tests that prove the app is alive with `@smoke` in the test name.
  Those also run against the *built* site before every deploy.
- If an action reloads the page (sign out, import, reset), read state with
  `evalSafe(page, () => ...)` instead of `page.evaluate`; it waits out the reload.
- Prefer checking what a person sees (text, visible screens) over internals.
- Tests start with the app's first-run state, which includes one sample
  Genesis 1 note. Count relative to that, not to zero.

## How deploying works

`.github/workflows/deploy.yml` runs on every push and pull request:

1. Install, then run the unit and project checks.
2. Run the full browser tests.
3. Build the publishable site (`npm run build` -> `_site/`).
4. Run the smoke tests against that built site.
5. **Only on `main`, and only if all of the above passed:** publish the tested
   `_site/` to GitHub Pages.
6. Check the live site: the app script is present and not empty, only
   public-domain Bible text is reachable, and the service worker is there.

A failed test stops the deploy. A unit test (`deploy workflow: nothing is
published unless every test passed`) also stops anyone from removing that gate
by accident.

If the live check (step 6) ever fails, the previous version is *not*
automatically restored. Fix forward with a new commit, or revert the bad one
(`git revert <commit>` and push), which redeploys the earlier code once tests pass.

### One-time GitHub setup

1. **Settings -> Pages -> Build and deployment -> Source: GitHub Actions.**
2. Merge your work to `main`. The first deploy runs automatically; the address
   appears in the Actions run and under Settings -> Pages.
3. In Supabase, add that address (ending in `/**`) under Authentication ->
   URL Configuration -> Redirect URLs (see `docs/SUPABASE_SETUP.md`).
4. Optional: run `npm install` once locally and commit the new
   `package-lock.json`. The workflow then installs exactly the same versions
   every time.

### Which Bible text is published

Only the public-domain **KJV**. `npm run build` copies `versions/KJV/` and
writes `versions/available.json`, so the app only offers versions that are
really on the site. NIV, ESV, NLT and CSB are copyrighted: they are listed in
`.gitignore`, kept on your own machine for local reading, and never published.

If any of them are already tracked by git, remove them from git (the files stay
on your disk):

```
git rm -r --cached versions/NIV versions/ESV versions/NLT versions/CSB
git commit -m "Stop tracking copyrighted Bible translations"
```

The unit tests fail in CI while any non-KJV text is tracked (`STRICT_LICENSES`).
Old commits still contain what was committed before; that is only a concern if
you need it gone from history entirely.

### Troubleshooting

- **A deploy is red:** open the run, find the red step, and download the
  `test-report` artifact for a replayable trace.
- **Passes on your machine, fails on GitHub:** run `npm ci` instead of
  `npm install` and run the tests again; often a missing committed file.
- **Pages shows an old version:** each deploy stamps the service-worker cache with
  the commit, so one refresh is enough. A stubborn browser needs a hard refresh.
