/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v2 PRO — MAIN APPLICATION
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────── */
const State = {
    defaults: {
        tasks: [],
        lists: ['My Tasks', 'Work', 'Personal'],
        dumps: [],
        pomo: [],
        currentList: 'All',
        streak: 0,
        lastVisit: null,
        name: '',
        onboarded: false,
        totalTasksCompleted: 0,
        totalFocusMinutes: 0,
        settings: {
            theme: 'dark',
            accent: 'royal',
            customHex: '',
            sound: true,
            focusDur: 25,
            breakDur: 5,
            longDur: 15,
            sessions: 4
        }
    },

    data: null,
    user: null,
    currentPage: 'home',
    weekOffset: 0,
    selectedRepeat: 'none',
    tempSubtasks: [],
    onboardStep: 0,
    editingTaskId: null,
    saveTimeout: null,
    clockInterval: null,

    pomo: {
        running: false,
        mode: 'focus',
        left: 0,
        total: 0,
        interval: null,
        count: 0
    }
};

const ACCENTS = [
    { id: 'royal', c: '#f5c842', n: 'Premium Gold' },
    { id: 'neon', c: '#00e5ff', n: 'Cyber Neon' },
    { id: 'matcha', c: '#9be36d', n: 'Fresh Matcha' },
    { id: 'sunset', c: '#ff5757', n: 'Aura Sunset' },
    { id: 'lavender', c: '#9d6eff', n: 'Pure Lavender' },
    { id: 'sky', c: '#38b6ff', n: 'Vibrant Sky' },
    { id: 'rose', c: '#ff4d8d', n: 'Pink Rose' },
    { id: 'mint', c: '#3dd9b8', n: 'Crystal Mint' },
    { id: 'void', c: '#8c9ab0', n: 'Deep Void' }
];


/* ─────────────────────────────────────────────────────────
   UTILITIES
───────────────────────────────────────────────────────── */
const Utils = {
    today() {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    },

    escape(str) {
        if (!str) return '';
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
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
                .reduce((a, p) => a + p.dur, 0)
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
    }
};

/* ─────────────────────────────────────────────────────────
   STORAGE
───────────────────────────────────────────────────────── */
const Storage = {
    load() {
        const local = localStorage.getItem('focussium_v2_data');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                return {
                    ...State.defaults,
                    ...parsed,
                    settings: { ...State.defaults.settings, ...(parsed.settings || {}) }
                };
            } catch {
                return Utils.clone(State.defaults);
            }
        }
        return Utils.clone(State.defaults);
    },

    saveLocal() {
        localStorage.setItem('focussium_v2_data', JSON.stringify(State.data));
    },

    async saveRemote() {
        if (!State.user) return;

        const indicator = document.getElementById('syncIndicator');
        indicator.className = 'sync-indicator saving';

        try {
            await FB.db.collection('users').doc(State.user.uid).set(Utils.clone(State.data));
            indicator.className = 'sync-indicator';
        } catch {
            indicator.className = 'sync-indicator error';
        }
    },

    save() {
        this.saveLocal();
        clearTimeout(State.saveTimeout);
        State.saveTimeout = setTimeout(() => this.saveRemote(), 1200);
    }
};

/* ─────────────────────────────────────────────────────────
   THEME
───────────────────────────────────────────────────────── */
const Theme = {
    hexToRGB(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    },

    lightenHex(hex, amount = 40) {
        const { r, g, b } = this.hexToRGB(hex);
        const lr = Math.min(255, r + amount);
        const lg = Math.min(255, g + amount);
        const lb = Math.min(255, b + amount);
        return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
    },

    darkenHex(hex, amount = 30) {
        const { r, g, b } = this.hexToRGB(hex);
        const dr = Math.max(0, r - amount);
        const dg = Math.max(0, g - amount);
        const db = Math.max(0, b - amount);
        return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    },

    shiftHue(hex, shift = 30) {
        const { r, g, b } = this.hexToRGB(hex);
        let h, s, l;
        const rr = r / 255, gg = g / 255, bb = b / 255;
        const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
        l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
            else if (max === gg) h = ((bb - rr) / d + 2) / 6;
            else h = ((rr - gg) / d + 4) / 6;
        }
        h = ((h * 360 + shift) % 360) / 360;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        let nr, ng, nb;
        if (s === 0) { nr = ng = nb = l; }
        else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            nr = hue2rgb(p, q, h + 1/3);
            ng = hue2rgb(p, q, h);
            nb = hue2rgb(p, q, h - 1/3);
        }
        return `#${Math.round(nr*255).toString(16).padStart(2,'0')}${Math.round(ng*255).toString(16).padStart(2,'0')}${Math.round(nb*255).toString(16).padStart(2,'0')}`;
    },

    applyCustomAccent(hex) {
        hex = hex.replace('#', '');
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return;
        const color = `#${hex}`;
        const { r, g, b } = this.hexToRGB(color);
        const lighter = this.lightenHex(color, 40);
        const darker = this.darkenHex(color, 30);
        const gradEnd = this.shiftHue(color, 30);

        const root = document.documentElement;
        root.style.setProperty('--ac', color);
        root.style.setProperty('--acr', `${r}, ${g}, ${b}`);
        root.style.setProperty('--acl', lighter);
        root.style.setProperty('--acd', darker);
        root.style.setProperty('--acg', `rgba(${r}, ${g}, ${b}, .2)`);
        root.style.setProperty('--acgr', `linear-gradient(135deg, ${color}, ${gradEnd})`);
        root.style.setProperty('--acs', `rgba(${r}, ${g}, ${b}, .12)`);
    },

    clearCustomAccent() {
        const root = document.documentElement;
        ['--ac', '--acr', '--acl', '--acd', '--acg', '--acgr', '--acs'].forEach(p => {
            root.style.removeProperty(p);
        });
    },

    apply() {
        let theme = State.data.settings.theme;
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);

        if (State.data.settings.accent === 'custom' && State.data.settings.customHex) {
            document.documentElement.setAttribute('data-accent', 'royal');
            this.applyCustomAccent(State.data.settings.customHex);
        } else {
            this.clearCustomAccent();
            document.documentElement.setAttribute('data-accent', State.data.settings.accent);
        }
    }
};

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (State.data?.settings?.theme === 'system') Theme.apply();
});

/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
const Toast = {
    timeout: null,
    show(msg) {
        const el = document.getElementById('toast');
        el.textContent = msg;
        el.classList.add('show');
        clearTimeout(this.timeout);
        this.timeout = setTimeout(() => el.classList.remove('show'), 2600);
    }
};

/* ─────────────────────────────────────────────────────────
   AUTH
───────────────────────────────────────────────────────── */
const Auth = {
    toggleEmail(show) {
        document.getElementById('googleAuthSection').style.display = show ? 'none' : 'block';
        document.getElementById('emailForm').classList.toggle('show', show);
        document.getElementById('loginError').textContent = '';
    },

    async signInGoogle() {
        const btn = document.getElementById('googleBtn');
        btn.querySelector('span:last-child').textContent = 'Signing in...';
        btn.disabled = true;

        try {
            await FB.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        } catch (e) {
            document.getElementById('loginError').textContent = e.message;
            btn.querySelector('span:last-child').textContent = 'Continue with Google';
            btn.disabled = false;
        }
    },

    async signInEmail() {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const btn = document.getElementById('emailSignInBtn');

        if (!email || !pass) return;

        btn.textContent = '...';
        btn.disabled = true;

        try {
            await FB.auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/user-not-found') msg = 'User not found. Try signing up.';
            if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            document.getElementById('loginError').textContent = msg;
            btn.textContent = 'Sign In';
            btn.disabled = false;
        }
    },

    async signUp() {
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;
        const btn = document.getElementById('emailSignUpBtn');

        if (!email || pass.length < 6) {
            document.getElementById('loginError').textContent = 'Password must be at least 6 characters.';
            return;
        }

        btn.textContent = '...';
        btn.disabled = true;

        try {
            await FB.auth.createUserWithEmailAndPassword(email, pass);
        } catch (err) {
            document.getElementById('loginError').textContent = err.message;
            btn.textContent = 'Sign Up';
            btn.disabled = false;
        }
    },

    async signOut() {
        try {
            await FB.auth.signOut();
            State.data = Utils.clone(State.defaults);
            localStorage.removeItem('focussium_v2_data');
        } catch {
            Toast.show('Sign out failed');
        }
    },

    init() {
        FB.auth.onAuthStateChanged(async user => {
            const loadingScreen = document.getElementById('loadingScreen');

            if (user) {
                State.user = user;

                try {
                    const doc = await FB.db.collection('users').doc(user.uid).get();
                    if (doc.exists) {
                        State.data = {
                            ...State.defaults,
                            ...doc.data(),
                            settings: { ...State.defaults.settings, ...(doc.data().settings || {}) }
                        };
                    } else {
                        State.data = Storage.load();
                    }
                } catch {
                    State.data = Storage.load();
                }

                document.getElementById('userAvatar').src = user.photoURL || '';
                document.getElementById('userEmailDisplay').textContent = user.email || '';
                document.getElementById('loginScreen').classList.remove('show');

                setTimeout(() => loadingScreen.classList.add('hide'), 300);

                if (!State.data.onboarded) {
                    Onboard.show();
                } else {
                    document.getElementById('app').classList.add('show');
                    App.init();
                }
            } else {
                State.user = null;
                State.data = Storage.load();
                document.getElementById('app').classList.remove('show');
                document.getElementById('loginScreen').classList.add('show');
                setTimeout(() => loadingScreen.classList.add('hide'), 300);
                App.init();
            }
        });
    }
};

/* ─────────────────────────────────────────────────────────
   ONBOARDING
───────────────────────────────────────────────────────── */
const Onboard = {
    show() {
        document.getElementById('onboardScreen').classList.add('show');
        State.onboardStep = 0;
        this.render();
        this.renderColors();
    },

    renderColors() {
        document.getElementById('onboardColors').innerHTML = ACCENTS.map(a =>
            `<div class="onboard-color ${State.data.settings.accent === a.id ? 'active' : ''}" 
                  style="background:${a.c}" 
                  onclick="Onboard.setAccent('${a.id}')"
                  title="${a.n}"></div>`
        ).join('');
    },

    render() {
        document.querySelectorAll('.onboard-step').forEach((step, i) => {
            step.classList.toggle('active', i === State.onboardStep);
        });

        document.getElementById('onboardDots').innerHTML = Array.from({ length: 5 }, (_, i) =>
            `<div class="onboard-dot ${i === State.onboardStep ? 'active' : ''}"></div>`
        ).join('');
    },

    next() {
        if (State.onboardStep === 1) {
            State.data.name = document.getElementById('onboardName').value.trim();
        }

        State.onboardStep++;
        if (State.onboardStep > 4) State.onboardStep = 4;
        this.render();
        Sound.toggle();
    },

    setAccent(accent) {
        State.data.settings.accent = accent;
        Theme.apply();
        this.renderColors();
    },

    setTheme(theme) {
        State.data.settings.theme = theme;
        Theme.apply();
        document.querySelectorAll('.onboard-theme').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    },

    done() {
        State.data.onboarded = true;
        Storage.save();
        document.getElementById('onboardScreen').classList.remove('show');
        document.getElementById('app').classList.add('show');
        App.init();
        Sound.success();
    }
};

/* ─────────────────────────────────────────────────────────
   CLOCK
───────────────────────────────────────────────────────── */
const Clock = {
    update() {
        const now = new Date();
        const h = now.getHours();
        const m = String(now.getMinutes()).padStart(2, '0');

        document.getElementById('clock').innerHTML = `${h % 12 || 12}:${m}<span class="clock-period">${h < 12 ? 'AM' : 'PM'}</span>`;

        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        document.getElementById('dateDisplay').textContent = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;

        let greeting = 'Good morning';
        if (h < 5) greeting = 'Still up';
        else if (h < 12) greeting = 'Good morning';
        else if (h < 17) greeting = 'Good afternoon';
        else if (h < 21) greeting = 'Good evening';
        else greeting = 'Night owl mode';

        const name = State.data.name || State.user?.displayName?.split(' ')[0] || '';
        document.getElementById('greeting').textContent = name ? `${greeting}, ${name}` : greeting;

        this.checkStreak();
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

/* ─────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────── */
const Nav = {
    go(page) {
        State.currentPage = page;

        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        document.querySelector(`.page[data-page="${page}"]`).classList.add('active');

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });

        const fab = document.getElementById('fabButton');
        fab.classList.toggle('show', page === 'tasks');

        Sound.nav();

        if (page === 'home') Home.render();
        if (page === 'tasks') Tasks.render();
        if (page === 'dump') Dump.render();
        if (page === 'report') Report.render();
    }
};

/* ─────────────────────────────────────────────────────────
   LEVELING
───────────────────────────────────────────────────────── */
const Level = {
    getXP() {
        const totalFocus = State.data.totalFocusMinutes || 0;
        const totalTasks = State.data.totalTasksCompleted || 0;
        return (totalFocus * 10) + (totalTasks * 50);
    },

    update() {
        const xp = this.getXP();
        const level = Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1;

        const xpForCurrentLevel = 100 * Math.pow(level - 1, 2);
        const xpForNextLevel = 100 * Math.pow(level, 2);
        const xpInCurrentLevel = xp - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
        const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

        const badge = document.getElementById('userLevelBadge');
        if (badge) badge.textContent = level;

        const barContainer = document.querySelector('.xp-bar-container');
        if (barContainer) barContainer.title = `Level ${level} | ${xp} XP total`;

        const bar = document.getElementById('xpBarFill');
        if (bar) bar.style.width = `${progressPercent}%`;
    }
};

/* ─────────────────────────────────────────────────────────
   TASKS
───────────────────────────────────────────────────────── */
const Tasks = {
    getVisibleToday() {
        const today = Utils.today();
        return State.data.tasks.filter(t =>
            !t.date ||
            t.date === today ||
            (t.date < today && !t.completed)
        );
    },

    getRepeatLabel(repeat) {
        const map = { none: '', daily: 'Daily', '2days': '2d', weekdays: 'Weekdays', weekly: 'Weekly' };
        if (map[repeat] !== undefined) return map[repeat];
        if (repeat?.startsWith('custom:')) return `${repeat.split(':')[1]}d`;
        return '';
    },

    taskHTML(task, index = 0) {
        const today = Utils.today();
        let metaHTML = '';

        if (task.date) {
            let label = '';
            if (task.date === today) label = 'Today';
            else if (task.date < today) label = 'Overdue';
            else {
                const d = new Date(task.date + 'T00:00:00');
                label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
            }
            const isOverdue = task.date < today && !task.completed;
            metaHTML += `<span class="task-badge ${isOverdue ? 'overdue' : ''}">${Icons.calendar(9)}${label}</span>`;
        }

        if (task.time) {
            metaHTML += `<span class="task-badge">${Icons.clock(9)}${Utils.formatTime12(task.time)}</span>`;
        }

        if (task.priority && task.priority !== 'none') {
            metaHTML += `<span class="task-badge priority-${task.priority}">${task.priority}</span>`;
        }

        const repeatLabel = this.getRepeatLabel(task.repeat);
        if (repeatLabel) {
            metaHTML += `<span class="task-badge repeat">${Icons.repeat(9)}${repeatLabel}</span>`;
        }

        let subtasksHTML = '';
        if (task.subtasks?.length) {
            subtasksHTML = `<div class="task-subtasks">` +
                task.subtasks.map((s, idx) => `
                    <div class="task-subtask">
                        <div class="subtask-checkbox ${s.done ? 'checked' : ''}" onclick="Tasks.toggleSubtask('${task.id}', ${idx})">
                            ${Icons.check(8)}
                        </div>
                        <span class="subtask-text ${s.done ? 'done' : ''}">${Utils.escape(s.text)}</span>
                    </div>
                `).join('') +
                `</div>`;
        }

        const priorityClass = task.priority && task.priority !== 'none' ? `priority-${task.priority}` : '';

        return `
        <div class="task-item ${priorityClass} ${task.completed ? 'completed' : ''}" data-id="${task.id}" style="animation-delay:${index * 0.04}s">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="Tasks.toggle('${task.id}')">
                ${Icons.check(12)}
            </div>
            <div class="task-content" onclick="Tasks.openEdit('${task.id}')">
                <div class="task-title">${Utils.escape(task.text)}</div>
                ${task.notes ? `<div class="task-notes">${Utils.escape(task.notes)}</div>` : ''}
                <div class="task-meta">${metaHTML}</div>
                ${subtasksHTML}
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" onclick="Tasks.openEdit('${task.id}')" title="Edit">
                    ${Icons.edit(14)}
                </button>
                <button class="task-action-btn delete" onclick="Tasks.remove('${task.id}')" title="Delete">
                    ${Icons.trash(14)}
                </button>
            </div>
        </div>`;
    },

    render() {
        const todayTasks = this.getVisibleToday();
        const listsWithTasks = State.data.lists.filter(l => todayTasks.some(t => t.list === l));
        const tabs = ['All', ...listsWithTasks];

        if (!tabs.includes(State.data.currentList)) {
            State.data.currentList = 'All';
        }

        document.getElementById('taskTabs').innerHTML = tabs.map(list => {
            const count = list === 'All'
                ? todayTasks.filter(t => !t.completed).length
                : todayTasks.filter(t => t.list === list && !t.completed).length;

            return `
            <button class="tab ${list === State.data.currentList ? 'active' : ''}" onclick="Tasks.setList('${Utils.escape(list).replace(/'/g, "\\'")}')">
                ${Utils.escape(list)}
                ${count ? `<span class="tab-count">${count}</span>` : ''}
            </button>`;
        }).join('');

        const filtered = State.data.currentList === 'All'
            ? todayTasks
            : todayTasks.filter(t => t.list === State.data.currentList);

        const container = document.getElementById('tasksContainer');

        if (!filtered.length) {
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${Icons.tasks(56)}</div>
                <p>Nothing here yet.<br>Tap + to add something meaningful.</p>
            </div>`;
            return;
        }

        const openTasks = filtered.filter(t => !t.completed);
        const doneTasks = filtered.filter(t => t.completed);

        container.innerHTML = [...openTasks, ...doneTasks].map((t, i) => this.taskHTML(t, i)).join('');
    },

    setList(list) {
        State.data.currentList = list;
        Storage.save();
        this.render();
        Sound.click();
    },

    createList() {
        const input = document.getElementById('newListInput');
        const name = input.value.trim();
        if (!name || State.data.lists.includes(name)) return;

        State.data.lists.push(name);
        State.data.currentList = name;
        input.value = '';
        Storage.save();
        this.render();
        Sound.success();
        Toast.show('List created');
    },

    openAddModal() {
        State.editingTaskId = null;
        document.getElementById('taskModalTitle').textContent = 'New Task';
        document.getElementById('taskSubmitBtn').textContent = 'Add Task';
        document.getElementById('taskDeleteBtn').style.display = 'none';

        document.getElementById('taskTitleInput').value = '';
        document.getElementById('taskNotesInput').value = '';
        document.getElementById('taskDateInput').value = Utils.today();
        document.getElementById('taskTimeInput').value = '';
        document.getElementById('taskPrioritySelect').value = 'none';
        document.getElementById('editingTaskId').value = '';

        State.selectedRepeat = 'none';
        State.tempSubtasks = [];

        this.populateListSelect();
        this.renderRepeatPills();
        this.renderSubtasks();
        document.getElementById('customRepeatRow').classList.remove('show');

        document.getElementById('addTaskModal').classList.add('on');
        setTimeout(() => document.getElementById('taskTitleInput').focus(), 300);
        Sound.open();
    },

    openEdit(taskId) {
        const task = State.data.tasks.find(t => t.id === taskId);
        if (!task) return;

        State.editingTaskId = taskId;
        document.getElementById('taskModalTitle').textContent = 'Edit Task';
        document.getElementById('taskSubmitBtn').textContent = 'Save Changes';
        document.getElementById('taskDeleteBtn').style.display = 'block';

        document.getElementById('taskTitleInput').value = task.text || '';
        document.getElementById('taskNotesInput').value = task.notes || '';
        document.getElementById('taskDateInput').value = task.date || '';
        document.getElementById('taskTimeInput').value = task.time || '';
        document.getElementById('taskPrioritySelect').value = task.priority || 'none';
        document.getElementById('editingTaskId').value = taskId;

        State.selectedRepeat = task.repeat || 'none';
        if (State.selectedRepeat.startsWith('custom:')) {
            document.getElementById('customRepeatDays').value = State.selectedRepeat.split(':')[1];
            State.selectedRepeat = 'custom';
        }

        State.tempSubtasks = task.subtasks ? Utils.clone(task.subtasks) : [];

        this.populateListSelect(task.list);
        this.renderRepeatPills();
        this.renderSubtasks();
        document.getElementById('customRepeatRow').classList.toggle('show', State.selectedRepeat === 'custom');

        document.getElementById('addTaskModal').classList.add('on');
        Sound.open();
    },

    populateListSelect(selected = null) {
        const select = document.getElementById('taskListSelect');
        select.innerHTML = State.data.lists.map(l =>
            `<option value="${Utils.escape(l)}" ${l === selected ? 'selected' : ''}>${Utils.escape(l)}</option>`
        ).join('');
    },

    renderRepeatPills() {
        const options = [
            ['none', 'Never'],
            ['daily', 'Daily'],
            ['2days', '2 Days'],
            ['weekdays', 'Weekdays'],
            ['weekly', 'Weekly'],
            ['custom', 'Custom']
        ];

        document.getElementById('repeatPills').innerHTML = options.map(([val, label]) => `
            <button class="pill ${State.selectedRepeat === val ? 'active' : ''}" onclick="Tasks.setRepeat('${val}')">
                ${label}
            </button>
        `).join('');
    },

    setRepeat(repeat) {
        State.selectedRepeat = repeat;
        this.renderRepeatPills();
        document.getElementById('customRepeatRow').classList.toggle('show', repeat === 'custom');
        Sound.click();
    },

    addTempSubtask() {
        const input = document.getElementById('subtaskInput');
        const text = input.value.trim();
        if (!text) return;

        State.tempSubtasks.push({ text, done: false });
        input.value = '';
        this.renderSubtasks();
        Sound.click();
    },

    renderSubtasks() {
        document.getElementById('subtasksList').innerHTML = State.tempSubtasks.map((s, i) => `
            <div class="subtask-item">
                <span>${Utils.escape(s.text)}</span>
                <button class="subtask-remove-btn" onclick="Tasks.removeTempSubtask(${i})">
                    ${Icons.close(12)}
                </button>
            </div>
        `).join('');
    },

    removeTempSubtask(i) {
        State.tempSubtasks.splice(i, 1);
        this.renderSubtasks();
        Sound.delete();
    },

    submitTask() {
        const title = document.getElementById('taskTitleInput').value.trim();
        if (!title) {
            document.getElementById('taskTitleInput').focus();
            return;
        }

        let repeat = State.selectedRepeat;
        if (repeat === 'custom') {
            repeat = 'custom:' + (parseInt(document.getElementById('customRepeatDays').value) || 3);
        }

        const taskData = {
            text: title,
            notes: document.getElementById('taskNotesInput').value.trim(),
            date: document.getElementById('taskDateInput').value,
            time: document.getElementById('taskTimeInput').value,
            priority: document.getElementById('taskPrioritySelect').value,
            list: document.getElementById('taskListSelect').value || State.data.lists[0],
            subtasks: Utils.clone(State.tempSubtasks),
            repeat
        };

        if (State.editingTaskId) {
            const task = State.data.tasks.find(t => t.id === State.editingTaskId);
            if (task) {
                Object.assign(task, taskData);
                Toast.show('Task updated');
            }
        } else {
            State.data.tasks.unshift({
                id: Utils.generateId('task'),
                ...taskData,
                completed: false,
                completedAt: null,
                createdAt: Date.now()
            });
            Toast.show('Task added');
        }

        Storage.save();
        document.getElementById('addTaskModal').classList.remove('on');
        this.render();
        Home.render();
        Sound.success();
    },

    deleteFromModal() {
        if (State.editingTaskId) {
            this.remove(State.editingTaskId);
            document.getElementById('addTaskModal').classList.remove('on');
        }
    },

    toggle(id) {
        const task = State.data.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : null;

        if (task.completed) {
            State.data.totalTasksCompleted = (State.data.totalTasksCompleted || 0) + 1;
            Level.update();
        }

        Storage.save();

        if (task.completed) {
            Sound.success();
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) el.classList.add('completing');
            setTimeout(() => {
                this.render();
                Home.render();
                if (State.currentPage === 'report') Report.render();
            }, 350);
        } else {
            Sound.click();
            this.render();
            Home.render();
            if (State.currentPage === 'report') Report.render();
        }
    },

    toggleSubtask(taskId, subIndex) {
        const task = State.data.tasks.find(t => t.id === taskId);
        if (!task?.subtasks?.[subIndex]) return;

        task.subtasks[subIndex].done = !task.subtasks[subIndex].done;
        Storage.save();
        this.render();
        Sound.click();
    },

    remove(id) {
        State.data.tasks = State.data.tasks.filter(t => t.id !== id);
        Storage.save();
        this.render();
        Home.render();
        if (State.currentPage === 'report') Report.render();
        Sound.delete();
        Toast.show('Task removed');
    },

    summonRepeats() {
        const today = Utils.today();
        const repeatNames = [...new Set(
            State.data.tasks
                .filter(t => t.repeat && t.repeat !== 'none')
                .map(t => t.text)
        )];

        repeatNames.forEach(name => {
            const items = State.data.tasks.filter(t => t.text === name && t.repeat && t.repeat !== 'none');
            const active = items.filter(t => !t.completed);

            if (active.length > 0) {
                if (active[0].date && active[0].date < today) active[0].date = today;
                active.slice(1).forEach(extra => {
                    State.data.tasks = State.data.tasks.filter(t => t.id !== extra.id);
                });
            } else {
                const completed = items
                    .filter(t => t.completed && t.completedAt)
                    .sort((a, b) => b.completedAt - a.completedAt);

                if (completed.length > 0) {
                    const last = completed[0];
                    const doneDate = new Date(last.completedAt).toISOString().split('T')[0];

                    if (doneDate < today && !State.data.tasks.some(t => t.text === name && t.date === today && !t.completed)) {
                        State.data.tasks.unshift({
                            ...last,
                            id: Utils.generateId('task'),
                            date: today,
                            completed: false,
                            completedAt: null,
                            createdAt: Date.now(),
                            subtasks: last.subtasks ? last.subtasks.map(s => ({ ...s, done: false })) : []
                        });
                    }
                }
            }
        });

        Storage.save();
    }
};

/* ─────────────────────────────────────────────────────────
   BRAIN DUMP
───────────────────────────────────────────────────────── */
const Dump = {
    add() {
        const ta = document.getElementById('dumpTextarea');
        const text = ta.value.trim();
        if (!text) return;

        State.data.dumps.unshift({
            id: Utils.generateId('dump'),
            text,
            ts: Date.now()
        });

        ta.value = '';
        Storage.save();
        this.render();
        Sound.success();
        Toast.show('Thought captured');
    },

    render() {
        const container = document.getElementById('dumpsContainer');

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
            <div class="dump-card" style="animation-delay:${i * 0.04}s">
                <div class="dump-text">${Utils.escape(d.text)}</div>
                <div class="dump-footer">
                    <span class="dump-time">${time}</span>
                    <div class="dump-actions">
                        <button class="dump-action-btn convert" onclick="Dump.toTask('${d.id}')">→ Task</button>
                        <button class="dump-action-btn remove" onclick="Dump.remove('${d.id}')">Remove</button>
                    </div>
                </div>
            </div>`;
        }).join('');
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
        Sound.success();
        Toast.show('Converted to task');
    },

    remove(id) {
        State.data.dumps = State.data.dumps.filter(d => d.id !== id);
        Storage.save();
        this.render();
        Sound.delete();
    }
};

/* ─────────────────────────────────────────────────────────
   HOME
───────────────────────────────────────────────────────── */
const Home = {
    render() {
        const todayTasks = Tasks.getVisibleToday();
        const doneTasks = todayTasks.filter(t => t.completed);
        const focusMin = State.data.pomo
            .filter(p => p.date === Utils.today())
            .reduce((a, p) => a + p.dur, 0);

        const percent = todayTasks.length ? Math.round((doneTasks.length / todayTasks.length) * 100) : 0;

        this.renderProgress(percent, doneTasks.length, todayTasks.length, focusMin);
        this.renderWeekSnapshot();
        this.renderStats(todayTasks.length, doneTasks.length, focusMin, State.data.streak || 0);
        this.renderTaskPreview(todayTasks);
    },

    renderProgress(percent, done, total, focusMin) {
        const ring = document.getElementById('progressRingCircle');
        const r = 52;
        const circ = 2 * Math.PI * r;
        ring.style.strokeDasharray = circ;
        ring.style.strokeDashoffset = circ * (1 - percent / 100);

        document.getElementById('progressPercent').textContent = `${percent}%`;
        document.getElementById('progressTasks').textContent = `${done}/${total}`;
        document.getElementById('progressFocus').textContent = `${focusMin}m`;
        document.getElementById('progressStreak').textContent = State.data.streak || 0;
    },

    renderWeekSnapshot() {
        const w = Utils.weekData(0);
        const prevW = Utils.weekData(-1);
        const score = Report.getScore(w);
        const prevScore = Report.getScore(prevW);
        const diff = score - prevScore;

        document.getElementById('homeWeekScore').textContent = score;

        // Trend indicator
        const trendEl = document.getElementById('homeWeekTrend');
        if (diff > 0) {
            trendEl.innerHTML = `<span class="trend-up">${Icons.trendUp(11)} +${diff}</span>`;
        } else if (diff < 0) {
            trendEl.innerHTML = `<span class="trend-down">${Icons.trendDown(11)} ${diff}</span>`;
        } else {
            trendEl.innerHTML = `<span class="trend-flat">— same</span>`;
        }

        // Mini SVG line chart (simplified + calmer visual rhythm)
        const values = w.days.map(d => d.tasks + Math.round(d.focus / 25));
        const max = Math.max(...values, 1);
        const W = 320, H = 72;
        const padX = 14, padY = 10;
        const chartW = W - padX * 2, chartH = H - padY * 2;

        const points = values.map((v, i) => ({
            x: padX + (i / 6) * chartW,
            y: padY + chartH - (v / max) * chartH
        }));

        const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
        const areaPoints = `${linePoints} ${points[points.length - 1].x},${H - 2} ${points[0].x},${H - 2}`;

        const css = getComputedStyle(document.documentElement);
        const ac = css.getPropertyValue('--ac').trim();

        const refLines = [0.25, 0.5, 0.75].map((ratio, idx) => {
            const y = padY + chartH * ratio;
            return `<line x1="${padX}" y1="${y}" x2="${W - padX}" y2="${y}" class="mini-chart-ref mini-chart-ref-${idx}"/>`;
        }).join('');

        const dotsHTML = points.map((p, i) => `
            <circle cx="${p.x}" cy="${p.y}" r="${values[i] > 0 ? 3.3 : 2}" 
                    fill="${values[i] > 0 ? ac : 'var(--bd)'}" 
                    class="mini-chart-dot" style="animation-delay:${0.3 + i * 0.06}s"
                    opacity="${values[i] > 0 ? 1 : 0.4}"/>
        `).join('');

        const labelsHTML = w.days.map((d, i) => `
            <text x="${points[i].x}" y="${H + 12}" text-anchor="middle" 
                  fill="var(--tx4)" font-size="8" font-weight="600" 
                  font-family="Inter, sans-serif" letter-spacing="0.04em">${d.name}</text>
        `).join('');

        document.getElementById('weekMiniChart').innerHTML = `
            <svg viewBox="0 0 ${W} ${H + 16}" class="mini-line-chart" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="miniAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.22"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                ${refLines}
                <polygon points="${areaPoints}" fill="url(#miniAreaGrad)" class="mini-chart-area"/>
                <polyline points="${linePoints}" fill="none" stroke="${ac}" stroke-width="2.5" 
                      stroke-linecap="round" stroke-linejoin="round" class="mini-chart-line"/>
                ${dotsHTML}
                ${labelsHTML}
            </svg>
        `;

        let insight = 'Start your week strong.';
        if (score >= 80) insight = 'You\'re in a beautiful flow state this week. Keep riding it.';
        else if (score >= 60) insight = 'Strong rhythm — your consistency is building real momentum.';
        else if (score >= 35) insight = 'Momentum is building. One more focus block seals the day.';
        else if (score > 0) insight = 'Every small step counts. One session can shift everything.';

        document.getElementById('weekInsight').textContent = insight;
    },


    renderStats(total, done, focus, streak) {
        const icons = [Icons.tasks(16), Icons.check(16), Icons.fire(16), Icons.shield(16)];
        const values = [total, done, focus, streak];

        for (let i = 0; i < 4; i++) {
            document.getElementById(`statIcon${i}`).innerHTML = icons[i];
            document.getElementById(`statValue${i}`).textContent = values[i];
        }
    },

    renderTaskPreview(todayTasks) {
        const preview = todayTasks.filter(t => !t.completed).slice(0, 4);
        const container = document.getElementById('homeTasksPreview');

        if (!preview.length) {
            container.innerHTML = `
            <div class="empty-state small">
                <p>All clear ${Icons.spark(14)}</p>
            </div>`;
            return;
        }

        container.innerHTML = preview.map((t, i) => Tasks.taskHTML(t, i)).join('');
    }
};

/* ─────────────────────────────────────────────────────────
/* ─────────────────────────────────────────────────────────
   POMODORO
───────────────────────────────────────────────────────── */
const Pomo = {
    liveInsights: [
        "Settle in. The hardest part is starting.",
        "Mute the noise. Find your flow.",
        "Your future self will thank you for this block of time.",
        "Breathe. One task at a time.",
        "Deep work is a superpower. You're building it now.",
        "Distractions are cheap. Focus is expensive.",
        "You are exactly where you need to be.",
        "Let go of perfection. Just make progress.",
        "Momentum builds silently. Keep pushing.",
        "Protect this time. The world can wait."
    ],
    currentInsightIndex: 0,
    insightInterval: null,

    init() {
        State.pomo.left = State.data.settings.focusDur * 60;
        State.pomo.total = State.pomo.left;
        State.pomo.mode = 'focus';
        this.updateDisplay();
        this.renderDots();
        this.updatePlayButton(false);
        this.cycleInsight(true);
    },

    setMode(mode) {
        if (State.pomo.running) return;

        State.pomo.mode = mode;
        document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        const durations = {
            focus: State.data.settings.focusDur,
            break: State.data.settings.breakDur,
            long: State.data.settings.longDur
        };

        State.pomo.left = durations[mode] * 60;
        State.pomo.total = State.pomo.left;
        this.updateDisplay();
        Sound.click();
        this.cycleInsight(true);
    },

    cycleInsight(force = false) {
        if (State.pomo.mode !== 'focus') {
            document.getElementById('pomoLiveInsight').classList.remove('show');
            return;
        }

        const el = document.getElementById('pomoLiveInsight');
        
        if (force) {
            this.currentInsightIndex = Math.floor(Math.random() * this.liveInsights.length);
            el.textContent = `"${this.liveInsights[this.currentInsightIndex]}"`;
            setTimeout(() => el.classList.add('show'), 100);
            return;
        }

        // Fade out
        el.classList.remove('show');
        
        setTimeout(() => {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.liveInsights.length);
            } while (nextIndex === this.currentInsightIndex && this.liveInsights.length > 1);
            
            this.currentInsightIndex = nextIndex;
            el.textContent = `"${this.liveInsights[this.currentInsightIndex]}"`;
            
            // Fade in
            requestAnimationFrame(() => el.classList.add('show'));
        }, 600);
    },

    toggle() {
        if (State.pomo.running) {
            clearInterval(State.pomo.interval);
            State.pomo.running = false;
            this.updatePlayButton(false);
            this.updateRunningState(false);
        } else {
            if (State.pomo.left <= 0) this.setMode(State.pomo.mode);

            State.pomo.running = true;
            this.updatePlayButton(true);
            this.updateRunningState(true);
            Sound.timerStart();

            // Initial force-show when starting play if it was paused
            this.cycleInsight(true);

            State.pomo.interval = setInterval(() => {
                State.pomo.left--;
                this.updateDisplay();

                // Rotate insight every 60 seconds
                if (State.pomo.mode === 'focus' && State.pomo.left % 60 === 0 && State.pomo.left > 0) {
                    this.cycleInsight();
                }

                if (State.pomo.left <= 0) {
                    clearInterval(State.pomo.interval);
                    State.pomo.running = false;
                    this.updatePlayButton(false);
                    this.updateRunningState(false);
                    this.done();
                }
            }, 1000);
        }
    },

    updatePlayButton(playing) {
        const html = playing ? Icons.pause(26) : Icons.play(26);
        document.getElementById('pomoPlayBtn').innerHTML = html;
        document.getElementById('fsPlayBtn').innerHTML = html;
        document.getElementById('pomoPlayBtn').classList.toggle('playing', playing);
        document.getElementById('fsPlayBtn').classList.toggle('playing', playing);
    },

    updateRunningState(running) {
        document.getElementById('pomoTimer').classList.toggle('running', running);
        
        // Zen mode hides UI elements when focusing
        const isZenMode = running && State.pomo.mode === 'focus';
        document.getElementById('app').classList.toggle('focus-zen', isZenMode);
    },

    reset() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        this.setMode(State.pomo.mode);
        Sound.click();
    },

    skip() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        this.done();
    },

    done() {
        Sound.timerDone();

        if (State.pomo.mode === 'focus') {
            State.pomo.count++;
            State.data.pomo.push({
                date: Utils.today(),
                dur: State.data.settings.focusDur,
                ts: Date.now()
            });

            State.data.totalFocusMinutes = (State.data.totalFocusMinutes || 0) + State.data.settings.focusDur;

            Storage.save();
            this.renderDots();
            Level.update();
            Toast.show('Focus done! 🔥');

            if (State.pomo.count >= State.data.settings.sessions) {
                State.pomo.count = 0;
                this.setMode('long');
            } else {
                this.setMode('break');
                Sound.breakStart();
            }
        } else {
            Toast.show("Let's focus! 💪");
            this.setMode('focus');
        }

        Home.render();
        if (State.currentPage === 'report') Report.render();
    },

    updateDisplay() {
        const mm = String(Math.floor(State.pomo.left / 60)).padStart(2, '0');
        const ss = String(State.pomo.left % 60).padStart(2, '0');
        const time = `${mm}:${ss}`;

        document.getElementById('pomoTime').textContent = time;
        document.getElementById('fsTime').textContent = time;

        const labels = { focus: 'Focus Time', break: 'Short Break', long: 'Long Break' };
        document.getElementById('pomoModeLabel').textContent = labels[State.pomo.mode];
        document.getElementById('fsLabel').textContent = labels[State.pomo.mode];

        const ring = document.getElementById('pomoRingCircle');
        const r = 130;
        const circ = 2 * Math.PI * r;
        ring.style.strokeDasharray = circ;
        ring.style.strokeDashoffset = State.pomo.total > 0 ? circ * (State.pomo.left / State.pomo.total) : 0;

        document.getElementById('fsBg').className = `fs-bg ${State.pomo.mode === 'focus' ? 'focus' : 'break'}`;
    },

    renderDots() {
        let html = '';
        for (let i = 0; i < State.data.settings.sessions; i++) {
            const isFilled = i < State.pomo.count;
            const isCurrent = i === State.pomo.count && State.pomo.mode === 'focus';
            html += `<div class="pomo-dot ${isFilled ? 'filled' : ''} ${isCurrent ? 'current' : ''}"></div>`;
        }
        document.getElementById('pomoSessionDots').innerHTML = html;
    },

    enterFullscreen() {
        document.getElementById('fullscreenPomo').classList.add('on');
        try { document.documentElement.requestFullscreen(); } catch { }
        Sound.click();
    },

    exitFullscreen() {
        document.getElementById('fullscreenPomo').classList.remove('on');
        try {
            if (document.fullscreenElement) document.exitFullscreen();
        } catch { }
        Sound.click();
    }
};

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.getElementById('fullscreenPomo').classList.contains('on')) {
        Pomo.exitFullscreen();
    }
});

/* ─────────────────────────────────────────────────────────
   REPORT
───────────────────────────────────────────────────────── */
const Report = {
    getScore(w) {
        const weekTasks = State.data.tasks.filter(t => {
            if (!t.date) return true;
            return w.dates.includes(t.date);
        });

        const totalWeekTasks = weekTasks.length || 1;
        const completedWeekTasks = w.totalTasks;
        const completionRate = completedWeekTasks / totalWeekTasks;

        const taskScore = Math.min(25, completedWeekTasks * 2);
        const focusScore = Math.min(25, Math.round(w.totalFocus / 12));
        const activeScore = Math.min(15, Math.round((w.activeDays / 7) * 15));
        const completionScore = Math.min(20, Math.round(completionRate * 20));
        const streakBonus = Math.min(10, Math.floor((State.data.streak || 0) / 2));

        const overdueOpen = State.data.tasks.filter(t =>
            t.date && t.date < Utils.today() && !t.completed
        ).length;

        const overduePenalty = Math.min(10, overdueOpen * 2);

        return Math.max(0, Math.min(100,
            taskScore + focusScore + activeScore + completionScore + streakBonus - overduePenalty
        ));
    },

    getScoreBreakdown(w) {
        const weekTasks = State.data.tasks.filter(t => {
            if (!t.date) return true;
            return w.dates.includes(t.date);
        });

        const totalWeekTasks = weekTasks.length || 1;
        const completedWeekTasks = w.totalTasks;
        const completionRate = completedWeekTasks / totalWeekTasks;

        return {
            tasks: Math.min(25, completedWeekTasks * 2),
            focus: Math.min(25, Math.round(w.totalFocus / 12)),
            consistency: Math.min(15, Math.round((w.activeDays / 7) * 15)),
            completion: Math.min(20, Math.round(completionRate * 20)),
            streak: Math.min(10, Math.floor((State.data.streak || 0) / 2)),
            overdue: Math.min(10, State.data.tasks.filter(t =>
                t.date && t.date < Utils.today() && !t.completed
            ).length * 2)
        };
    },

    changeWeek(dir) {
        State.weekOffset += dir;
        if (State.weekOffset > 0) State.weekOffset = 0;
        this.render();
        Sound.click();
    },

    render() {
        const w = Utils.weekData(State.weekOffset);
        const dates = Utils.weekDates(State.weekOffset);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const start = new Date(dates[0] + 'T00:00:00');
        const end = new Date(dates[6] + 'T00:00:00');

        document.getElementById('weekNavLabel').textContent =
            State.weekOffset === 0
                ? 'This Week'
                : `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;

        this.renderScoreHero(w);
        this.renderStats(w);
        this.renderHeatmap(w);
        this.drawChart('tasksChart', w.days.map(d => d.tasks), w.days.map(d => d.name));
        this.drawChart('focusChart', w.days.map(d => d.focus), w.days.map(d => d.name));
        this.renderMonthOverview();
        this.renderInsights(w);
    },

    getMonthData(offset = 0) {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth() + offset, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
        const days = [];
        const monthIdx = monthStart.getMonth();
        const year = monthStart.getFullYear();
        const count = monthEnd.getDate();

        for (let day = 1; day <= count; day++) {
            const d = new Date(year, monthIdx, day);
            const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tasks = State.data.tasks.filter(t => t.completed && t.doneDate === key).length;
            const focus = State.data.pomo
                .filter(p => p.date === key)
                .reduce((sum, p) => sum + p.dur, 0);
            const score = tasks + Math.round(focus / 25);
            days.push({
                day,
                weekday: d.getDay(),
                key,
                tasks,
                focus,
                score,
                isToday: key === Utils.today()
            });
        }

        const totalTasks = days.reduce((sum, d) => sum + d.tasks, 0);
        const totalFocus = days.reduce((sum, d) => sum + d.focus, 0);
        const activeDays = days.filter(d => d.score > 0).length;
        const bestScore = Math.max(...days.map(d => d.score), 0);
        const bestDay = days.find(d => d.score === bestScore && d.score > 0) || null;

        return {
            year,
            month: monthIdx,
            days,
            totalTasks,
            totalFocus,
            activeDays,
            bestDay,
            bestScore,
            startWeekday: monthStart.getDay()
        };
    },

    renderMonthOverview() {
        const m = this.getMonthData(0);
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        document.getElementById('monthLabel').textContent = `${monthNames[m.month]} ${m.year}`;

        const completionRate = m.days.length ? Math.round((m.activeDays / m.days.length) * 100) : 0;
        document.getElementById('monthStats').innerHTML = `
            <div class="month-stat-chip">
                <span class="month-stat-label">Tasks</span>
                <span class="month-stat-value">${m.totalTasks}</span>
            </div>
            <div class="month-stat-chip">
                <span class="month-stat-label">Focus</span>
                <span class="month-stat-value">${m.totalFocus}m</span>
            </div>
            <div class="month-stat-chip">
                <span class="month-stat-label">Active days</span>
                <span class="month-stat-value">${m.activeDays}/${m.days.length}</span>
            </div>
            <div class="month-stat-chip">
                <span class="month-stat-label">Rhythm</span>
                <span class="month-stat-value">${completionRate}%</span>
            </div>
        `;

        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
            .map(name => `<div class="month-day-head">${name}</div>`)
            .join('');

        const leadBlanks = Array.from({ length: m.startWeekday }, () =>
            `<div class="month-day-cell month-day-empty"></div>`).join('');

        const intensityMax = Math.max(m.bestScore, 1);
        const dayCells = m.days.map(d => {
            const level = d.score <= 0 ? 0 : Math.min(4, Math.ceil((d.score / intensityMax) * 4));
            return `
                <div class="month-day-cell level-${level} ${d.isToday ? 'today' : ''}" title="${d.key}: ${d.tasks} tasks, ${d.focus} focus min">
                    <div class="month-day-num">${d.day}</div>
                    <div class="month-day-meta">${d.tasks} • ${d.focus}m</div>
                </div>
            `;
        }).join('');

        document.getElementById('monthHeatmap').innerHTML = dayHeaders + leadBlanks + dayCells;

        let monthInsight = `You're showing up on ${m.activeDays} days this month.`;
        if (!m.totalTasks && !m.totalFocus) {
            monthInsight = 'Fresh month, fresh canvas — one focused session can define your tone.';
        } else if (completionRate >= 70) {
            monthInsight = `Beautiful consistency. ${completionRate}% of days were active, and your monthly rhythm is very stable.`;
        } else if (completionRate >= 45) {
            monthInsight = `Strong base is forming. Push for 2-3 more active days to lock momentum.`;
        } else if (m.bestDay) {
            monthInsight = `Your best day was ${monthNames[m.month]} ${m.bestDay.day} (${m.bestDay.tasks} tasks, ${m.bestDay.focus}m focus). Recreate that setup.`;
        }

        document.getElementById('monthInsight').textContent = monthInsight;
    },

    renderScoreHero(w) {
        const score = this.getScore(w);
        const breakdown = this.getScoreBreakdown(w);

        document.getElementById('reportScoreValue').textContent = score;
        document.getElementById('reportScoreFill').style.width = `${score}%`;

        document.getElementById('scoreBreakdown').innerHTML = `
            <div class="score-breakdown-item">
                <div class="score-breakdown-value positive">+${breakdown.tasks}</div>
                <div class="score-breakdown-label">Tasks</div>
            </div>
            <div class="score-breakdown-item">
                <div class="score-breakdown-value positive">+${breakdown.focus}</div>
                <div class="score-breakdown-label">Focus</div>
            </div>
            <div class="score-breakdown-item">
                <div class="score-breakdown-value ${breakdown.overdue ? 'negative' : 'positive'}">${breakdown.overdue ? '-' + breakdown.overdue : '+0'}</div>
                <div class="score-breakdown-label">Overdue</div>
            </div>
        `;
    },

    renderStats(w) {
        document.getElementById('reportStats').innerHTML = `
            <div class="report-stat-card">
                <div class="report-stat-value">${w.totalTasks}</div>
                <div class="report-stat-label">Tasks</div>
            </div>
            <div class="report-stat-card">
                <div class="report-stat-value">${w.totalFocus}m</div>
                <div class="report-stat-label">Focus</div>
            </div>
            <div class="report-stat-card">
                <div class="report-stat-value">${w.activeDays}/7</div>
                <div class="report-stat-label">Active</div>
            </div>
        `;
    },

    renderHeatmap(w) {
        const best = Math.max(...w.days.map(d => d.tasks + Math.round(d.focus / 25)), 1);

        document.getElementById('heatmapGrid').innerHTML = w.days.map(d => {
            const total = d.tasks + Math.round(d.focus / 25);
            const active = total > 0;
            const isBest = total === best && total > 0;

            return `
            <div class="heatmap-day ${active ? 'active' : ''} ${isBest ? 'best' : ''}">
                <div class="heatmap-day-name">${d.name}</div>
                <div class="heatmap-day-value">${d.tasks}</div>
                <div class="heatmap-day-sub">${d.focus}m</div>
            </div>`;
        }).join('');
    },

    drawChart(containerId, values, labels) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const max = Math.max(...values, 1);
        const W = 400, H = 160;
        const pad = { t: 20, r: 16, b: 30, l: 36 };
        const chartW = W - pad.l - pad.r;
        const chartH = H - pad.t - pad.b;

        const css = getComputedStyle(document.documentElement);
        const ac = css.getPropertyValue('--ac').trim();
        const gridColor = css.getPropertyValue('--chart-grid').trim();
        const txtColor = css.getPropertyValue('--chart-text').trim();

        const uid = containerId + '_' + Date.now();

        const points = values.map((v, i) => ({
            x: pad.l + (i / (values.length - 1)) * chartW,
            y: pad.t + chartH - (v / max) * chartH,
            val: v
        }));

        const pathD = points.reduce((acc, p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`;
            const prev = points[i - 1];
            const cpx = (prev.x + p.x) / 2;
            return `${acc} C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
        }, '');

        const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.t + chartH} L ${points[0].x} ${pad.t + chartH} Z`;

        const gridLines = Array.from({ length: 5 }, (_, i) => {
            const y = pad.t + chartH * (1 - i / 4);
            const val = Math.round(max * i / 4);
            return `
                <line x1="${pad.l}" y1="${y}" x2="${W - pad.r}" y2="${y}" 
                      stroke="${gridColor}" stroke-width="1" stroke-dasharray="${i === 0 ? 'none' : '4,4'}"/>
                <text x="${pad.l - 8}" y="${y + 3}" text-anchor="end" 
                      fill="${txtColor}" font-size="9" font-family="Inter, sans-serif">${val}</text>
            `;
        }).join('');

        const dotsHTML = points.map((p, i) => `
            <g class="chart-point" style="animation-delay:${0.4 + i * 0.08}s">
                <circle cx="${p.x}" cy="${p.y}" r="12" fill="${ac}" opacity="0.08" class="chart-dot-glow"/>
                <circle cx="${p.x}" cy="${p.y}" r="${p.val > 0 ? 4.5 : 2.5}" 
                        fill="${p.val > 0 ? '#fff' : 'var(--bg4)'}" 
                        stroke="${p.val > 0 ? ac : 'var(--bd)'}" stroke-width="2.5"/>
                ${p.val > 0 ? `<text x="${p.x}" y="${p.y - 12}" text-anchor="middle" 
                      fill="var(--tx1)" font-size="9" font-weight="700" 
                      font-family="Inter, sans-serif">${p.val}</text>` : ''}
            </g>
        `).join('');

        const labelsHTML = points.map((p, i) => `
            <text x="${p.x}" y="${H - 6}" text-anchor="middle" 
                  fill="${txtColor}" font-size="9" font-weight="600" 
                  font-family="Inter, sans-serif" letter-spacing="0.03em">${labels[i]}</text>
        `).join('');

        container.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" class="line-chart-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="areaGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.3"/>
                        <stop offset="70%" stop-color="${ac}" stop-opacity="0.05"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0"/>
                    </linearGradient>
                    <filter id="lineGlow_${uid}">
                        <feGaussianBlur stdDeviation="4" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="lineGrad_${uid}" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.6"/>
                        <stop offset="50%" stop-color="${ac}"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0.6"/>
                    </linearGradient>
                </defs>
                ${gridLines}
                <path d="${areaD}" fill="url(#areaGrad_${uid})" class="chart-area-fill"/>
                <path d="${pathD}" fill="none" stroke="url(#lineGrad_${uid})" stroke-width="3" 
                      stroke-linecap="round" stroke-linejoin="round" 
                      filter="url(#lineGlow_${uid})" class="chart-line-path"/>
                ${dotsHTML}
                ${labelsHTML}
            </svg>
        `;
    },

    renderInsights(w) {
        const insights = [];
        const score = this.getScore(w);
        const breakdown = this.getScoreBreakdown(w);
        const prevW = Utils.weekData(State.weekOffset - 1);
        const prevScore = this.getScore(prevW);
        const scoreDiff = score - prevScore;

        if (!w.totalTasks && !w.totalFocus) {
            insights.push({
                icon: Icons.spark(12),
                text: `<strong>Blank canvas.</strong> This week is wide open. Start with one tiny task — momentum loves a small beginning.`
            });
        } else {
            if (scoreDiff > 15) {
                insights.push({
                    icon: Icons.trendUp(12),
                    text: `<strong>Major surge!</strong> Score jumped <strong>+${scoreDiff}</strong> vs last week. Something clicked — keep doing it.`
                });
            } else if (scoreDiff > 0) {
                insights.push({
                    icon: Icons.trendUp(12),
                    text: `<strong>Upward trend.</strong> Score is <strong>+${scoreDiff}</strong> higher than last week. Small gains compound.`
                });
            } else if (scoreDiff < -10) {
                insights.push({
                    icon: Icons.trendDown(12),
                    text: `<strong>Dip detected.</strong> Score dropped <strong>${scoreDiff}</strong> vs last week. No judgment — even a short reset flips the trajectory.`
                });
            }

            if (score >= 80) {
                insights.push({
                    icon: Icons.trophy(12),
                    text: `<strong>Elite week.</strong> Score of <strong>${score}</strong> — you balanced output, focus, and consistency beautifully.`
                });
            } else if (score >= 55) {
                insights.push({
                    icon: Icons.target(12),
                    text: `<strong>Solid foundation.</strong> At <strong>${score}</strong>. Two more focus blocks push this into elite territory.`
                });
            } else if (score > 0) {
                insights.push({
                    icon: Icons.spark(12),
                    text: `<strong>Building.</strong> Score of <strong>${score}</strong>. One or two deep sessions make this week feel much stronger.`
                });
            }

            if (w.bestDay.tasks > 0 || w.bestDay.focus > 0) {
                insights.push({
                    icon: Icons.fire(12),
                    text: `<strong>Peak: ${w.bestDay.name}</strong> — ${w.bestDay.tasks} task${w.bestDay.tasks !== 1 ? 's' : ''} and ${w.bestDay.focus}m focused. That's your power pattern.`
                });
            }

            if (w.activeDays >= 5) {
                insights.push({
                    icon: Icons.shield(12),
                    text: `<strong>${w.activeDays}/7 active days.</strong> Consistency beats intensity. You're proving it daily.`
                });
            } else if (w.activeDays >= 3) {
                insights.push({
                    icon: Icons.shield(12),
                    text: `<strong>${w.activeDays}/7 active days.</strong> One more active day this week boosts your rhythm significantly.`
                });
            }

            if (w.totalFocus > 0 && w.totalTasks > 0) {
                const ratio = w.totalFocus / w.totalTasks;
                if (ratio > 30) {
                    insights.push({ icon: Icons.target(12), text: `<strong>Deep work mode.</strong> High focus-per-task ratio — quality over quantity is a superpower.` });
                }
            }

            if (breakdown.overdue > 0) {
                const overdueCount = Math.ceil(breakdown.overdue / 2);
                insights.push({
                    icon: Icons.trendDown(12),
                    text: `<strong>${overdueCount} overdue.</strong> Clear, reschedule, or drop them. Overdue items create invisible mental drag.`
                });
            }
        }

        const tips = [
            'Done beats perfect. Ship it ugly, refine it later.',
            'If a task feels heavy, split it until each piece feels obvious.',
            'Protect one distraction-free block tomorrow morning.',
            'The hardest part is starting. After 2 minutes, momentum takes over.',
            'Energy management > time management. Work when you\'re sharpest.',
            'Rest is productive. Recovery fuels tomorrow\'s output.'
        ];

        insights.push({
            icon: Icons.spark(12),
            text: `<em>"${tips[Math.floor(Math.random() * tips.length)]}"</em>`
        });

        document.getElementById('aiInsightsContent').innerHTML = insights.map((ins, idx) => `
            <div class="ai-insight-item" style="animation-delay:${idx * 0.06}s">
                <div class="ai-insight-icon">${ins.icon}</div>
                <div class="ai-insight-text">${ins.text}</div>
            </div>
        `).join('');
    },

    downloadPDF() {
        Sound.click();
        Toast.show('Generating report...');

        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                const w = Utils.weekData(State.weekOffset);
                const dates = Utils.weekDates(State.weekOffset);
                const score = this.getScore(w);
                const breakdown = this.getScoreBreakdown(w);

                const pageW = 210;
                let y = 0;

                const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim();
                const toRGB = hex => {
                    hex = hex.replace('#', '');
                    return [
                        parseInt(hex.substring(0, 2), 16),
                        parseInt(hex.substring(2, 4), 16),
                        parseInt(hex.substring(4, 6), 16)
                    ];
                };
                const [r, g, b] = toRGB(ac);

                doc.setFillColor(r, g, b);
                doc.rect(0, 0, pageW, 50, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(26);
                doc.text('Focussium', 18, 22);

                doc.setFontSize(14);
                doc.text('Weekly Report', 18, 32);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                const range = `${new Date(dates[0] + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric' })} — ${new Date(dates[6] + 'T00:00:00').toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}`;
                doc.text(range, 18, 42);

                y = 62;
                doc.setTextColor(30, 30, 40);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(20);
                doc.text(`Score: ${score}/100`, 18, y);
                y += 12;

                doc.setDrawColor(r, g, b);
                doc.setFillColor(r, g, b);
                doc.roundedRect(18, y, score * 1.7, 6, 3, 3, 'F');
                doc.setDrawColor(220, 220, 225);
                doc.roundedRect(18, y, 170, 6, 3, 3, 'S');
                y += 18;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Summary', 18, y);
                y += 10;

                const summaryItems = [
                    { label: 'Tasks Completed', value: String(w.totalTasks), color: [r, g, b] },
                    { label: 'Focus Minutes', value: `${w.totalFocus}m`, color: [92, 201, 138] },
                    { label: 'Active Days', value: `${w.activeDays}/7`, color: [229, 184, 92] }
                ];

                let sx = 18;
                summaryItems.forEach(item => {
                    doc.setFillColor(248, 248, 252);
                    doc.roundedRect(sx, y, 56, 24, 4, 4, 'F');
                    doc.setFontSize(9);
                    doc.setTextColor(120, 120, 130);
                    doc.text(item.label, sx + 6, y + 8);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(16);
                    doc.setTextColor(item.color[0], item.color[1], item.color[2]);
                    doc.text(item.value, sx + 6, y + 19);
                    doc.setFont('helvetica', 'normal');
                    sx += 60;
                });
                y += 34;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(30, 30, 40);
                doc.text('Score Breakdown', 18, y);
                y += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const breakdownLines = [
                    `Tasks: +${breakdown.tasks}`,
                    `Focus: +${breakdown.focus}`,
                    `Consistency: +${breakdown.consistency}`,
                    `Completion: +${breakdown.completion}`,
                    `Streak Bonus: +${breakdown.streak}`,
                    `Overdue Penalty: -${breakdown.overdue}`
                ];
                breakdownLines.forEach(line => {
                    doc.text(line, 22, y);
                    y += 6;
                });
                y += 6;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('Daily Breakdown', 18, y);
                y += 8;

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                w.days.forEach(day => {
                    doc.text(`${day.name}: ${day.tasks} tasks • ${day.focus}m focus`, 22, y);
                    y += 6;
                });
                y += 8;

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('AI Insights', 18, y);
                y += 8;

                const insightsText = document.getElementById('aiInsightsContent').textContent
                    .replace(/\s+/g, ' ')
                    .trim();

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9.5);
                const wrapped = doc.splitTextToSize(insightsText, 170);
                doc.text(wrapped, 18, y);

                doc.setFontSize(8);
                doc.setTextColor(140, 140, 155);
                doc.text('Generated by Focussium', pageW / 2, 287, { align: 'center' });

                doc.save(`Focussium_Report_${dates[0]}.pdf`);
                Sound.success();
                Toast.show('Report downloaded');
            } catch (e) {
                console.error(e);
                Toast.show('PDF generation failed');
            }
        }, 300);
    }
};

/* ─────────────────────────────────────────────────────────
   SETTINGS
───────────────────────────────────────────────────────── */
const Settings = {
    open() {
        document.getElementById('settingsModal').classList.add('on');
        this.render();
        Sound.open();
    },

    render() {
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === State.data.settings.theme);
        });

        document.getElementById('soundToggle').classList.toggle('on', State.data.settings.sound);
        document.getElementById('focusDurValue').textContent = State.data.settings.focusDur;
        document.getElementById('breakDurValue').textContent = State.data.settings.breakDur;
        document.getElementById('longDurValue').textContent = State.data.settings.longDur;
        document.getElementById('sessionsValue').textContent = State.data.settings.sessions;

        document.getElementById('accentButtons').innerHTML = ACCENTS.map(a => `
            <div class="accent-btn ${State.data.settings.accent === a.id ? 'active' : ''}" 
                 style="background:${a.c}" 
                 onclick="Settings.setAccent('${a.id}')"
                 title="${a.n}"></div>
        `).join('');

        // Update custom color picker state
        const isCustom = State.data.settings.accent === 'custom';
        const swatch = document.getElementById('customColorSwatch');
        const hexInput = document.getElementById('customHexInput');
        const nativeInput = document.getElementById('customColorNative');
        const picker = document.getElementById('customColorPicker');
        
        if (isCustom && State.data.settings.customHex) {
            swatch.style.background = `#${State.data.settings.customHex}`;
            swatch.classList.add('has-color');
            hexInput.value = State.data.settings.customHex.toUpperCase();
            nativeInput.value = `#${State.data.settings.customHex}`;
            picker.classList.add('active');
        } else {
            swatch.style.background = '';
            swatch.classList.remove('has-color');
            hexInput.value = '';
            picker.classList.remove('active');
        }

    },

    setTheme(theme) {
        State.data.settings.theme = theme;
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
    },

    setAccent(accent) {
        State.data.settings.accent = accent;
        State.data.settings.customHex = '';
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
    },

    applyCustomColor() {
        let hex = document.getElementById('customHexInput').value.trim().replace('#', '');
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
            Toast.show('Enter a valid 6-digit hex code');
            document.getElementById('customHexInput').focus();
            return;
        }
        State.data.settings.accent = 'custom';
        State.data.settings.customHex = hex;
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
        Toast.show('Custom accent applied ✨');
    },

    updateCustomSwatch() {
        const input = document.getElementById('customHexInput');
        const swatch = document.getElementById('customColorSwatch');
        let hex = input.value.trim().replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            swatch.style.background = `#${hex}`;
            swatch.classList.add('has-color');
        } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
            const expanded = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            swatch.style.background = `#${expanded}`;
            swatch.classList.add('has-color');
        } else {
            swatch.style.background = '';
            swatch.classList.remove('has-color');
        }
    },

    toggleSound() {
        State.data.settings.sound = !State.data.settings.sound;
        Storage.save();
        this.render();
        Sound.toggle();
    },

    adjust(key, delta) {
        const limits = {
            focusDur: [5, 120],
            breakDur: [1, 30],
            longDur: [5, 60],
            sessions: [1, 10]
        };

        const [min, max] = limits[key];
        State.data.settings[key] = Math.max(min, Math.min(max, State.data.settings[key] + delta));

        Storage.save();
        this.render();

        if (!State.pomo.running) Pomo.init();
        Sound.click();
    },

    clearData() {
        if (!confirm('Delete all data? This cannot be undone.')) return;

        State.data = Utils.clone(State.defaults);
        State.data.onboarded = true;
        Storage.save();

        document.getElementById('settingsModal').classList.remove('on');
        Home.render();
        Tasks.render();
        Dump.render();
        Pomo.init();
        Report.render();

        Toast.show('All data cleared');
    }
};

/* Custom color picker event listeners */
document.getElementById('customHexInput').addEventListener('input', () => {
    Settings.updateCustomSwatch();
});

document.getElementById('customHexInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') Settings.applyCustomColor();
});

document.getElementById('customColorNative').addEventListener('input', e => {
    const hex = e.target.value.replace('#', '');
    document.getElementById('customHexInput').value = hex.toUpperCase();
    Settings.updateCustomSwatch();
});

document.getElementById('customColorNative').addEventListener('change', e => {
    const hex = e.target.value.replace('#', '');
    document.getElementById('customHexInput').value = hex.toUpperCase();
    Settings.updateCustomSwatch();
    Settings.applyCustomColor();
});

/* ─────────────────────────────────────────────────────────
   MODALS
───────────────────────────────────────────────────────── */
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('on');
            Sound.close();
        }
    });
});

/* ─────────────────────────────────────────────────────────
   COMMAND GLASS (QUICK ADD)
───────────────────────────────────────────────────────── */
const CommandGlass = {
    open() {
        const glass = document.getElementById('cmdGlass');
        const input = document.getElementById('cmdInput');
        
        glass.classList.add('show');
        document.getElementById('cmdIcon').innerHTML = Icons.zap(12) || Icons.spark(12);
        
        // Slight delay to ensure display: flex is applied before focusing
        setTimeout(() => input.focus(), 50);
        Sound.click();
    },

    close() {
        const glass = document.getElementById('cmdGlass');
        glass.classList.remove('show');
        document.getElementById('cmdInput').value = '';
        Sound.close();
    },

    submit() {
        const input = document.getElementById('cmdInput');
        const text = input.value.trim();
        
        if (!text) return;

        // Simple heuristic: if it starts with "dump ", send to brain dump. Else, add as task.
        if (text.toLowerCase().startsWith('dump ')) {
            const dumpText = text.substring(5).trim();
            if (dumpText) {
                State.data.dumps.unshift({
                    id: Utils.id(),
                    text: dumpText,
                    ts: Date.now()
                });
                Storage.save();
                Dump.render(); // update if open
                Toast.show("Brain dump saved");
            }
        } else {
            // Send to Tasks today
            State.data.tasks.push({
                id: Utils.id(),
                text: text,
                date: Utils.today(),
                listId: null,
                completed: false,
                subtasks: []
            });
            Storage.save();
            Tasks.render();
            Home.render();
            Toast.show("Task added to Today");
        }

        this.close();
        Sound.click();
    }
};

/* ─────────────────────────────────────────────────────────
   KEYBOARD SHORTCUTS
───────────────────────────────────────────────────────── */
document.getElementById('taskTitleInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') Tasks.submitTask();
});

document.getElementById('subtaskInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') Tasks.addTempSubtask();
});

document.getElementById('newListInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') Tasks.createList();
});

document.getElementById('dumpTextarea').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        Dump.add();
    }
});

document.addEventListener('keydown', e => {
    // Command Glass Toggle (Ctrl+K or Cmd+K)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const glass = document.getElementById('cmdGlass');
        if (glass.classList.contains('show')) {
            CommandGlass.close();
        } else {
            CommandGlass.open();
        }
    }

    // Escape Command Glass
    if (e.key === 'Escape') {
        const glass = document.getElementById('cmdGlass');
        if (glass.classList.contains('show')) {
            CommandGlass.close();
        }
    }
});

document.getElementById('cmdInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        CommandGlass.submit();
    }
});

/* ─────────────────────────────────────────────────────────
   APP INIT
───────────────────────────────────────────────────────── */
const App = {
    init() {
        if (!State.data) {
            State.data = Storage.load();
        }

        Theme.apply();
        Clock.update();

        if (State.clockInterval) clearInterval(State.clockInterval);
        State.clockInterval = setInterval(() => Clock.update(), 10000);

        Pomo.init();
        Home.render();
        Tasks.render();
        Dump.render();
        Report.render();
        Settings.render();
        Level.update();

        document.getElementById('taskDateInput').value = Utils.today();
        document.getElementById('userEmailDisplay').textContent = State.user?.email || '—';
    }
};

/* ─────────────────────────────────────────────────────────
   BOOT
───────────────────────────────────────────────────────── */
window.addEventListener('load', () => {
    injectIcons();
    Auth.init();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered', reg))
            .catch(err => console.log('SW failed', err));
    }
});
