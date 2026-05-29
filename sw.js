const APP_VERSION = '2026.05.29.1';
const CACHE_NAME = `focussium-${APP_VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/sounds.js',
    './js/icons.js',
    './js/firebase-config.js',
    './icon-192.png',
    './icon-512.png'
];

// Install: pre-cache all static assets
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(c => c.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: purge old caches, claim clients immediately
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Fetch: stale-while-revalidate for assets, network-first for navigation
self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;

    // Navigation: try network first, fall back to cached index
    if (e.request.mode === 'navigate') {
        e.respondWith(
            fetch(e.request)
                .then(res => {
                    const copy = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    // Cross-origin (Firebase, Google Fonts, CDN): pass through, no cache
    const reqUrl = new URL(e.request.url);
    if (reqUrl.origin !== self.location.origin) return;

    // Same-origin assets: cache-first with background revalidation
    e.respondWith(
        caches.open(CACHE_NAME).then(cache =>
            cache.match(e.request).then(cached => {
                const networkFetch = fetch(e.request)
                    .then(res => {
                        if (res && res.status === 200 && res.type !== 'opaque') {
                            cache.put(e.request, res.clone());
                        }
                        return res;
                    })
                    .catch(() => cached);

                // Return cached immediately; revalidate in background
                return cached || networkFetch;
            })
        )
    );
});

// Allow clients to force update
self.addEventListener('message', e => {
    if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
