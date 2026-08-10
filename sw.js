const CACHE_NAME = 'code-bible-v2';
const CACHE_URLS = [
  '.',
  'index.html',
  'manifest.json',
  'css/style.css?v=2',
  'js/data.js?v=2',
  'js/storage.js?v=2',
  'js/games.js?v=2',
  'js/bible.js?v=2',
  'js/app.js?v=2'
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
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
