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

        // Safety fallback if Firebase callback delays
        setTimeout(hideLoading, 1200);

        FB.auth.onAuthStateChanged(async user => {
            if (user) {
                State.user = user;

                try {
                    const doc = await FB.db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        const remoteData = doc.data();
                        const migrated = State.migrate(remoteData);
                        State.data = State.validate(migrated);
                    } else {
                        State.data = Storage.load();
                    }
                } catch (e) {
                    ErrorLog.log('Firestore load failed, using local', e, 'warn');
                    State.data = Storage.load();
                }

                if (typeof Settings !== 'undefined' && Settings.applyAvatarDisplay) {
                    Settings.applyAvatarDisplay();
                }

                const emailDisp = document.getElementById('userEmailDisplay');
                if (emailDisp) emailDisp.textContent = user.email || '';

                document.getElementById('loginScreen')?.classList.remove('show');
                setTimeout(hideLoading, 300);

                if (!State.data.onboarded) {
                    if (typeof Onboard !== 'undefined' && Onboard.show) Onboard.show();
                } else {
                    document.getElementById('app')?.classList.add('show');
                    App.init();
                }
            } else {
                State.user = null;
                State.data = Storage.load();
                document.getElementById('app')?.classList.remove('show');
                document.getElementById('loginScreen')?.classList.add('show');
                setTimeout(hideLoading, 300);
                App.init();
            }
        });
    }
};
