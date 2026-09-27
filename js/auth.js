/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — AUTH MODULE
   Firebase Google Authentication + Psychological Boot Reveal
═══════════════════════════════════════════════════════════ */

const Auth = {
    async signInGoogle() {
        const btn = document.getElementById('googleBtn');
        if (!btn) return;
        const label = btn.querySelector('span:last-child');
        if (label) label.textContent = 'Signing in...';
        btn.disabled = true;

        try {
            await FB.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        } catch (e) {
            const err = document.getElementById('loginError');
            if (err) err.textContent = e.message;
            if (label) label.textContent = 'Continue with Google';
            btn.disabled = false;
            ErrorLog.log('Google sign-in failed', e, 'warn');
        }
    },

    async signOut() {
        try {
            document.querySelectorAll('.modal.on').forEach(m => m.classList.remove('on'));

            if (State.pomo.running) {
                clearInterval(State.pomo.interval);
                State.pomo.running = false;
                State.pomo.interval = null;
            }

            await FB.auth.signOut();
            State.data = Utils.clone(State.defaults);
            localStorage.removeItem(Storage.LOCAL_KEY);
            localStorage.removeItem(Storage.LEGACY_KEY);

            document.getElementById('loginScreen')?.classList.add('show');
            document.getElementById('onboardScreen')?.classList.remove('show');
            document.getElementById('app')?.classList.remove('show');
            Sound.click();
            Toast.show('Signed out cleanly');
        } catch (e) {
            ErrorLog.log('Sign out failed', e, 'error');
            Toast.show('Sign out failed');
        }
    },

    /**
     * Psychological reveal: app renders fully behind the splash (opacity:0),
     * then a double-rAF ensures the browser has painted one complete frame
     * before we trigger the CSS crossfade (splash blurs out, app floats up).
     * The human eye perceives zero loading because there's no hard cut.
     */
    _reveal() {
        const app    = document.getElementById('app');
        const splash = document.getElementById('loadingScreen');
        if (!app || !splash) return;

        // Ensure the app is already in the DOM with its content rendered
        // but still invisible (opacity:0 from CSS .app rule)
        app.classList.add('show');

        // Double rAF: first frame triggers layout, second frame commits paint.
        // This guarantees at least one fully-composited frame exists before
        // the transition fires — eliminates any FPS drop / jank on reveal.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                splash.classList.add('hide');
            });
        });
    },

    /**
     * Merge remote Firestore data with local data without losing recent local changes.
     * Remote wins for historical records (tasks, pomo sessions, habits history, dumps, moods).
     * Local wins for active user preferences (settings, habitConfig, name).
     */
    _mergeRemoteData(local, remote) {
        if (!remote || typeof remote !== 'object') return local;

        const today = (new Date()).toISOString().split('T')[0];

        const merged = {
            ...remote,
            // User preferences: always keep local version
            settings:    { ...remote.settings, ...local.settings },
            habitConfig: (Array.isArray(local.habitConfig) && local.habitConfig.length)
                             ? local.habitConfig
                             : (remote.habitConfig || []),
            name:        local.name || remote.name || '',
            onboarded:   local.onboarded || remote.onboarded,

            // Habits history: local always wins for any day recorded locally
            habits: {
                ...(remote.habits || {}),
                ...(local.habits || {})
            },

            // Tasks: prefer whichever side has more (offline edits)
            tasks: (Array.isArray(local.tasks) && local.tasks.length >= (remote.tasks || []).length)
                       ? local.tasks
                       : (remote.tasks || []),

            // Keep highest XP counters (offline sessions)
            totalFocusMinutes:       Math.max(local.totalFocusMinutes || 0,       remote.totalFocusMinutes || 0),
            totalTasksCompleted:     Math.max(local.totalTasksCompleted || 0,     remote.totalTasksCompleted || 0),
            totalHabitDaysCompleted: Math.max(local.totalHabitDaysCompleted || 0, remote.totalHabitDaysCompleted || 0),
            level: Math.max(local.level || 1, remote.level || 1),
        };

        return State.validate(State.migrate(merged));
    },

    init() {
        // ── Step 1: Load cached local data instantly (zero network wait) ──
        State.data = Storage.load();

        // ── Step 2: If user is known (onboarded), render app fully BEHIND the splash ──
        //    The app is at opacity:0 via CSS — user sees splash, not a blank screen.
        if (State.data && State.data.onboarded) {
            document.getElementById('app')?.style.setProperty('visibility', 'visible');
            App.init();  // Full render, invisible behind splash
        }

        // ── Step 3: Wait for Firebase auth state (max ~1-2 frames on cached token) ──
        let revealed = false;

        const doReveal = () => {
            if (revealed) return;
            revealed = true;
            Auth._reveal();
        };

        // Safety net: reveal after 2.5s even if Firebase is slow/blocked
        const safetyTimer = setTimeout(doReveal, 2500);

        FB.auth.onAuthStateChanged(async user => {
            clearTimeout(safetyTimer);

            if (user) {
                State.user = user;

                if (typeof Settings !== 'undefined' && Settings.applyAvatarDisplay) {
                    Settings.applyAvatarDisplay();
                }

                const emailDisp = document.getElementById('userEmailDisplay');
                if (emailDisp) emailDisp.textContent = user.email || '';

                document.getElementById('loginScreen')?.classList.remove('show');

                if (!State.data.onboarded) {
                    // New user: show onboarding, then reveal
                    if (typeof Onboard !== 'undefined' && Onboard.show) Onboard.show();
                    doReveal();
                } else {
                    // Returning user: app already rendered behind splash → reveal now
                    if (!document.getElementById('app')?.classList.contains('show')) {
                        App.init();
                    }
                    doReveal();
                }

                // ── Step 4: Background Firestore sync — non-blocking, 6s timeout ──
                const syncTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('sync-timeout')), 6000)
                );

                try {
                    const doc = await Promise.race([
                        FB.db.collection('users').doc(user.uid).get(),
                        syncTimeout
                    ]);

                    if (doc.exists) {
                        // Smart merge: never blindly overwrite recent local changes
                        State.data = Auth._mergeRemoteData(State.data, doc.data());
                        Storage.saveLocal();

                        // Update sync dot green
                        const indicator = document.getElementById('syncIndicator');
                        if (indicator) indicator.className = 'sync-indicator synced';

                        // Silently re-render all views with merged data
                        if (typeof Home    !== 'undefined') Home.render();
                        if (typeof Tasks   !== 'undefined') Tasks.render();
                        if (typeof Habits  !== 'undefined') Habits.render();
                        if (typeof Report  !== 'undefined') Report.render();
                        if (typeof Settings !== 'undefined') Settings.render();
                    }
                } catch (e) {
                    if (e.message !== 'sync-timeout') {
                        ErrorLog.log('Firestore background sync failed, using local', e, 'warn');
                    }
                }

            } else {
                // Not signed in
                State.user = null;

                if (!State.data?.onboarded) {
                    document.getElementById('app')?.classList.remove('show');
                    document.getElementById('loginScreen')?.classList.add('show');
                } else {
                    // Offline mode: already rendered from cache
                    App.init();
                }

                doReveal();
            }
        });
    }
};
