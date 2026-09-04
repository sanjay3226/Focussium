/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — HOME MODULE
   Dashboard: progress ring, week chart, stats, task preview, habits
═══════════════════════════════════════════════════════════ */

const Home = {
    render() {
        Quotes.render();
        const todayTasks = Tasks.getVisibleToday();
        const doneTasks  = todayTasks.filter(t => t.completed);
        const focusMin   = State.data.pomo
            .filter(p => p.date === Utils.today())
            .reduce((a, p) => a + p.dur, 0);

        const percent = todayTasks.length
            ? Math.round((doneTasks.length / todayTasks.length) * 100)
            : 0;

        this.renderProgress(percent, doneTasks.length, todayTasks.length, focusMin);
        this.renderWeekSnapshot();
        this.renderStats(todayTasks.length, doneTasks.length, focusMin, State.data.streak || 0);
        this.renderTaskPreview(todayTasks);
        this.renderHabitsPreview(); // v3.0 NEW
    },

    renderProgress(percent, done, total, focusMin) {
        const ring = document.getElementById('progressRingCircle');
        if (ring) {
            const r = 52, circ = 2 * Math.PI * r;
            ring.style.strokeDasharray  = circ;
            ring.style.strokeDashoffset = circ * (1 - percent / 100);
        }
        const pctEl     = document.getElementById('progressPercent');
        const tasksEl   = document.getElementById('progressTasks');
        const focusEl   = document.getElementById('progressFocus');
        const streakEl  = document.getElementById('progressStreak');
        if (pctEl)    pctEl.textContent    = `${percent}%`;
        if (tasksEl)  tasksEl.textContent  = `${done}/${total}`;
        if (focusEl)  focusEl.textContent  = `${focusMin}m`;
        if (streakEl) streakEl.textContent = State.data.streak || 0;
    },

    renderWeekSnapshot() {
        const w     = Utils.weekData(0);
        const prevW = Utils.weekData(-1);
        const score     = Report.getScore(w);
        const prevScore = Report.getScore(prevW);
        const diff = score - prevScore;

        const scoreEl = document.getElementById('homeWeekScore');
        if (scoreEl) scoreEl.textContent = score;

        const trendEl = document.getElementById('homeWeekTrend');
        if (trendEl) {
            if (diff > 0) trendEl.innerHTML = `<span class="trend-up">${Icons.trendUp(11)} +${diff}</span>`;
            else if (diff < 0) trendEl.innerHTML = `<span class="trend-down">${Icons.trendDown(11)} ${diff}</span>`;
            else trendEl.innerHTML = `<span class="trend-flat">— same</span>`;
        }

        // Smooth cubic Bezier mini chart
        const values = w.days.map(d => d.tasks + Math.round(d.focus / 25));
        const max  = Math.max(...values, 1);
        const W = 320, H = 72, padX = 14, padY = 10;
        const chartW = W - padX * 2, chartH = H - padY * 2;

        const points = values.map((v, i) => ({
            x: padX + (i / 6) * chartW,
            y: padY + chartH - (v / max) * chartH
        }));

        let curveD = `M ${points[0].x},${points[0].y}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i], p1 = points[i + 1];
            curveD += ` C ${p0.x + (p1.x - p0.x) * 0.45},${p0.y} ${p0.x + (p1.x - p0.x) * 0.55},${p1.y} ${p1.x},${p1.y}`;
        }
        const areaD = `${curveD} L ${points[points.length-1].x},${H-2} L ${points[0].x},${H-2} Z`;
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#38B6FF';

        const refLines = [0.25, 0.5, 0.75].map((ratio, idx) => {
            const y = padY + chartH * ratio;
            return `<line x1="${padX}" y1="${y}" x2="${W-padX}" y2="${y}" class="mini-chart-ref mini-chart-ref-${idx}"/>`;
        }).join('');

        const dotsHTML = points.map((p, i) => `
            ${values[i] > 0 ? `<circle cx="${p.x}" cy="${p.y}" r="5.5" fill="${ac}" opacity="0.4" style="filter:drop-shadow(0 0 6px ${ac});"/>` : ''}
            <circle cx="${p.x}" cy="${p.y}" r="${values[i] > 0 ? 3.5 : 2}"
                    fill="${values[i] > 0 ? '#FFFFFF' : 'var(--bd)'}"
                    stroke="${values[i] > 0 ? ac : 'none'}" stroke-width="1.5"
                    class="mini-chart-dot" style="animation-delay:${0.3 + i * 0.06}s"
                    opacity="${values[i] > 0 ? 1 : 0.4}"/>
        `).join('');

        const labelsHTML = w.days.map((d, i) => `
            <text x="${points[i].x}" y="${H+12}" text-anchor="middle"
                  fill="var(--tx3)" font-size="8" font-weight="700"
                  font-family="var(--font-sans), sans-serif" letter-spacing="0.04em">${d.name}</text>
        `).join('');

        const chartEl = document.getElementById('weekMiniChart');
        if (chartEl) {
            chartEl.innerHTML = `
            <svg viewBox="0 0 ${W} ${H+16}" class="mini-line-chart" preserveAspectRatio="none" style="overflow:visible;">
                <defs>
                    <linearGradient id="miniAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.38"/>
                        <stop offset="50%" stop-color="${ac}" stop-opacity="0.10"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                ${refLines}
                <path d="${areaD}" fill="url(#miniAreaGrad)" class="mini-chart-area"/>
                <path d="${curveD}" fill="none" stroke="${ac}" stroke-width="5"
                      stroke-linecap="round" stroke-linejoin="round" opacity="0.35"
                      style="filter:drop-shadow(0 0 8px ${ac});" class="mini-chart-glow-outer"/>
                <path d="${curveD}" fill="none" stroke="${ac}" stroke-width="2.8"
                      stroke-linecap="round" stroke-linejoin="round"
                      style="filter:drop-shadow(0 0 4px ${ac});" class="mini-chart-line"/>
                ${dotsHTML}
                ${labelsHTML}
            </svg>`;
        }

        let insight = 'Start your week strong.';
        if (score >= 80)      insight = "You're in a beautiful flow state this week. Keep riding it.";
        else if (score >= 60) insight = 'Strong rhythm — your consistency is building real momentum.';
        else if (score >= 35) insight = 'Momentum is building. One more focus block seals the day.';
        else if (score > 0)   insight = 'Every small step counts. One session can shift everything.';

        const insightEl = document.getElementById('weekInsight');
        if (insightEl) insightEl.textContent = insight;
    },

    renderStats(total, done, focus, streak) {
        const icons  = [Icons.tasks(16), Icons.check(16), Icons.fire(16), Icons.shield(16)];
        const values = [total, done, `${focus}m`, streak];

        for (let i = 0; i < 4; i++) {
            const iconEl  = document.getElementById(`statIcon${i}`);
            const valueEl = document.getElementById(`statValue${i}`);
            if (iconEl)  iconEl.innerHTML   = icons[i] || '';
            if (valueEl) valueEl.textContent = values[i];
        }
    },

    renderTaskPreview(todayTasks) {
        const preview   = Utils.sortTasks(todayTasks.filter(t => !t.completed)).slice(0, 4);
        const container = document.getElementById('homeTasksPreview');
        if (!container) return;

        if (!preview.length) {
            container.innerHTML = `
            <div class="empty-state small">
                <p>All clear ${Icons.spark(14)}</p>
            </div>`;
            return;
        }
        container.innerHTML = preview.map((t, i) => Tasks.taskHTML(t, i)).join('');
    },

    /* v3.0 NEW: mini habits card on home dashboard */
    renderHabitsPreview() {
        const container = document.getElementById('homeHabitsPreview');
        if (!container) return;
        container.innerHTML = Habits.renderHomeCard();
    }
};
