/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — BOOT ORCHESTRATOR
   Slim ~100-line init. All logic lives in feature modules.
   Load order: icons → auth → SW → App.init
═══════════════════════════════════════════════════════════ */

const App = {
    init() {
        /* Guard: ensure state is loaded */
        if (!State.data || typeof State.data !== 'object') {
            State.data = Storage.load();
        }

        /* Apply theme + accent (updates <html> attributes) */
        Theme.apply();

        /* Kick off repeat task engine (summon daily repeats) */
        if (typeof Tasks !== 'undefined') Tasks.summonRepeats();

        /* Start live clock */
        if (typeof Clock !== 'undefined') Clock.start();

        /* Init pomodoro timer display */
        if (typeof Pomo !== 'undefined') {
            Pomo.init();
            Pomo.requestNotificationPermission();
        }

        /* Render all pages */
        if (typeof Home    !== 'undefined') Home.render();
        if (typeof Tasks   !== 'undefined') Tasks.render();
        if (typeof Dump    !== 'undefined') Dump.render();
        if (typeof Report  !== 'undefined') Report.render();
        if (typeof Habits  !== 'undefined') Habits.render();
        if (typeof Settings !== 'undefined') Settings.render();

        /* Gamification */
        if (typeof Level !== 'undefined') Level.update();

        /* Nav badges */
        if (typeof Nav !== 'undefined') Nav.updateBadges();

        /* Daily quote */
        if (typeof Quotes !== 'undefined') Quotes.render();

        /* Default date on task modal */
        const dateInp = document.getElementById('taskDateInput');
        if (dateInp) dateInp.value = Utils.today();

        /* Restore user email display */
        const emailDisp = document.getElementById('userEmailDisplay');
        if (emailDisp) emailDisp.textContent = State.user?.email || '—';

        /* Avatar */
        if (typeof Settings !== 'undefined') Settings.applyAvatarDisplay();

        console.log(`Focussium 3.0 🚀 | Schema v${CONFIG.SCHEMA_VERSION} | ${Utils.today()}`);
    }
};

/* ═══════════════════════════════════════════════════════════
   BOOT SEQUENCE
═══════════════════════════════════════════════════════════ */
window.addEventListener('load', () => {
    /* Inject all SVG icons into DOM */
    if (typeof injectIcons === 'function') injectIcons();

    /* Firebase Auth bootstrap (handles login screen + onboard check) */
    if (typeof Auth !== 'undefined') Auth.init();

    /* Service Worker — auto-update on new version */
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('./sw.js')
            .then(reg => {
                /* Activate waiting SW immediately */
                if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                /* Reload when new SW takes control */
                let refreshed = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (refreshed) return;
                    refreshed = true;
                    window.location.reload();
                });

                /* Poll for updates every 60s */
                setInterval(() => reg.update(), 60_000);
            })
            .catch(err => console.warn('SW registration failed:', err));
    }
});
