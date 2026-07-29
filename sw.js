const APP_VERSION = '2026.07.29.v200';
const CACHE_NAME = `focussium-${APP_VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/sounds.js',
    './js/icons.js',
    './js/threebg_dark.js',
    './js/threebg_light.js',
    './js/firebase-config.js',
    './icon-192.png',
    './icon-512.png'
];

// Install: pre-cache and activate immediately
self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
    );
});

// Activate: purge ALL old caches and claim clients immediately
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: Network-First for ALL local assets (Instant GitHub Pages update mode)
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    const reqUrl = new URL(e.request.url);
    // Ignore cross-origin (Firebase, Google Fonts, CDN)
    if (reqUrl.origin !== self.location.origin) return;

    // Network-First: Try fresh network fetch first; fall back to cache when offline
    e.respondWith(
        fetch(e.request)
            .then(networkRes => {
                if (networkRes && networkRes.status === 200 && networkRes.type !== 'opaque') {
                    const copy = networkRes.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
                }
                return networkRes;
            })
            .catch(() => caches.match(e.request))
    );
});

// Force update signal handler
self.addEventListener('message', e => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
