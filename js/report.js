/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — REPORT MODULE
   Analytics, SVG charts, heatmap, PDF export
═══════════════════════════════════════════════════════════ */

const Report = {

    /* ─── SCORE ENGINE ─── */
    getScore(w) {
        const weekTasks    = State.data.tasks.filter(t => !t.date || w.dates.includes(t.date));
        const totalW       = weekTasks.length || 1;
        const completedW   = w.totalTasks;

        const taskScore       = Math.min(25, completedW * 2);
        const focusScore      = Math.min(25, Math.round(w.totalFocus / 12));
        const activeScore     = Math.min(15, Math.round((w.activeDays / 7) * 15));
        const completionScore = Math.min(20, Math.round((completedW / totalW) * 20));
        const streakBonus     = Math.min(10, Math.floor((State.data.streak || 0) / 2));
        const overdueOpen     = State.data.tasks.filter(t => t.date && t.date < Utils.today() && !t.completed).length;
        const overduePenalty  = Math.min(10, overdueOpen * 2);

        return Math.max(0, Math.min(100, taskScore + focusScore + activeScore + completionScore + streakBonus - overduePenalty));
    },

    getScoreBreakdown(w) {
        const weekTasks  = State.data.tasks.filter(t => !t.date || w.dates.includes(t.date));
        const totalW     = weekTasks.length || 1;
        const completedW = w.totalTasks;
        return {
            tasks:       Math.min(25, completedW * 2),
            focus:       Math.min(25, Math.round(w.totalFocus / 12)),
            consistency: Math.min(15, Math.round((w.activeDays / 7) * 15)),
            completion:  Math.min(20, Math.round((completedW / totalW) * 20)),
            streak:      Math.min(10, Math.floor((State.data.streak || 0) / 2)),
            overdue:     Math.min(10, State.data.tasks.filter(t => t.date && t.date < Utils.today() && !t.completed).length * 2)
        };
    },

    /* ─── NAVIGATION ─── */
    changeWeek(dir)  { State.weekOffset  += dir; if (State.weekOffset  > 0) State.weekOffset  = 0; this.render(); Sound.click(); },
    changeMonth(dir) { State.monthOffset += dir; if (State.monthOffset > 0) State.monthOffset = 0; this.render(); Sound.click(); },
    setMode(mode)    { State.reportMode = mode; if (!State.selectedReportDate) State.selectedReportDate = Utils.today(); this.render(); Sound.click(); },
    toggleCollapse(cardId) { document.getElementById(cardId)?.classList.toggle('expanded'); Sound.click(); },

    setChartTab(tab) {
        State.reportChartTab = tab;
        document.getElementById('chartTabTasksBtn')?.classList.toggle('active', tab === 'tasks');
        document.getElementById('chartTabFocusBtn')?.classList.toggle('active', tab === 'focus');
        const w = Utils.weekData(State.weekOffset);
        this.drawChart('analyticsChart', w.days.map(d => tab === 'tasks' ? d.tasks : d.focus), w.days.map(d => d.name), tab);
        Sound.click();
    },

    /* ─── MAIN RENDER ─── */
    render() {
        const w     = Utils.weekData(State.weekOffset);
        const dates = Utils.weekDates(State.weekOffset);
        const m     = this.getMonthData(State.monthOffset);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const start  = new Date(dates[0] + 'T00:00:00');
        const end    = new Date(dates[6] + 'T00:00:00');

        const weekLabelEl = document.getElementById('weekNavLabel');
        if (weekLabelEl) weekLabelEl.textContent = State.weekOffset === 0
            ? 'This Week'
            : `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;

        const monthLabelEl = document.getElementById('monthNavLabel');
        if (monthLabelEl) monthLabelEl.textContent = `${months[m.month]} ${m.year}`;

        if (!State.selectedReportDate) State.selectedReportDate = Utils.today();
        if (!State.reportChartTab)     State.reportChartTab = 'tasks';

        this.renderModePanel(w, m);
        this.applyModeVisibility();
        this.renderScoreHero(w);
        this.renderStats(w);
        this.renderHeatmap(w);
        this.setChartTab(State.reportChartTab);
        this.renderMonthOverview(m);
        this.renderDayDetails(w, m);
        this.renderInsights(w, m);
        this.renderHabitsHeatmap(); // v3.0 NEW

        ['reportHeatChevron','reportAnalyticsChevron','reportMonthChevron','reportDayChevron'].forEach(id => {
            const el = document.getElementById(id);
            if (el && Icons.chevronDown) el.innerHTML = Icons.chevronDown(12);
        });
        const dlIcon = document.getElementById('downloadIcon');
        if (dlIcon && Icons.download) dlIcon.innerHTML = Icons.download(16);
    },

    applyModeVisibility() {
        const mode = State.reportMode || 'week';
        document.querySelector('.page[data-page="report"]')?.setAttribute('data-report-mode', mode);
        document.querySelectorAll('.report-mode-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(mode === 'month' ? 'reportModeMonthBtn' : 'reportModeWeekBtn')?.classList.add('active');
    },

    renderModePanel(w, m) {
        const mode         = State.reportMode || 'week';
        const monthDays    = m.days.length || 1;
        const monthRhythm  = Math.round((m.activeDays / monthDays) * 100);
        const weekRhythm   = Math.round((w.activeDays / 7) * 100);
        const avgDailyFocus= Math.round(m.totalFocus / monthDays);
        const weekAvgFocus = Math.round(w.totalFocus / 7);

        const insightEl = document.getElementById('reportModeInsight');
        if (insightEl) insightEl.textContent = mode === 'month'
            ? `Monthly mode: ${m.totalTasks} tasks, ${m.totalFocus} focus minutes, ${monthRhythm}% rhythm across ${monthDays} days.`
            : `Weekly mode: ${w.totalTasks} tasks done, ${w.totalFocus} focus minutes, ${weekRhythm}% rhythm. Tap a day to drill in.`;

        const chips = [
            { label: 'Weekly Score',  value: `${this.getScore(w)}` },
            { label: 'Week Focus',    value: `${w.totalFocus}m` },
            { label: 'Week Rhythm',   value: `${weekRhythm}%` },
            { label: 'Week Avg/Day',  value: `${weekAvgFocus}m` },
            { label: 'Month Tasks',   value: `${m.totalTasks}` },
            { label: 'Month Focus',   value: `${m.totalFocus}m` },
            { label: 'Month Rhythm',  value: `${monthRhythm}%` },
            { label: 'Avg Focus/Day', value: `${avgDailyFocus}m` },
        ];
        const visible = mode === 'week' ? chips.slice(0, 4) : chips.slice(4);

        const metricsEl = document.getElementById('reportModeMetrics');
        if (metricsEl) {
            metricsEl.innerHTML = visible.map((chip, idx) => `
            <div class="report-mode-chip" style="animation-delay:${0.05 + idx * 0.05}s">
                <div class="report-mode-chip-label">${chip.label}</div>
                <div class="report-mode-chip-value">${chip.value}</div>
            </div>`).join('');
        }
    },

    renderScoreHero(w) {
        const score  = this.getScore(w);
        const labels = { '80': 'Deep Flow', '60': 'High Momentum', '35': 'Building Rhythm', '0': 'Resting Flow' };
        let vibe = 'Resting Flow';
        if (score >= 80) vibe = 'Deep Flow State';
        else if (score >= 60) vibe = 'High Momentum';
        else if (score >= 35) vibe = 'Building Rhythm';

        const scoreEl = document.getElementById('reportScoreVal');
        const vibeEl  = document.getElementById('reportVibeLabel');
        const barEl   = document.getElementById('reportScoreBar');
        if (scoreEl) scoreEl.textContent = score;
        if (vibeEl)  vibeEl.textContent  = vibe;
        if (barEl)   barEl.style.width   = `${score}%`;
    },

    renderStats(w) {
        [
            ['reportStatTasks',  w.totalTasks],
            ['reportStatFocus',  `${w.totalFocus}m`],
            ['reportStatActive', `${w.activeDays}/7`],
            ['reportStatStreak', State.data.streak || 0]
        ].forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });
    },

    renderHeatmap(w) {
        const container = document.getElementById('reportHeatGrid');
        if (!container) return;
        const today = Utils.today();
        container.innerHTML = w.days.map(day => {
            const intensity = Math.min(4, day.tasks + Math.floor(day.focus / 25));
            const isToday   = day.date === today;
            const isSel     = day.date === State.selectedReportDate;
            return `
            <div class="heat-cell heat-${intensity} ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}"
                 data-action="select-report-day" data-date="${day.date}" title="${day.name}: ${day.tasks} tasks, ${day.focus}m focus">
                <div class="heat-label">${day.name.substring(0,2)}</div>
                <div class="heat-tasks">${day.tasks}</div>
            </div>`;
        }).join('');
    },

    drawChart(containerId, values, labels, type) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const max = Math.max(...values, 1);
        const W = 320, H = 120, padX = 14, padY = 8, barGap = 8;
        const chartW = W - padX * 2;
        const barW   = (chartW - (values.length - 1) * barGap) / values.length;
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#38B6FF';
        const unit = type === 'focus' ? 'm' : '';

        const bars = values.map((v, i) => {
            const barH  = v > 0 ? Math.max(6, (v / max) * (H - padY * 2 - 16)) : 4;
            const bx    = padX + i * (barW + barGap);
            const by    = H - padY - 14 - barH;
            const alpha = v > 0 ? 0.95 : 0.3;
            return `
            <rect x="${bx}" y="${by}" width="${barW}" height="${barH}" rx="4" fill="${v > 0 ? ac : 'var(--bg4)'}" opacity="${alpha}"
                  style="filter:${v > 0 ? `drop-shadow(0 0 6px ${ac}44)` : 'none'}"/>
            ${v > 0 ? `<text x="${bx + barW/2}" y="${Math.max(by - 4, padY + 6)}" text-anchor="middle"
                  fill="${ac}" font-size="8" font-weight="700">${v}${unit}</text>` : ''}
            <text x="${bx + barW/2}" y="${H - 2}" text-anchor="middle"
                  fill="var(--tx3)" font-size="8" font-weight="700">${labels[i].substring(0,2)}</text>`;
        }).join('');

        container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
            ${bars}
        </svg>`;
    },

    getMonthData(offset = 0) {
        const now        = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        const monthIdx   = monthStart.getMonth();
        const year       = monthStart.getFullYear();
        const days       = [];

        for (let day = 1; day <= monthEnd.getDate(); day++) {
            const d   = new Date(year, monthIdx, day);
            const key = `${year}-${String(monthIdx + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const tasks  = State.data.tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === key).length;
            const focus  = State.data.pomo.filter(p => p.date === key).reduce((sum, p) => sum + p.dur, 0);
            days.push({ day, weekday: d.getDay(), key, tasks, focus, score: tasks + Math.round(focus / 25), isToday: key === Utils.today() });
        }

        const totalTasks  = days.reduce((s, d) => s + d.tasks, 0);
        const totalFocus  = days.reduce((s, d) => s + d.focus, 0);
        const activeDays  = days.filter(d => d.score > 0).length;
        const bestScore   = Math.max(...days.map(d => d.score), 0);
        const bestDay     = days.find(d => d.score === bestScore && d.score > 0) || null;

        return { year, month: monthIdx, days, totalTasks, totalFocus, activeDays, bestDay, bestScore, startWeekday: monthStart.getDay() };
    },

    renderMonthOverview(m) {
        const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const labelEl = document.getElementById('monthLabel');
        if (labelEl) labelEl.textContent = `${monthNames[m.month]} ${m.year}`;

        const completionRate = m.days.length ? Math.round((m.activeDays / m.days.length) * 100) : 0;
        const statsEl = document.getElementById('monthStats');
        if (statsEl) statsEl.innerHTML = `
            <div class="month-stat-chip"><span class="month-stat-label">Tasks</span><span class="month-stat-value">${m.totalTasks}</span></div>
            <div class="month-stat-chip"><span class="month-stat-label">Focus</span><span class="month-stat-value">${m.totalFocus}m</span></div>
            <div class="month-stat-chip"><span class="month-stat-label">Active</span><span class="month-stat-value">${m.activeDays}/${m.days.length}</span></div>
            <div class="month-stat-chip"><span class="month-stat-label">Rhythm</span><span class="month-stat-value">${completionRate}%</span></div>`;

        const calEl = document.getElementById('monthCalendar');
        if (!calEl) return;
        const dayNames = ['Su','Mo','Tu','We','Th','Fr','Sa'];
        let calHTML = `<div class="cal-header">${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}</div><div class="cal-grid">`;
        const startOffset = m.startWeekday;
        for (let i = 0; i < startOffset; i++) calHTML += '<div class="cal-empty"></div>';
        m.days.forEach(day => {
            const intensity = Math.min(4, day.score);
            const isSel = day.key === State.selectedReportDate;
            calHTML += `<div class="cal-cell cal-int-${intensity} ${day.isToday ? 'today' : ''} ${isSel ? 'selected' : ''}"
                             data-action="select-report-day" data-date="${day.key}" title="${day.key}: ${day.tasks}t ${day.focus}m">
                <span class="cal-num">${day.day}</span>
            </div>`;
        });
        calHTML += '</div>';
        calEl.innerHTML = calHTML;
    },

    getDateDigest(date, w, m) {
        if (!date) return null;
        const inWeek = w.days.find(d => d.date === date);
        if (inWeek) return inWeek;
        return m.days.find(d => d.key === date) || null;
    },

    renderDayDetails(w, m) {
        const sel = State.selectedReportDate || Utils.today();
        const dayData = w.days.find(d => d.date === sel) || m.days.find(d => d.key === sel);
        const container = document.getElementById('reportDayDetailBody') || document.getElementById('reportCardDayDetail');
        if (!container) return;

        if (!dayData) {
            container.innerHTML = `<div class="empty-state small"><p>Select a day on the heatmap to see details.</p></div>`;
            return;
        }

        const date = new Date((dayData.date || dayData.key) + 'T00:00:00');
        const dayLabel = date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

        const completedTasks = State.data.tasks.filter(t =>
            t.completed && t.completedAt &&
            new Date(t.completedAt).toISOString().split('T')[0] === (dayData.date || dayData.key)
        );

        const mood = State.data.moods?.find(m => m.date === (dayData.date || dayData.key))?.mood || '';
        const moodLabels = { focused: '🧠 Focused', good: '😊 Good', okay: '😐 Okay', low: '😔 Low', epic: '🔥 Epic' };

        container.innerHTML = `
        <div class="day-detail-content">
            <div class="day-detail-header">
                <div class="day-detail-date">${dayLabel}</div>
                ${mood ? `<span class="day-detail-mood">${moodLabels[mood] || mood}</span>` : ''}
            </div>
            <div class="day-detail-stats">
                <div class="day-detail-stat">
                    <span class="day-stat-val">${dayData.tasks || 0}</span>
                    <span class="day-stat-label">Tasks Done</span>
                </div>
                <div class="day-detail-stat">
                    <span class="day-stat-val">${dayData.focus || 0}m</span>
                    <span class="day-stat-label">Focus Logged</span>
                </div>
            </div>
            ${completedTasks.length ? `
            <div class="day-detail-tasks-list">
                <div class="day-detail-tasks-title">Completed Tasks</div>
                ${completedTasks.slice(0, 8).map(t => `
                    <div class="day-detail-task">
                        <span class="day-task-check">${Icons.check(12)}</span>
                        <span class="day-task-text">${Utils.escape(t.text)}</span>
                    </div>`).join('')}
                ${completedTasks.length > 8 ? `<div class="day-detail-more">+${completedTasks.length - 8} more completed</div>` : ''}
            </div>` : '<div class="day-detail-empty">No tasks completed on this day.</div>'}
        </div>`;
    },

    renderInsights(w, m) {
        const score     = this.getScore(w);
        const breakdown = this.getScoreBreakdown(w);
        const container = document.getElementById('aiInsightsContent');
        if (!container) return;

        let insight = 'Build the habit of completing one deep work block daily. Small wins compound.';
        if (score >= 80)      insight = `Elite week — ${w.totalFocus}min of deep focus logged. ${State.data.streak}d streak active. Keep this momentum.`;
        else if (score >= 60) insight = `Solid output. ${w.totalTasks} tasks done. Focus: ${w.totalFocus}min. Add 2 more sessions to hit flow state.`;
        else if (score >= 35) insight = `Building rhythm. Best day: ${w.bestDay?.name || 'today'}. Overdue items are dragging your score — clear them first.`;
        else if (score > 0)   insight = `Week needs momentum. Start with just 1 pomodoro to break friction. Score is ${score}/100 — climb from here.`;

        container.textContent = insight;

        const breakdownEl = document.getElementById('scoreBreakdownList');
        if (breakdownEl) {
            breakdownEl.innerHTML = [
                { label: 'Tasks Done',      val: breakdown.tasks,        positive: true },
                { label: 'Focus Minutes',   val: breakdown.focus,        positive: true },
                { label: 'Consistency',     val: breakdown.consistency,  positive: true },
                { label: 'Completion Rate', val: breakdown.completion,   positive: true },
                { label: 'Streak Bonus',    val: breakdown.streak,       positive: true },
                { label: 'Overdue Penalty', val: -breakdown.overdue,     positive: false },
            ].map(item => `
            <div class="breakdown-item">
                <span class="breakdown-label">${item.label}</span>
                <span class="breakdown-val ${item.val >= 0 ? 'positive' : 'negative'}">${item.val >= 0 ? '+' : ''}${item.val}</span>
            </div>`).join('');
        }
    },

    /* v3.0 NEW: Habits heatmap in reports */
    renderHabitsHeatmap() {
        const container = document.getElementById('reportHabitsHeatmap');
        if (!container) return;

        const config  = State.data.habitConfig || DEFAULT_HABITS;
        const enabled = config.filter(h => h.enabled);
        const dates   = Utils.weekDates(State.weekOffset);
        const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

        container.innerHTML = `
        <div class="habits-heatmap-grid">
            <div class="habits-heatmap-header-row">
                <span class="habits-heatmap-title-col">Habit</span>
                <div class="habits-heatmap-day-labels">
                    ${dayHeaders.map(dh => `<span class="habits-heatmap-day-label">${dh}</span>`).join('')}
                </div>
            </div>
            ${enabled.map(h => `
            <div class="habits-heatmap-row">
                <div class="habits-heatmap-meta">
                    <span class="habits-heatmap-icon">${Icons.getHabitIcon(h.icon, 16)}</span>
                    <span class="habits-heatmap-label">${Utils.escape(h.label)}</span>
                </div>
                <div class="habits-heatmap-dots">
                    ${dates.map(date => {
                        const done = (State.data.habits?.[date] || []).includes(h.id);
                        return `<div class="habits-heatmap-dot ${done ? 'done' : ''}" title="${date}: ${done ? 'Completed' : 'Missed'}"></div>`;
                    }).join('')}
                </div>
            </div>`).join('')}
        </div>`;
    },

    /* ─── EXPORT STUDIO (HYBRID 2 + 5: INFOGRAPHIC CARD & HIGH-DPI PDF/PNG) ─── */
    openExportStudio() {
        const modal = document.getElementById('exportModal');
        if (!modal) return;

        // Inject icons into action buttons
        const pngIcon = document.getElementById('exportIconPng');
        const pdfIcon = document.getElementById('exportIconPdf');
        const copyIcon = document.getElementById('exportIconCopy');
        if (pngIcon && Icons.camera) pngIcon.innerHTML = Icons.camera(16);
        if (pdfIcon && Icons.filePdf) pdfIcon.innerHTML = Icons.filePdf(16);
        if (copyIcon && Icons.copy) copyIcon.innerHTML = Icons.copy(16);

        // Generate Infographic Card HTML
        this.renderInfographicPreview();

        modal.classList.add('on');
        Sound.open();
    },

    closeExportStudio() {
        const modal = document.getElementById('exportModal');
        if (modal) modal.classList.remove('on');
        Sound.close();
    },

    renderInfographicPreview() {
        const card = document.getElementById('infographicCard');
        if (!card) return;

        const w = Utils.weekData(State.weekOffset);
        const dates = Utils.weekDates(State.weekOffset);
        const score = this.getScore(w);
        const breakdown = this.getScoreBreakdown(w);

        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const start = new Date(dates[0] + 'T00:00:00');
        const end = new Date(dates[6] + 'T00:00:00');
        const dateRangeStr = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

        const username = State.user?.displayName || State.data?.settings?.userName || 'Focus Disciple';
        const userInitial = username.charAt(0).toUpperCase();
        const levelData = (typeof Level !== 'undefined' && Level.getXPInfo) ? Level.getXPInfo() : { level: 1, rank: 'Focus Initiate' };
        const levelNum = levelData.level || 1;
        const rankTitle = levelData.rank || 'Focus Initiate';

        const totalFocusMins = w.days.reduce((s, d) => s + d.focus, 0);
        const totalTasksDone = w.days.reduce((s, d) => s + d.tasks, 0);
        const totalSessions = (State.data?.pomo || []).filter(p => dates.includes(p.date)).length;
        const habitActiveDays = dates.filter(d => (State.data?.habits?.[d] || []).length > 0).length;
        const habitRate = Math.round((habitActiveDays / 7) * 100);

        const velocityTier = score >= 90 ? '⚡ S-TIER DISCIPLINE' : score >= 75 ? '🔥 HIGH VELOCITY' : score >= 50 ? '🌱 STEADY MOMENTUM' : '🚀 IN PROGRESS';

        // Top completed tasks of the week
        const completedTasksThisWeek = (State.data?.tasks || [])
            .filter(t => t.completed && t.completedAt && dates.includes(new Date(t.completedAt).toISOString().split('T')[0]))
            .slice(0, 3);

        const maxDailyFocus = Math.max(...w.days.map(d => d.focus), 1);
        const daysLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

        // Seneca / Marcus Stoic quote for insight footer
        const stoicQuotes = [
            "“We suffer more often in imagination than in reality.” — Seneca",
            "“You have power over your mind, not outside events.” — Marcus Aurelius",
            "“First say to yourself what you would be; and then do what you have to do.” — Epictetus",
            "“Action is the true measure of discipline.” — Toji"
        ];
        const quote = stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];

        card.innerHTML = `
            <!-- Header: Brand + User Pill -->
            <div class="info-header">
                <div class="info-brand">
                    <div class="info-logo-disc">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                    </div>
                    <div>
                        <div class="info-brand-title">Focussium</div>
                        <div class="info-brand-sub">Weekly Vibe Report</div>
                    </div>
                </div>
                <div class="info-user-pill">
                    <div class="info-user-avatar">${userInitial}</div>
                    <div>
                        <div class="info-user-name">${Utils.escape(username)}</div>
                        <div class="info-user-rank">LVL ${levelNum} • ${rankTitle}</div>
                    </div>
                </div>
            </div>

            <!-- Date Range Badge -->
            <div class="info-date-range">📅 ${dateRangeStr}</div>

            <!-- Hero Score & Velocity -->
            <div class="info-hero-score">
                <div class="info-score-left">
                    <span class="info-score-label">VIBE SCORE</span>
                    <span class="info-score-digits">${score}<span style="font-size:1.1rem;color:var(--tx3);font-family:var(--font-sans);font-weight:700;">/100</span></span>
                    <span class="info-score-sub">${breakdown.tasks} task pts • ${breakdown.focus} focus pts • ${breakdown.streak} rhythm pts</span>
                </div>
                <div class="info-score-badge">${velocityTier}</div>
            </div>

            <!-- Triad KPIs -->
            <div class="info-triad">
                <div class="info-kpi">
                    <span class="info-kpi-val">${totalFocusMins}m</span>
                    <span class="info-kpi-lbl">Focus Time (${totalSessions} sesh)</span>
                </div>
                <div class="info-kpi">
                    <span class="info-kpi-val">${totalTasksDone}</span>
                    <span class="info-kpi-lbl">Tasks Crushed</span>
                </div>
                <div class="info-kpi">
                    <span class="info-kpi-val">${habitRate}%</span>
                    <span class="info-kpi-lbl">Habit Rhythm (${habitActiveDays}/7d)</span>
                </div>
            </div>

            <!-- Rhythm Bar Mini Visualizer -->
            <div class="info-rhythm-section">
                <div class="info-section-title">WEEKLY FOCUS DISTRIBUTION</div>
                <div class="info-bars-grid">
                    ${w.days.map((d, i) => {
                        const pct = d.focus > 0 ? Math.max(12, Math.min(100, Math.round((d.focus / maxDailyFocus) * 100))) : 6;
                        const hasFocus = d.focus > 0;
                        return `
                        <div class="info-bar-col">
                            <div class="info-bar-track">
                                <div class="info-bar-fill" style="height:${pct}%;opacity:${hasFocus ? 1 : 0.2};${hasFocus ? 'box-shadow:0 0 8px var(--ac);' : ''}"></div>
                            </div>
                            <span class="info-bar-day">${daysLabels[i]}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Accomplishments Highlight -->
            <div class="info-tasks-list">
                <div class="info-section-title">KEY ACCOMPLISHMENTS</div>
                ${completedTasksThisWeek.length > 0 ? completedTasksThisWeek.map(t => `
                    <div class="info-task-item">
                        <span class="info-task-check">✓</span>
                        <span style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${Utils.escape(t.text)}</span>
                    </div>
                `).join('') : `
                    <div class="info-task-item" style="color:var(--tx3);font-style:italic;">
                        No completed tasks logged this week. Time to build momentum!
                    </div>
                `}
            </div>

            <!-- Seneca Stoic Wisdom -->
            <div class="info-quote-box">${quote}</div>

            <!-- Watermark Footer -->
            <div class="info-footer-watermark">
                <span>focussium.app</span>
                <span>Tracked with Discipline</span>
            </div>
        `;
    },

    async loadHtml2Canvas() {
        if (typeof window.html2canvas !== 'undefined') return window.html2canvas;
        Toast.show('Preparing visual engine…');
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => resolve(window.html2canvas);
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return window.html2canvas;
    },

    async generateCardCanvas() {
        const h2c = await this.loadHtml2Canvas();
        const card = document.getElementById('infographicCard');
        if (!card) throw new Error('Infographic card not found');
        return await h2c(card, {
            scale: 2.5,
            useCORS: true,
            backgroundColor: null,
            logging: false
        });
    },

    async downloadPNG() {
        try {
            Toast.show('Rendering high-res card… 🎨');
            const canvas = await this.generateCardCanvas();
            const dates = Utils.weekDates(State.weekOffset);
            const link = document.createElement('a');
            link.download = `Focussium_Vibe_${dates[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            Sound.success();
            Toast.show('Infographic Card downloaded! 📸');
        } catch(e) {
            handleError('PNG Export', e);
            Toast.show('Export failed. Please try again.');
        }
    },

    async downloadPDF() {
        try {
            Toast.show('Generating PDF document… 📄');
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                await new Promise(resolve => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }

            const canvas = await this.generateCardCanvas();
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf || window;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Background fill
            doc.setFillColor(3, 4, 11);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');

            // Center image nicely on A4
            const imgWidth = 170;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            const posX = (pageWidth - imgWidth) / 2;
            const posY = Math.max(15, (pageHeight - imgHeight) / 2);

            doc.addImage(imgData, 'PNG', posX, posY, imgWidth, imgHeight);

            const dates = Utils.weekDates(State.weekOffset);
            doc.save(`Focussium_Report_${dates[0]}.pdf`);
            Sound.success();
            Toast.show('PDF Report downloaded! 📄');
        } catch(e) {
            handleError('PDF Export', e);
            Toast.show('PDF generation failed');
        }
    },

    async copyImage() {
        try {
            Toast.show('Capturing card… 📋');
            const canvas = await this.generateCardCanvas();
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob generation failed');
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    Sound.success();
                    Toast.show('Infographic copied to clipboard! 📋');
                } catch(clipErr) {
                    const dates = Utils.weekDates(State.weekOffset);
                    const link = document.createElement('a');
                    link.download = `Focussium_Vibe_${dates[0]}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                    Toast.show('Downloaded image (Clipboard permission restricted)');
                }
            }, 'image/png');
        } catch(e) {
            handleError('Copy image', e);
            Toast.show('Failed to copy card');
        }
    }
};

/* ─── REPORT EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const el = e.target.closest('[data-action]');

    if (action === 'select-report-day') {
        State.selectedReportDate = el.dataset.date;
        const w = Utils.weekData(State.weekOffset);
        const m = Report.getMonthData(State.monthOffset);
        Report.renderDayDetails(w, m);
        Report.renderHeatmap(w);
        Report.renderMonthOverview(m);
        Sound.click();
    }
});
