// Project wiring and guardrails. These catch the "quiet" mistakes: a file that
// was never loaded, an empty script, a stale cache list, a leaked secret, a
// database table left without row-level security, or an unpinned CI action.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { ROOT, read, exists, walk, warn } = require('./helpers/load');

const html = read('index.html');
const swSource = read('sw.js');
const stripQuery = u => u.split('?')[0];
const localScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u));
const externalScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]).filter(u => /^https?:/.test(u));
const precache = [...swSource.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(u => u !== '.' && !u.startsWith('code-bible-') && /\.(html|json|css|js)(\?|$)/.test(u));

test('every script and stylesheet index.html loads exists and is not empty', () => {
  const stylesheets = [...html.matchAll(/<link[^>]+href="([^"]+\.css[^"]*)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u));
  [...localScripts, ...stylesheets].forEach(u => {
    const f = stripQuery(u);
    assert.ok(exists(f), `index.html loads ${f} but it does not exist`);
    assert.ok(fs.statSync(path.join(ROOT, f)).size > 0, `${f} is EMPTY (this is exactly how a blank app.js breaks the whole app)`);
  });
});

test('every file in js/ is loaded by index.html (nothing forgotten)', () => {
  const loaded = new Set(localScripts.map(stripQuery));
  walk(path.join(ROOT, 'js')).map(f => path.relative(ROOT, f).split(path.sep).join('/'))
    .filter(f => f.endsWith('.js') && !path.basename(f).startsWith('_'))
    .forEach(f => assert.ok(loaded.has(f), `${f} exists but index.html never loads it`));
});

test('scripts load in a safe order', () => {
  const order = localScripts.map(stripQuery);
  const before = (a, b) => assert.ok(order.indexOf(a) !== -1 && order.indexOf(a) < order.indexOf(b), `${a} must load before ${b}`);
  before('js/data.js', 'js/storage.js');
  before('js/storage.js', 'js/story-data.js');
  before('js/storage.js', 'js/cloud.js');
  before('js/games/registry.js', 'js/games.js');
  before('js/games/registry.js', 'js/games/wordgames.js');
  before('js/games/arcade-engine.js', 'js/games/flappy.js');
  before('js/story-data.js', 'js/story.js');
  assert.equal(order[order.length - 1], 'js/app.js', 'app.js must load last');
});

test('service worker pre-caches exactly the files the page loads, with matching ?v= versions', () => {
  precache.forEach(u => assert.ok(exists(stripQuery(u)), `sw.js pre-caches ${u} but the file does not exist (this breaks installing the app offline)`));
  localScripts.forEach(u => assert.ok(precache.includes(u), `index.html loads ${u} but sw.js does not pre-cache that exact version`));
  const css = [...html.matchAll(/<link[^>]+href="(css\/[^"]+)"/g)].map(m => m[1]);
  css.forEach(u => assert.ok(precache.includes(u), `sw.js does not pre-cache ${u}`));
});

test('service worker never touches cross-origin or non-GET requests (sign-in & sync traffic)', () => {
  assert.match(swSource, /method !== 'GET'/);
  assert.match(swSource, /origin !== self\.location\.origin/);
});

test('app.js defines every function other files expect from it', () => {
  const app = read('js/app.js');
  ['showView', 'showTab', 'goToChapterTab', 'openStoryRead', 'openArcadeGame', 'splitChapterKey', 'leaveArcade', 'init'].forEach(fn => {
    assert.match(app, new RegExp(`function\\s+${fn}\\s*\\(`), `app.js is missing function ${fn}()`);
  });
  assert.match(app, /^let activeStoryBeat\b/m, 'activeStoryBeat must be a top-level binding (games read it)');
});

test('every element id the code looks up exists in index.html or is created by the code', () => {
  const jsFiles = walk(path.join(ROOT, 'js')).filter(f => f.endsWith('.js') && !path.basename(f).startsWith('_'));
  const allJs = jsFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n');
  const ids = new Set([...read('js/app.js').matchAll(/\$\('([\w-]+)'\)/g)].map(m => m[1]));
  const inHtml = id => new RegExp(`id="${id}"`).test(html);
  const created = id => new RegExp(`id=\\\\?["']${id}\\\\?["']|\\.id\\s*=\\s*['"]${id}['"]|id:\\s*['"]${id}['"]`).test(allJs);
  ids.forEach(id => assert.ok(inHtml(id) || created(id), `app.js looks up #${id}, but nothing defines it`));
});

test('index.html has no duplicate ids', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, [], `duplicate ids: ${dupes.join(', ')}`);
});

test('manifest is valid and its icons exist', () => {
  const m = JSON.parse(read('manifest.json'));
  assert.ok(m.name && m.start_url && m.display);
  (m.icons || []).forEach(i => assert.ok(exists(i.src), `manifest icon ${i.src} is missing`));
});

test('the external sign-in library is pinned to an exact version', () => {
  const lib = externalScripts.find(u => u.includes('supabase-js'));
  assert.ok(lib, 'supabase-js script tag is missing');
  assert.match(lib, /supabase-js@\d+\.\d+\.\d+/, 'pin an exact version, never @2 or @latest');
});

// ------------------------------------------------------------------ security
const SKIP_DIRS = ['node_modules', '.git', '_site', 'versions', 'playwright-report', 'test-results'];
const textFiles = () => walk(ROOT, { skip: SKIP_DIRS }).filter(f => /\.(js|json|html|css|md|yml|yaml|sql|ps1|py)$/.test(f) && !/package-lock\.json$/.test(f));

test('no secret keys, JWTs or database passwords are committed anywhere', () => {
  const self = path.join('tests', 'unit', 'project.test.js');
  textFiles().filter(f => !f.endsWith(self)).forEach(f => {
    const body = fs.readFileSync(f, 'utf8'), rel = path.relative(ROOT, f);
    assert.ok(!/sb_secret_[A-Za-z0-9_-]{10,}/.test(body), `${rel}: contains a Supabase SECRET key`);
    assert.ok(!/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/.test(body), `${rel}: contains a JWT (anon/service_role keys look like this)`);
    assert.ok(!/postgres(ql)?:\/\/[^\s'"@]+:[^\s'"@]+@/.test(body), `${rel}: contains a database connection string with a password`);
  });
});

test('the browser code only ever uses a publishable key', () => {
  const cloud = read('js/cloud.js');
  assert.match(cloud, /CLOUD_KEY\s*=\s*'sb_publishable_[A-Za-z0-9_-]+'/);
  assert.match(cloud, /CLOUD_URL\s*=\s*'https:\/\/[a-z0-9]+\.supabase\.co'/);
  ['js', 'index.html'].forEach(p => {
    const files = p === 'js' ? walk(path.join(ROOT, 'js')) : [path.join(ROOT, p)];
    // Comments may warn about the secret key; code must never use it.
    const code = f => fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/\s.*$/gm, '');
    files.forEach(f => assert.ok(!/service_role/.test(code(f)), `${path.relative(ROOT, f)} uses service_role in browser code`));
  });
});

test('database: every table has row-level security and only the intended public access', () => {
  const sql = read('supabase/schema.sql').replace(/--.*$/gm, '');
  const tables = [...sql.matchAll(/create table (?:if not exists )?public\.(\w+)/g)].map(m => m[1]);
  assert.ok(tables.length >= 3, 'expected profiles, user_data, keepalive');
  tables.forEach(t => assert.match(sql, new RegExp(`alter table public\\.${t}\\s+enable row level security`), `table ${t} is missing "enable row level security"`));

  // Private tables must never be granted to the signed-out (anon) role.
  ['profiles', 'user_data'].forEach(t => {
    const grants = [...sql.matchAll(new RegExp(`grant [^;]*on public\\.${t}[^;]*to ([^;]+);`, 'g'))].map(m => m[1]);
    grants.forEach(g => assert.ok(!/\banon\b/.test(g), `${t} must not be granted to anon`));
  });
  assert.ok(!/grant all/i.test(sql), 'avoid "grant all"');
  assert.match(sql, /revoke all on function public\.delete_my_account\(\) from public, anon/);
  // Elevated functions must pin their search_path.
  [...sql.matchAll(/security definer[\s\S]*?\$\$/g)].forEach(m => assert.match(m[0], /set search_path/, 'security definer function needs "set search_path"'));
  // Every policy is limited to the owner's own rows.
  [...sql.matchAll(/create policy "(user_data|profiles): [^"]+"[\s\S]*?;/g)].forEach(m => assert.match(m[0], /auth\.uid\(\)/, `${m[1]} policy must check auth.uid()`));
});

test('GitHub workflows: actions are pinned to a version and permissions are declared', () => {
  const dir = path.join(ROOT, '.github', 'workflows');
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f)).forEach(f => {
    const y = fs.readFileSync(path.join(dir, f), 'utf8');
    [...y.matchAll(/uses:\s*([^\s#]+)/g)].map(m => m[1]).filter(u => !u.startsWith('./')).forEach(u => {
      assert.match(u, /@v?\d/, `${f}: "${u}" must be pinned to a version, not a branch`);
      assert.ok(!/@(main|master|latest)\b/.test(u), `${f}: "${u}" is unpinned`);
    });
    assert.match(y, /^permissions:/m, `${f}: declare top-level permissions (least privilege)`);
  });
});

test('deploy workflow: nothing is published unless every test passed', () => {
  const file = path.join(ROOT, '.github', 'workflows', 'deploy.yml');
  assert.ok(fs.existsSync(file), '.github/workflows/deploy.yml is missing');
  const y = fs.readFileSync(file, 'utf8');

  // Split the file into its jobs (two-space-indented keys under "jobs:").
  const jobsAt = y.search(/^jobs:\s*$/m);
  assert.ok(jobsAt >= 0, 'no "jobs:" section');
  const parts = y.slice(jobsAt).split(/^  ([a-z][\w-]*):\s*$/m);           // [pre, name, body, name, body, ...]
  const jobs = {};
  for (let i = 1; i < parts.length; i += 2) jobs[parts[i]] = parts[i + 1];
  assert.ok(jobs.test && jobs.deploy, 'expected a "test" job and a "deploy" job');

  // The gate: deploy waits for test, and only ever runs from main.
  assert.match(jobs.deploy, /^\s{4}needs:\s*test\b/m, 'the deploy job must have "needs: test"');
  assert.match(jobs.deploy, /refs\/heads\/main/, 'the deploy job must only run on main');
  assert.equal((y.match(/actions\/deploy-pages@/g) || []).length, 1, 'exactly one step may publish');
  assert.ok(!/actions\/deploy-pages@/.test(jobs.test), 'the test job must never publish');

  // The job that installs the test browser must pin an Ubuntu version Playwright supports.
  // "ubuntu-latest" moves to new Ubuntu releases on GitHub's schedule, and a new release can
  // break the browser install overnight (it did, at Ubuntu 26.04).
  assert.match(jobs.test, /^\s{4}runs-on:\s*ubuntu-\d\d\.\d\d\s*$/m, 'the test job must use a pinned runner like ubuntu-24.04, not ubuntu-latest');

  // The test job runs every kind of test, in order, before it packages anything.
  const order = ['npm run test:unit', 'npm run test:e2e', 'npm run build', '--grep @smoke', 'actions/upload-pages-artifact@']
    .map(step => ({ step, at: jobs.test.indexOf(step) }));
  order.forEach(o => assert.ok(o.at >= 0, `the test job must contain "${o.step}"`));
  for (let i = 1; i < order.length; i++) {
    assert.ok(order[i].at > order[i - 1].at, `"${order[i].step}" must come after "${order[i - 1].step}"`);
  }
  assert.match(jobs.test, /SERVE_DIR:\s*_site/, 'the smoke tests must run against the built site (SERVE_DIR: _site)');

  // Least privilege: the workflow is read-only by default; only deploy may write to Pages.
  assert.match(y, /^permissions:\s*\n\s+contents:\s*read\s*$/m, 'top-level permissions must be contents: read');
  assert.match(jobs.deploy, /pages:\s*write/);
  assert.ok(!/pages:\s*write|id-token:\s*write/.test(jobs.test), 'the test job must not have publish permissions');
});

test('copyrighted translations are not committed (warns; set STRICT_LICENSES=1 to fail)', () => {
  let tracked;
  try { tracked = cp.execSync('git ls-files versions', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { return; }                                  // not a git checkout: nothing to check
  const bad = tracked.split('\n').filter(f => f && !f.startsWith('versions/KJV/'));
  if (bad.length) {
    const msg = `${bad.length} non-KJV Bible text file(s) are tracked in git (e.g. ${bad[0]}). If the repo is public, those translations are copyrighted. See docs/TESTING.md.`;
    if (process.env.STRICT_LICENSES) assert.fail(msg);
    warn(msg);
  }
});
