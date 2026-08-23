/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — ACCOUNT MODULE
   Profile modal, XP display, sign-out
═══════════════════════════════════════════════════════════ */

const Account = {
    open() {
        this.render();
        document.getElementById('accountModal')?.classList.add('on');
        Sound.open();
    },

    close() {
        document.getElementById('accountModal')?.classList.remove('on');
        Sound.click();
    },

    render() {
        const user   = State.user;
        const data   = State.data;
        const xpInfo = Level.getXPInfo(); // { xp, level, current, needed, pct, rank, toNext }

        /* ─── Avatar ─── */
        const avatarEl = document.getElementById('accountAvatar');
        const fallbackEl = document.getElementById('accountAvatarFallback');
        const userPhoto = user?.photoURL || data.settings?.customAvatarDataUrl;
        const initial = (data.name || user?.displayName || 'F').charAt(0).toUpperCase();

        if (avatarEl && fallbackEl) {
            if (userPhoto) {
                avatarEl.src = userPhoto;
                avatarEl.style.display = 'block';
                fallbackEl.style.display = 'none';
            } else {
                avatarEl.style.display = 'none';
                fallbackEl.textContent = initial;
                fallbackEl.style.display = 'flex';
            }
        }

        /* ─── Name / email ─── */
        const nameEl  = document.getElementById('accountName');
        const emailEl = document.getElementById('accountEmail');
        if (nameEl)  nameEl.textContent  = data.name || user?.displayName || 'Focus Warrior';
        if (emailEl) emailEl.textContent = user?.email || 'Offline Mode';

        /* ─── Level badge ─── */
        const levelEl = document.getElementById('accountLevel');
        if (levelEl)  levelEl.textContent = xpInfo.level;

        /* ─── Rank pill ─── */
        const rankEl = document.getElementById('accountRank');
        if (rankEl)  rankEl.textContent = `⚡ LVL ${xpInfo.level} • ${xpInfo.rank}`;

        /* ─── XP bar ─── */
        const xpFillEl = document.getElementById('accountXpFill');
        const xpTextEl = document.getElementById('accountXpText');
        if (xpFillEl) xpFillEl.style.width = `${xpInfo.pct}%`;
        if (xpTextEl) xpTextEl.textContent  = `${xpInfo.current} / ${xpInfo.needed} XP to Level ${xpInfo.level + 1}`;

        /* ─── Lifetime stats ─── */
        const statsData = [
            { id: 'accountStatTasks',  val: data.totalTasksCompleted      || 0 },
            { id: 'accountStatFocus',  val: `${data.totalFocusMinutes     || 0}m` },
            { id: 'accountStatStreak', val: data.streak                   || 0 },
            { id: 'accountStatHabits', val: data.totalHabitDaysCompleted  || 0 },
        ];
        statsData.forEach(({ id, val }) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        /* ─── Sign out / sign in button ─── */
        const signBtn = document.getElementById('accountSignBtn');
        if (signBtn) {
            if (user) {
                signBtn.textContent = 'Sign Out';
                signBtn.dataset.action = 'account-sign-out';
            } else {
                signBtn.textContent = 'Sign In with Google';
                signBtn.dataset.action = 'account-sign-in';
            }
        }
    },

    /* ─── EXPORT ─── */
    exportData() {
        Storage.export();
    },

    /* ─── IMPORT ─── */
    importData() {
        const input   = document.createElement('input');
        input.type    = 'file';
        input.accept  = '.json';
        input.onchange = (e) => Storage.import(e.target.files[0]);
        input.click();
    },

    /* ─── DELETE ALL ─── */
    deleteAllData() {
        if (!confirm('Delete ALL your Focussium data? This cannot be undone.')) return;
        localStorage.removeItem(Storage.LOCAL_KEY);
        State.data = State.migrate({});
        Storage.saveLocal();
        App.init();
        this.close();
        if (Sound.delete) Sound.delete();
        Toast.show('All data deleted');
    }
};

/* ─── ACCOUNT EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;

    if (action === 'account-sign-out') { Auth.signOut(); Account.close(); }
    if (action === 'account-sign-in')  { Auth.signInGoogle(); }
    if (action === 'account-export')   { Account.exportData(); }
    if (action === 'account-import')   { Account.importData(); }
    if (action === 'account-delete')   { Account.deleteAllData(); }
});
