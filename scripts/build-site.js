#!/usr/bin/env node
// Assembles the folder that gets published to GitHub Pages (default: ./_site).
//
// What ships:     index.html, manifest.json, sw.js, css/, js/, icons/ and the
//                 Bible text for PUBLISHED_VERSIONS (default: KJV only).
// What never does: tests, docs, SQL, workflows, node_modules, package files, and
//                 the copyrighted translations (NIV, ESV, NLT, CSB).
//
// It also writes versions/available.json so the app only offers versions that
// are really on the site, and stamps sw.js with the commit so every deploy
// refreshes returning visitors' cached files automatically.
//
//   node scripts/build-site.js
//   PUBLISHED_VERSIONS=KJV,WEB node scripts/build-site.js     (public-domain only!)
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = ['index.html', 'manifest.json', 'sw.js'];
const DIRS = ['css', 'js', 'icons'];
const SKIP_NAMES = new Set(['.DS_Store', 'Thumbs.db', '_stub-template.js']);

function countFiles(dir) {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    n += e.isDirectory() ? countFiles(path.join(dir, e.name)) : 1;
  }
  return n;
}

function build(opts = {}) {
  const out = path.resolve(opts.outDir || process.env.SITE_DIR || path.join(ROOT, '_site'));
  const published = (opts.versions || process.env.PUBLISHED_VERSIONS || 'KJV')
    .toString().split(',').map(s => s.trim()).filter(Boolean);
  const sha = (opts.sha !== undefined ? opts.sha : process.env.GITHUB_SHA) || '';

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });

  FILES.forEach(f => {
    if (!fs.existsSync(path.join(ROOT, f))) throw new Error(`Required file missing: ${f}`);
    fs.copyFileSync(path.join(ROOT, f), path.join(out, f));
  });
  DIRS.forEach(d => {
    if (!fs.existsSync(path.join(ROOT, d))) throw new Error(`Required folder missing: ${d}`);
    fs.cpSync(path.join(ROOT, d), path.join(out, d), {
      recursive: true,
      filter: src => !SKIP_NAMES.has(path.basename(src))
    });
  });

  const shipped = [];
  published.forEach(v => {
    const src = path.join(ROOT, 'versions', v);
    if (!fs.existsSync(src) || countFiles(src) === 0) throw new Error(`Cannot publish version "${v}": versions/${v} is missing or empty.`);
    fs.cpSync(src, path.join(out, 'versions', v), { recursive: true, filter: s => !SKIP_NAMES.has(path.basename(s)) });
    shipped.push(v);
  });
  fs.writeFileSync(path.join(out, 'versions', 'available.json'), JSON.stringify(shipped));

  if (sha) {
    const swPath = path.join(out, 'sw.js');
    const sw = fs.readFileSync(swPath, 'utf8');
    const stamped = sw.replace(/const CACHE_NAME = '[^']*';/, `const CACHE_NAME = 'code-bible-${sha.slice(0, 7)}';`);
    if (stamped === sw) throw new Error('Could not find CACHE_NAME in sw.js to stamp.');
    fs.writeFileSync(swPath, stamped);
  }

  const total = countFiles(out);
  return { outDir: out, versions: shipped, files: total, stamped: !!sha };
}

module.exports = { build };

if (require.main === module) {
  try {
    const r = build();
    console.log(`Built ${r.files} files into ${r.outDir}`);
    console.log(`Bible versions published: ${r.versions.join(', ')}${r.stamped ? '  (service worker cache stamped)' : ''}`);
  } catch (e) {
    console.error('BUILD FAILED: ' + e.message);
    process.exit(1);
  }
}
