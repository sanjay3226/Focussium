/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — SERVICE WORKER
   Network-first, auto-updates, v3.0 cache manifest
═══════════════════════════════════════════════════════════ */

const APP_VERSION = '2026.09.04.v331';
const CACHE_NAME  = `focussium-${APP_VERSION}`;

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './og-image.png',
    './og-image.jpg',

    /* CSS — modular */
    './css/tokens.css',
    './css/reset.css',
    './css/animations.css',
    './css/layout.css',
    './css/components.css',
    './css/pages.css',
    './css/modals.css',
    './css/timer.css',
    './css/charts.css',
    './css/games.css',

    /* JS — core */
    './js/config.js',
    './js/state.js',
    './js/utils.js',
    './js/storage.js',
    './js/theme.js',
    './js/toast.js',

    /* JS — features */
    './js/auth.js',
    './js/router.js',
    './js/clock.js',
    './js/confetti.js',
    './js/quotes.js',
    './js/level.js',
    './js/tasks.js',
    './js/dump.js',
    './js/pomo.js',
    './js/habits.js',
    './js/home.js',
    './js/report.js',
    './js/games.js',
    './js/account.js',
    './js/settings.js',
    './js/onboard.js',
    './js/command-glass.js',

    /* JS — external libs (unchanged) */
    './js/sounds.js',
    './js/icons.js',
    './js/firebase-config.js',

    /* Boot */
    './js/app.js',

    /* Fonts (cache key only — actual fonts from Google CDN) */
    'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700;800&display=swap'
];

/* ── Install: pre-cache all assets ── */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            /* Cache individually so one bad URL doesn't block all */
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(e => console.warn('Cache miss:', url, e)))
            );
        })
    );
    /* Take control immediately */
    self.skipWaiting();
});

/* ── Activate: purge old caches ── */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

/* ── Fetch: network-first, fall back to cache ── */
self.addEventListener('fetch', (event) => {
    /* Skip non-GET and chrome-extension requests */
    if (event.request.method !== 'GET') return;
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                /* Clone and cache successful responses */
                if (response && response.status === 200 && response.type !== 'opaque') {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            })
            .catch(() => {
                /* Network failed → serve from cache */
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    /* Fallback to index for navigation requests (SPA) */
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

/* ── Message: skip waiting on demand ── */
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
