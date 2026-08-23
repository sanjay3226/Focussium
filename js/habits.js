/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — HABITS MODULE (NEW FEATURE)
   Daily micro-habit tracker with streaks + XP rewards
═══════════════════════════════════════════════════════════ */

const Habits = {
    /* ─── RENDER MAIN HABITS PAGE ─── */
    render() {
        const container = document.getElementById('habitsContainer');
        if (!container) return;

        const today = Utils.today();
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabledHabits = config.filter(h => h.enabled);
        const todayCompleted = State.data.habits?.[today] || [];

        const allDone = enabledHabits.length > 0 &&
            enabledHabits.every(h => todayCompleted.includes(h.id));

        // XP bonus banner
        const bonusHTML = allDone ? `
        <div class="habits-bonus-banner">
            ⚡ All habits complete! +${CONFIG.XP_PER_HABIT_DAY} XP bonus earned today.
        </div>` : '';

        // Progress bar
        const pct = enabledHabits.length
            ? Math.round((todayCompleted.length / enabledHabits.length) * 100)
            : 0;

        // Streak calculation
        const streak = this.calculateStreak();

        container.innerHTML = `
        <div class="habits-header">
            <div class="habits-header-meta">
                <span class="habits-streak">${Icons.fire(14)} ${streak} day streak</span>
                <span class="habits-xp-hint">${todayCompleted.length}/${enabledHabits.length} done today</span>
            </div>
            <div class="habits-progress-bar-wrap">
                <div class="habits-progress-bar" style="width:${pct}%"></div>
            </div>
        </div>
        ${bonusHTML}
        <div class="habits-list">
            ${enabledHabits.map(habit => {
                const done = todayCompleted.includes(habit.id);
                return `
                <button class="habit-item ${done ? 'done' : ''}"
                        data-action="toggle-habit" data-habit-id="${habit.id}"
                        aria-pressed="${done}">
                    <span class="habit-icon">${habit.icon}</span>
                    <span class="habit-label">${Utils.escape(habit.label)}</span>
                    <span class="habit-check">${Icons.check(16)}</span>
                </button>`;
            }).join('')}
        </div>
        <div class="habits-section-title">Last 7 Days</div>
        ${this.renderStreakGrid()}
        <div class="habits-configure-row">
            <button class="habits-configure-btn" data-action="open-habit-config">
                ${Icons.edit(14)} Configure Habits
            </button>
        </div>`;
    },

    /* ─── TOGGLE HABIT ─── */
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

        // Check if all enabled habits done → award XP
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const allDone = enabled.length > 0 && enabled.every(h => dayHabits.includes(h.id));

        // Track if today was already a "full day" to avoid double-awarding
        if (allDone && !State.data._habitBonusAwardedDays?.includes(today)) {
            if (!State.data._habitBonusAwardedDays) State.data._habitBonusAwardedDays = [];
            State.data._habitBonusAwardedDays.push(today);
            State.data.totalHabitDaysCompleted = (State.data.totalHabitDaysCompleted || 0) + 1;
            Level.update();
            Toast.show(`All habits done! ⚡ +${CONFIG.XP_PER_HABIT_DAY} XP`);
            Sound.success();
        } else {
            Sound.click();
        }

        Storage.save();
        this.render();
        Home.renderHabitsPreview();
    },

    /* ─── 7-DAY STREAK GRID ─── */
    renderStreakGrid() {
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const total = enabled.length || 1;
        const days = [];

        for (let i = 6; i >= 0; i--) {
            const date = Utils.daysAgo(i);
            const done = (State.data.habits?.[date] || []).length;
            const pct  = Math.min(100, Math.round((done / total) * 100));
            const isToday = i === 0;
            const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
            days.push({ date, done, pct, isToday, dayName });
        }

        return `
        <div class="habits-streak-grid">
            ${days.map(d => `
            <div class="habit-streak-col">
                <div class="habit-streak-bar-wrap">
                    <div class="habit-streak-bar-fill" style="height:${d.pct}%; background: ${d.pct === 100 ? 'var(--ac)' : d.pct > 0 ? 'rgba(var(--acr),0.5)' : 'var(--bg4)'}"></div>
                </div>
                <div class="habit-streak-day ${d.isToday ? 'today' : ''}">${d.dayName}</div>
                <div class="habit-streak-count">${d.done}/${enabled.length || 0}</div>
            </div>`).join('')}
        </div>`;
    },

    /* ─── STREAK CALCULATION ─── */
    calculateStreak() {
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        if (!enabled.length) return 0;

        let streak = 0;
        let date = Utils.today();

        while (true) {
            const dayHabits = State.data.habits?.[date] || [];
            const allDone = enabled.every(h => dayHabits.includes(h.id));
            if (!allDone) break;
            streak++;
            // Go to previous day
            const d = new Date(date + 'T00:00:00');
            d.setDate(d.getDate() - 1);
            date = d.toISOString().split('T')[0];
        }

        return streak;
    },

    /* ─── MINI CARD FOR HOME (v3.0 new) ─── */
    renderHomeCard() {
        const today = Utils.today();
        const config = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const done = (State.data.habits?.[today] || []).length;
        const pct  = enabled.length ? Math.round((done / enabled.length) * 100) : 0;

        return `
        <div class="home-habits-card">
            <div class="home-habits-header">
                <span class="home-habits-title">${Icons.fire(12)} Daily Habits</span>
                <span class="home-habits-count">${done}/${enabled.length}</span>
            </div>
            <div class="home-habits-progress-bar">
                <div class="home-habits-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="home-habits-dots">
                ${enabled.map(h => {
                    const isDone = (State.data.habits?.[today] || []).includes(h.id);
                    return `<span class="home-habit-dot ${isDone ? 'done' : ''}" title="${h.label}">${h.icon}</span>`;
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

    if (action === 'toggle-habit')    Habits.toggle(el.dataset.habitId);
    if (action === 'open-habit-config') {
        // Future: open habit config modal
        Toast.show('Habit config coming in v3.1!');
    }
});
