// GameBox service worker — offline-first app shell
const CACHE = 'gamebox-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/i18n.js',
  './js/store.js',
  './js/ui.js',
  './js/games/registry.js',
  './js/games/launch.js',
  './js/games/snake.js',
  './js/games/g2048.js',
  './js/games/sudoku.js',
  './js/games/tictactoe.js',
  './js/games/minesweeper.js',
  './js/games/memory.js',
  './js/games/wordsearch.js',
  './js/games/brickbreaker.js',
  './js/games/runner.js',
  './js/games/space.js',
  './js/tools/registry.js',
  './js/tools/launch.js',
  './js/tools/games-tools.js',
  './js/tools/daily-tools.js',
  './js/vendor/qrcode.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
