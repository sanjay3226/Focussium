/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — CLOCK MODULE
   Live clock display with streak tracking
═══════════════════════════════════════════════════════════ */

const Clock = {
    update() {
        const now = new Date();
        const h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');

        const clockEl = document.getElementById('clock');
        if (clockEl) {
            clockEl.innerHTML = `${h % 12 || 12}:${m}<span class="clock-period">${h < 12 ? 'AM' : 'PM'}</span>`;
        }

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateEl = document.getElementById('dateDisplay');
        if (dateEl) {
            dateEl.textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
        }

        let greeting = 'Good morning';
        if (h < 5) greeting = 'Still up';
        else if (h < 12) greeting = 'Good morning';
        else if (h < 17) greeting = 'Good afternoon';
        else if (h < 21) greeting = 'Good evening';
        else greeting = 'Night owl mode';

        const name = State.data.name || State.user?.displayName?.split(' ')[0] || '';
        const greetEl = document.getElementById('greeting');
        if (greetEl) greetEl.textContent = name ? `${greeting}, ${name}` : greeting;

        this.checkStreak();
    },

    start() {
        this.update();
        if (State.clockInterval) clearInterval(State.clockInterval);
        State.clockInterval = setInterval(() => this.update(), CONFIG.CLOCK_INTERVAL);
    },

    checkStreak() {
        const today = Utils.today();
        if (State.data.lastVisit !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            if (State.data.lastVisit === yesterday) {
                State.data.streak = (State.data.streak || 0) + 1;
            } else if (State.data.lastVisit) {
                State.data.streak = 1;
            } else {
                State.data.streak = 1;
            }

            State.data.lastVisit = today;
            Tasks.summonRepeats();
            Storage.save();
        }
    }
};
