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
        const user    = State.user;
        const data    = State.data;
        const xpInfo  = Level.getXPInfo();

        // Avatar
        const avatarEl = document.getElementById('accountAvatar');
        if (avatarEl) {
            avatarEl.src = user?.photoURL || '';
            avatarEl.style.display = user?.photoURL ? 'block' : 'none';
        }

        // Name / email
        const nameEl  = document.getElementById('accountName');
        const emailEl = document.getElementById('accountEmail');
        if (nameEl)  nameEl.textContent  = data.name || user?.displayName || 'Focus Warrior';
        if (emailEl) emailEl.textContent = user?.email || 'Offline Mode';

        // Level badge
        const levelEl = document.getElementById('accountLevel');
        if (levelEl)  levelEl.textContent = `Level ${xpInfo.level}`;

        // Rank
        const rankEl  = document.getElementById('accountRank');
        const rankObj = RANKS.find(r => xpInfo.level >= r.minLevel && xpInfo.level <= r.maxLevel);
        if (rankEl) rankEl.textContent = rankObj ? `${rankObj.icon} ${rankObj.name}` : '';

        // XP bar
        const xpFillEl = document.getElementById('accountXpFill');
        const xpTextEl = document.getElementById('accountXpText');
        if (xpFillEl) xpFillEl.style.width = `${xpInfo.pct}%`;
        if (xpTextEl) xpTextEl.textContent = `${xpInfo.current} / ${xpInfo.needed} XP to Level ${xpInfo.level + 1}`;

        // Lifetime stats
        const statsData = [
            { id: 'accountStatTasks',   val: data.totalTasksCompleted || 0,          label: 'Tasks Done' },
            { id: 'accountStatFocus',   val: `${data.totalFocusMinutes || 0}m`,      label: 'Focus Time' },
            { id: 'accountStatStreak',  val: data.streak || 0,                       label: 'Day Streak' },
            { id: 'accountStatHabits',  val: data.totalHabitDaysCompleted || 0,      label: 'Habit Days' },
        ];

        statsData.forEach(({ id, val }) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        // Sign out / sign in button
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

        // Data management
        const exportBtn = document.getElementById('accountExportBtn');
        const importBtn = document.getElementById('accountImportBtn');
        if (exportBtn) exportBtn.dataset.action = 'account-export';
        if (importBtn) importBtn.dataset.action = 'account-import';
    },

    exportData() {
        try {
            const json    = JSON.stringify(State.data, null, 2);
            const blob    = new Blob([json], { type: 'application/json' });
            const url     = URL.createObjectURL(blob);
            const a       = document.createElement('a');
            a.href        = url;
            a.download    = `focussium-backup-${Utils.today()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            Sound.success();
            Toast.show('Data exported!');
        } catch (e) {
            handleError('exportData', e);
            Toast.show('Export failed');
        }
    },

    importData() {
        const input    = document.createElement('input');
        input.type     = 'file';
        input.accept   = '.json';
        input.onchange = (e) => {
            const file   = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (!imported || typeof imported !== 'object') throw new Error('Invalid JSON');
                    // Run migration to ensure schema is current
                    State.data = Storage.migrate(imported);
                    Storage.save();
                    App.init();
                    this.close();
                    Sound.success();
                    Toast.show('Data imported successfully!');
                } catch (err) {
                    handleError('importData', err);
                    Toast.show('Import failed — invalid file');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    deleteAllData() {
        if (!confirm('Delete ALL your Focussium data? This cannot be undone.')) return;
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        State.data = Storage.migrate({});
        App.init();
        this.close();
        Sound.delete();
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
