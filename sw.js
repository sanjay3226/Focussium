const CACHE_NAME = 'focussium-v2';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json?v=2',
    './icon-192.png?v=2',
    './icon-512.png?v=2',
    './screenshot-desktop.png',
    './screenshot-mobile.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // Optional: return a fallback page if network fails and not in cache
            });
        })
    );
});
