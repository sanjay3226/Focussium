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
        achievements: [],
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

const ACHIEVEMENTS = [
    { id: 'first_task', name: 'First Step', desc: 'Complete your first task', icon: 'star', check: d => d.totalTasksCompleted >= 1 },
    { id: 'task_10', name: 'Getting Started', desc: 'Complete 10 tasks', icon: 'zap', check: d => d.totalTasksCompleted >= 10 },
    { id: 'task_50', name: 'Productive Mind', desc: 'Complete 50 tasks', icon: 'fire', check: d => d.totalTasksCompleted >= 50 },
    { id: 'task_100', name: 'Task Master', desc: 'Complete 100 tasks', icon: 'trophy', check: d => d.totalTasksCompleted >= 100 },
    { id: 'focus_60', name: 'Deep Work', desc: 'Focus for 60 minutes total', icon: 'target', check: d => d.totalFocusMinutes >= 60 },
    { id: 'focus_300', name: 'Flow State', desc: 'Focus for 5 hours total', icon: 'spark', check: d => d.totalFocusMinutes >= 300 },
    { id: 'streak_3', name: 'Consistency', desc: 'Maintain a 3-day streak', icon: 'shield', check: d => d.streak >= 3 },
    { id: 'streak_7', name: 'Week Warrior', desc: 'Maintain a 7-day streak', icon: 'crown', check: d => d.streak >= 7 },
    { id: 'streak_30', name: 'Unstoppable', desc: 'Maintain a 30-day streak', icon: 'trophy', check: d => d.streak >= 30 }
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
    apply() {
        let theme = State.data.settings.theme;
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-accent', State.data.settings.accent);
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
            Achievements.check();
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
   ACHIEVEMENTS
───────────────────────────────────────────────────────── */
const Achievements = {
    check() {
        let newAchievement = false;

        ACHIEVEMENTS.forEach(ach => {
            if (!State.data.achievements.includes(ach.id) && ach.check(State.data)) {
                State.data.achievements.push(ach.id);
                newAchievement = true;
                Toast.show(`🏆 Achievement: ${ach.name}`);
                Sound.achievement();
            }
        });

        if (newAchievement) {
            Storage.save();
        }
    },

    renderPreview() {
        const unlocked = State.data.achievements.length;
        const total = ACHIEVEMENTS.length;
        const recent = ACHIEVEMENTS.filter(a => State.data.achievements.includes(a.id)).slice(-3);

        if (unlocked === 0) {
            return `
            <div class="achievements-preview-card">
                <div class="achievements-preview-icon">${Icons.trophy(24)}</div>
                <div class="achievements-preview-text">
                    <div class="achievements-preview-title">Start earning achievements</div>
                    <div class="achievements-preview-sub">Complete tasks and focus sessions to unlock badges</div>
                </div>
            </div>`;
        }

        return `
        <div class="achievements-preview-card">
            <div class="achievements-preview-header">
                <span>${Icons.trophy(16)} ${unlocked}/${total} Achievements</span>
            </div>
            <div class="achievements-preview-badges">
                ${recent.map(a => `
                    <div class="achievement-badge" title="${a.name}">
                        ${Icons[a.icon] ? Icons[a.icon](16) : Icons.star(16)}
                    </div>
                `).join('')}
            </div>
        </div>`;
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
            Achievements.check();
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
        this.renderAchievements();
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
        const score = Report.getScore(w);

        document.getElementById('homeWeekScore').textContent = score;

        const max = Math.max(...w.days.map(d => d.tasks + Math.round(d.focus / 25)), 1);
        document.getElementById('weekMiniBars').innerHTML = w.days.map((d, i) => {
            const total = d.tasks + Math.round(d.focus / 25);
            const h = Math.max(6, (total / max) * 48);
            return `
            <div class="week-mini-bar-col">
                <div class="week-mini-bar" style="height:${h}px;animation-delay:${i * 0.05}s"></div>
                <div class="week-mini-bar-label">${d.name}</div>
            </div>`;
        }).join('');

        let insight = 'Start your week strong.';
        if (score >= 80) insight = 'You are in a beautiful flow state this week.';
        else if (score >= 60) insight = 'Strong rhythm. Your consistency is paying off.';
        else if (score >= 35) insight = 'Momentum is building. Keep showing up gently.';
        else if (score > 0) insight = 'One focused session can change the feel of the day.';

        document.getElementById('weekInsight').textContent = insight;
    },

    renderAchievements() {
        document.getElementById('achievementsPreview').innerHTML = Achievements.renderPreview();
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
   POMODORO
───────────────────────────────────────────────────────── */
const Pomo = {
    init() {
        State.pomo.left = State.data.settings.focusDur * 60;
        State.pomo.total = State.pomo.left;
        State.pomo.mode = 'focus';
        this.updateDisplay();
        this.renderDots();
        this.updatePlayButton(false);
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

            State.pomo.interval = setInterval(() => {
                State.pomo.left--;
                this.updateDisplay();

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
            Achievements.check();
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
        this.renderInsights(w);
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

    drawChart(canvasId, values, labels) {
        const canvas = document.getElementById(canvasId);
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        if (!rect.width || !rect.height) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const W = rect.width;
        const H = rect.height;
        const pad = { t: 10, r: 8, b: 26, l: 30 };
        const chartW = W - pad.l - pad.r;
        const chartH = H - pad.t - pad.b;
        const max = Math.max(...values, 1);
        const step = chartW / values.length;
        const barW = step * 0.5;

        const css = getComputedStyle(document.documentElement);
        const grid = css.getPropertyValue('--chart-grid').trim();
        const txt = css.getPropertyValue('--chart-text').trim();
        const ac = css.getPropertyValue('--ac').trim();

        ctx.clearRect(0, 0, W, H);

        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + chartH * (1 - i / 4);
            ctx.beginPath();
            ctx.moveTo(pad.l, y);
            ctx.lineTo(W - pad.r, y);
            ctx.stroke();
        }

        ctx.fillStyle = txt;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = pad.t + chartH * (1 - i / 4);
            ctx.fillText(Math.round(max * i / 4), pad.l - 6, y + 3);
        }

        const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + chartH);
        grad.addColorStop(0, ac);
        grad.addColorStop(1, ac + '40');

        values.forEach((v, i) => {
            const x = pad.l + step * i + (step - barW) / 2;
            const h = (v / max) * chartH;
            const y = pad.t + chartH - h;

            ctx.fillStyle = grad;
            const r = 4;
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + barW - r, y);
            ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
            ctx.lineTo(x + barW, pad.t + chartH);
            ctx.lineTo(x, pad.t + chartH);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.fill();

            if (v > 0) {
                ctx.fillStyle = css.getPropertyValue('--tx1').trim();
                ctx.font = 'bold 9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(v, x + barW / 2, y - 5);
            }

            ctx.fillStyle = txt;
            ctx.font = '9px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW / 2, H - 6);
        });
    },

    renderInsights(w) {
        const insights = [];
        const score = this.getScore(w);
        const breakdown = this.getScoreBreakdown(w);

        if (!w.totalTasks && !w.totalFocus) {
            insights.push({
                icon: Icons.spark(12),
                text: `<strong>No activity yet.</strong> Start with one small task or one 10-minute focus session. Momentum loves a tiny beginning.`
            });
        } else {
            if (score >= 80) {
                insights.push({
                    icon: Icons.trendUp(12),
                    text: `<strong>Excellent week.</strong> Your score hit <strong>${score}</strong> — you balanced output, focus, and consistency beautifully.`
                });
            } else if (score >= 55) {
                insights.push({
                    icon: Icons.target(12),
                    text: `<strong>Solid momentum.</strong> A few more protected focus blocks could push this week into elite territory.`
                });
            } else {
                insights.push({
                    icon: Icons.spark(12),
                    text: `<strong>Building momentum.</strong> This week needs one or two protected focus sessions to feel much better.`
                });
            }

            if (w.bestDay.tasks > 0 || w.bestDay.focus > 0) {
                insights.push({
                    icon: Icons.fire(12),
                    text: `<strong>Best day:</strong> <strong>${w.bestDay.name}</strong> with <strong>${w.bestDay.tasks}</strong> tasks and <strong>${w.bestDay.focus}m</strong> focus.`
                });
            }

            if (w.activeDays >= 5) {
                insights.push({
                    icon: Icons.shield(12),
                    text: `<strong>Strong consistency.</strong> Active on <strong>${w.activeDays}/7</strong> days — that matters more than one perfect day.`
                });
            }

            if (breakdown.overdue > 0) {
                insights.push({
                    icon: Icons.trendDown(12),
                    text: `<strong>Overdue drag.</strong> Clear or reschedule overdue tasks to reduce mental friction.`
                });
            }
        }

        const tips = [
            'Done beats perfect. Finish ugly, refine later.',
            'If a task feels heavy, shrink it until it feels obvious.',
            'Protect one distraction-free block tomorrow.',
            'Turn heavy tasks into tiny next steps.',
            'Celebrate progress, not just outcomes.'
        ];

        insights.push({
            icon: Icons.spark(12),
            text: `<em>${tips[Math.floor(Math.random() * tips.length)]}</em>`
        });

        document.getElementById('aiInsightsContent').innerHTML = insights.map(i => `
            <div class="ai-insight-item">
                <div class="ai-insight-icon">${i.icon}</div>
                <div class="ai-insight-text">${i.text}</div>
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
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
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
