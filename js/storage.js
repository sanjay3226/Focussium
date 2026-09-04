/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — STORAGE MODULE
   localStorage + Firestore sync + Data Export/Import
═══════════════════════════════════════════════════════════ */

const Storage = {
    LOCAL_KEY: 'focussium_v3_data',
    LEGACY_KEY: 'focussium_v2_data',

    /* ─── LOAD ─── */
    load() {
        // Try v3 key first, fall back to v2 (migration path)
        let raw = localStorage.getItem(this.LOCAL_KEY);
        if (!raw) raw = localStorage.getItem(this.LEGACY_KEY);

        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // Run schema migration then full validation
                const migrated = State.migrate(parsed);
                return State.validate(migrated);
            } catch (e) {
                handleError('Failed to parse local data', e);
                return Utils.clone(State.defaults);
            }
        }
        return Utils.clone(State.defaults);
    },

    /* ─── SAVE LOCAL ─── */
    saveLocal() {
        try {
            localStorage.setItem(this.LOCAL_KEY, JSON.stringify(State.data));
        } catch (e) {
            handleError('localStorage save failed', e);
        }
    },

    /* ─── SAVE REMOTE (Firestore) ─── */
    async saveRemote() {
        if (!State.user) return;

        const indicator = document.getElementById('syncIndicator');
        if (indicator) indicator.className = 'sync-indicator saving';

        try {
            await FB.db.collection('users').doc(State.user.uid).set(Utils.clone(State.data));
            if (indicator) indicator.className = 'sync-indicator';
        } catch (e) {
            handleError('Firestore save failed', e);
            if (indicator) indicator.className = 'sync-indicator error';
        }
    },

    /* ─── DEBOUNCED SAVE (local now, remote after delay) ─── */
    save() {
        this.saveLocal();
        clearTimeout(State.saveTimeout);
        State.saveTimeout = setTimeout(() => this.saveRemote(), CONFIG.SAVE_DEBOUNCE);
    },

    /* ─── EXPORT (v3.0 NEW) ─── */
    export() {
        try {
            const exportData = {
                exportedAt: new Date().toISOString(),
                appVersion: APP_VERSION,
                schemaVersion: SCHEMA_VERSION,
                data: Utils.clone(State.data)
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `focussium-backup-${Utils.today()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            Toast.show('Backup downloaded!');
        } catch (e) {
            handleError('Export failed', e);
            Toast.show('Export failed. Try again.');
        }
    },

    /* ─── IMPORT (v3.0 NEW) ─── */
    import(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                // Accept both wrapped exports and raw data
                const rawData = json.data || json;
                const migrated = State.migrate(rawData);
                const validated = State.validate(migrated);

                if (!confirm('Replace all current data with imported backup?')) return;

                State.data = validated;
                this.save();

                // Re-render all views
                Theme.apply();
                Home.render();
                Tasks.render();
                Dump.render();
                Pomo.init();
                Report.render();
                Habits.render();
                Level.update();

                Toast.show('Data imported successfully!');
            } catch (err) {
                handleError('Import failed', err);
                Toast.show('Import failed — invalid backup file.');
            }
        };
        reader.readAsText(file);
    }
};
