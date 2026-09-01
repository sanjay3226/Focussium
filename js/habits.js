/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — HABITS MODULE
   Complete habit tracker with add/edit/delete config
═══════════════════════════════════════════════════════════ */

const Habits = {

    /* ─── RENDER MAIN HABITS PAGE ─── */
    render() {
        const container = document.getElementById('habitsContainer');
        if (!container) return;

        const today    = Utils.today();
        const config   = State.data.habitConfig || DEFAULT_HABITS;
        const enabled  = config.filter(h => h.enabled);
        const todayDone = State.data.habits?.[today] || [];

        const allDone = enabled.length > 0 && enabled.every(h => todayDone.includes(h.id));
        const pct = enabled.length ? Math.round((todayDone.length / enabled.length) * 100) : 0;
        const streak = this.calculateStreak();

        const bonusHTML = allDone ? `
        <div class="habits-bonus-banner">
            ${Icons.bolt ? Icons.bolt(14) : '⚡'} All habits complete! +${CONFIG.XP_PER_HABIT_DAY} XP earned.
        </div>` : '';

        container.innerHTML = `
        <div class="habits-header">
            <div class="habits-header-meta">
                <span class="habits-streak">${Icons.fire ? Icons.fire(14) : '🔥'} ${streak} day streak</span>
                <span class="habits-xp-hint">${todayDone.length}/${enabled.length} done</span>
            </div>
            <div class="habits-progress-bar-wrap">
                <div class="habits-progress-bar" style="width:${pct}%"></div>
            </div>
        </div>
        ${bonusHTML}
        <div class="habits-list">
            ${enabled.length === 0 ? `
            <div class="habits-empty-state">
                <div class="habits-empty-icon">${Icons.shield ? Icons.shield(32) : '🛡️'}</div>
                <p>No habits yet.<br>Tap <strong>Add Habit</strong> to begin your streak.</p>
            </div>` :
            enabled.map(habit => {
                const done = todayDone.includes(habit.id);
                return `
                <button class="habit-item ${done ? 'done' : ''}"
                        data-action="toggle-habit" data-habit-id="${habit.id}"
                        aria-pressed="${done}">
                    <span class="habit-icon">${Icons.getHabitIcon ? Icons.getHabitIcon(habit.icon, 20) : '✦'}</span>
                    <span class="habit-label">${Utils.escape(habit.label)}</span>
                    <span class="habit-check">${Icons.check ? Icons.check(14) : '✓'}</span>
                </button>`;
            }).join('')}
        </div>

        <div class="habits-section-title">Last 7 Days</div>
        ${this.renderStreakGrid()}

        <div class="habits-manage-section">
            <div class="habits-manage-header">
                <span class="habits-manage-title">All Habits</span>
                <button class="habits-add-btn" data-action="open-habit-add">
                    ${Icons.plus ? Icons.plus(14) : '+'} Add Habit
                </button>
            </div>
            <div class="habits-all-list">
                ${config.length === 0 ? `<p class="habits-none-msg">No habits configured yet.</p>` :
                config.map(h => `
                <div class="habit-config-row">
                    <div class="habit-config-left">
                        <span class="habit-config-icon">${Icons.getHabitIcon ? Icons.getHabitIcon(h.icon, 16) : '✦'}</span>
                        <span class="habit-config-label ${!h.enabled ? 'disabled' : ''}">${Utils.escape(h.label)}</span>
                    </div>
                    <div class="habit-config-actions">
                        <div class="toggle mini-toggle ${h.enabled ? 'on' : ''}"
                             data-action="habit-toggle-enable"
                             data-habit-id="${h.id}"
                             role="switch"
                             aria-checked="${h.enabled}"></div>
                        <button class="habit-edit-btn" data-action="open-habit-edit" data-habit-id="${h.id}" title="Edit">
                            ${Icons.edit ? Icons.edit(13) : '✏️'}
                        </button>
                        <button class="habit-delete-btn" data-action="habit-delete" data-habit-id="${h.id}" title="Delete">
                            ${Icons.trash ? Icons.trash(13) : '🗑️'}
                        </button>
                    </div>
                </div>`).join('')}
            </div>
        </div>`;
    },

    /* ─── TOGGLE HABIT COMPLETION ─── */
    toggle(habitId) {
        const today = Utils.today();
        if (!State.data.habits) State.data.habits = {};
        if (!State.data.habits[today]) State.data.habits[today] = [];

        const dayHabits = State.data.habits[today];
        const idx = dayHabits.indexOf(habitId);
        if (idx === -1) {
            dayHabits.push(habitId);
        } else {
            dayHabits.splice(idx, 1);
        }

        const config  = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const allDone = enabled.length > 0 && enabled.every(h => dayHabits.includes(h.id));

        if (allDone && !State.data._habitBonusAwardedDays?.includes(today)) {
            if (!State.data._habitBonusAwardedDays) State.data._habitBonusAwardedDays = [];
            State.data._habitBonusAwardedDays.push(today);
            State.data.totalHabitDaysCompleted = (State.data.totalHabitDaysCompleted || 0) + 1;
            if (typeof Level !== 'undefined') Level.update();
            Toast.show(`All habits done! ⚡ +${CONFIG.XP_PER_HABIT_DAY} XP`);
            Sound.success();
        } else {
            Sound.click();
        }

        Storage.save();
        this.render();
        if (typeof Home !== 'undefined') Home.renderHabitsPreview();
    },

    /* ─── TOGGLE ENABLE/DISABLE ─── */
    toggleEnable(habitId) {
        if (!State.data.habitConfig) State.data.habitConfig = [...DEFAULT_HABITS];
        const habit = State.data.habitConfig.find(h => h.id === habitId);
        if (habit) {
            habit.enabled = !habit.enabled;
            Storage.save();
            this.render();
            Sound.click();
        }
    },

    /* ─── DELETE HABIT ─── */
    deleteHabit(habitId) {
        if (!State.data.habitConfig) State.data.habitConfig = [...DEFAULT_HABITS];
        if (!confirm('Delete this habit? This cannot be undone.')) return;
        State.data.habitConfig = State.data.habitConfig.filter(h => h.id !== habitId);
        Storage.save();
        this.render();
        if (typeof Home !== 'undefined') Home.renderHabitsPreview();
        Sound.click();
        Toast.show('Habit deleted.');
    },

    /* ─── OPEN ADD MODAL ─── */
    openAddModal() {
        document.getElementById('habitModalTitle').textContent  = 'Add Habit';
        document.getElementById('habitLabelInput').value        = '';
        document.getElementById('habitIconSelect').value        = 'workout';
        document.getElementById('editingHabitId').value         = '';
        document.getElementById('habitSubmitBtn').textContent   = 'Add Habit';
        document.getElementById('habitModal').classList.add('on');
        Sound.click();
    },

    /* ─── OPEN EDIT MODAL ─── */
    openEditModal(habitId) {
        if (!State.data.habitConfig) State.data.habitConfig = [...DEFAULT_HABITS];
        const habit = State.data.habitConfig.find(h => h.id === habitId);
        if (!habit) return;

        document.getElementById('habitModalTitle').textContent  = 'Edit Habit';
        document.getElementById('habitLabelInput').value        = habit.label;
        document.getElementById('habitIconSelect').value        = habit.icon || 'workout';
        document.getElementById('editingHabitId').value         = habitId;
        document.getElementById('habitSubmitBtn').textContent   = 'Save Changes';
        document.getElementById('habitModal').classList.add('on');
        Sound.click();
    },

    /* ─── SUBMIT HABIT (add or edit) ─── */
    submitHabit() {
        const label   = document.getElementById('habitLabelInput').value.trim();
        const icon    = document.getElementById('habitIconSelect').value;
        const editId  = document.getElementById('editingHabitId').value;

        if (!label) {
            Toast.show('Please enter a habit name.');
            return;
        }

        if (!State.data.habitConfig) State.data.habitConfig = [...DEFAULT_HABITS];

        if (editId) {
            // Edit existing
            const habit = State.data.habitConfig.find(h => h.id === editId);
            if (habit) {
                habit.label = label;
                habit.icon  = icon;
            }
            Toast.show('Habit updated! ✓');
        } else {
            // Add new — generate unique ID
            const id = 'habit_' + Date.now();
            State.data.habitConfig.push({ id, label, icon, enabled: true });
            Toast.show('New habit added! 🌱');
        }

        Storage.save();
        document.getElementById('habitModal').classList.remove('on');
        this.render();
        if (typeof Home !== 'undefined') Home.renderHabitsPreview();
        Sound.success();
    },

    /* ─── 7-DAY STREAK GRID ─── */
    renderStreakGrid() {
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const total   = enabled.length || 1;
        const days    = [];

        for (let i = 6; i >= 0; i--) {
            const date    = Utils.daysAgo(i);
            const done    = (State.data.habits?.[date] || []).length;
            const pct     = Math.min(100, Math.round((done / total) * 100));
            const isToday = i === 0;
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
            days.push({ date, done, pct, isToday, dayName });
        }

        return `
        <div class="habits-streak-grid">
            ${days.map(d => `
            <div class="habit-streak-col">
                <div class="habit-streak-bar-wrap">
                    <div class="habit-streak-bar-fill" style="height:${d.pct}%; background: ${
                        d.pct === 100 ? 'var(--ac)' :
                        d.pct > 0     ? 'rgba(var(--acr),0.5)' :
                        'var(--bg4)'
                    }"></div>
                </div>
                <div class="habit-streak-day ${d.isToday ? 'today' : ''}">${d.dayName}</div>
                <div class="habit-streak-count">${d.done}/${enabled.length || 0}</div>
            </div>`).join('')}
        </div>`;
    },

    /* ─── STREAK CALCULATION ─── */
    calculateStreak() {
        const config  = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        if (!enabled.length) return 0;

        let streak = 0;
        let date   = Utils.today();
        let checkedToday = false;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const dayHabits = State.data.habits?.[date] || [];
            const allDone   = enabled.every(h => dayHabits.includes(h.id));
            if (!allDone) {
                // If today is incomplete, don't wipe streak yet; check backwards from yesterday
                if (!checkedToday && date === Utils.today()) {
                    checkedToday = true;
                    const d = new Date(date + 'T00:00:00');
                    d.setDate(d.getDate() - 1);
                    date = d.toISOString().split('T')[0];
                    continue;
                }
                break;
            }
            streak++;
            checkedToday = true;
            const d = new Date(date + 'T00:00:00');
            d.setDate(d.getDate() - 1);
            date = d.toISOString().split('T')[0];
        }
        return streak;
    },

    /* ─── MINI CARD FOR HOME ─── */
    renderHomeCard() {
        const today   = Utils.today();
        const config  = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const done    = (State.data.habits?.[today] || []).length;
        const pct     = enabled.length ? Math.round((done / enabled.length) * 100) : 0;

        return `
        <div class="home-habits-card" data-action="nav-go" data-page="habits">
            <div class="home-habits-header">
                <span class="home-habits-title">${Icons.shield ? Icons.shield(13) : '🛡️'} Daily Habits</span>
                <span class="home-habits-count">${done}/${enabled.length}</span>
            </div>
            <div class="home-habits-progress-bar">
                <div class="home-habits-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="home-habits-dots">
                ${enabled.map(h => {
                    const isDone = (State.data.habits?.[today] || []).includes(h.id);
                    return `
                    <div class="home-habit-chip ${isDone ? 'done' : ''}" title="${Utils.escape(h.label)}">
                        <span class="home-habit-icon">${Icons.getHabitIcon ? Icons.getHabitIcon(h.icon, 14) : '✦'}</span>
                        <span class="home-habit-name">${Utils.escape(h.label)}</span>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }
};

/* ─── HABITS EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const el = e.target.closest('[data-action]');

    if (action === 'toggle-habit')       Habits.toggle(el.dataset.habitId);
    if (action === 'habit-toggle-enable') Habits.toggleEnable(el.dataset.habitId);
    if (action === 'habit-delete')        Habits.deleteHabit(el.dataset.habitId);
    if (action === 'open-habit-add')      Habits.openAddModal();
    if (action === 'open-habit-edit')     Habits.openEditModal(el.dataset.habitId);
    if (action === 'habit-submit')        Habits.submitHabit();
    if (action === 'habit-modal-close') {
        document.getElementById('habitModal')?.classList.remove('on');
        Sound.close();
    }
});
