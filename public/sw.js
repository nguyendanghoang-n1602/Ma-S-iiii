// Service Worker cho Làng Sói — PWA
const CACHE_NAME = 'lang-soi-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Không cache API / Supabase / Realtime requests
  const url = new URL(event.request.url);
  if (url.origin.includes('supabase') || url.pathname.includes('/rest/') || url.pathname.includes('/realtime/')) {
    return;
  }

  // Network first, fallback to cache for app shell
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});
