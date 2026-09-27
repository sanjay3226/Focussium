/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — AUTH MODULE
   Firebase Google Authentication
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
            // Close all open modals
            document.querySelectorAll('.modal.on').forEach(m => m.classList.remove('on'));

            // Stop any running pomo timer
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
     * Merge remote Firestore data with local data without losing recent local changes.
     * Remote wins for historical records (tasks, pomo sessions, habits history, dumps, moods).
     * Local wins for active user preferences (settings, habitConfig, name).
     */
    _mergeRemoteData(local, remote) {
        if (!remote || typeof remote !== 'object') return local;

        const merged = {
            ...remote,
            // User preferences: always keep local version (user just changed these)
            settings:    { ...remote.settings, ...local.settings },
            habitConfig: (Array.isArray(local.habitConfig) && local.habitConfig.length)
                             ? local.habitConfig
                             : (remote.habitConfig || []),
            name:        local.name || remote.name || '',
            onboarded:   local.onboarded || remote.onboarded,

            // Habits history: merge by date key — local entries take priority for today
            habits: (() => {
                const today = (new Date()).toISOString().split('T')[0];
                const merged = { ...(remote.habits || {}) };
                // Local today always wins (user just ticked/unticked today)
                if (local.habits && local.habits[today]) {
                    merged[today] = local.habits[today];
                }
                return merged;
            })(),

            // Tasks: if local has more tasks, prefer local (offline edits)
            tasks: (Array.isArray(local.tasks) && local.tasks.length >= (remote.tasks || []).length)
                       ? local.tasks
                       : (remote.tasks || []),

            // Keep local pomo streak / bonus tracking if higher (offline sessions)
            totalFocusMinutes:       Math.max(local.totalFocusMinutes || 0, remote.totalFocusMinutes || 0),
            totalTasksCompleted:     Math.max(local.totalTasksCompleted || 0, remote.totalTasksCompleted || 0),
            totalHabitDaysCompleted: Math.max(local.totalHabitDaysCompleted || 0, remote.totalHabitDaysCompleted || 0),
            level: Math.max(local.level || 1, remote.level || 1),
        };

        return State.validate(State.migrate(merged));
    },

    init() {
        let initialized = false;
        const hideLoading = () => {
            if (initialized) return;
            initialized = true;
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) loadingScreen.classList.add('hide');
        };

        // Instant Paint: load cached localStorage immediately so user never waits on slow network
        State.data = Storage.load();
        if (State.data && State.data.onboarded) {
            document.getElementById('app')?.classList.add('show');
            App.init();
            setTimeout(hideLoading, 250);
        } else {
            setTimeout(hideLoading, 700);
        }

        FB.auth.onAuthStateChanged(async user => {
            if (user) {
                State.user = user;

                if (typeof Settings !== 'undefined' && Settings.applyAvatarDisplay) {
                    Settings.applyAvatarDisplay();
                }

                const emailDisp = document.getElementById('userEmailDisplay');
                if (emailDisp) emailDisp.textContent = user.email || '';

                document.getElementById('loginScreen')?.classList.remove('show');
                hideLoading();

                if (!State.data.onboarded) {
                    if (typeof Onboard !== 'undefined' && Onboard.show) Onboard.show();
                } else if (!document.getElementById('app')?.classList.contains('show')) {
                    document.getElementById('app')?.classList.add('show');
                    App.init();
                }

                // Background sync from Firestore (non-blocking, smart merge)
                // Timeout: 6s — if Firestore is blocked by adblocker, give up cleanly
                const syncTimeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('sync-timeout')), 6000)
                );

                try {
                    const doc = await Promise.race([
                        FB.db.collection('users').doc(user.uid).get(),
                        syncTimeout
                    ]);

                    if (doc.exists) {
                        // Smart merge: never blindly overwrite local with stale remote
                        State.data = Auth._mergeRemoteData(State.data, doc.data());
                        Storage.saveLocal(); // persist merged result locally

                        // Update sync dot to green
                        const indicator = document.getElementById('syncIndicator');
                        if (indicator) indicator.className = 'sync-indicator synced';

                        // Re-render all affected views with merged data
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
                    // Sync dot stays neutral / error — handled by saveRemote in storage.js
                }
            } else {
                State.user = null;
                hideLoading();
                if (!State.data?.onboarded) {
                    document.getElementById('app')?.classList.remove('show');
                    document.getElementById('loginScreen')?.classList.add('show');
                }
                App.init();
            }
        });
    }
};
