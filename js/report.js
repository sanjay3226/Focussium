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
        const userPhoto = (State.user?.photoURL && State.user.photoURL.startsWith('http')) 
            ? State.user.photoURL 
            : (State.data?.settings?.customAvatarDataUrl && State.data.settings.customAvatarDataUrl.startsWith('data:image')) 
            ? State.data.settings.customAvatarDataUrl 
            : null;

        const avatarMarkup = userPhoto 
            ? `<img src="${userPhoto}" class="info-user-avatar-img" alt="Avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="info-user-avatar" style="display:none;">${userInitial}</div>`
            : `<div class="info-user-avatar">${userInitial}</div>`;

        const levelData = (typeof Level !== 'undefined' && Level.getXPInfo) ? Level.getXPInfo() : { level: 1, rank: 'Focus Initiate' };
        const levelNum = levelData.level || 1;
        const rankTitle = levelData.rank || 'Focus Initiate';

        const totalFocusMins = w.days.reduce((s, d) => s + d.focus, 0);
        const totalTasksDone = w.days.reduce((s, d) => s + d.tasks, 0);
        const totalSessions = (State.data?.pomo || []).filter(p => dates.includes(p.date)).length;
        const habitActiveDays = dates.filter(d => (State.data?.habits?.[d] || []).length > 0).length;
        const habitRate = Math.round((habitActiveDays / 7) * 100);

        const velocityBadge = score >= 90 
            ? '⚡ S-TIER FLOW' 
            : score >= 70 
            ? '🔥 HIGH VELOCITY' 
            : score >= 40 
            ? '✨ STEADY RHYTHM' 
            : '🌱 BUILDING MOMENTUM';

        // Top completed tasks of the week
        const completedTasksThisWeek = (State.data?.tasks || [])
            .filter(t => t.completed && t.completedAt && dates.includes(new Date(t.completedAt).toISOString().split('T')[0]))
            .slice(0, 3);

        const maxDailyFocus = Math.max(...w.days.map(d => d.focus), 1);
        const daysLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

        // Seneca / Marcus Stoic quote for insight footer
        const stoicQuotes = [
            "We suffer more often in imagination than in reality. — Seneca",
            "You have power over your mind, not outside events. — Marcus Aurelius",
            "First say to yourself what you would be; and then do what you have to do. — Epictetus",
            "Action is the true measure of discipline. — Toji"
        ];
        const quote = stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];

        card.innerHTML = `
            <!-- Header: Brand + User Pill -->
            <div class="info-header">
                <div class="info-brand">
                    <div class="info-logo-disc">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                    </div>
                    <div>
                        <div class="info-brand-title">Focussium</div>
                        <div class="info-brand-sub">WEEKLY PRODUCTIVITY VIBE</div>
                    </div>
                </div>
                <div class="info-user-pill">
                    <div class="info-user-avatar-wrap">
                        ${avatarMarkup}
                    </div>
                    <div class="info-user-meta">
                        <div class="info-user-name">${Utils.escape(username)}</div>
                        <div class="info-user-rank">LVL ${levelNum} • ${rankTitle}</div>
                    </div>
                </div>
            </div>

            <!-- Date & Velocity Sub-header Row -->
            <div class="info-sub-row">
                <div class="info-date-range">📅 ${dateRangeStr}</div>
                <div class="info-velocity-chip">${velocityBadge}</div>
            </div>

            <!-- Hero Score Card -->
            <div class="info-hero-score">
                <div class="info-score-left">
                    <span class="info-score-label">VIBE PERFORMANCE SCORE</span>
                    <div class="info-score-value-row">
                        <span class="info-score-digits">${score}</span>
                        <span class="info-score-max">/100</span>
                    </div>
                    <span class="info-score-sub">${breakdown.tasks} Task pts • ${breakdown.focus} Focus pts • ${breakdown.streak} Streak pts</span>
                </div>
                <div class="info-score-graphic">
                    <div class="info-score-ring" style="--ring-pct:${Math.max(8, score)}%">
                        <div class="info-score-ring-inner">⚡</div>
                    </div>
                </div>
            </div>

            <!-- Triad Key Metrics -->
            <div class="info-triad">
                <div class="info-kpi">
                    <span class="info-kpi-val">${totalFocusMins}m</span>
                    <span class="info-kpi-lbl">Focus Time</span>
                    <span class="info-kpi-sub">${totalSessions} deep sessions</span>
                </div>
                <div class="info-kpi">
                    <span class="info-kpi-val">${totalTasksDone}</span>
                    <span class="info-kpi-lbl">Tasks Crushed</span>
                    <span class="info-kpi-sub">Completed</span>
                </div>
                <div class="info-kpi">
                    <span class="info-kpi-val">${habitRate}%</span>
                    <span class="info-kpi-lbl">Habit Rhythm</span>
                    <span class="info-kpi-sub">${habitActiveDays}/7 days logged</span>
                </div>
            </div>

            <!-- Rhythm Bar Visualizer -->
            <div class="info-rhythm-section">
                <div class="info-section-title">WEEKLY FOCUS MOMENTUM</div>
                <div class="info-bars-grid">
                    ${w.days.map((d, i) => {
                        const pct = d.focus > 0 ? Math.max(14, Math.min(100, Math.round((d.focus / maxDailyFocus) * 100))) : 8;
                        const hasFocus = d.focus > 0;
                        return `
                        <div class="info-bar-col">
                            <div class="info-bar-track">
                                <div class="info-bar-fill ${hasFocus ? 'active' : ''}" style="height:${pct}%;"></div>
                            </div>
                            <span class="info-bar-day ${hasFocus ? 'active' : ''}">${daysLabels[i]}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <!-- Key Accomplishments -->
            <div class="info-tasks-list">
                <div class="info-section-title">KEY ACCOMPLISHMENTS</div>
                ${completedTasksThisWeek.length > 0 ? completedTasksThisWeek.map(t => `
                    <div class="info-task-item">
                        <span class="info-task-check">✓</span>
                        <span class="info-task-text">${Utils.escape(t.text)}</span>
                    </div>
                `).join('') : `
                    <div class="info-task-empty">
                        <span>🌱</span>
                        <span>Momentum is building. Complete your first focus session this week!</span>
                    </div>
                `}
            </div>

            <!-- Seneca Stoic Reflection -->
            <div class="info-quote-box">
                <span class="info-quote-text">“${quote}”</span>
            </div>

            <!-- Watermark Footer -->
            <div class="info-footer-watermark">
                <span>focussium.app</span>
                <span>Tracked with Discipline</span>
            </div>
        `;
    },

    async generateCardCanvas() {
        try {
            if (document.fonts) {
                const cs0 = getComputedStyle(document.documentElement);
                const sf = (cs0.getPropertyValue('--font-serif') || 'Georgia, serif').trim() || 'Georgia, serif';
                const ss = (cs0.getPropertyValue('--font-sans') || 'Inter, sans-serif').trim() || 'Inter, sans-serif';
                await Promise.all([
                    document.fonts.load(`700 30px ${sf}`),
                    document.fonts.load(`italic 600 20px ${sf}`),
                    document.fonts.load(`600 14px ${ss}`),
                    document.fonts.load(`700 13px ${ss}`),
                    document.fonts.load(`800 32px ${ss}`)
                ]);
                await document.fonts.ready;
            }
        } catch (e) {}

        const W = 1200, H = 1600;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        const cs = getComputedStyle(document.documentElement);
        const pv = (name, fallback) => {
            const v = (cs.getPropertyValue(name) || '').trim();
            return v || fallback;
        };
        const AC = pv('--ac', '#6366F1');
        const ACL = pv('--acl', '#A5B4FC');
        const ACR = pv('--acr', '99, 102, 241');
        const serifFont = pv('--font-serif', 'Georgia, serif');
        const sansFont = pv('--font-sans', 'Inter, sans-serif');

        let rgb = ACR.split(',').map(v => parseInt(v, 10));
        if (rgb.length !== 3 || rgb.some(isNaN)) rgb = [99, 102, 241];
        const [AR, AG, AB] = rgb;
        const acA = a => `rgba(${AR},${AG},${AB},${a})`;

        /* ---------- helpers ---------- */
        function roundRect(x, y, w, h, r) {
            r = Math.min(r, w / 2, h / 2);
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
        function setTrack(px) { try { ctx.letterSpacing = px ? px + 'px' : '0px'; } catch (e) {} }
        function T(str, x, y, font, color, align, tr) {
            ctx.font = font;
            ctx.fillStyle = color;
            ctx.textAlign = align || 'left';
            ctx.textBaseline = 'middle';
            setTrack(tr || 0);
            ctx.fillText(String(str), x, y);
            setTrack(0);
        }
        function M(str, font, tr) {
            ctx.font = font;
            setTrack(tr || 0);
            const w = ctx.measureText(String(str)).width;
            setTrack(0);
            return w;
        }
        function glass(x, y, w, h, r, fa, sa) {
            roundRect(x, y, w, h, r);
            ctx.fillStyle = `rgba(255,255,255,${fa == null ? 0.035 : fa})`;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = `rgba(255,255,255,${sa == null ? 0.09 : sa})`;
            ctx.stroke();
        }
        function fit(str, font, maxW) {
            let s = String(str == null ? '' : str);
            if (M(s, font) <= maxW) return s;
            while (s.length > 1 && M(s + '…', font) > maxW) s = s.slice(0, -1);
            return s + '…';
        }
        function fmtFocus(m) {
            m = Math.round(Number(m) || 0);
            return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
        }
        const pad2 = n => String(n).padStart(2, '0');
        function dayKey(v) {
            if (!v) return null;
            if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
            const d = new Date(v);
            if (isNaN(d)) return null;
            return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
        }

        /* ---------- data ---------- */
        const wd = Utils.weekData(State.weekOffset) || {};
        const days = (wd.days || []).slice(0, 7);
        const dates = (Utils.weekDates(State.weekOffset) || []).slice(0, 7);
        const weekSet = new Set(dates);
        const userName = (State.user?.displayName || State.data?.settings?.userName || 'Focused User').trim() || 'Focused User';
        const xp = (typeof Level !== 'undefined' && Level.getXPInfo) ? Level.getXPInfo() : { level: 1, rank: 'Novice' };

        const dayFocus = [];
        for (let i = 0; i < 7; i++) dayFocus.push(Number(days[i]?.focus) || 0);
        const totalFocus = Number.isFinite(wd.totalFocus) ? wd.totalFocus : dayFocus.reduce((s, v) => s + v, 0);

        const weekTasks = (State.data?.tasks || []).filter(t => {
            if (!t.completed) return false;
            const k = dayKey(t.completedAt) || dayKey(t.date);
            return k && weekSet.has(k);
        });
        const totalTasks = Number.isFinite(wd.totalTasks) ? wd.totalTasks : weekTasks.length;
        const activeDays = Number.isFinite(wd.activeDays) ? wd.activeDays : dayFocus.filter(v => v > 0).length;

        let peak = '';
        try {
            const bd = wd.bestDay;
            if (typeof bd === 'string') peak = bd;
            else if (bd && typeof bd.name === 'string') peak = bd.name;
        } catch (e) {}

        const habits = (State.data?.habitConfig || []).filter(h => h && h.enabled).slice(0, 4);
        const habitLog = State.data?.habits || {};
        const habitRows = habits.map(h => {
            const marks = dates.map(d => Array.isArray(habitLog[d]) && habitLog[d].includes(h.id));
            return { label: h.label || 'Habit', marks, done: marks.filter(Boolean).length };
        });
        const habitDone = habitRows.reduce((s, r) => s + r.done, 0);
        const habitTotal = habits.length * 7;
        const rhythm = habitTotal ? Math.round(habitDone / habitTotal * 100) : 0;

        const focusPts = Math.min(100, Math.round(totalFocus / 360 * 100));
        const taskPts = Math.min(100, Math.round(totalTasks / 21 * 100));
        const habitPts = habitTotal ? rhythm : 0;
        const vibe = Math.max(0, Math.min(100, Math.round((focusPts + taskPts + habitPts) / 3)));

        let tier = 'STARTING', emoji = '🌱';
        if (vibe >= 85) { tier = 'ELITE'; emoji = '⚡'; }
        else if (vibe >= 70) { tier = 'STRONG'; emoji = '🚀'; }
        else if (vibe >= 50) { tier = 'STEADY'; emoji = '📈'; }
        else if (vibe >= 30) { tier = 'BUILDING'; emoji = '🌅'; }

        /* ---------- background ---------- */
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, '#090D1E');
        bg.addColorStop(0.55, '#050711');
        bg.addColorStop(1, '#020308');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        function glow(cx, cy, r) {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, acA(0.2));
            g.addColorStop(1, acA(0));
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, W, H);
        }
        glow(W * 0.88, 30, 560);
        glow(90, H * 0.98, 600);

        const stripe = ctx.createLinearGradient(0, 0, W, 0);
        stripe.addColorStop(0, AC);
        stripe.addColorStop(1, ACL);
        ctx.fillStyle = stripe;
        ctx.fillRect(0, 0, W, 6);

        roundRect(32, 32, W - 64, H - 64, 28);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.stroke();

        /* ---------- header ---------- */
        const lg = ctx.createLinearGradient(64, 64, 120, 120);
        lg.addColorStop(0, AC);
        lg.addColorStop(1, ACL);
        roundRect(64, 64, 56, 56, 16);
        ctx.fillStyle = lg;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(94, 76);
        ctx.lineTo(82, 94);
        ctx.lineTo(89, 94);
        ctx.lineTo(87, 108);
        ctx.lineTo(102, 90);
        ctx.lineTo(95, 90);
        ctx.closePath();
        ctx.fillStyle = '#000';
        ctx.fill();

        T('Focussium', 136, 88, `700 30px ${serifFont}`, '#FFFFFF');
        T('WEEKLY PRODUCTIVITY AUDIT', 138, 114, `700 12px ${sansFont}`, '#94A3B8', 'left', 2);

        const lvlText = `LVL ${xp.level || 1} • ${String(xp.rank || 'Novice').toUpperCase()}`;
        const nameW = M(userName, `700 15px ${sansFont}`);
        const lvlW = M(lvlText, `800 12px ${sansFont}`);
        const capW = 14 + 26 + 10 + nameW + 12 + lvlW + 16;
        const capX = 1136 - capW;
        roundRect(capX, 74, capW, 36, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255,255,255,0.09)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(capX + 27, 92, 13, 0, Math.PI * 2);
        ctx.fillStyle = AC;
        ctx.fill();
        T((userName[0] || 'F').toUpperCase(), capX + 27, 92, `800 13px ${sansFont}`, '#FFFFFF', 'center');

        const nameX = capX + 50;
        T(userName, nameX, 92, `700 15px ${sansFont}`, '#FFFFFF');
        T(lvlText, nameX + nameW + 12, 92, `800 12px ${sansFont}`, AC);

        /* ---------- date pill ---------- */
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        let range = '';
        if (dates[0] && dates[dates.length - 1]) {
            const fd = ds => {
                const [y, m, d] = ds.split('-').map(Number);
                return { M: MONTHS[(m || 1) - 1], d: d || 1, y: y || 0 };
            };
            const a = fd(dates[0]), b = fd(dates[dates.length - 1]);
            range = a.y === b.y
                ? `${a.M} ${a.d} – ${b.M} ${b.d}, ${b.y}`
                : `${a.M} ${a.d}, ${a.y} – ${b.M} ${b.d}, ${b.y}`;
        }
        const pillText = `📅  ${range}`;
        const pillFont = `700 13px ${sansFont}`;
        const pillW = M(pillText, pillFont) + 30;
        roundRect(64, 128, pillW, 32, 16);
        ctx.fillStyle = acA(0.12);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = acA(0.28);
        ctx.stroke();
        T(pillText, 79, 144, pillFont, '#CBD5E1');

        /* ---------- vibe score hero ---------- */
        glass(64, 196, 1072, 190, 24, 0.035, 0.09);
        T('PRODUCTIVITY VIBE SCORE', 100, 234, `800 13px ${sansFont}`, '#94A3B8', 'left', 1.5);

        const scoreFont = `700 72px ${serifFont}`;
        T(String(vibe), 100, 302, scoreFont, AC);
        const scoreW = M(String(vibe), scoreFont);
        T('/100', 100 + scoreW + 10, 316, `700 24px ${sansFont}`, '#94A3B8');

        T(`FOCUS ${focusPts}  •  TASKS ${taskPts}  •  HABITS ${habitPts}`, 100, 354, `600 13px ${sansFont}`, '#94A3B8');

        const badgeText = `${emoji} ${tier}`;
        const badgeFont = `800 13px ${sansFont}`;
        const badgeW = M(badgeText, badgeFont) + 36;
        const badgeX = 1100 - badgeW;
        const badgeGrad = ctx.createLinearGradient(badgeX, 0, badgeX + badgeW, 0);
        badgeGrad.addColorStop(0, AC);
        badgeGrad.addColorStop(1, ACL);
        roundRect(badgeX, 282, badgeW, 36, 18);
        ctx.fillStyle = badgeGrad;
        ctx.fill();
        T(badgeText, badgeX + badgeW / 2, 300, badgeFont, '#000', 'center');

        /* ---------- KPI cards ---------- */
        const kpi = [
            {
                val: fmtFocus(totalFocus),
                lbl: 'FOCUS TIME',
                sub: `AVG ${Math.round(totalFocus / 7)}M / DAY` + (peak ? ` • PEAK ${peak.trim().slice(0, 3).toUpperCase()}` : '')
            },
            {
                val: String(totalTasks),
                lbl: 'TASKS CRUSHED',
                sub: `${activeDays} ACTIVE DAY${activeDays === 1 ? '' : 'S'}`
            },
            {
                val: `${rhythm}%`,
                lbl: 'HABIT RHYTHM',
                sub: habitTotal ? `${habitDone}/${habitTotal} CHECK-INS` : 'NO HABITS SET'
            }
        ];
        const colW = (1072 - 32) / 3;
        kpi.forEach((k, i) => {
            const x = 64 + i * (colW + 16);
            glass(x, 404, colW, 140, 20, 0.04, 0.08);
            const cx = x + colW / 2;
            T(k.val, cx, 452, `800 32px ${sansFont}`, '#FFFFFF', 'center');
            T(k.lbl, cx, 494, `700 12px ${sansFont}`, '#94A3B8', 'center', 1);
            T(k.sub, cx, 520, `600 12px ${sansFont}`, AC, 'center');
        });

        /* ---------- weekly focus bars ---------- */
        glass(64, 564, 1072, 230, 24, 0.035, 0.09);
        T('WEEKLY FOCUS DISTRIBUTION (MINUTES)', 100, 600, `800 13px ${sansFont}`, '#94A3B8', 'left', 1.5);

        const slot = 1000 / 7;
        const barW = 58;
        const barBottom = 742, barMaxH = 92;
        const maxF = Math.max(...dayFocus, 1);
        const FALLBACK_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

        for (let i = 0; i < 7; i++) {
            const f = dayFocus[i];
            const bx = 100 + i * slot + (slot - barW) / 2;
            const cx = bx + barW / 2;

            roundRect(bx, barBottom - barMaxH, barW, barMaxH, 9);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();

            if (f > 0) {
                const h = Math.max(18, Math.round(f / maxF * barMaxH));
                const by = barBottom - h;
                const g = ctx.createLinearGradient(0, by, 0, barBottom);
                g.addColorStop(0, ACL);
                g.addColorStop(1, AC);
                roundRect(bx, by, barW, h, 9);
                ctx.fillStyle = g;
                ctx.fill();
                T(String(f), cx, by - 14, `700 13px ${sansFont}`, '#FFFFFF', 'center');
            }

            const nm = String(days[i]?.name || '').trim().slice(0, 3).toUpperCase() || FALLBACK_DAYS[i];
            T(nm, cx, 762, `700 12px ${sansFont}`, f > 0 ? '#FFFFFF' : '#64748B', 'center');
        }

        /* ---------- habit matrix ---------- */
        glass(64, 814, 1072, 250, 24, 0.035, 0.09);
        T('HABIT COMPLIANCE & CONSISTENCY MATRIX', 100, 850, `800 13px ${sansFont}`, '#94A3B8', 'left', 1.5);

        if (!habitRows.length) {
            T('No habits tracked this week', 600, 944, `600 14px ${sansFont}`, '#64748B', 'center');
        } else {
            habitRows.forEach((row, i) => {
                const cy = 901 + i * 44;
                T(fit(row.label, `700 14px ${sansFont}`, 330), 100, cy, `700 14px ${sansFont}`, '#E2E8F0');
                const pct = Math.round(row.done / 7 * 100);
                for (let j = 0; j < 7; j++) {
                    const px = 470 + j * 59;
                    const done = !!row.marks[j];
                    roundRect(px, cy - 14, 50, 28, 9);
                    ctx.fillStyle = done ? AC : 'rgba(255,255,255,0.06)';
                    ctx.fill();
                    T('MTWTFSS'[j], px + 25, cy, `800 13px ${sansFont}`, done ? '#000' : '#64748B', 'center');
                }
                T(`${pct}%`, 1100, cy, `800 16px ${sansFont}`, pct >= 70 ? AC : '#94A3B8', 'right');
            });
        }

        /* ---------- accomplishments ---------- */
        glass(64, 1084, 1072, 230, 24, 0.035, 0.09);
        T('KEY ACCOMPLISHMENTS & COMPLETED TASKS', 100, 1120, `800 13px ${sansFont}`, '#94A3B8', 'left', 1.5);

        const done = weekTasks.slice(0, 4);
        if (!done.length) {
            T('No tasks completed this week — momentum starts with the next rep.', 600, 1204, `600 14px ${sansFont}`, '#64748B', 'center');
        } else {
            done.forEach((t, i) => {
                const ry = 1144 + i * 42;
                roundRect(100, ry, 1000, 34, 10);
                ctx.fillStyle = 'rgba(255,255,255,0.035)';
                ctx.fill();
                T('✓', 120, ry + 17, `800 14px ${sansFont}`, AC, 'center');
                T(fit(t.text, `600 14px ${sansFont}`, 930), 146, ry + 17, `600 14px ${sansFont}`, '#E2E8F0');
            });
        }

        /* ---------- stoic quote ---------- */
        const qg = ctx.createLinearGradient(64, 1334, 1136, 1444);
        qg.addColorStop(0, acA(0.14));
        qg.addColorStop(1, acA(0.02));
        roundRect(64, 1334, 1072, 110, 24);
        ctx.fillStyle = qg;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = acA(0.22);
        ctx.stroke();

        const qFont = `italic 600 20px ${serifFont}`;
        const q1 = '“We suffer more often in imagination than in reality.”';
        const q2 = '— Seneca';
        const qGap = 16;
        const qTotal = M(q1, qFont) + qGap + M(q2, qFont);
        const qsx = 600 - qTotal / 2;
        T(q1, qsx, 1389, qFont, '#E2E8F0');
        T(q2, qsx + M(q1, qFont) + qGap, 1389, qFont, AC);

        /* ---------- footer ---------- */
        ctx.beginPath();
        ctx.moveTo(64, 1480);
        ctx.lineTo(1136, 1480);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.stroke();

        T('focussium.app • Offline-First Deep Productivity', 64, 1512, `700 13px ${sansFont}`, '#64748B');
        T('DESIGNED FOR DEEP FOCUS & DISCIPLINE', 1136, 1512, `800 11px ${sansFont}`, '#64748B', 'right', 1.5);

        return canvas;
    },

    async downloadPNG() {
        try {
            Toast.show('Rendering high-res card… 🎨');
            const canvas = await this.generateCardCanvas();
            const dates = Utils.weekDates(State.weekOffset);
            const link = document.createElement('a');
            link.download = `Focussium_Vibe_${dates[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
            Toast.show('Infographic Card downloaded! 📸');
        } catch(e) {
            handleError('PNG Export', e);
            Toast.show('Export failed. Please try again.');
        }
    },

    async downloadPDF() {
        try {
            Toast.show('Generating Executive PDF Report… 📄');

            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                await new Promise(resolve => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
            }

            const { jsPDF } = window.jspdf || window;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            const PW = doc.internal.pageSize.getWidth(); // 210
            const PH = doc.internal.pageSize.getHeight(); // 297

            // Gather Data
            const w = Utils.weekData(State.weekOffset);
            const dates = Utils.weekDates(State.weekOffset);
            const score = this.getScore(w);
            const breakdown = this.getScoreBreakdown(w);

            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const start = new Date(dates[0] + 'T00:00:00');
            const end = new Date(dates[6] + 'T00:00:00');
            const dateRangeStr = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

            const username = State.user?.displayName || State.data?.settings?.userName || State.data?.name || 'Focus Disciple';
            const levelData = (typeof Level !== 'undefined' && Level.getXPInfo) ? Level.getXPInfo() : { level: 1, rank: 'Focus Initiate', current: 0, needed: 800 };
            const levelNum = levelData.level || 1;
            const rankTitle = levelData.rank || 'Focus Initiate';

            const totalFocusMins = w.days.reduce((s, d) => s + d.focus, 0);
            const totalFocusHours = (totalFocusMins / 60).toFixed(1);
            const totalTasksDone = w.days.reduce((s, d) => s + d.tasks, 0);
            const totalSessions = (State.data?.pomo || []).filter(p => dates.includes(p.date)).length;
            const habitActiveDays = dates.filter(d => (State.data?.habits?.[d] || []).length > 0).length;
            const habitRate = Math.round((habitActiveDays / 7) * 100);
            const velocityBadge = score >= 90 ? 'S-TIER FLOW' : score >= 70 ? 'HIGH VELOCITY' : score >= 40 ? 'STEADY RHYTHM' : 'MOMENTUM BUILDING';

            // Habits configured
            const habitConfigs = State.data?.habitConfig || DEFAULT_HABITS || [];
            
            // Completed tasks this week
            const completedTasksThisWeek = (State.data?.tasks || [])
                .filter(t => t.completed && t.completedAt && dates.includes(new Date(t.completedAt).toISOString().split('T')[0]));

            // Colors
            const css = getComputedStyle(document.documentElement);
            const acHex = (css.getPropertyValue('--ac').trim() || '#38B6FF').replace('#', '');
            const acR = parseInt(acHex.substring(0, 2), 16) || 56;
            const acG = parseInt(acHex.substring(2, 4), 16) || 182;
            const acB = parseInt(acHex.substring(4, 6), 16) || 255;

            const BG_PAGE = [10, 14, 30];
            const BG_CARD = [17, 23, 46];
            const BG_CARD_ALT = [23, 31, 60];
            const BORDER = [40, 52, 90];
            const TX_WHITE = [255, 255, 255];
            const TX_GRAY = [148, 163, 184];
            const TX_MUTED = [100, 116, 139];
            const ACCENT = [acR, acG, acB];

            // Helper Drawing Functions
            const fillBg = (c) => doc.setFillColor(c[0], c[1], c[2]);
            const strokeBd = (c) => doc.setDrawColor(c[0], c[1], c[2]);
            const textCol = (c) => doc.setTextColor(c[0], c[1], c[2]);

            // ================= PAGE 1 =================
            // Page Background
            fillBg(BG_PAGE);
            doc.rect(0, 0, PW, PH, 'F');

            // Top Header Accent Line
            fillBg(ACCENT);
            doc.rect(0, 0, PW, 3, 'F');

            // ── HEADER BLOCK ──
            fillBg(BG_CARD);
            strokeBd(BORDER);
            doc.roundedRect(12, 10, PW - 24, 28, 4, 4, 'FD');

            // Brand Logo & Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            textCol(TX_WHITE);
            doc.text('FOCUSSIUM 3.0', 20, 22);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            textCol(TX_GRAY);
            doc.text('EXECUTIVE PRODUCTIVITY AUDIT & WEEKLY DOSSIER', 20, 28);

            // User Info on Right
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            textCol(TX_WHITE);
            doc.text(Utils.escape(username), PW - 20, 20, { align: 'right' });

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            textCol(ACCENT);
            doc.text(`LVL ${levelNum} • ${rankTitle}`, PW - 20, 26, { align: 'right' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            textCol(TX_MUTED);
            doc.text(dateRangeStr, PW - 20, 31, { align: 'right' });

            let curY = 44;

            // ── SECTION 1: VIBE SCORE & PERFORMANCE MATRIX ──
            fillBg(BG_CARD);
            strokeBd(BORDER);
            doc.roundedRect(12, curY, PW - 24, 38, 4, 4, 'FD');

            // Score Display
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            textCol(TX_GRAY);
            doc.text('WEEKLY VIBE SCORE', 20, curY + 10);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            textCol(ACCENT);
            doc.text(`${score}`, 20, curY + 24);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            textCol(TX_GRAY);
            doc.text('/ 100', 44, curY + 22);

            // Velocity Tier Badge
            fillBg(BG_CARD_ALT);
            strokeBd(ACCENT);
            doc.roundedRect(20, curY + 28, 48, 6, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            textCol(TX_WHITE);
            doc.text(velocityBadge, 44, curY + 32.5, { align: 'center' });

            // Triad Summary Columns on Right
            const kpiX1 = 80, kpiX2 = 122, kpiX3 = 164;
            
            // KPI 1: Focus Time
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            textCol(TX_WHITE);
            doc.text(`${totalFocusMins}m`, kpiX1, curY + 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            textCol(TX_GRAY);
            doc.text('Focus Time', kpiX1, curY + 22);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            textCol(ACCENT);
            doc.text(`${totalSessions} Deep Sessions`, kpiX1, curY + 27);

            // KPI 2: Tasks Done
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            textCol(TX_WHITE);
            doc.text(`${totalTasksDone}`, kpiX2, curY + 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            textCol(TX_GRAY);
            doc.text('Tasks Crushed', kpiX2, curY + 22);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            textCol(ACCENT);
            doc.text('Completed This Week', kpiX2, curY + 27);

            // KPI 3: Habit Rhythm
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            textCol(TX_WHITE);
            doc.text(`${habitRate}%`, kpiX3, curY + 16);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            textCol(TX_GRAY);
            doc.text('Habit Rhythm', kpiX3, curY + 22);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            textCol(ACCENT);
            doc.text(`${habitActiveDays}/7 Active Days`, kpiX3, curY + 27);

            // Breakdown Points Row
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            textCol(TX_MUTED);
            doc.text(`Score Breakdown: Tasks (+${breakdown.tasks} pts) • Focus (+${breakdown.focus} pts) • Rhythm (+${breakdown.streak} pts) • Consistency (+${breakdown.consistency} pts)`, 80, curY + 34);

            curY += 44;

            // ── SECTION 2: 7-DAY VISUAL FOCUS BAR CHART ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('WEEKLY FOCUS MOMENTUM (DRAWN CHART)', 14, curY);
            curY += 4;

            fillBg(BG_CARD);
            strokeBd(BORDER);
            doc.roundedRect(12, curY, PW - 24, 46, 4, 4, 'FD');

            const maxDailyFocus = Math.max(...w.days.map(d => d.focus), 1);
            const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const chartSlotW = (PW - 24 - 24) / 7;

            w.days.forEach((d, i) => {
                const barX = 20 + i * chartSlotW;
                const barWidth = chartSlotW - 8;
                const trackH = 26;
                const fillH = d.focus > 0 ? Math.max(3, (d.focus / maxDailyFocus) * trackH) : 1;
                const barY = curY + 8;

                // Track
                fillBg(BG_CARD_ALT);
                strokeBd(BORDER);
                doc.roundedRect(barX, barY, barWidth, trackH, 1.5, 1.5, 'FD');

                // Fill
                if (d.focus > 0) {
                    fillBg(ACCENT);
                    strokeBd(ACCENT);
                    doc.roundedRect(barX, barY + trackH - fillH, barWidth, fillH, 1.5, 1.5, 'FD');

                    // Value label
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(5.5);
                    textCol(TX_WHITE);
                    doc.text(`${d.focus}m`, barX + barWidth / 2, barY + trackH - fillH - 1.5, { align: 'center' });
                }

                // Day Label
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6);
                textCol(d.focus > 0 ? ACCENT : TX_GRAY);
                doc.text(dayLabels[i], barX + barWidth / 2, barY + trackH + 5, { align: 'center' });
            });

            curY += 52;

            // ── SECTION 3: DAILY PERFORMANCE BREAKDOWN TABLE ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('DAILY PERFORMANCE BREAKDOWN (MON – SUN)', 14, curY);
            curY += 4;

            // Table Header
            fillBg(BG_CARD_ALT);
            strokeBd(BORDER);
            doc.roundedRect(12, curY, PW - 24, 7, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            textCol(TX_GRAY);
            doc.text('DAY', 16, curY + 4.8);
            doc.text('DATE', 42, curY + 4.8);
            doc.text('FOCUS TIME', 76, curY + 4.8);
            doc.text('SESSIONS', 112, curY + 4.8);
            doc.text('TASKS CRUSHED', 142, curY + 4.8);
            doc.text('DAILY STATUS', 178, curY + 4.8);
            curY += 8;

            // Table Rows
            const dayFullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            w.days.forEach((d, i) => {
                const rowBg = (i % 2 === 0) ? BG_CARD : BG_PAGE;
                fillBg(rowBg);
                strokeBd(BORDER);
                doc.rect(12, curY, PW - 24, 6.5, 'FD');

                const dailySessions = (State.data?.pomo || []).filter(p => p.date === d.date).length;
                const dailyStatus = d.focus >= 60 ? 'Peak Focus' : d.focus > 0 ? 'Active Session' : '— Low Focus';

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(6.5);
                textCol(d.focus > 0 ? ACCENT : TX_WHITE);
                doc.text(dayFullNames[i], 16, curY + 4.5);

                doc.setFont('helvetica', 'normal');
                textCol(TX_GRAY);
                doc.text(d.date, 42, curY + 4.5);

                doc.setFont('helvetica', d.focus > 0 ? 'bold' : 'normal');
                textCol(d.focus > 0 ? TX_WHITE : TX_MUTED);
                doc.text(`${d.focus}m`, 76, curY + 4.5);

                textCol(dailySessions > 0 ? TX_WHITE : TX_MUTED);
                doc.text(`${dailySessions}`, 112, curY + 4.5);

                textCol(d.tasks > 0 ? TX_WHITE : TX_MUTED);
                doc.text(`${d.tasks}`, 142, curY + 4.5);

                textCol(d.focus >= 60 ? ACCENT : TX_GRAY);
                doc.text(dailyStatus, 178, curY + 4.5);

                curY += 6.5;
            });

            // Footer Page 1
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            textCol(TX_MUTED);
            doc.text('Focussium 3.0 • Confidential Productivity Audit • Generated locally on device', 12, PH - 6);
            doc.text(`Page 1 of 2`, PW - 12, PH - 6, { align: 'right' });


            // ================= PAGE 2 =================
            doc.addPage();

            // Page Background
            fillBg(BG_PAGE);
            doc.rect(0, 0, PW, PH, 'F');

            // Top Header Accent Line
            fillBg(ACCENT);
            doc.rect(0, 0, PW, 3, 'F');

            curY = 14;

            // ── SECTION 4: KEY ACCOMPLISHMENTS & COMPLETED TASKS ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('KEY ACCOMPLISHMENTS & COMPLETED TASKS', 14, curY);
            curY += 4;

            fillBg(BG_CARD);
            strokeBd(BORDER);
            const taskBoxH = 64;
            doc.roundedRect(12, curY, PW - 24, taskBoxH, 4, 4, 'FD');

            if (completedTasksThisWeek.length > 0) {
                completedTasksThisWeek.slice(0, 8).forEach((t, i) => {
                    const ty = curY + 7 + (i * 6.8);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    textCol(ACCENT);
                    doc.text('✓', 18, ty);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(7);
                    textCol(TX_WHITE);
                    const taskTitle = t.text.length > 75 ? t.text.substring(0, 72) + '…' : t.text;
                    doc.text(taskTitle, 24, ty);

                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(6);
                    textCol(TX_MUTED);
                    const taskDate = t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : '';
                    doc.text(taskDate, PW - 20, ty, { align: 'right' });
                });
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                textCol(TX_GRAY);
                doc.text('No completed tasks logged for this week. Focus momentum is ready to be built!', 20, curY + 24);
            }

            curY += taskBoxH + 8;

            // ── SECTION 5: HABIT CONSISTENCY MATRIX ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('HABIT COMPLIANCE & CONSISTENCY MATRIX', 14, curY);
            curY += 4;

            fillBg(BG_CARD);
            strokeBd(BORDER);
            const habitBoxH = 58;
            doc.roundedRect(12, curY, PW - 24, habitBoxH, 4, 4, 'FD');

            if (habitConfigs.length > 0) {
                habitConfigs.slice(0, 6).forEach((h, i) => {
                    const hy = curY + 8 + (i * 8.2);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    textCol(TX_WHITE);
                    doc.text(h.label || h.name || 'Habit', 18, hy);

                    // 7 days tick boxes
                    dates.forEach((d, dayIdx) => {
                        const isDone = (State.data?.habits?.[d] || []).includes(h.id);
                        const dotX = 84 + dayIdx * 12;
                        fillBg(isDone ? ACCENT : BG_CARD_ALT);
                        strokeBd(isDone ? ACCENT : BORDER);
                        doc.roundedRect(dotX, hy - 3.5, 7.5, 4.8, 1, 1, 'FD');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(5);
                        textCol(isDone ? [0, 0, 0] : TX_MUTED);
                        doc.text(dayFullNames[dayIdx].substring(0, 1), dotX + 3.75, hy - 0.2, { align: 'center' });
                    });

                    // Compliance Rate
                    const doneCount = dates.filter(d => (State.data?.habits?.[d] || []).includes(h.id)).length;
                    const compRate = Math.round((doneCount / 7) * 100);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    textCol(compRate >= 70 ? ACCENT : TX_GRAY);
                    doc.text(`${compRate}% (${doneCount}/7d)`, PW - 20, hy, { align: 'right' });
                });
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                textCol(TX_GRAY);
                doc.text('No active habits configured. Establish daily habits in the Habits tab to track streaks.', 20, curY + 24);
            }

            curY += habitBoxH + 8;

            // ── SECTION 6: AI & STOIC EXECUTIVE REFLECTION ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('AI EXECUTIVE INSIGHT & STOIC REFLECTION', 14, curY);
            curY += 4;

            fillBg(BG_CARD);
            strokeBd(ACCENT);
            doc.roundedRect(12, curY, PW - 24, 32, 4, 4, 'FD');

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7.5);
            textCol(TX_WHITE);
            const stoicQuoteText = "“We suffer more often in imagination than in reality.” — Seneca";
            doc.text(stoicQuoteText, 18, curY + 9);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            textCol(TX_GRAY);
            const insightSummary = totalFocusMins > 120 
                ? `Exceptional focus momentum demonstrated with ${totalFocusHours}h logged across ${totalSessions} sessions. Maintain your daily habit rhythm to solidify long-term neuroplastic discipline.`
                : `Focus momentum is developing. Aim for 25-minute deep Pomodoro blocks and daily habit completion to unlock S-Tier velocity and consistent output.`;
            doc.text(doc.splitTextToSize(insightSummary, PW - 38), 18, curY + 16);

            // Footer Page 2
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            textCol(TX_MUTED);
            doc.text('Focussium 3.0 • Confidential Productivity Audit • Generated locally on device', 12, PH - 6);
            doc.text(`Page 2 of 2`, PW - 12, PH - 6, { align: 'right' });

            // Save PDF
            doc.save(`Focussium_Executive_Audit_${dates[0]}.pdf`);
            if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
            Toast.show('Detailed 2-Page PDF Report downloaded! 📄');
        } catch (e) {
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
                    if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
                    Toast.show('Infographic copied to clipboard! 📋');
                } catch(clipErr) {
                    const dates = Utils.weekDates(State.weekOffset);
                    const link = document.createElement('a');
                    link.download = `Focussium_Vibe_${dates[0]}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
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

