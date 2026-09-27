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

                // Background sync from Firestore (non-blocking)
                try {
                    const doc = await FB.db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        const remoteData = doc.data();
                        const migrated = State.migrate(remoteData);
                        State.data = State.validate(migrated);
                        Storage.save();
                        if (typeof Home !== 'undefined') Home.render();
                        if (typeof Tasks !== 'undefined') Tasks.render();
                        if (typeof Habits !== 'undefined') Habits.render();
                        if (typeof Report !== 'undefined') Report.render();
                    }
                } catch (e) {
                    ErrorLog.log('Firestore background sync failed, using local', e, 'warn');
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
