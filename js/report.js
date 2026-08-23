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
        const W = 320, H = 120, padX = 20, padY = 10, barGap = 6;
        const chartW = W - padX * 2;
        const barW   = (chartW - (values.length - 1) * barGap) / values.length;
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#38B6FF';
        const unit = type === 'focus' ? 'm' : '';

        const bars = values.map((v, i) => {
            const barH  = Math.max(0, (v / max) * (H - padY * 2));
            const bx    = padX + i * (barW + barGap);
            const by    = H - padY - barH;
            const alpha = v > 0 ? 1 : 0.18;
            return `
            <rect x="${bx}" y="${by}" width="${barW}" height="${barH}" rx="5" fill="${ac}" opacity="${alpha}"
                  style="filter:${v > 0 ? `drop-shadow(0 0 6px ${ac}55)` : 'none'}"/>
            ${v > 0 ? `<text x="${bx + barW/2}" y="${Math.max(by - 4, padY + 8)}" text-anchor="middle"
                  fill="${ac}" font-size="7.5" font-weight="700">${v}${unit}</text>` : ''}
            <text x="${bx + barW/2}" y="${H - 2}" text-anchor="middle"
                  fill="var(--tx3)" font-size="8" font-weight="700">${labels[i].substring(0,2)}</text>`;
        }).join('');

        container.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="100%" preserveAspectRatio="none">
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
        const container = document.getElementById('reportCardDayDetail');
        if (!container) return;

        if (!dayData) {
            container.innerHTML = `<div class="empty-state"><p>Select a day on the heatmap to see details.</p></div>`;
            return;
        }

        const date = new Date((dayData.date || dayData.key) + 'T00:00:00');
        const dayLabel = date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

        const completedTasks = State.data.tasks.filter(t =>
            t.completed && t.completedAt &&
            new Date(t.completedAt).toISOString().split('T')[0] === (dayData.date || dayData.key)
        );

        const mood = State.data.moods?.find(m => m.date === (dayData.date || dayData.key))?.mood || '';
        const moodLabels = { focused: '🧠 Focused', good: '😊 Good', okay: '😐 Okay', low: '😔 Low', epic: '🔥 Epic' };

        container.innerHTML = `
        <div class="day-detail-header">
            <div class="day-detail-date">${dayLabel}</div>
            ${mood ? `<span class="day-detail-mood">${moodLabels[mood] || mood}</span>` : ''}
        </div>
        <div class="day-detail-stats">
            <div class="day-detail-stat"><span class="day-stat-val">${dayData.tasks || 0}</span><span class="day-stat-label">tasks done</span></div>
            <div class="day-detail-stat"><span class="day-stat-val">${dayData.focus || 0}m</span><span class="day-stat-label">focus</span></div>
        </div>
        ${completedTasks.length ? `
        <div class="day-detail-tasks-list">
            ${completedTasks.slice(0, 6).map(t => `<div class="day-detail-task">✓ ${Utils.escape(t.text)}</div>`).join('')}
            ${completedTasks.length > 6 ? `<div class="day-detail-more">+${completedTasks.length - 6} more</div>` : ''}
        </div>` : '<div class="day-detail-empty">No tasks completed this day.</div>'}`;
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

        container.innerHTML = `
        <div class="habits-heatmap-grid">
            ${enabled.map(h => `
            <div class="habits-heatmap-row">
                <span class="habits-heatmap-icon">${h.icon}</span>
                <span class="habits-heatmap-label">${Utils.escape(h.label)}</span>
                <div class="habits-heatmap-dots">
                    ${dates.map(date => {
                        const done = (State.data.habits?.[date] || []).includes(h.id);
                        return `<div class="habits-heatmap-dot ${done ? 'done' : ''}" title="${date}"></div>`;
                    }).join('')}
                </div>
            </div>`).join('')}
        </div>`;
    },

    /* ─── PDF EXPORT ─── */
    async downloadPDF() {
        if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
            Toast.show('Loading PDF engine…');
            await new Promise(resolve => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }

        try {
            const { jsPDF } = window.jspdf || window;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const w   = Utils.weekData(State.weekOffset);
            const dates = Utils.weekDates(State.weekOffset);
            const score = this.getScore(w);
            const breakdown = this.getScoreBreakdown(w);

            // Colours from CSS
            const css = getComputedStyle(document.documentElement);
            const acHex = (css.getPropertyValue('--ac').trim() || '#f5c842').replace('#','');
            const acRGB = parseInt(acHex.substring(0,2),16), acGGB = parseInt(acHex.substring(2,4),16), acBGB = parseInt(acHex.substring(4,6),16);
            const PW = 210;

            const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
            const setText = (c) => doc.setTextColor(c[0], c[1], c[2]);
            const BG0  = [8,10,26], BG2 = [15,19,40], BG3 = [22,28,58];
            const TX1  = [255,255,255], TX2 = [226,232,240], TX3 = [148,163,184], BORD = [255,255,255,0.12];
            const GRN  = [76,175,80], AMB = [255,193,7], RSE = [244,67,54];

            // Header
            setFill(BG0); doc.rect(0,0,PW,297,'F');
            setFill(BG2); doc.rect(0,0,PW,56,'F');
            doc.setFillColor(acRGB, acGGB, acBGB);
            doc.rect(0,0,PW,3,'F');
            doc.addImage('icon-192.png','PNG',12,10,28,28).catch?.();
            doc.setFont('helvetica','bold'); doc.setFontSize(20); setText(TX1);
            doc.text('Focussium 3.0',44,20);
            doc.setFont('helvetica','normal'); doc.setFontSize(8); setText(TX3);
            doc.text('Weekly Productivity Report',44,27);
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            const start  = new Date(dates[0]+'T00:00:00'), end = new Date(dates[6]+'T00:00:00');
            const range  = `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
            doc.text(range, PW/2, 21, { align: 'center' });

            // Big score
            doc.setFont('helvetica','bold'); doc.setFontSize(38); setText(TX1);
            doc.text(`${score}`,180,44,{align:'right'});
            doc.setFont('helvetica','normal'); doc.setFontSize(9); setText(TX2);
            doc.text('/ 100',183,44);

            doc.save(`Focussium_Report_${dates[0]}.pdf`);
            Sound.success();
            Toast.show('Report downloaded!');
        } catch(e) {
            handleError('PDF generation', e);
            Toast.show('PDF generation failed');
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
