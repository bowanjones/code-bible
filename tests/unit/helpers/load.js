// Helpers for unit tests: load the app's plain browser scripts into an isolated
// Node "vm" so we can test real code without a browser or any build step.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..', '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

function memoryStorage(initial = {}) {
  const data = Object.assign({}, initial);
  return {
    getItem: k => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: k => { delete data[k]; },
    _data: data
  };
}

// Evaluate browser scripts (in order) inside a fresh sandbox and return the
// named top-level bindings. Each call is fully isolated, so tests can't leak
// state into each other.
function loadApp(files, expose, extraGlobals = {}) {
  const sandbox = Object.assign({ localStorage: memoryStorage(), console }, extraGlobals);
  vm.createContext(sandbox);
  const code = files.map(read).join('\n') + `\n;this.__exposed = { ${expose.join(', ')} };`;
  vm.runInContext(code, sandbox, { filename: 'app-scripts.js' });
  return Object.assign(sandbox.__exposed, { _sandbox: sandbox });
}

// Standard bundle: books + storage + story engine.
function loadCore(extraGlobals) {
  return loadApp(
    ['js/data.js', 'js/packs/genesis.js', 'js/storage.js', 'js/story-data.js', 'js/arcs/genesis-10-50.js'],
    ['BOOKS', 'TOTAL_CHAPTERS', 'SEED_GAME', 'BUILTIN_PACKS', 'STORE_KEY', 'Storage', 'STORY_ARCS', 'StoryEngine'],
    extraGlobals
  );
}

function walk(dir, { skip = [] } = {}) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full, { skip }));
    else out.push(full);
  }
  return out;
}

// In CI this shows up as a yellow annotation on the run; locally it's just text.
function warn(message) {
  if (process.env.GITHUB_ACTIONS) console.log(`::warning::${message}`);
  else console.warn(`WARNING: ${message}`);
}

module.exports = { ROOT, read, exists, memoryStorage, loadApp, loadCore, walk, warn };
