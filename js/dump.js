/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — BRAIN DUMP MODULE
   Brain dump capture, mood logging, task conversion
═══════════════════════════════════════════════════════════ */

const Dump = {
    add() {
        const ta = document.getElementById('dumpTextarea');
        const text = ta?.value.trim();
        if (!text) return;

        State.data.dumps.unshift({
            id: Utils.generateId('dump'),
            text,
            ts: Date.now()
        });

        if (ta) ta.value = '';
        Storage.save();
        this.render();
        Nav.updateBadges();
        Sound.success();
        Toast.show('Thought captured');
    },

    render() {
        const container = document.getElementById('dumpsContainer');
        if (!container) return;

        this.updateMoodUI();

        if (!State.data.dumps.length) {
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${Icons.brain(56)}</div>
                <p>Your brain dump is empty.<br>Drop whatever's taking space in your head.</p>
            </div>`;
            return;
        }

        container.innerHTML = State.data.dumps.map((d, i) => {
            const dt = new Date(d.ts);
            const time = dt.toLocaleDateString('en', { month: 'short', day: 'numeric' }) +
                ' · ' +
                dt.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

            return `
            <div class="dump-card" style="animation-delay:${i * CONFIG.TASK_ANIMATION_STAGGER}s">
                <div class="dump-text">${Utils.escape(d.text)}</div>
                <div class="dump-footer">
                    <span class="dump-time">${time}</span>
                    <div class="dump-actions">
                        <button class="dump-action-btn convert" data-action="dump-to-task" data-dump-id="${d.id}">→ Task</button>
                        <button class="dump-action-btn remove" data-action="dump-remove" data-dump-id="${d.id}">Remove</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    updateMoodUI() {
        const icon = document.getElementById('moodLoggerIcon');
        if (icon) icon.innerHTML = Icons.spark(12);

        if (!State.data.moods) State.data.moods = [];
        const today = Utils.today();
        const todayMood = State.data.moods.find(m => m.date === today)?.mood || '';

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', btn.classList.contains(todayMood));
        });
    },

    logMood(moodType) {
        if (!State.data.moods) State.data.moods = [];
        const today = Utils.today();
        const existingIndex = State.data.moods.findIndex(m => m.date === today);

        const moodEntry = {
            date: today,
            time: new Date().toLocaleTimeString(),
            mood: moodType
        };

        if (existingIndex !== -1) {
            State.data.moods[existingIndex] = moodEntry;
        } else {
            State.data.moods.push(moodEntry);
        }

        Storage.save();
        this.updateMoodUI();
        Sound.success();
        Toast.show(`Vibe logged: ${moodType.toUpperCase()}!`);

        if (document.getElementById('reportCardDayDetail')) {
            Report.render();
        }
    },

    toTask(id) {
        const dump = State.data.dumps.find(d => d.id === id);
        if (!dump) return;

        State.data.tasks.unshift({
            id: Utils.generateId('task'),
            text: dump.text,
            notes: '',
            date: Utils.today(),
            time: '',
            priority: 'none',
            list: State.data.lists[0] || 'My Tasks',
            completed: false,
            completedAt: null,
            createdAt: Date.now(),
            subtasks: [],
            repeat: 'none'
        });

        State.data.dumps = State.data.dumps.filter(d => d.id !== id);
        Storage.save();
        this.render();
        Tasks.render();
        Home.render();
        Nav.updateBadges();
        Sound.success();
        Toast.show('Converted to task');
    },

    remove(id) {
        State.data.dumps = State.data.dumps.filter(d => d.id !== id);
        Storage.save();
        this.render();
        Nav.updateBadges();
        Sound.delete();
    }
};

/* ─── DUMP EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const el = e.target.closest('[data-action]');

    if (action === 'dump-to-task') Dump.toTask(el.dataset.dumpId);
    if (action === 'dump-remove')  Dump.remove(el.dataset.dumpId);
});
