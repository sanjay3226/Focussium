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
        this.renderWeekTimeline(w);
        this.renderHeatmap(w);
        this.setChartTab(State.reportChartTab);
        this.renderMonthOverview(m);
        this.renderDayDetails(w, m);
        this.renderInsights(w, m);
        this.renderHabitsHeatmap(); // v3.0 NEW
        this.renderStreakPanel();   // v3.1 NEW
        this.renderMonthSparkline(m); // v3.1 NEW

        ['reportHeatChevron','reportAnalyticsChevron','reportMonthChevron','reportDayChevron','reportHabitsChevron','reportStreakChevron'].forEach(id => {
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
        let vibe = 'Resting Flow';
        if (score >= 80) vibe = 'Deep Flow State';
        else if (score >= 60) vibe = 'High Momentum';
        else if (score >= 35) vibe = 'Building Rhythm';

        const scoreEl = document.getElementById('reportScoreValue');
        const vibeEl  = document.getElementById('reportVibeTitle');
        const circle  = document.getElementById('reportVibeGaugeCircle');
        if (scoreEl) scoreEl.textContent = score;
        if (vibeEl)  vibeEl.textContent  = vibe;
        if (circle) {
            const circumference = 376.9;
            const pct = Math.min(100, Math.max(0, score));
            const offset = circumference - (circumference * pct / 100);
            circle.style.strokeDashoffset = `${offset}`;
        }

        const bdEl = document.getElementById('scoreBreakdownList');
        if (bdEl) {
            const bd = this.getScoreBreakdown(w);
            bdEl.innerHTML = `
                <div class="breakdown-item">
                    <span class="breakdown-label">Tasks Done</span>
                    <span class="breakdown-val positive">+${bd.tasks}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Focus Time</span>
                    <span class="breakdown-val positive">+${bd.focus}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Active Days</span>
                    <span class="breakdown-val positive">+${bd.consistency}</span>
                </div>
                <div class="breakdown-item">
                    <span class="breakdown-label">Streak Flow</span>
                    <span class="breakdown-val positive">+${bd.streak}</span>
                </div>
                ${bd.overdue > 0 ? `
                <div class="breakdown-item">
                    <span class="breakdown-label">Overdue</span>
                    <span class="breakdown-val negative">-${bd.overdue}</span>
                </div>` : ''}
            `;
        }
    },

    renderStats(w) {
        const container = document.getElementById('reportStats');
        if (!container) return;
        const stats = [
            { val: w.totalTasks, lbl: 'Tasks Done' },
            { val: `${w.totalFocus}m`, lbl: 'Focus Time' },
            { val: `${w.activeDays}/7`, lbl: 'Active Days' },
            { val: State.data.streak || 0, lbl: 'Day Streak' }
        ];
        container.innerHTML = stats.map(s => `
            <div class="report-stat">
                <div class="report-stat-val">${s.val}</div>
                <div class="report-stat-lbl">${s.lbl}</div>
            </div>
        `).join('');
    },

    renderWeekTimeline(w) {
        const container = document.getElementById('reportWeekTimeline');
        if (!container) return;

        const maxFocus = Math.max(...w.days.map(d => d.focus), 60);
        const maxTasks = Math.max(...w.days.map(d => d.tasks), 5);
        const today = Utils.today();
        const moodIcons = {
            calm: Icons.meditate ? Icons.meditate(14) : '',
            high: Icons.zap ? Icons.zap(14) : '',
            flow: Icons.ocean ? Icons.ocean(14) : '',
            tired: Icons.habitSleep ? Icons.habitSleep(14) : '',
            clouded: Icons.cloud ? Icons.cloud(14) : '',
            focused: Icons.target ? Icons.target(14) : '',
            good: Icons.smileHappy ? Icons.smileHappy(14) : '',
            okay: Icons.smileNeutral ? Icons.smileNeutral(14) : '',
            low: Icons.smileSad ? Icons.smileSad(14) : '',
            epic: Icons.fire ? Icons.fire(14) : ''
        };

        container.innerHTML = w.days.map((day, i) => {
            const focusPct = Math.min(100, Math.round((day.focus / maxFocus) * 100));
            const tasksPct = Math.min(100, Math.round((day.tasks / maxTasks) * 100));
            const isToday = day.date === today;
            const isSel = day.date === State.selectedReportDate;
            const mood = State.data.moods?.find(m => m.date === day.date)?.mood || '';
            const moodMarkup = mood && moodIcons[mood] ? `<span class="timeline-mood" style="color:var(--ac);">${moodIcons[mood]}</span>` : '';
            const dayScore = day.tasks + Math.floor(day.focus / 25);
            const dateNum = new Date(day.date + 'T00:00:00').getDate();

            return `
            <div class="timeline-day ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}"
                 data-action="select-report-day" data-date="${day.date}"
                 style="animation-delay: ${i * 40}ms">
                <div class="timeline-day-label">
                    <span class="timeline-weekday">${day.name.substring(0, 3)}</span>
                    <span class="timeline-date">${dateNum}</span>
                    ${isToday ? '<span class="timeline-today-pill">Today</span>' : ''}
                </div>
                <div class="timeline-day-bars">
                    <div class="timeline-bar-row">
                        <span class="timeline-bar-lbl">Focus</span>
                        <div class="timeline-bar-track">
                            <div class="timeline-bar-fill focus" style="width: ${focusPct}%"></div>
                        </div>
                        <span class="timeline-bar-val">${day.focus}m</span>
                    </div>
                    <div class="timeline-bar-row">
                        <span class="timeline-bar-lbl">Tasks</span>
                        <div class="timeline-bar-track">
                            <div class="timeline-bar-fill tasks" style="width: ${tasksPct}%"></div>
                        </div>
                        <span class="timeline-bar-val">${day.tasks}</span>
                    </div>
                </div>
                <div class="timeline-day-meta">
                    ${moodMarkup}
                    ${dayScore > 0 ? `<span class="timeline-pts">+${dayScore} pts</span>` : '<span class="timeline-rest">Rest</span>'}
                </div>
            </div>`;
        }).join('');
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
        const maxVal = Math.max(...values, 1);
        const W = 380, H = 145;
        const padX = 24, padTop = 18, padBottom = 26;
        const chartW = W - padX * 2;
        const chartH = H - padTop - padBottom;
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#38B6FF';
        const unit = type === 'focus' ? 'm' : '';

        const points = values.map((v, i) => {
            const x = padX + (i / Math.max(1, values.length - 1)) * chartW;
            const y = padTop + (1 - (v / maxVal)) * chartH;
            return { x, y, v, label: labels[i] };
        });

        // Smooth cubic bezier path construction
        let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i === 0 ? 0 : i - 1];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[i + 2] || p2;

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }

        const lastPt = points[points.length - 1];
        const firstPt = points[0];
        const areaPath = `${linePath} L ${lastPt.x.toFixed(1)} ${H - padBottom} L ${firstPt.x.toFixed(1)} ${H - padBottom} Z`;

        // Dotted horizontal grid lines
        const gridLines = [0.33, 0.66, 1].map(step => {
            const gy = padTop + (1 - step) * chartH;
            return `<line class="chart-grid-line" x1="${padX}" y1="${gy.toFixed(1)}" x2="${W - padX}" y2="${gy.toFixed(1)}" opacity="0.6"/>`;
        }).join('');

        // Points & Labels
        const dots = points.map((p, i) => {
            return `
            <g class="chart-point-group" data-idx="${i}" data-val="${p.v}${unit}" data-label="${p.label}">
                <circle class="chart-point" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4.5"/>
                ${p.v > 0 ? `<text class="chart-value-label" x="${p.x.toFixed(1)}" y="${(p.y - 8).toFixed(1)}">${p.v}${unit}</text>` : ''}
                <text class="chart-label" x="${p.x.toFixed(1)}" y="${H - 6}">${p.label.substring(0, 2)}</text>
            </g>`;
        }).join('');

        container.innerHTML = `
        <div class="chart-tooltip" id="chartTooltip"></div>
        <svg class="chart-svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
                <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${ac}" stop-opacity="0.5"/>
                    <stop offset="70%" stop-color="${ac}" stop-opacity="0.12"/>
                    <stop offset="100%" stop-color="${ac}" stop-opacity="0.0"/>
                </linearGradient>
            </defs>
            ${gridLines}
            <path class="chart-area" d="${areaPath}"/>
            <path class="chart-line" d="${linePath}"/>
            ${dots}
        </svg>`;

        // Interactive tooltips
        const tooltip = container.querySelector('#chartTooltip');
        const groups = container.querySelectorAll('.chart-point-group');
        groups.forEach(g => {
            const showTooltip = () => {
                if (!tooltip) return;
                const val = g.getAttribute('data-val');
                const lbl = g.getAttribute('data-label');
                tooltip.textContent = `${lbl}: ${val}`;
                const pt = g.querySelector('.chart-point');
                const rect = pt.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                tooltip.style.left = `${rect.left - containerRect.left + rect.width / 2}px`;
                tooltip.style.top = `${rect.top - containerRect.top}px`;
                tooltip.classList.add('visible');
            };
            const hideTooltip = () => {
                if (tooltip) tooltip.classList.remove('visible');
            };
            g.addEventListener('mouseenter', showTooltip);
            g.addEventListener('mouseleave', hideTooltip);
            g.addEventListener('touchstart', () => { showTooltip(); }, { passive: true });
        });
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
        const dayNames = ['S','M','T','W','T','F','S'];

        let calHTML = `
        <div class="gh-heatmap">
            <div class="gh-header">
                ${dayNames.map(d => `<div class="gh-day-label">${d}</div>`).join('')}
            </div>
            <div class="gh-grid">`;

        for (let i = 0; i < m.startWeekday; i++) {
            calHTML += '<div class="gh-empty"></div>';
        }

        m.days.forEach((day, idx) => {
            const intensity = Math.min(4, day.score);
            const isSel = day.key === State.selectedReportDate;
            calHTML += `
            <div class="gh-cell gh-int-${intensity} ${day.isToday ? 'today' : ''} ${isSel ? 'selected' : ''}"
                 style="--cell-i: ${idx};"
                 data-action="select-report-day" data-date="${day.key}"
                 title="${day.key}: ${day.tasks} tasks, ${day.focus}m focus">
                <span class="gh-num">${day.day}</span>
            </div>`;
        });

        calHTML += `
            </div>
            <div class="gh-legend">
                <span class="gh-legend-label">${m.activeDays} active days in ${monthNames[m.month]}</span>
                <div class="gh-legend-scale">
                    <span class="gh-legend-text">Less</span>
                    <div class="gh-legend-box gh-int-0"></div>
                    <div class="gh-legend-box gh-int-1"></div>
                    <div class="gh-legend-box gh-int-2"></div>
                    <div class="gh-legend-box gh-int-3"></div>
                    <div class="gh-legend-box gh-int-4"></div>
                    <span class="gh-legend-text">More</span>
                </div>
            </div>
        </div>`;

        calEl.innerHTML = calHTML;
    },

    renderMonthSparkline(m) {
        const container = document.getElementById('monthSparklineContainer');
        if (!container || !m || !m.days || !m.days.length) return;

        const scores = m.days.map(d => d.score);
        const maxScore = Math.max(...scores, 1);
        const W = 360, H = 58, padX = 10, padY = 8;
        const chartW = W - padX * 2;
        const chartH = H - padY * 2;
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#38B6FF';

        const points = m.days.map((d, i) => {
            const x = padX + (i / Math.max(1, m.days.length - 1)) * chartW;
            const y = padY + (1 - (d.score / maxScore)) * chartH;
            return { x, y, day: d.day, score: d.score, isToday: d.isToday };
        });

        let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const mx = (p1.x + p2.x) / 2;
            path += ` C ${mx.toFixed(1)} ${p1.y.toFixed(1)}, ${mx.toFixed(1)} ${p2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
        }

        const areaPath = `${path} L ${points[points.length - 1].x.toFixed(1)} ${H} L ${points[0].x.toFixed(1)} ${H} Z`;
        const todayPt = points.find(p => p.isToday) || points[points.length - 1];

        container.innerHTML = `
        <svg class="month-sparkline-svg" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
            <defs>
                <linearGradient id="monthSparkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="${ac}" stop-opacity="0.4"/>
                    <stop offset="100%" stop-color="${ac}" stop-opacity="0.02"/>
                </linearGradient>
            </defs>
            <path d="${areaPath}" fill="url(#monthSparkGrad)"/>
            <path d="${path}" fill="none" stroke="${ac}" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="${todayPt.x.toFixed(1)}" cy="${todayPt.y.toFixed(1)}" r="3.5" fill="${ac}" stroke="var(--bg3)" stroke-width="1.5"/>
        </svg>`;
    },

    renderStreakPanel() {
        const container = document.getElementById('reportStreakBody');
        if (!container) return;

        const currentStreak = State.data.streak || 0;
        const todayKey = Utils.today();
        const days = [];

        for (let i = 29; i >= 0; i--) {
            const dateStr = Utils.daysAgo(i);
            const isToday = (dateStr === todayKey);
            const tasksDone = (State.data.tasks || []).filter(t => t.completed && t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === dateStr).length;
            const focusMin = (State.data.pomo || []).filter(p => p.date === dateStr).reduce((sum, p) => sum + p.dur, 0);
            const habitsDone = (State.data.habits?.[dateStr] || []).length;
            const active = (tasksDone > 0 || focusMin > 0 || habitsDone > 0);
            days.push({ date: dateStr, isToday, active, tasksDone, focusMin, habitsDone });
        }

        const activeDaysCount = days.filter(d => d.active).length;
        const consistencyRate = Math.round((activeDaysCount / 30) * 100);

        let streakStatus = 'Momentum Rising';
        if (currentStreak >= 30) streakStatus = 'Legendary Flow';
        else if (currentStreak >= 14) streakStatus = 'Unstoppable';
        else if (currentStreak >= 7) streakStatus = 'Consistent Fire';
        else if (currentStreak >= 3) streakStatus = 'Building Habit';

        container.innerHTML = `
        <div class="streak-panel-card">
            <div class="streak-hero">
                <div class="streak-hero-left">
                    <div class="streak-flame-disc">
                        ${Icons.fire(24)}
                    </div>
                    <div>
                        <div class="streak-count-num">${currentStreak}</div>
                        <div class="streak-count-lbl">Day Active Streak</div>
                    </div>
                </div>
                <div class="streak-status-badge">${streakStatus}</div>
            </div>

            <div class="streak-trail-wrap">
                <div class="streak-trail-label">
                    <span>30-Day Activity Trail</span>
                    <span>${consistencyRate}% Consistency</span>
                </div>
                <div class="streak-trail">
                    ${days.map(d => `
                    <div class="streak-dot ${d.active ? 'active' : ''} ${d.isToday ? 'today' : ''}"
                         title="${d.date}: ${d.tasksDone} tasks, ${d.focusMin}m focus, ${d.habitsDone} habits"></div>
                    `).join('')}
                </div>
            </div>
        </div>`;
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
        const container = document.getElementById('reportDayDetailBody');
        if (!container) return;

        if (!dayData) {
            container.innerHTML = `<div class="empty-state small"><p>Select a day on the heatmap to see details.</p></div>`;
            return;
        }

        const dayKey = dayData.date || dayData.key;
        const date = new Date(dayKey + 'T00:00:00');
        const dayLabel = date.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' });

        const completedTasks = State.data.tasks.filter(t =>
            t.completed && t.completedAt &&
            new Date(t.completedAt).toISOString().split('T')[0] === dayKey
        );

        const mood = State.data.moods?.find(m => m.date === dayKey)?.mood || '';
        const moodConfigs = {
            calm:    { text: 'Calm',    icon: Icons.meditate(13) },
            high:    { text: 'Sparked', icon: Icons.zap(13) },
            flow:    { text: 'Flow',    icon: Icons.ocean(13) },
            tired:   { text: 'Resting', icon: Icons.habitSleep(13) },
            clouded: { text: 'Clouded', icon: Icons.cloud(13) },
            focused: { text: 'Focused', icon: Icons.brain(13) },
            good:    { text: 'Good',    icon: Icons.smileHappy(13) },
            okay:    { text: 'Okay',    icon: Icons.smileNeutral(13) },
            low:     { text: 'Low',     icon: Icons.smileSad(13) },
            epic:    { text: 'Epic',    icon: Icons.fire(13) }
        };
        const moodMarkup = mood && moodConfigs[mood]
            ? `<span class="day-detail-mood" style="display:inline-flex;align-items:center;gap:5px;"><span>${moodConfigs[mood].icon}</span><span>${moodConfigs[mood].text}</span></span>`
            : (mood ? `<span class="day-detail-mood">${mood}</span>` : '');

        const dayDumps = (State.data.dumps || []).filter(d => {
            if (!d.ts) return false;
            return new Date(d.ts).toISOString().split('T')[0] === dayKey;
        });

        // Habits completed on this date
        const completedHabits = (State.data.habits?.[dayKey] || []);
        const habitConfigs = State.data.habitConfig || (typeof DEFAULT_HABITS !== 'undefined' ? DEFAULT_HABITS : []);
        const dayHabitItems = habitConfigs.filter(h => h.enabled).map(h => {
            const isDone = completedHabits.includes(h.id);
            const iconSvg = Icons.getHabitIcon ? Icons.getHabitIcon(h.icon, 12) : '';
            return `<span class="day-habit-pill ${isDone ? 'done' : ''}">${iconSvg} ${Utils.escape(h.label)}</span>`;
        });

        container.innerHTML = `
        <div class="day-detail-content">
            <div class="day-detail-header">
                <div class="day-detail-date">${dayLabel}</div>
                ${moodMarkup}
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

            ${dayHabitItems.length ? `
            <div class="day-detail-tasks-list" style="margin-top:10px;">
                <div class="day-detail-tasks-title">Habit Rhythm</div>
                <div class="day-habit-pill-wrap">${dayHabitItems.join('')}</div>
            </div>` : ''}

            ${dayDumps.length ? `
            <div class="day-detail-tasks-list" style="margin-top:10px;">
                <div class="day-detail-tasks-title">Captured Thoughts</div>
                ${dayDumps.slice(0, 5).map(d => `
                    <div class="day-detail-task" style="border-left: 2.5px solid var(--ac); padding-left: 8px;">
                        <span class="day-task-text" style="color:var(--tx2);">${Utils.escape(d.text)}</span>
                    </div>`).join('')}
                ${dayDumps.length > 5 ? `<div class="day-detail-more">+${dayDumps.length - 5} more thoughts</div>` : ''}
            </div>` : ''}
        </div>`;
    },

    renderInsights(w, m) {
        const container = document.getElementById('aiInsightsContent');
        if (!container) return;

        const mode = State.reportMode || 'week';
        if (mode === 'month') {
            const activePct = m.days.length ? Math.round((m.activeDays / m.days.length) * 100) : 0;
            const focusHours = (m.totalFocus / 60).toFixed(1);
            const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            const curMonth = monthNames[m.month];

            if (m.totalTasks === 0 && m.totalFocus === 0) {
                container.textContent = `No activity recorded yet for ${curMonth}. Start with a 25-minute Pomodoro session today to kickstart your monthly rhythm.`;
            } else if (activePct >= 75) {
                container.textContent = `Phenomenal consistency! Active ${m.activeDays} of ${m.days.length} days (${activePct}%) in ${curMonth} with ${focusHours}h of deep focus. Your peak day was ${m.bestDay?.key || 'recent'} (${m.bestScore} pts).`;
            } else if (activePct >= 40) {
                container.textContent = `Solid monthly foundation in ${curMonth}: ${m.totalTasks} tasks completed and ${focusHours}h focused across ${m.activeDays} days. Aim for 3 consecutive active days to strengthen your streak.`;
            } else {
                container.textContent = `${curMonth} shows ${m.totalTasks} tasks and ${m.totalFocus}m focus across ${m.activeDays} active days. Focus on daily micro-sessions to rebuild momentum.`;
            }
        } else {
            const score = this.getScore(w);
            let insight = 'Build the habit of completing one deep work block daily. Small wins compound.';
            if (score >= 80)      insight = `Elite week — ${w.totalFocus}min of deep focus logged across ${w.activeDays} active days. ${State.data.streak}d streak active. Keep this momentum.`;
            else if (score >= 60) insight = `Solid output: ${w.totalTasks} tasks done, ${w.totalFocus}min focus. Peak output on ${w.bestDay?.name || 'this week'}. Push for 1 more session to enter flow state.`;
            else if (score >= 35) insight = `Building rhythm. Best day: ${w.bestDay?.name || 'today'}. Clearing pending tasks before weekend will unlock higher momentum.`;
            else if (score > 0)   insight = `Week needs momentum. Start with just 1 pomodoro to break initial friction. Current score is ${score}/100 — climb from here.`;
            container.textContent = insight;
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
            ? `${Icons.zap(12)} S-TIER FLOW` 
            : score >= 70 
            ? `${Icons.fire(12)} HIGH VELOCITY` 
            : score >= 40 
            ? `${Icons.spark(12)} STEADY RHYTHM` 
            : `${Icons.habitDefault(12)} BUILDING MOMENTUM`;

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
                <div class="info-date-range">${Icons.calendar(12)} ${dateRangeStr}</div>
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
                        <div class="info-score-ring-inner">${Icons.zap(16)}</div>
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
                        <span class="info-task-check">${Icons.check(12)}</span>
                        <span class="info-task-text">${Utils.escape(t.text)}</span>
                    </div>
                `).join('') : `
                    <div class="info-task-empty">
                        <span>${Icons.seedling(16)}</span>
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

        let tier = 'STARTING';
        if (vibe >= 85) { tier = 'ELITE'; }
        else if (vibe >= 70) { tier = 'STRONG'; }
        else if (vibe >= 50) { tier = 'STEADY'; }
        else if (vibe >= 30) { tier = 'BUILDING'; }

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
        const pillFont = `700 13px ${sansFont}`;
        const pillW = M(range, pillFont) + 52;
        roundRect(64, 128, pillW, 32, 16);
        ctx.fillStyle = acA(0.12);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = acA(0.28);
        ctx.stroke();

        ctx.save();
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const calX = 80, calY = 138;
        ctx.strokeRect(calX, calY, 13, 11);
        ctx.beginPath();
        ctx.moveTo(calX + 3, calY - 3); ctx.lineTo(calX + 3, calY);
        ctx.moveTo(calX + 10, calY - 3); ctx.lineTo(calX + 10, calY);
        ctx.moveTo(calX, calY + 3.5); ctx.lineTo(calX + 13, calY + 3.5);
        ctx.stroke();
        ctx.restore();

        T(range, 102, 144, pillFont, '#CBD5E1');

        /* ---------- vibe score hero ---------- */
        glass(64, 196, 1072, 190, 24, 0.035, 0.09);
        T('PRODUCTIVITY VIBE SCORE', 100, 234, `800 13px ${sansFont}`, '#94A3B8', 'left', 1.5);

        const scoreFont = `700 72px ${serifFont}`;
        T(String(vibe), 100, 302, scoreFont, AC);
        const scoreW = M(String(vibe), scoreFont);
        T('/100', 100 + scoreW + 10, 316, `700 24px ${sansFont}`, '#94A3B8');

        T(`FOCUS ${focusPts}  •  TASKS ${taskPts}  •  HABITS ${habitPts}`, 100, 354, `600 13px ${sansFont}`, '#94A3B8');

        const badgeText = tier;
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
                // Crisp vector checkmark
                ctx.save();
                ctx.strokeStyle = AC;
                ctx.lineWidth = 2.2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(114, ry + 17);
                ctx.lineTo(119, ry + 22);
                ctx.lineTo(127, ry + 12);
                ctx.stroke();
                ctx.restore();
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
        const btn = document.querySelector('[data-action="export-download-png"]');
        if (btn) btn.classList.add('loading');
        try {
            Toast.show('Rendering high-res card…');
            const canvas = await this.generateCardCanvas();
            const dates = Utils.weekDates(State.weekOffset);
            const link = document.createElement('a');
            link.download = `Focussium_Vibe_${dates[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
            Toast.show('Infographic Card downloaded!');
        } catch(e) {
            handleError('PNG Export', e);
            Toast.show('Export failed. Please try again.');
        } finally {
            if (btn) btn.classList.remove('loading');
        }
    },

    async downloadPDF() {
        const btn = document.querySelector('[data-action="export-download-pdf"]');
        if (btn) btn.classList.add('loading');
        try {
            Toast.show('Generating Executive PDF Report…');

            let jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDFClass) {
                await new Promise(resolve => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    document.head.appendChild(script);
                });
                jsPDFClass = window.jspdf?.jsPDF || window.jsPDF;
            }

            const doc = new jsPDFClass({ orientation: 'portrait', unit: 'mm', format: 'a4' });

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

            // Enabled habits only (BUG-05)
            const habitConfigs = (State.data?.habitConfig || DEFAULT_HABITS || []).filter(h => h.enabled);
            
            // Completed tasks this week
            const completedTasksThisWeek = (State.data?.tasks || [])
                .filter(t => t.completed && t.completedAt && dates.includes(new Date(t.completedAt).toISOString().split('T')[0]));

            // Colors: Theme-aware (BUG-04)
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            const css = getComputedStyle(document.documentElement);
            const acHex = (css.getPropertyValue('--ac').trim() || '#38B6FF').replace('#', '');
            const acR = parseInt(acHex.substring(0, 2), 16) || 56;
            const acG = parseInt(acHex.substring(2, 4), 16) || 182;
            const acB = parseInt(acHex.substring(4, 6), 16) || 255;

            const BG_PAGE     = isLight ? [242, 240, 235] : [10, 14, 30];
            const BG_CARD     = isLight ? [255, 255, 255] : [17, 23, 46];
            const BG_CARD_ALT = isLight ? [235, 232, 226] : [23, 31, 60];
            const BORDER      = isLight ? [215, 210, 202] : [40, 52, 90];
            const TX_WHITE    = isLight ? [18, 16, 14]   : [255, 255, 255];
            const TX_GRAY     = isLight ? [70, 65, 60]   : [148, 163, 184];
            const TX_MUTED    = isLight ? [115, 110, 102] : [100, 116, 139];
            const ACCENT      = [acR, acG, acB];

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
            doc.rect(0, 0, PW, 3.5, 'F');

            // ── HEADER BLOCK ──
            fillBg(BG_CARD);
            strokeBd(BORDER);
            doc.roundedRect(12, 10, PW - 24, 28, 4, 4, 'FD');

            // Brand Logo Disc & Title
            fillBg(ACCENT);
            doc.roundedRect(18, 16, 10, 10, 2.5, 2.5, 'F');
            // Vector lightning shape inside logo box
            if (isLight) doc.setFillColor(255, 255, 255);
            else doc.setFillColor(0, 0, 0);
            doc.triangle(23, 17.5, 20.5, 21.5, 23, 21.5, 'F');
            doc.triangle(22.5, 20.5, 25, 20.5, 22.5, 24.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            textCol(TX_WHITE);
            doc.text('FOCUSSIUM 3.0', 32, 22);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            textCol(TX_GRAY);
            doc.text('EXECUTIVE PRODUCTIVITY AUDIT & WEEKLY DOSSIER', 32, 28);

            // User Info on Right
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            textCol(TX_WHITE);
            doc.text(username, PW - 20, 20, { align: 'right' });

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
            doc.roundedRect(12, curY, PW - 24, 40, 4, 4, 'FD');

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
            doc.roundedRect(20, curY + 29, 48, 6.5, 2, 2, 'FD');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            textCol(TX_WHITE);
            doc.text(velocityBadge, 44, curY + 33.5, { align: 'center' });

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
            doc.text(`Score Breakdown: Tasks (+${breakdown.tasks} pts) • Focus (+${breakdown.focus} pts) • Rhythm (+${breakdown.streak} pts) • Consistency (+${breakdown.consistency} pts)`, 80, curY + 35);

            curY += 46;

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

            // Baseline guide line
            doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
            doc.setLineWidth(0.4);
            doc.line(18, curY + 34, PW - 18, curY + 34);

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
                    textCol(isLight ? TX_WHITE : [255, 255, 255]);
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
                const rowBg = (i % 2 === 0) ? BG_CARD : (isLight ? [248, 246, 242] : BG_PAGE);
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
            const timeStampStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            doc.text(`Focussium 3.0 • Verified Audit • Generated ${timeStampStr}`, 12, PH - 6);
            doc.text(`Page 1 of 2`, PW - 12, PH - 6, { align: 'right' });


            // ================= PAGE 2 =================
            doc.addPage();

            // Page Background
            fillBg(BG_PAGE);
            doc.rect(0, 0, PW, PH, 'F');

            // Top Header Accent Line
            fillBg(ACCENT);
            doc.rect(0, 0, PW, 3.5, 'F');

            curY = 14;

            // ── SECTION 4: KEY ACCOMPLISHMENTS & COMPLETED TASKS ──
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            textCol(TX_WHITE);
            doc.text('KEY ACCOMPLISHMENTS & COMPLETED TASKS', 14, curY);
            curY += 4;

            fillBg(BG_CARD);
            strokeBd(BORDER);
            const maxTaskItems = Math.min(8, completedTasksThisWeek.length);
            const taskBoxH = maxTaskItems > 0 ? Math.max(30, 10 + maxTaskItems * 6.8) : 34;
            doc.roundedRect(12, curY, PW - 24, taskBoxH, 4, 4, 'FD');

            if (completedTasksThisWeek.length > 0) {
                completedTasksThisWeek.slice(0, 8).forEach((t, i) => {
                    const ty = curY + 7 + (i * 6.8);
                    // Vector checkmark in PDF
                    doc.setDrawColor(ACCENT[0], ACCENT[1], ACCENT[2]);
                    doc.setLineWidth(0.5);
                    doc.line(16.5, ty - 1, 18, ty);
                    doc.line(18, ty, 20.5, ty - 2.8);

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
                doc.text('No completed tasks logged for this week. Focus momentum is ready to be built!', 20, curY + 18);
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
            const habitRows = Math.min(6, habitConfigs.length);
            const habitBoxH = habitRows > 0 ? Math.max(36, 12 + habitRows * 8.2) : 34;
            doc.roundedRect(12, curY, PW - 24, habitBoxH, 4, 4, 'FD');

            if (habitConfigs.length > 0) {
                habitConfigs.slice(0, 6).forEach((h, i) => {
                    const hy = curY + 8 + (i * 8.2);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7);
                    textCol(TX_WHITE);
                    const habitLabel = (h.label || h.name || 'Habit');
                    doc.text(habitLabel.length > 30 ? habitLabel.substring(0, 28) + '…' : habitLabel, 18, hy);

                    // 7 days tick boxes
                    dates.forEach((d, dayIdx) => {
                        const isDone = (State.data?.habits?.[d] || []).includes(h.id);
                        const dotX = 84 + dayIdx * 11;
                        fillBg(isDone ? ACCENT : BG_CARD_ALT);
                        strokeBd(isDone ? ACCENT : BORDER);
                        doc.roundedRect(dotX, hy - 3.5, 7.5, 4.8, 1, 1, 'FD');
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(5);
                        textCol(isDone ? (isLight ? [255, 255, 255] : [0, 0, 0]) : TX_MUTED);
                        doc.text(dayFullNames[dayIdx].substring(0, 1), dotX + 3.75, hy - 0.2, { align: 'center' });
                    });

                    // Compliance Rate + visual progress bar
                    const doneCount = dates.filter(d => (State.data?.habits?.[d] || []).includes(h.id)).length;
                    const compRate = Math.round((doneCount / 7) * 100);

                    const pBarW = 16;
                    const pFillW = (pBarW * compRate) / 100;
                    fillBg(BG_CARD_ALT);
                    doc.roundedRect(PW - 46, hy - 2.5, pBarW, 3, 0.8, 0.8, 'F');
                    if (pFillW > 0) {
                        fillBg(ACCENT);
                        doc.roundedRect(PW - 46, hy - 2.5, pFillW, 3, 0.8, 0.8, 'F');
                    }

                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(6.5);
                    textCol(compRate >= 70 ? ACCENT : TX_GRAY);
                    doc.text(`${compRate}%`, PW - 18, hy, { align: 'right' });
                });
            } else {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(7);
                textCol(TX_GRAY);
                doc.text('No active habits configured. Establish daily habits in the Habits tab to track streaks.', 20, curY + 18);
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
            const stoicQuotes = [
                "“We suffer more often in imagination than in reality.” — Seneca",
                "“You have power over your mind, not outside events.” — Marcus Aurelius",
                "“First say to yourself what you would be; and then do what you have to do.” — Epictetus",
                "“Action is the true measure of discipline.” — Toji"
            ];
            const stoicQuoteText = stoicQuotes[Math.floor(Math.random() * stoicQuotes.length)];
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
            doc.text(`Focussium 3.0 • Verified Audit • Generated ${timeStampStr}`, 12, PH - 6);
            doc.text(`Page 2 of 2`, PW - 12, PH - 6, { align: 'right' });

            // Save PDF
            doc.save(`Focussium_Executive_Audit_${dates[0]}.pdf`);
            if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
            Toast.show('Detailed 2-Page PDF Report downloaded!');
        } catch (e) {
            handleError('PDF Export', e);
            Toast.show('PDF generation failed');
        } finally {
            if (btn) btn.classList.remove('loading');
        }
    },

    async copyImage() {
        const btn = document.querySelector('[data-action="export-copy-clipboard"]');
        if (btn) btn.classList.add('loading');
        try {
            Toast.show('Capturing card…');
            const canvas = await this.generateCardCanvas();
            canvas.toBlob(async (blob) => {
                if (!blob) throw new Error('Blob generation failed');
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    if (typeof Sound !== 'undefined' && Sound.success) Sound.success();
                    Toast.show('Infographic copied to clipboard!');
                } catch(clipErr) {
                    const dates = Utils.weekDates(State.weekOffset);
                    const link = document.createElement('a');
                    link.download = `Focussium_Vibe_${dates[0]}.png`;
                    link.href = canvas.toDataURL('image/png');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    Toast.show('Downloaded image (Clipboard permission restricted)');
                } finally {
                    if (btn) btn.classList.remove('loading');
                }
            }, 'image/png');
        } catch(e) {
            handleError('Copy image', e);
            Toast.show('Failed to copy card');
            if (btn) btn.classList.remove('loading');
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
        Report.renderWeekTimeline(w);
        Report.renderHeatmap(w);
        Report.renderMonthOverview(m);
        Sound.click();

        if (State.reportMode === 'month') {
            document.getElementById('reportCardDayDetail')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});

