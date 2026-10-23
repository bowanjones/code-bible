// The deploy build (scripts/build-site.js): proves what gets published is
// complete, self-consistent, and contains nothing that should stay private.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { build } = require('../../scripts/build-site.js');
const { ROOT } = require('./helpers/load');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'code-bible-site-'));
const out = path.join(tmp, 'site');
const result = build({ outDir: out, sha: 'abcdef1234567890', versions: 'KJV' });
const has = rel => fs.existsSync(path.join(out, rel));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('the published site contains the app', () => {
  ['index.html', 'manifest.json', 'sw.js', 'css/style.css', 'js/app.js', 'js/cloud.js', 'js/storage.js', 'icons'].forEach(f => assert.ok(has(f), `missing ${f}`));
  assert.ok(result.files > 100);
});

test('nothing private or developer-only is published', () => {
  ['tests', 'docs', 'supabase', '.github', 'scripts', 'node_modules', 'package.json', 'playwright.config.js', 'README.md', 'bible-copy.ps1', '.git', 'js/games/_stub-template.js']
    .forEach(f => assert.ok(!has(f), `${f} must not be published`));
});

test('only public-domain Bible text is published, and the app is told which', () => {
  assert.deepEqual(fs.readdirSync(path.join(out, 'versions')).sort(), ['KJV', 'available.json']);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'versions/available.json'), 'utf8')), ['KJV']);
  ['NIV', 'ESV', 'NLT', 'CSB'].forEach(v => assert.ok(!has(`versions/${v}`), `${v} is copyrighted and must not be published`));
});

test('every file the page and the service worker reference is in the published site', () => {
  const html = fs.readFileSync(path.join(out, 'index.html'), 'utf8');
  [...html.matchAll(/(?:src|href)="((?!https?:|#|data:)[^"]+)"/g)].map(m => m[1].split('?')[0]).forEach(f => assert.ok(has(f), `index.html references ${f}, which is not published`));
  const sw = fs.readFileSync(path.join(out, 'sw.js'), 'utf8');
  [...sw.matchAll(/'([^']+\.(?:html|json|css|js)(?:\?[^']*)?)'/g)].map(m => m[1].split('?')[0]).forEach(f => assert.ok(has(f), `sw.js pre-caches ${f}, which is not published (the app would fail to install offline)`));
});

test('the service-worker cache is stamped with the commit so every deploy refreshes visitors', () => {
  assert.match(fs.readFileSync(path.join(out, 'sw.js'), 'utf8'), /const CACHE_NAME = 'code-bible-abcdef1';/);
  assert.match(fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8'), /const CACHE_NAME = 'code-bible-v\d+';/, 'the source file itself is left untouched');
});

test('publishing a missing version fails loudly instead of shipping a broken site', () => {
  assert.throws(() => build({ outDir: path.join(tmp, 'x'), versions: 'KJV,DOESNOTEXIST', sha: '' }), /Cannot publish version/);
});
