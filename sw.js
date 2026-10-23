const CACHE_NAME = 'code-bible-v25';
const CACHE_URLS = [
  '.',
  'index.html',
  'manifest.json',
  'css/style.css?v=16',
  'js/data.js?v=4',
  'js/packs/genesis.js?v=1',
  'js/storage.js?v=9',
  'js/games.js?v=6',
  'js/games/registry.js?v=1',
  'js/games/arcade-engine.js?v=3',
  'js/games/wordgames.js?v=6',
  'js/games/creationsort.js?v=3',
  'js/games/gardentrail.js?v=5',
  'js/games/farmplot.js?v=5',
  'js/games/connectdots.js?v=2',
  'js/games/sudoku.js?v=1',
  'js/games/crossword.js?v=3',
  'js/games/slingshot.js?v=1',
  'js/games/flappy.js?v=1',
  'js/games/runner.js?v=1',
  'js/games/frogger.js?v=1',
  'js/games/pacman.js?v=1',
  'js/games/galaga.js?v=1',
  'js/games/towerdefense.js?v=1',
  'js/bible.js?v=6',
  'js/chapterquiz.js?v=1',
  'js/notes.js?v=6',
  'js/story-data.js?v=12',
  'js/arcs/genesis-10-50.js?v=1',
  'js/story.js?v=6',
  'js/cloud.js?v=1',
  'js/app.js?v=18'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle same-origin GETs. Sign-in and cloud-sync traffic (Supabase) and
  // CDN scripts must go straight to the network and never be cached here.
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});