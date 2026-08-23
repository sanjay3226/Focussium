/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — UTILS MODULE
   Pure utility functions + centralized error logging
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   CENTRALIZED ERROR LOGGER (v3.0 UPGRADED)
───────────────────────────────────────────────────────── */
const ErrorLog = {
    entries: [],
    maxEntries: 50,

    log(context, error, severity = 'warn') {
        const entry = {
            ts: new Date().toISOString(),
            context,
            message: error?.message || String(error),
            severity
        };
        this.entries.unshift(entry);
        if (this.entries.length > this.maxEntries) this.entries.pop();

        if (severity === 'error') {
            console.error(`[Focussium 3.0] ${context}:`, error);
        } else {
            console.warn(`[Focussium 3.0] ${context}:`, error);
        }
    }
};

/** Legacy compat wrapper used throughout app */
function handleError(context, error) {
    ErrorLog.log(context, error, 'warn');
}

/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
const Utils = {
    today() {
        return new Date().toISOString().split('T')[0];
    },

    isToday(dateStr) {
        return dateStr === this.today();
    },

    isOverdue(dateStr) {
        return dateStr && dateStr < this.today();
    },

    daysAgo(n) {
        const d = new Date();
        d.setDate(d.getDate() - n);
        return d.toISOString().split('T')[0];
    },

    escape(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    formatTime12(time) {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hr = +h;
        return `${hr % 12 || 12}:${m} ${hr < 12 ? 'AM' : 'PM'}`;
    },

    clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    },

    /** Returns a priority weight for sorting (lower = higher priority) */
    priorityWeight(p) {
        const weights = { high: 0, medium: 1, low: 2, none: 3 };
        return weights[p] ?? 3;
    },

    /** Sort tasks: overdue first, then respect manual drag-and-drop order */
    sortTasks(tasks) {
        const today = this.today();
        return [...tasks].sort((a, b) => {
            const aOverdue = a.date && a.date < today && !a.completed ? 1 : 0;
            const bOverdue = b.date && b.date < today && !b.completed ? 1 : 0;
            if (bOverdue !== aOverdue) return bOverdue - aOverdue;

            const aIdx = State.data.tasks.findIndex(t => t.id === a.id);
            const bIdx = State.data.tasks.findIndex(t => t.id === b.id);
            if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;

            return this.priorityWeight(a.priority) - this.priorityWeight(b.priority);
        });
    },

    weekDates(offset = 0) {
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setHours(0, 0, 0, 0);
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);

        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d.toISOString().split('T')[0];
        });
    },

    weekData(offset = 0) {
        const dates = this.weekDates(offset);
        const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const days = dates.map((date, i) => ({
            date,
            name: names[i],
            tasks: State.data.tasks.filter(t =>
                t.completed &&
                t.completedAt &&
                new Date(t.completedAt).toISOString().split('T')[0] === date
            ).length,
            focus: State.data.pomo
                .filter(p => p.date === date)
                .reduce((a, p) => a + p.dur, 0),
            // v3.0 NEW: habits completion data per day
            habitsCompleted: this._getHabitsCompletedCount(date)
        }));

        return {
            dates,
            days,
            totalTasks: days.reduce((a, d) => a + d.tasks, 0),
            totalFocus: days.reduce((a, d) => a + d.focus, 0),
            activeDays: days.filter(d => d.tasks > 0 || d.focus > 0).length,
            bestDay: days.reduce((best, day) => {
                const bestScore = best.tasks + best.focus / 25;
                const dayScore = day.tasks + day.focus / 25;
                return dayScore > bestScore ? day : best;
            }, days[0])
        };
    },

    /** v3.0: Get count of habits completed on a specific date */
    _getHabitsCompletedCount(date) {
        const dayHabits = State.data.habits?.[date];
        if (!Array.isArray(dayHabits)) return 0;
        return dayHabits.length;
    },

    /** v3.0: Get total enabled habits count */
    getTotalHabitsEnabled() {
        const config = State.data.habitConfig || DEFAULT_HABITS;
        return config.filter(h => h.enabled).length;
    }
};
