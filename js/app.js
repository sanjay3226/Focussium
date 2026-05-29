/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v2 PRO — MAIN APPLICATION (ENHANCED)
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   CONFIGURATION & GAME RANKS
   ───────────────────────────────────────────────────────── */
const CONFIG = {
    CLOCK_INTERVAL: 1000,
    SAVE_DEBOUNCE: 1200,
    TOAST_DURATION: 2600,
    UNDO_DURATION: 4000,
    TASK_ANIMATION_STAGGER: 0.04,
    XP_PER_FOCUS_MINUTE: 10,
    XP_PER_TASK: 50,
    RANKS: {
        1: { title: "Novice Flow 🧘", unlock: "Start your zen focus." },
        2: { title: "Habit Builder 🏗️", unlock: "Cyber Neon & Aura Sunset accents!" },
        3: { title: "Focus Disciple 📿", unlock: "Vibrant Retro Synth sound palette!" },
        4: { title: "Productivity Elite ⚡", unlock: "4 Animated VIP Avatars in settings!" },
        5: { title: "Zen Master 🪷", unlock: "Custom Color Swatch hex input!" },
        6: { title: "Time Whisperer ⏳", unlock: "Mystic Nebula accent theme!" },
        7: { title: "Deep Explorer 🌌", unlock: "Golden Celestial Aura decoration!" },
        8: { title: "Zen Deity 👑", unlock: "Infinite Golden Aura & Elite Status!" }
    }
};

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
        level: 1,
        settings: {
            theme: 'dark',
            accent: 'royal',
            customHex: '',
            sound: true,
            soundPalette: 'zen',
            avatar: 'default',
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
    monthOffset: 0,
    selectedReportDate: null,
    selectedRepeat: 'none',
    tempSubtasks: [],
    onboardStep: 0,
    editingTaskId: null,
    saveTimeout: null,
    clockInterval: null,
    reportMode: 'week',

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
    async loadDailyQuote() {
        const textEl = document.getElementById('dailyQuoteText');
        const authEl = document.getElementById('dailyQuoteAuthor');
        const sparkEl = document.getElementById('quoteSparkleIcon');
        const bannerEl = document.getElementById('dailyQuoteCard');
        if (!textEl || !authEl) return;

        if (sparkEl) sparkEl.innerHTML = Icons.spark(16);
        if (bannerEl) bannerEl.style.display = 'flex';

        // Offline Fallback
        const fallbackQuotes = [
            { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
            { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
            { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack" },
            { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
            { text: "Do not seek to follow in the footsteps of the wise. Seek what they sought.", author: "Basho" },
            { text: "Quiet the mind and the soul will speak.", author: "Ma Jaya Sati Bhagavati" },
            { text: "Flow is the state of being completely involved in an activity for its own sake.", author: "Mihaly Csikszentmihalyi" },
            { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
            { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
            { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" }
        ];

        const setQuote = (q) => {
            textEl.innerHTML = `"${q.text}"`;
            authEl.textContent = `— ${q.author || 'Unknown'}`;
        };

        try {
            // Check cache
            let cached = localStorage.getItem('focussium_quotes_cache');
            let quotes = null;
            if (cached) {
                try {
                    quotes = JSON.parse(cached);
                } catch(e) {}
            }

            if (!quotes || !quotes.length) {
                // Fetch from dummyjson first
                const res = await fetch('https://dummyjson.com/quotes?limit=150');
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.quotes && data.quotes.length) {
                        quotes = data.quotes.map(q => ({ text: q.quote, author: q.author }));
                    }
                }
                
                // Fallback to type.fit if dummyjson fails
                if (!quotes) {
                    const res2 = await fetch('https://type.fit/api/quotes');
                    if (res2.ok) {
                        const data2 = await res2.json();
                        if (data2 && data2.length) {
                            quotes = data2.map(q => ({ text: q.text, author: q.author }));
                        }
                    }
                }

                if (quotes && quotes.length) {
                    localStorage.setItem('focussium_quotes_cache', JSON.stringify(quotes));
                }
            }

            if (quotes && quotes.length) {
                const dayIndex = Math.floor(Date.now() / 86400000) % quotes.length;
                setQuote(quotes[dayIndex]);
            } else {
                const dayIndex = Math.floor(Date.now() / 86400000) % fallbackQuotes.length;
                setQuote(fallbackQuotes[dayIndex]);
            }
        } catch (e) {
            console.error('Error fetching quotes:', e);
            const dayIndex = Math.floor(Date.now() / 86400000) % fallbackQuotes.length;
            setQuote(fallbackQuotes[dayIndex]);
        }
    },

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

    /** Returns a priority weight for sorting (lower = higher priority) */
    priorityWeight(p) {
        const weights = { high: 0, medium: 1, low: 2, none: 3 };
        return weights[p] ?? 3;
    },

    /** Sort tasks: overdue first, then respect manual drag and drop order */
    sortTasks(tasks) {
        const today = this.today();
        return [...tasks].sort((a, b) => {
            const aOverdue = a.date && a.date < today && !a.completed ? 1 : 0;
            const bOverdue = b.date && b.date < today && !b.completed ? 1 : 0;
            if (bOverdue !== aOverdue) return bOverdue - aOverdue;
            
            // Respect manual reordering by comparing index in State.data.tasks
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
   ERROR HANDLER
───────────────────────────────────────────────────────── */
function handleError(context, error) {
    console.warn(`[Focussium] ${context}:`, error);
}

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
            } catch (e) {
                handleError('Failed to parse local data', e);
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
        } catch (e) {
            handleError('Firestore save failed', e);
            indicator.className = 'sync-indicator error';
        }
    },

    save() {
        this.saveLocal();
        clearTimeout(State.saveTimeout);
        State.saveTimeout = setTimeout(() => this.saveRemote(), CONFIG.SAVE_DEBOUNCE);
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
   TOAST (with Undo support)
───────────────────────────────────────────────────────── */
const Toast = {
    timeout: null,
    undoTimeout: null,

    show(msg) {
        const el = document.getElementById('toast');
        el.innerHTML = msg;
        el.classList.remove('has-undo');
        el.classList.add('show');
        clearTimeout(this.timeout);
        clearTimeout(this.undoTimeout);
        this.timeout = setTimeout(() => el.classList.remove('show'), CONFIG.TOAST_DURATION);
    },

    showUndo(msg, undoFn) {
        const el = document.getElementById('toast');
        el.innerHTML = `<span>${msg}</span><button class="toast-undo-btn" id="toastUndoBtn">Undo</button>`;
        el.classList.add('show', 'has-undo');
        clearTimeout(this.timeout);
        clearTimeout(this.undoTimeout);

        const btn = document.getElementById('toastUndoBtn');
        btn.onclick = () => {
            clearTimeout(this.undoTimeout);
            el.classList.remove('show', 'has-undo');
            undoFn();
        };

        this.undoTimeout = setTimeout(() => {
            el.classList.remove('show', 'has-undo');
        }, CONFIG.UNDO_DURATION);
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
        } catch (e) {
            handleError('Sign out failed', e);
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
                } catch (e) {
                    handleError('Firestore load failed, using local', e);
                    State.data = Storage.load();
                }

                // Avatar with premium fallback/VIP display
                Settings.applyAvatarDisplay();

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

    /** Starts the clock with 1-second updates for accuracy */
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

/* ─────────────────────────────────────────────────────────
   LEVELING, CONFETTI & DEITY GLOW ENGINE
   ───────────────────────────────────────────────────────── */
const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
        this.canvas = document.getElementById('celebrationCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        window.addEventListener('resize', () => this.resize());
        this.resize();
    },

    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    },

    start() {
        this.init();
        if (!this.canvas) return;
        this.particles = [];
        const colors = [
            getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#f5c842',
            getComputedStyle(document.documentElement).getPropertyValue('--acl').trim() || '#ffdd6b',
            '#ff5757', '#3dd9b8', '#9d6eff', '#00e5ff'
        ];

        for (let i = 0; i < 150; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                r: Math.random() * 5 + 4,
                d: Math.random() * this.canvas.height,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.random() * 10 - 5,
                tiltAngleIncremental: Math.random() * 0.07 + 0.02,
                tiltAngle: 0,
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1
            });
        }

        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.draw();
    },

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let active = false;

        this.particles.forEach((p, idx) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speedY;
            p.x += p.speedX + Math.sin(p.tiltAngle) * 0.5;
            p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

            if (p.y < this.canvas.height + p.r * 2) {
                active = true;
            }

            this.ctx.beginPath();
            this.ctx.lineWidth = p.r;
            this.ctx.strokeStyle = p.color;
            this.ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            this.ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            this.ctx.stroke();
        });

        if (active) {
            this.animationId = requestAnimationFrame(() => this.draw());
        } else {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
};

const Level = {
    getXP() {
        const totalFocus = State.data.totalFocusMinutes || 0;
        const totalTasks = State.data.totalTasksCompleted || 0;
        return (totalFocus * CONFIG.XP_PER_FOCUS_MINUTE) + (totalTasks * CONFIG.XP_PER_TASK);
    },

    getCurrentLevel() {
        const xp = this.getXP();
        return Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1;
    },

    update() {
        const xp = this.getXP();
        const level = this.getCurrentLevel();

        const xpForCurrentLevel = 100 * Math.pow(level - 1, 2);
        const xpForNextLevel = 100 * Math.pow(level, 2);
        const xpInCurrentLevel = xp - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
        const progressPercent = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

        // Sync level and trigger celebration if level increased
        if (State.data.level === undefined) {
            State.data.level = level;
        } else if (level > State.data.level && State.data.onboarded) {
            this.celebrate(level);
            State.data.level = level;
            Storage.save();
        } else if (level < State.data.level) {
            State.data.level = level;
            Storage.save();
        }

        const badge = document.getElementById('userLevelBadge');
        if (badge) badge.textContent = level;

        const wrapper = document.querySelector('.avatar-wrapper');
        if (wrapper) {
            wrapper.classList.toggle('level-8-plus', level >= 8);
        }

        const barContainer = document.querySelector('.xp-bar-container');
        if (barContainer) {
            barContainer.title = `Level ${level} | ${xp} XP | ${Math.ceil(xpNeededForNext - xpInCurrentLevel)} XP to Level ${level + 1}`;
        }

        const bar = document.getElementById('xpBarFill');
        if (bar) bar.style.width = `${progressPercent}%`;

        // Proactively update Settings display ifSettings is defined
        if (window.Settings && typeof Settings.render === 'function') {
            Settings.renderAccents();
            Settings.renderAvatars();
            Settings.renderSoundPalette();
        }
    },

    celebrate(newLvl) {
        Sound.levelUp();
        Confetti.start();

        const rank = CONFIG.RANKS[newLvl] || { title: "Focused Creator 💫", unlock: "New customization rewards!" };

        const modal = document.getElementById('levelUpModal');
        const badgeVal = document.getElementById('levelUpBadgeVal');
        const titleText = document.getElementById('levelUpTitleText');
        const subText = document.getElementById('levelUpSubText');
        const unlockText = document.getElementById('levelUpUnlockText');

        if (badgeVal) badgeVal.textContent = newLvl;
        if (titleText) titleText.textContent = rank.title;
        if (subText) subText.textContent = `You reached Level ${newLvl}!`;
        if (unlockText) unlockText.textContent = rank.unlock;

        if (modal) modal.classList.add('on');
    },

    claimVibe() {
        const modal = document.getElementById('levelUpModal');
        if (modal) modal.classList.remove('on');
        Sound.click();
    }
};

/* ─────────────────────────────────────────────────────────
   NAVIGATION (with badge support)
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

        this.updateBadges();
    },

    /** Updates nav item badges with pending counts */
    updateBadges() {
        const pendingTasks = Tasks.getVisibleToday().filter(t => !t.completed).length;
        const pendingDumps = State.data.dumps.length;

        this._setBadge('navIconTasks', pendingTasks);
        this._setBadge('navIconDump', pendingDumps);
    },

    _setBadge(parentId, count) {
        const parent = document.getElementById(parentId)?.closest('.nav-item');
        if (!parent) return;
        let badge = parent.querySelector('.nav-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'nav-badge';
                parent.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else if (badge) {
            badge.remove();
        }
    }
};

/* ─────────────────────────────────────────────────────────
   LEVELING
───────────────────────────────────────────────────────── */


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
        let subtasksProgressHTML = '';
        if (task.subtasks?.length) {
            const doneCount = task.subtasks.filter(s => s.done).length;
            const percent = Math.round((doneCount / task.subtasks.length) * 100);
            
            subtasksProgressHTML = `
            <div class="task-steps-progress" title="${doneCount}/${task.subtasks.length} steps completed">
                <div class="task-steps-progress-bar">
                    <div class="task-steps-progress-fill" style="width: ${percent}%"></div>
                </div>
                <span class="task-steps-progress-text">${doneCount}/${task.subtasks.length} steps</span>
            </div>`;

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
        const hasDetails = task.notes || task.subtasks?.length;
        const expandChevronHTML = hasDetails ? `<span class="task-expand-chevron">${Icons.chevronDown(10)}</span>` : '';

        return `
        <div class="task-item ${priorityClass} ${task.completed ? 'completed' : ''}" 
             data-id="${task.id}" 
             draggable="true" 
             ondragstart="Tasks.dragStart(event, '${task.id}')"
             ondragover="Tasks.dragOver(event)"
             ondragleave="Tasks.dragLeave(event)"
             ondrop="Tasks.dragDrop(event, '${task.id}')"
             ondragend="Tasks.dragEnd(event)"
             style="animation-delay:${index * CONFIG.TASK_ANIMATION_STAGGER}s">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="Tasks.toggle('${task.id}')">
                ${Icons.check(12)}
            </div>
            <div class="task-content" onclick="Tasks.toggleExpand(event, '${task.id}')">
                <div class="task-title-row" style="display:flex; align-items:center; justify-content:space-between; gap: 8px;">
                    <div class="task-title">${Utils.escape(task.text)}</div>
                    ${expandChevronHTML}
                </div>
                ${task.notes ? `<div class="task-notes">${Utils.escape(task.notes)}</div>` : ''}
                <div class="task-meta">${metaHTML}</div>
                ${subtasksProgressHTML}
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

    dragStart(e, id) {
        e.dataTransfer.setData('text/plain', id);
        e.currentTarget.classList.add('dragging');
        setTimeout(() => {
            const el = document.querySelector(`.task-item[data-id="${id}"]`);
            if (el) el.style.opacity = '0.3';
        }, 0);
    },

    dragOver(e) {
        e.preventDefault();
        const taskItem = e.currentTarget.closest('.task-item');
        if (taskItem && !taskItem.classList.contains('dragging')) {
            taskItem.classList.add('drag-over');
        }
    },

    dragLeave(e) {
        const taskItem = e.currentTarget.closest('.task-item');
        if (taskItem) {
            taskItem.classList.remove('drag-over');
        }
    },

    dragDrop(e, targetId) {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        if (id === targetId) return;

        const tasks = State.data.tasks;
        const dragIndex = tasks.findIndex(t => t.id === id);
        const targetIndex = tasks.findIndex(t => t.id === targetId);

        if (dragIndex !== -1 && targetIndex !== -1) {
            const [draggedTask] = tasks.splice(dragIndex, 1);
            tasks.splice(targetIndex, 0, draggedTask);
            Storage.save();
            Tasks.render();
            // Sync dashboard tasks too
            if (document.getElementById('homeTasksPreview')) {
                const todayTasks = Tasks.getVisibleToday();
                Home.renderTaskPreview(todayTasks);
            }
            Sound.click();
        }
    },

    dragEnd(e) {
        const dragging = document.querySelector('.task-item.dragging');
        if (dragging) {
            dragging.classList.remove('dragging');
            dragging.style.opacity = '';
        }
        document.querySelectorAll('.task-item.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    },

    toggleExpand(e, taskId) {
        if (e.target.closest('.task-checkbox') || e.target.closest('.subtask-checkbox') || e.target.closest('.task-actions') || e.target.closest('.task-action-btn')) {
            return;
        }

        const taskItem = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (!taskItem) return;

        const hasDetails = taskItem.querySelector('.task-notes') || taskItem.querySelector('.task-subtasks');
        if (hasDetails) {
            e.stopPropagation();
            taskItem.classList.toggle('expanded');
            Sound.click();
        } else {
            this.openEdit(taskId);
        }
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

        const activeFilter = State.data.settings?.taskFilter || 'all';
        const totalCount = filtered.length;
        const completedCount = filtered.filter(t => t.completed).length;
        const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

        const toolsBar = document.getElementById('taskToolsBar');
        if (toolsBar) {
            toolsBar.innerHTML = `
            <div class="task-progress-kpi">
                <span class="task-progress-kpi-text">${completedCount}/${totalCount} Done</span>
                <div class="task-progress-kpi-bar-container">
                    <div class="task-progress-kpi-bar-fill" style="width: ${pct}%"></div>
                </div>
                <span class="task-progress-kpi-pct">${pct}%</span>
            </div>
            <div class="task-filter-group">
                <button class="task-filter-btn ${activeFilter === 'all' ? 'active' : ''}" onclick="Tasks.setFilter('all')">All</button>
                <button class="task-filter-btn ${activeFilter === 'pending' ? 'active' : ''}" onclick="Tasks.setFilter('pending')">Pending</button>
                <button class="task-filter-btn ${activeFilter === 'high' ? 'active' : ''}" onclick="Tasks.setFilter('high')">High 🔥</button>
            </div>`;
        }

        let renderTasks = filtered;
        if (activeFilter === 'pending') {
            renderTasks = filtered.filter(t => !t.completed);
        } else if (activeFilter === 'high') {
            renderTasks = filtered.filter(t => t.priority === 'high');
        }

        const container = document.getElementById('tasksContainer');

        if (!renderTasks.length) {
            const hour = new Date().getHours();
            let emptyMsg = 'Nothing here yet.<br>Tap + to add something meaningful.';
            if (hour < 10) emptyMsg = 'Fresh morning, fresh start.<br>Tap + to set your intentions.';
            else if (hour < 14) emptyMsg = 'Afternoon\'s wide open.<br>Tap + to capture what matters.';
            else if (hour < 20) emptyMsg = 'Evening clarity.<br>Tap + to plan tomorrow.';
            else emptyMsg = 'Night owl mode.<br>Tap + to dump tomorrow\'s thoughts.';
            container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${Icons.tasks(56)}</div>
                <p>${emptyMsg}</p>
            </div>`;
            return;
        }

        const openTasks = Utils.sortTasks(renderTasks.filter(t => !t.completed));
        const doneTasks = renderTasks.filter(t => t.completed);

        let hintHTML = '';
        if (openTasks.length > 1) {
            hintHTML = `
            <div class="sorting-hint">
                ${Icons.info(11)} Drag tasks to reorder manually (Overdue items stay pinned on top).
            </div>`;
        }

        container.innerHTML = hintHTML + [...openTasks, ...doneTasks].map((t, i) => this.taskHTML(t, i)).join('');
    },

    setList(list) {
        State.data.currentList = list;
        Storage.save();
        this.render();
        Sound.click();
    },

    setFilter(filter) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.taskFilter = filter;
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
        Nav.updateBadges();
        Sound.success();
    },

    deleteFromModal() {
        if (State.editingTaskId) {
            this.remove(State.editingTaskId);
            document.getElementById('addTaskModal').classList.remove('on');
        }
    },

    /** Toggle task completion — correctly adjusts XP in both directions */
    toggle(id) {
        const task = State.data.tasks.find(t => t.id === id);
        if (!task) return;

        task.completed = !task.completed;
        task.completedAt = task.completed ? Date.now() : null;

        if (task.completed) {
            State.data.totalTasksCompleted = (State.data.totalTasksCompleted || 0) + 1;
        } else {
            // Decrement XP when un-completing a task
            State.data.totalTasksCompleted = Math.max(0, (State.data.totalTasksCompleted || 0) - 1);
        }
        Level.update();

        Storage.save();

        if (task.completed) {
            Sound.success();
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.classList.add('completing');
                const rect = el.getBoundingClientRect();
                if (window.Particles) {
                    Particles.spawnExplosion(rect.left + 24, rect.top + 24, 25);
                }
            }
            setTimeout(() => {
                this.render();
                Home.render();
                Nav.updateBadges();
                if (State.currentPage === 'report') Report.render();
            }, 350);
        } else {
            Sound.click();
            this.render();
            Home.render();
            Nav.updateBadges();
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

    /** Remove task with undo support */
    remove(id) {
        const removedTask = State.data.tasks.find(t => t.id === id);
        State.data.tasks = State.data.tasks.filter(t => t.id !== id);
        Storage.save();
        this.render();
        Home.render();
        Nav.updateBadges();
        if (State.currentPage === 'report') Report.render();
        Sound.delete();

        if (removedTask) {
            Toast.showUndo('Task removed', () => {
                State.data.tasks.unshift(removedTask);
                Storage.save();
                this.render();
                Home.render();
                Nav.updateBadges();
                Sound.success();
                Toast.show('Task restored');
            });
        } else {
            Toast.show('Task removed');
        }
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
        Nav.updateBadges();
        Sound.success();
        Toast.show('Thought captured');
    },

    render() {
        const container = document.getElementById('dumpsContainer');

        this.updateMoodUI();

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
            <div class="dump-card" style="animation-delay:${i * CONFIG.TASK_ANIMATION_STAGGER}s">
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

    updateMoodUI() {
        const icon = document.getElementById('moodLoggerIcon');
        if (icon) icon.innerHTML = Icons.spark(12);

        if (!State.data.moods) State.data.moods = [];
        const today = Utils.today();
        const todayMood = State.data.moods.find(m => m.date === today)?.mood || '';

        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.toggle('active', btn.classList.contains(todayMood));
        });
    },

    logMood(moodType) {
        if (!State.data.moods) State.data.moods = [];
        const today = Utils.today();
        const existingIndex = State.data.moods.findIndex(m => m.date === today);

        const moodEntry = {
            date: today,
            time: new Date().toLocaleTimeString(),
            mood: moodType
        };

        if (existingIndex !== -1) {
            State.data.moods[existingIndex] = moodEntry;
        } else {
            State.data.moods.push(moodEntry);
        }

        Storage.save();
        this.updateMoodUI();
        Sound.success();
        Toast.show(`Vibe logged: ${moodType.toUpperCase()}!`);
        
        // Render changes on vibe page too
        if (document.getElementById('reportCardDayDetail')) {
            Report.render();
        }
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
        Nav.updateBadges();
        Sound.success();
        Toast.show('Converted to task');
    },

    remove(id) {
        State.data.dumps = State.data.dumps.filter(d => d.id !== id);
        Storage.save();
        this.render();
        Nav.updateBadges();
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

        const trendEl = document.getElementById('homeWeekTrend');
        if (diff > 0) {
            trendEl.innerHTML = `<span class="trend-up">${Icons.trendUp(11)} +${diff}</span>`;
        } else if (diff < 0) {
            trendEl.innerHTML = `<span class="trend-down">${Icons.trendDown(11)} ${diff}</span>`;
        } else {
            trendEl.innerHTML = `<span class="trend-flat">— same</span>`;
        }

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
        const preview = Utils.sortTasks(todayTasks.filter(t => !t.completed)).slice(0, 4);
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
   POMODORO (with browser notifications)
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
        this.initAmbientUI();
    },

    initAmbientUI() {
        const icon = document.getElementById('ambientVolIcon');
        if (icon) icon.innerHTML = Icons.volume(12);

        if (!State.data.settings) State.data.settings = {};
        const sound = State.data.settings.ambientSound || 'none';
        const vol = State.data.settings.ambientVol !== undefined ? State.data.settings.ambientVol : 40;

        document.querySelectorAll('.ambient-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === sound);
        });

        const slider = document.getElementById('ambientVolumeSlider');
        if (slider) {
            slider.value = vol;
            slider.style.setProperty('--val', vol + '%');
        }
    },

    setAmbient(type) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.ambientSound = type;
        Storage.save();

        document.querySelectorAll('.ambient-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === type);
        });

        if (State.pomo.running) {
            const vol = State.data.settings.ambientVol !== undefined ? State.data.settings.ambientVol : 40;
            Sound.startAmbient(type, vol / 100);
        } else if (type === 'none') {
            Sound.stopAmbient();
        }
        Sound.click();
    },

    setAmbientVolume(val) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.ambientVol = parseInt(val);
        Storage.save();

        Sound.setAmbientVolume(parseInt(val) / 100);

        const slider = document.getElementById('ambientVolumeSlider');
        if (slider) {
            slider.style.setProperty('--val', val + '%');
        }
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

        el.classList.remove('show');
        
        setTimeout(() => {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.liveInsights.length);
            } while (nextIndex === this.currentInsightIndex && this.liveInsights.length > 1);
            
            this.currentInsightIndex = nextIndex;
            el.textContent = `"${this.liveInsights[this.currentInsightIndex]}"`;
            
            requestAnimationFrame(() => el.classList.add('show'));
        }, 600);
    },

    toggle() {
        if (State.pomo.running) {
            clearInterval(State.pomo.interval);
            State.pomo.running = false;
            this.updatePlayButton(false);
            this.updateRunningState(false);
            Sound.stopAmbient();
        } else {
            if (State.pomo.left <= 0) this.setMode(State.pomo.mode);

            State.pomo.running = true;
            this.updatePlayButton(true);
            this.updateRunningState(true);
            Sound.timerStart();

            // Auto start ambient noise
            const sound = State.data.settings?.ambientSound || 'none';
            const vol = State.data.settings?.ambientVol !== undefined ? State.data.settings.ambientVol : 40;
            Sound.startAmbient(sound, vol / 100);

            this.cycleInsight(true);

            State.pomo.interval = setInterval(() => {
                State.pomo.left--;
                this.updateDisplay();

                if (State.pomo.mode === 'focus' && State.pomo.left % 60 === 0 && State.pomo.left > 0) {
                    this.cycleInsight();
                }

                if (State.pomo.left <= 0) {
                    clearInterval(State.pomo.interval);
                    State.pomo.running = false;
                    this.updatePlayButton(false);
                    this.updateRunningState(false);
                    Sound.stopAmbient();
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
        
        const isZenMode = running && State.pomo.mode === 'focus';
        document.getElementById('app').classList.toggle('focus-zen', isZenMode);
    },

    reset() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        this.setMode(State.pomo.mode);
        Sound.stopAmbient();
        Sound.click();
    },

    skip() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        Sound.stopAmbient();
        this.done();
    },

    done() {
        Sound.timerDone();
        this.sendNotification();

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
        try { document.documentElement.requestFullscreen(); } catch (e) {}
        // Escape key exits fullscreen pomo
        if (!Pomo._escListener) {
            Pomo._escListener = (e) => { if (e.key === 'Escape') Pomo.exitFullscreen(); };
            document.addEventListener('keydown', Pomo._escListener);
        }
        Sound.click();
    },

    exitFullscreen() {
        document.getElementById('fullscreenPomo').classList.remove('on');
        try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
        if (Pomo._escListener) {
            document.removeEventListener('keydown', Pomo._escListener);
            Pomo._escListener = null;
        }
        Sound.click();
    },

    /** Request browser notification permission on first use */
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    /** Send browser notification when timer completes */
    sendNotification() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const labels = { focus: '🔥 Focus session complete!', break: '☕ Break is over!', long: '🌟 Long break done!' };
            const body = State.pomo.mode === 'focus'
                ? `Great work! You completed ${State.data.settings.focusDur} minutes of deep focus.`
                : 'Time to get back to work!';
            new Notification(labels[State.pomo.mode] || 'Timer done!', {
                body,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: 'focussium-pomo',
                silent: false
            });
        } catch (e) {
            handleError('Notification failed', e);
        }
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
    toggleCollapse(cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.classList.toggle('expanded');
            Sound.click();
        }
    },

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

    changeMonth(dir) {
        State.monthOffset += dir;
        if (State.monthOffset > 0) State.monthOffset = 0;
        this.render();
        Sound.click();
    },

    setMode(mode) {
        State.reportMode = mode;
        if (!State.selectedReportDate) {
            State.selectedReportDate = Utils.today();
        }
        this.render();
        Sound.click();
    },

    setChartTab(tab) {
        State.reportChartTab = tab;
        
        const btnTasks = document.getElementById('chartTabTasksBtn');
        const btnFocus = document.getElementById('chartTabFocusBtn');
        if (btnTasks && btnFocus) {
            btnTasks.classList.toggle('active', tab === 'tasks');
            btnFocus.classList.toggle('active', tab === 'focus');
        }

        const w = Utils.weekData(State.weekOffset);
        if (tab === 'tasks') {
            this.drawChart('analyticsChart', w.days.map(d => d.tasks), w.days.map(d => d.name), 'tasks');
        } else {
            this.drawChart('analyticsChart', w.days.map(d => d.focus), w.days.map(d => d.name), 'focus');
        }
        Sound.click();
    },

    render() {
        const w = Utils.weekData(State.weekOffset);
        const dates = Utils.weekDates(State.weekOffset);
        const m = this.getMonthData(State.monthOffset);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const start = new Date(dates[0] + 'T00:00:00');
        const end = new Date(dates[6] + 'T00:00:00');

        document.getElementById('weekNavLabel').textContent =
            State.weekOffset === 0
                ? 'This Week'
                : `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}`;

        document.getElementById('monthNavLabel').textContent =
            State.monthOffset === 0
                ? `${months[m.month]} ${m.year}`
                : `${months[m.month]} ${m.year}`;

        if (!State.selectedReportDate) {
            State.selectedReportDate = Utils.today();
        }

        if (!State.reportChartTab) {
            State.reportChartTab = 'tasks';
        }

        this.renderModePanel(w, m);
        this.applyModeVisibility();
        this.renderScoreHero(w);
        this.renderStats(w);
        this.renderHeatmap(w);
        
        this.setChartTab(State.reportChartTab);

        this.renderMonthOverview(m);
        this.renderDayDetails(w, m);
        this.renderInsights(w, m);

        const chevrons = ['reportHeatChevron', 'reportAnalyticsChevron', 'reportMonthChevron', 'reportDayChevron'];
        chevrons.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = Icons.chevronDown(12);
        });
    },

    applyModeVisibility() {
        const mode = State.reportMode || 'week';
        const reportPage = document.querySelector('.page[data-page="report"]');
        if (!reportPage) return;
        reportPage.setAttribute('data-report-mode', mode);

        document.querySelectorAll('.report-mode-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(mode === 'month' ? 'reportModeMonthBtn' : 'reportModeWeekBtn');
        if (activeBtn) activeBtn.classList.add('active');
    },

    renderModePanel(w, m) {
        const mode = State.reportMode || 'week';
        const monthDays = m.days.length || 1;
        const monthRhythm = Math.round((m.activeDays / monthDays) * 100);
        const weekRhythm = Math.round((w.activeDays / 7) * 100);
        const avgDailyFocus = Math.round(m.totalFocus / monthDays);
        const weekAvgFocus = Math.round(w.totalFocus / 7);
        const selected = this.getDateDigest(State.selectedReportDate, w, m);

        let insight = `Weekly mode: ${w.totalTasks} tasks done, ${w.totalFocus} focus minutes, ${weekRhythm}% rhythm. Tap a day to drill in.`;
        if (mode === 'month') {
            insight = `Monthly mode: ${m.totalTasks} tasks, ${m.totalFocus} focus minutes, ${monthRhythm}% rhythm across ${monthDays} days.`;
        }

        document.getElementById('reportModeInsight').textContent = insight;

        const chips = [
            { label: 'Weekly Score', value: `${this.getScore(w)}` },
            { label: 'Week Focus', value: `${w.totalFocus}m` },
            { label: 'Week Rhythm', value: `${weekRhythm}%` },
            { label: 'Week Avg / Day', value: `${weekAvgFocus}m` },
            { label: 'Month Tasks', value: `${m.totalTasks}` },
            { label: 'Month Focus', value: `${m.totalFocus}m` },
            { label: 'Month Rhythm', value: `${monthRhythm}%` },
            { label: 'Avg Focus / Day', value: `${avgDailyFocus}m` },
            { label: 'Selected Day', value: selected ? `${selected.tasks}T • ${selected.focus}m` : 'None' }
        ];

        const visible = mode === 'week'
            ? chips.slice(0, 5)
            : chips.slice(4);

        document.getElementById('reportModeMetrics').innerHTML = visible.map((chip, idx) => `
            <div class="report-mode-chip" style="animation-delay:${0.05 + idx * 0.05}s">
                <div class="report-mode-chip-label">${chip.label}</div>
                <div class="report-mode-chip-value">${chip.value}</div>
            </div>
        `).join('');
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
            const tasks = State.data.tasks.filter(t =>
                t.completed &&
                t.completedAt &&
                new Date(t.completedAt).toISOString().split('T')[0] === key
            ).length;
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

    renderMonthOverview(m) {
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
                <button class="month-day-cell level-${level} ${d.isToday ? 'today' : ''} ${State.selectedReportDate === d.key ? 'selected' : ''}" onclick="Report.selectDate('${d.key}')" title="${d.key}: ${d.tasks} tasks, ${d.focus} focus min">
                    <div class="month-day-num">${d.day}</div>
                    <div class="month-day-meta">${d.tasks} • ${d.focus}m</div>
                </button>
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

        const circle = document.getElementById('reportVibeGaugeCircle');
        if (circle) {
            const r = 60;
            const circ = 2 * Math.PI * r;
            circle.style.strokeDasharray = circ;
            circle.style.strokeDashoffset = circ * (1 - score / 100);
        }

        const titleEl = document.getElementById('reportVibeTitle');
        if (titleEl) {
            let vibe = "Resting Flow";
            if (score >= 90) vibe = "Transcendental Flow 👑";
            else if (score >= 75) vibe = "Elite Momentum ⚡";
            else if (score >= 55) vibe = "Active Rhythm 🔥";
            else if (score >= 35) vibe = "Rising Focus 📈";
            
            titleEl.textContent = vibe;
        }

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
            const selected = State.selectedReportDate === d.date;

            return `
            <button class="heatmap-day ${active ? 'active' : ''} ${isBest ? 'best' : ''} ${selected ? 'selected' : ''}" onclick="Report.selectDate('${d.date}')">
                <div class="heatmap-day-name">${d.name}</div>
                <div class="heatmap-day-value">${d.tasks}</div>
                <div class="heatmap-day-sub">${d.focus}m</div>
            </button>`;
        }).join('');
    },

    selectDate(dateKey) {
        State.selectedReportDate = dateKey;
        this.render();
        Sound.click();
    },

    getDateDigest(dateKey, w, m) {
        if (!dateKey) return null;
        const weekDay = w.days.find(d => d.date === dateKey);
        const monthDay = m.days.find(d => d.key === dateKey);
        return {
            key: dateKey,
            tasks: weekDay ? weekDay.tasks : (monthDay ? monthDay.tasks : 0),
            focus: weekDay ? weekDay.focus : (monthDay ? monthDay.focus : 0)
        };
    },

    renderDayDetails(w, m) {
        const selected = this.getDateDigest(State.selectedReportDate, w, m) || { key: Utils.today(), tasks: 0, focus: 0 };
        State.selectedReportDate = selected.key;

        const dateObj = new Date(`${selected.key}T00:00:00`);
        const label = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        document.getElementById('reportDayLabel').textContent = `Day Spotlight — ${label}`;

        const completedTasks = State.data.tasks.filter(t => 
            t.completed && t.completedAt && 
            new Date(t.completedAt).toISOString().split('T')[0] === selected.key
        ).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

        const openDue = State.data.tasks.filter(t => !t.completed && t.date === selected.key);

        const focusSessions = State.data.pomo.filter(p => p.date === selected.key);

        const todayMoodEntry = (State.data.moods || []).find(m => m.date === selected.key);
        let moodHTML = '';
        if (todayMoodEntry) {
            const moodMap = {
                calm: { label: 'Calm Zen', emoji: '🧘', color: '#2ec4b6' },
                high: { label: 'Sparked Energy', emoji: '⚡', color: '#ff9f1c' },
                flow: { label: 'Deep Flow State', emoji: '🌊', color: 'var(--ac)' },
                tired: { label: 'Restful Recovery', emoji: '💤', color: '#9d6eff' },
                clouded: { label: 'Clouded Mind', emoji: '☁️', color: '#8c9ab0' }
            };
            const mapping = moodMap[todayMoodEntry.mood] || { label: todayMoodEntry.mood, emoji: '✨', color: 'var(--ac)' };
            
            moodHTML = `
            <span class="day-meta-pill" style="border-color: ${mapping.color}">
                <span class="mood-indicator-dot ${todayMoodEntry.mood}"></span>
                ${mapping.emoji} ${mapping.label}
            </span>`;
        }

        document.getElementById('dayDetailMeta').innerHTML = `
            <span class="day-meta-pill"><span>${Icons.calendar(10)}</span>${selected.key}</span>
            <span class="day-meta-pill"><span>${Icons.check(10)}</span>${completedTasks.length} Completed</span>
            <span class="day-meta-pill"><span>${Icons.clock(10)}</span>${selected.focus}m Focus</span>
            <span class="day-meta-pill"><span>${Icons.tasks(10)}</span>${openDue.length} Pending</span>
            ${moodHTML}
        `;

        document.getElementById('dayDetailGrid').innerHTML = `
            <div class="day-detail-kpi">
                <div class="day-detail-kpi-label">Completed Tasks</div>
                <div class="day-detail-kpi-value">${completedTasks.length}</div>
            </div>
            <div class="day-detail-kpi">
                <div class="day-detail-kpi-label">Pending Due</div>
                <div class="day-detail-kpi-value">${openDue.length}</div>
            </div>
            <div class="day-detail-kpi">
                <div class="day-detail-kpi-label">Focus Sessions</div>
                <div class="day-detail-kpi-value">${focusSessions.length}</div>
            </div>
            <div class="day-detail-kpi">
                <div class="day-detail-kpi-label">Total Rhythm</div>
                <div class="day-detail-kpi-value">${completedTasks.length + focusSessions.length} Act.</div>
            </div>
        `;

        const timeline = [];

        completedTasks.forEach(t => {
            const timeStr = t.completedAt ? new Date(t.completedAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }) : 'All-Day';
            timeline.push({
                ts: t.completedAt || Date.now(),
                time: timeStr,
                title: t.text,
                tag: 'Task Complete ✓',
                tagClass: 'task'
            });
        });

        focusSessions.forEach(p => {
            const timeStr = p.ts ? new Date(p.ts).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' }) : 'Focus-Block';
            timeline.push({
                ts: p.ts || Date.now(),
                time: timeStr,
                title: `${p.dur}m Pomodoro block`,
                tag: 'Focus Done 🔥',
                tagClass: 'focus'
            });
        });

        openDue.forEach((t, i) => {
            timeline.push({
                ts: Date.now() + 100000 + i,
                time: t.time ? Utils.formatTime12(t.time) : 'Due Pending',
                title: t.text,
                tag: `Remaining Open (${t.priority || 'no'} rush)`,
                tagClass: 'pending'
            });
        });

        timeline.sort((a, b) => a.ts - b.ts);

        const container = document.getElementById('dayDetailList');
        if (!container) return;

        if (timeline.length === 0) {
            container.innerHTML = `<div class="day-detail-empty">No activity logs recorded for this day. 🧘</div>`;
            return;
        }

        container.innerHTML = `
            <div class="day-timeline-container">
                ${timeline.map((item, idx) => `
                    <div class="day-timeline-item" style="animation-delay: ${idx * 0.05}s">
                        <span class="day-timeline-time">${item.time}</span>
                        <div class="day-timeline-title">${Utils.escape(item.title)}</div>
                        <span class="day-timeline-tag ${item.tagClass}">${item.tag}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    drawChart(containerId, values, labels, metric = 'tasks') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const max = Math.max(...values, 1);
        const W = 400, H = 160;
        const pad = { t: 22, r: 16, b: 32, l: 36 };
        const chartW = W - pad.l - pad.r;
        const chartH = H - pad.t - pad.b;

        const css = getComputedStyle(document.documentElement);
        const ac = css.getPropertyValue('--ac').trim() || '#6c63ff';
        const gridColor = css.getPropertyValue('--chart-grid').trim() || 'rgba(255,255,255,0.06)';
        const txtColor = css.getPropertyValue('--chart-text').trim() || 'rgba(255,255,255,0.35)';
        const avg = Math.round(values.reduce((sum, v) => sum + v, 0) / (values.length || 1));
        const avgY = pad.t + chartH - (avg / max) * chartH;

        const uid = containerId + '_' + Date.now();

        const points = values.map((v, i) => ({
            x: pad.l + (i / Math.max(values.length - 1, 1)) * chartW,
            y: pad.t + chartH - (v / max) * chartH,
            val: v
        }));

        // Smooth cubic bezier path
        const pathD = points.reduce((acc, p, i) => {
            if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            const prev = points[i - 1];
            const tension = 0.4;
            const cpx1 = prev.x + (p.x - prev.x) * tension;
            const cpx2 = p.x - (p.x - prev.x) * tension;
            return `${acc} C ${cpx1.toFixed(1)} ${prev.y.toFixed(1)}, ${cpx2.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
        }, '');

        const baseline = pad.t + chartH;
        const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${baseline} L ${points[0].x.toFixed(1)} ${baseline} Z`;

        const bars = points.map((p, i) => {
            const h = Math.max((values[i] / max) * chartH, values[i] > 0 ? 3 : 0);
            const y = pad.t + chartH - h;
            return `<rect class="chart-bar" x="${(p.x - 7).toFixed(1)}" y="${y.toFixed(1)}" width="14" height="${h.toFixed(1)}" rx="6" style="animation-delay:${0.22 + i * 0.06}s"/>`;
        }).join('');

        const gridLines = Array.from({ length: 5 }, (_, i) => {
            const y = pad.t + chartH * (1 - i / 4);
            const val = Math.round(max * i / 4);
            return `
                <line x1="${pad.l}" y1="${y.toFixed(1)}" x2="${W - pad.r}" y2="${y.toFixed(1)}"
                      stroke="${gridColor}" stroke-width="${i === 0 ? 1 : 0.8}" stroke-dasharray="${i === 0 ? 'none' : '3,5'}"/>
                <text x="${pad.l - 6}" y="${(y + 3.5).toFixed(1)}" text-anchor="end"
                      fill="${txtColor}" font-size="8" font-family="Inter,sans-serif" font-weight="600">${val}</text>
            `;
        }).join('');

        const dotsHTML = points.map((p, i) => `
            <g class="chart-point" style="animation-delay:${0.45 + i * 0.08}s" role="img" aria-label="${labels[i]}: ${p.val}">
                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" fill="${ac}" opacity="0.06" class="chart-dot-glow"/>
                <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.val > 0 ? 5.5 : 2.5}"
                        fill="${p.val > 0 ? '#ffffff' : 'var(--bg4)'}"
                        stroke="${p.val > 0 ? ac : 'var(--bd)'}" stroke-width="2.5"/>
                ${p.val > 0 ? `<text x="${p.x.toFixed(1)}" y="${(p.y - 13).toFixed(1)}" text-anchor="middle"
                      fill="var(--tx1)" font-size="9" font-weight="700"
                      font-family="Inter,sans-serif">${p.val}</text>` : ''}
            </g>
        `).join('');

        const labelsHTML = points.map((p, i) => `
            <text x="${p.x.toFixed(1)}" y="${H - 5}" text-anchor="middle"
                  fill="${txtColor}" font-size="9" font-weight="700"
                  font-family="Inter,sans-serif" letter-spacing="0.04em">${labels[i]}</text>
        `).join('');

        container.innerHTML = `
            <svg viewBox="0 0 ${W} ${H}" class="line-chart-svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="areaGrad_${uid}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.38"/>
                        <stop offset="55%" stop-color="${ac}" stop-opacity="0.10"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0"/>
                    </linearGradient>
                    <filter id="lineGlow_${uid}" x="-20%" y="-60%" width="140%" height="220%">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <filter id="dotGlow_${uid}" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="2.5" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                    <linearGradient id="lineGrad_${uid}" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stop-color="${ac}" stop-opacity="0.7"/>
                        <stop offset="50%" stop-color="${ac}"/>
                        <stop offset="100%" stop-color="${ac}" stop-opacity="0.7"/>
                    </linearGradient>
                </defs>
                <rect x="${pad.l}" y="${pad.t}" width="${chartW}" height="${chartH}"
                      fill="rgba(255,255,255,0.01)" rx="4"/>
                ${gridLines}
                <line x1="${pad.l}" y1="${avgY.toFixed(1)}" x2="${W - pad.r}" y2="${avgY.toFixed(1)}"
                      stroke="${ac}" stroke-width="1" stroke-dasharray="4,6" opacity="0.4" class="chart-avg-line"/>
                <path d="${areaD}" fill="url(#areaGrad_${uid})" class="chart-area-fill"/>
                ${bars}
                <path d="${pathD}" fill="none" stroke="url(#lineGrad_${uid})" stroke-width="3.5"
                      stroke-linecap="round" stroke-linejoin="round"
                      filter="url(#lineGlow_${uid})" class="chart-line-path"/>
                ${dotsHTML}
                ${labelsHTML}
            </svg>
        `;
    },



    renderInsights(w, m) {
        const insights = [];
        const mode = State.reportMode || 'week';
        const score = this.getScore(w);
        const prevW = Utils.weekData(State.weekOffset - 1);
        const prevScore = this.getScore(prevW);
        const scoreDiff = score - prevScore;
        const monthDays = m.days.length || 1;
        const monthRhythm = Math.round((m.activeDays / monthDays) * 100);

        let momentumText = "<strong>Fresh week arc.</strong> Log your first checked task or Pomodoro session to kickstart score trending.";
        let momentumClass = "momentum";
        let momentumIcon = Icons.spark(14);
        if (w.totalTasks > 0 || w.totalFocus > 0) {
            if (scoreDiff > 12) {
                momentumText = `<strong>Score Surge!</strong> Your vibe score jumped <strong>+${scoreDiff}</strong> points compared to last week. You are in beautiful alignment.`;
                momentumIcon = Icons.trendUp(14);
            } else if (scoreDiff > 0) {
                momentumText = `<strong>Rhythm Rising.</strong> Score is <strong>+${scoreDiff}</strong> higher than last week. Small habits compound quietly.`;
                momentumIcon = Icons.trendUp(14);
            } else if (scoreDiff < -10) {
                momentumText = `<strong>Energy Dip.</strong> Score dropped <strong>${scoreDiff}</strong> compared to last week. No pressure — rest fuels tomorrow's output.`;
                momentumIcon = Icons.trendDown(14);
            } else {
                momentumText = `<strong>Steady Rhythm.</strong> You are showing incredible consistency, matching your productivity levels from last week.`;
                momentumIcon = Icons.shield(14);
            }
        }
        insights.push({ type: 'Momentum', text: momentumText, icon: momentumIcon, catClass: momentumClass });

        let peakText = "Your high-focus days will appear here once you log focused flow blocks.";
        let peakClass = "peaks";
        let peakIcon = Icons.fire(14);
        if (w.bestDay.tasks > 0 || w.bestDay.focus > 0) {
            peakText = `<strong>Best Day: ${w.bestDay.name}</strong> — Completed ${w.bestDay.tasks} tasks with ${w.bestDay.focus} minutes of deep work. Replicate this setup!`;
        }
        insights.push({ type: 'Focus Peak', text: peakText, icon: peakIcon, catClass: peakClass });

        let rhythmText = "Consistency is the lock of focus. Set a streak to see your habits lock.";
        let rhythmClass = "habits";
        let rhythmIcon = Icons.shield(14);
        if (w.activeDays >= 5) {
            rhythmText = `<strong>Epic Flow:</strong> ${w.activeDays}/7 active days. Consistency always beats temporary intensity.`;
        } else if (w.activeDays >= 3) {
            rhythmText = `<strong>Active Flow:</strong> ${w.activeDays}/7 active days. Push for just one more session to unlock high vibe indicators.`;
        }
        insights.push({ type: 'Habits', text: rhythmText, icon: rhythmIcon, catClass: rhythmClass });

        const tips = [
            "Done is better than perfect. Launch it, then iterate.",
            "Heavy tasks? Split them down until they feel obvious.",
            "Block out one distraction-free hour tomorrow morning.",
            "The hardest part is starting. After 2 minutes, flow overrides.",
            "Energy over time. Work when your brain is sharpest.",
            "Rest is highly productive. Recovery triggers creativity."
        ];
        let adviceText = `<em>"${tips[Math.floor(Math.random() * tips.length)]}"</em>`;
        let adviceClass = "advice";
        let adviceIcon = Icons.spark(14);
        insights.push({ type: 'Advice', text: adviceText, icon: adviceIcon, catClass: adviceClass });

        const container = document.getElementById('aiInsightsContent');
        if (!container) return;

        container.innerHTML = `
            <div class="insights-grid">
                ${insights.map((ins, idx) => `
                    <div class="insight-card" style="animation-delay: ${idx * 0.05}s">
                        <div class="insight-card-header ${ins.catClass}">
                            ${ins.icon}
                            <span>${ins.type}</span>
                        </div>
                        <div class="insight-card-text">${ins.text}</div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    downloadPDF() {
        Sound.click();
        Toast.show('Loading PDF engine...');

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            Toast.show('Generating report...');
            setTimeout(() => this._generatePDF(), 200);
        };
        script.onerror = () => Toast.show('Failed to load PDF library');

        if (window.jspdf) {
            Toast.show('Generating report...');
            setTimeout(() => this._generatePDF(), 200);
        } else {
            document.head.appendChild(script);
        }
    },

    _generatePDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const w = Utils.weekData(State.weekOffset);
            const dates = Utils.weekDates(State.weekOffset);
            const score = this.getScore(w);
            const breakdown = this.getScoreBreakdown(w);

            const pageW = 210;

            // Get current accent color from DOM
            const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#f5c842';
            const toRGB = hex => {
                hex = hex.replace('#', '');
                if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
                return [
                    parseInt(hex.substring(0, 2), 16),
                    parseInt(hex.substring(2, 4), 16),
                    parseInt(hex.substring(4, 6), 16)
                ];
            };
            const [r, g, b] = toRGB(ac);

            // 1. HEADER SECTION (Height: 0 to 38mm)
            doc.setFillColor(r, g, b);
            doc.rect(0, 0, pageW, 38, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(24);
            doc.text('F O C U S S I U M', 16, 17);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(240, 240, 245);
            doc.text('Your Zen Productivity Space • Weekly Performance Vibe', 16, 25);

            // Date Capsule Badge on Right
            const range = `${new Date(dates[0] + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric' })} — ${new Date(dates[6] + 'T00:00:00').toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            doc.setFillColor(255, 255, 255, 0.2);
            doc.roundedRect(132, 13, 62, 9, 2.5, 2.5, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(255, 255, 255);
            doc.text(range, 136, 19);

            // 2. ROW 1: THE VIBE CORE (y = 48mm to 100mm)
            // Left Column: Vibe Scorecard Card
            doc.setFillColor(248, 249, 252);
            doc.setDrawColor(228, 230, 238);
            doc.roundedRect(15, 46, 85, 52, 4, 4, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(110, 110, 125);
            doc.text('PRODUCTIVITY SCORE', 21, 55);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(30);
            doc.setTextColor(r, g, b);
            doc.text(`${score} / 100`, 21, 69);

            // Custom Linear Progress bar
            doc.setFillColor(228, 230, 235);
            doc.roundedRect(21, 76, 73, 5, 2.5, 2.5, 'F');
            doc.setFillColor(r, g, b);
            doc.roundedRect(21, 76, Math.max(5, score * 0.73), 5, 2.5, 2.5, 'F');

            let vibeTitle = "Resting Flow 🧘";
            if (score >= 80) vibeTitle = "Deep Flow State 🧘";
            else if (score >= 60) vibeTitle = "High Momentum ⚡";
            else if (score >= 35) vibeTitle = "Rhythm Building 🏗️";
            else if (score > 0) vibeTitle = "Mindful Recovery 📿";

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(75, 75, 90);
            doc.text(`Vibe Status: ${vibeTitle}`, 21, 89);

            // Right Column: Key Metrics Card
            doc.setFillColor(248, 249, 252);
            doc.roundedRect(108, 46, 87, 52, 4, 4, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(110, 110, 125);
            doc.text('WEEKLY KEY METRICS', 114, 55);

            // Row 1 inside metrics
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9.5);
            doc.setTextColor(60, 60, 70);
            doc.text('Tasks Completed', 114, 67);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(r, g, b);
            doc.text(`${w.totalTasks} tasks`, 188, 67, { align: 'right' });
            doc.setDrawColor(226, 228, 236);
            doc.line(114, 70, 188, 70);

            // Row 2 inside metrics
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 70);
            doc.text('Total Focus Time', 114, 78);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(92, 190, 128); // Green
            doc.text(`${w.totalFocus} min`, 188, 78, { align: 'right' });
            doc.line(114, 81, 188, 81);

            // Row 3 inside metrics
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(60, 60, 70);
            doc.text('Consistency Rhythm', 114, 89);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(229, 174, 92); // Gold
            doc.text(`${w.activeDays} / 7 days`, 188, 89, { align: 'right' });

            // 3. ROW 2: INNER WORKINGS (y = 106mm to 184mm)
            // Left Column: Score Breakdown List
            doc.setFillColor(253, 253, 254);
            doc.roundedRect(15, 106, 85, 78, 4, 4, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(110, 110, 125);
            doc.text('SCORE BREAKDOWN', 21, 115);

            const breakItems = [
                { label: 'Tasks Done Points', val: `+${breakdown.tasks}`, pos: true },
                { label: 'Focus Minutes Points', val: `+${breakdown.focus}`, pos: true },
                { label: 'Consistency rhythm', val: `+${breakdown.consistency}`, pos: true },
                { label: 'Task completion rate', val: `+${breakdown.completion}`, pos: true },
                { label: 'Streak Bonus modifier', val: `+${breakdown.streak}`, pos: true },
                { label: 'Overdue Penalty deduction', val: `-${breakdown.overdue}`, pos: false }
            ];

            breakItems.forEach((item, idx) => {
                const y_b = 124 + idx * 8.5;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(80, 80, 95);
                doc.text(item.label, 21, y_b);

                doc.setFont('helvetica', 'bold');
                if (item.pos) {
                    doc.setTextColor(50, 140, 95); // soft green
                } else {
                    doc.setTextColor(220, 80, 80); // soft red
                }
                doc.text(item.val, 92, y_b, { align: 'right' });

                if (idx < 5) {
                    doc.setDrawColor(240, 240, 244);
                    doc.line(21, y_b + 2.5, 92, y_b + 2.5);
                }
            });

            // Right Column: Daily Week Rhythm Bullet Journal Log
            doc.setFillColor(253, 253, 254);
            doc.roundedRect(108, 106, 87, 78, 4, 4, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(110, 110, 125);
            doc.text('DAILY ACTIVITY LOG', 114, 115);

            w.days.forEach((day, idx) => {
                const y_d = 124 + idx * 8.5;
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8.5);
                doc.setTextColor(70, 70, 85);
                doc.text(day.name, 114, y_d);

                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8);
                doc.setTextColor(110, 110, 125);
                doc.text(`${day.tasks} tasks done  •  ${day.focus}m focus`, 128, y_d);

                // Elegant indicator dot showing active vs restful days
                const isActive = day.tasks > 0 || day.focus > 0;
                if (isActive) {
                    doc.setFillColor(r, g, b);
                } else {
                    doc.setFillColor(220, 220, 225);
                }
                doc.circle(184, y_d - 1, 1, 'F');

                if (idx < 6) {
                    doc.setDrawColor(240, 240, 244);
                    doc.line(114, y_d + 2.5, 186, y_d + 2.5);
                }
            });

            // 4. ROW 3: AI INSIGHTS & MINDFULNESS BANNER (y = 192mm to 276mm)
            doc.setFillColor(248, 249, 252);
            doc.setDrawColor(228, 230, 238);
            doc.roundedRect(15, 192, 180, 82, 4, 4, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(110, 110, 125);
            doc.text('AI INSIGHTS & MINDFULNESS REFLECTIONS', 21, 201);

            const rawText = document.getElementById('aiInsightsContent')?.textContent || '';
            const insightsText = rawText.replace(/\s+/g, ' ').trim() || 'Your mindful productivity vibe will appear here as you log tasks. Complete focus blocks, maintain lists, and review your daily logs to see insights customized for your focus style.';

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 75);
            const wrapped = doc.splitTextToSize(insightsText, 168);
            
            // Limit to fit beautifully on page
            doc.text(wrapped.slice(0, 5), 21, 210);

            // Visual divider for quotes
            doc.setDrawColor(226, 228, 236);
            doc.line(21, 247, 189, 247);

            // Daily Quote block integration
            const rawQuote = document.getElementById('dailyQuoteText')?.textContent || '"Your mind is for having ideas, not holding them."';
            const rawAuthor = document.getElementById('dailyQuoteAuthor')?.textContent || '— David Allen';

            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8.5);
            doc.setTextColor(r, g, b);
            doc.text(rawQuote, 21, 255);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 115);
            doc.text(rawAuthor, 21, 261);

            // 5. FOOTER
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(140, 140, 155);
            doc.text('Designed for brains that work differently  •  Focussium v2 Pro', pageW / 2, 287, { align: 'center' });

            doc.save(`Focussium_Report_${dates[0]}.pdf`);
            Sound.success();
            Toast.show('Report downloaded');
        } catch (e) {
            handleError('PDF generation', e);
            Toast.show('PDF generation failed');
        }
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

        this.renderAccents();
        this.renderAvatars();
        this.renderSoundPalette();
    },

    renderAccents() {
        const lvl = State.data?.level || 1;
        const locks = {
            royal: 1,
            neon: 2,
            sunset: 2,
            lavender: 2,
            matcha: 4,
            void: 4,
            rose: 4,
            mint: 6,
            sky: 6
        };

        document.getElementById('accentButtons').innerHTML = ACCENTS.map(a => {
            const req = locks[a.id] || 1;
            const isLocked = lvl < req;
            const isActive = State.data.settings.accent === a.id;
            
            return `
            <div class="accent-btn ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}" 
                 style="background:${a.c}" 
                 onclick="${isLocked ? `Toast.show('Requires Level ${req} 🔒')` : `Settings.setAccent('${a.id}')`}"
                 title="${a.n} ${isLocked ? `(Requires Level ${req})` : ''}"></div>
            `;
        }).join('');

        const picker = document.getElementById('customColorPicker');
        if (picker) {
            picker.classList.toggle('locked', lvl < 5);
        }

        const isCustom = State.data.settings.accent === 'custom';
        const swatch = document.getElementById('customColorSwatch');
        const hexInput = document.getElementById('customHexInput');
        const nativeInput = document.getElementById('customColorNative');
        
        if (isCustom && State.data.settings.customHex) {
            swatch.style.background = `#${State.data.settings.customHex}`;
            swatch.classList.add('has-color');
            hexInput.value = State.data.settings.customHex.toUpperCase();
            nativeInput.value = `#${State.data.settings.customHex}`;
            if (picker && lvl >= 5) picker.classList.add('active');
        } else {
            swatch.style.background = '';
            swatch.classList.remove('has-color');
            hexInput.value = '';
            if (picker) picker.classList.remove('active');
        }
    },

    renderAvatars() {
        const lvl = State.data?.level || 1;
        const avatars = [
            { id: 'default', req: 1, n: 'Default Explorer', type: 'svg', icon: 'default' },
            { id: 'seed', req: 2, n: 'Zen Focus Seed', type: 'img', src: 'zen_focus_avatar.png' },
            { id: 'lotus', req: 2, n: 'Zen Lotus', type: 'svg', icon: 'lotus' },
            { id: 'custom', req: 3, n: 'Custom Photo / Camera', type: 'custom' },
            { id: 'voyager', req: 4, n: 'Astro Voyager', type: 'svg', icon: 'voyager' },
            { id: 'deity', req: 8, n: 'Zen Deity', type: 'svg', icon: 'deity' }
        ];

        const container = document.getElementById('avatarButtons');
        if (!container) return;

        const vectors = {
            default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; padding:8px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>`,
            lotus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; padding:8px; color:var(--ac);"><path d="M12 2C8 6 8 13 12 22C16 13 16 6 12 2Z" /><path d="M12 8C5 11 5 16 12 22C19 16 19 11 12 8Z" /><path d="M12 13C2 15 2 18 12 22C22 18 22 15 12 13Z" /></svg>`,
            voyager: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; padding:8px; color:var(--ac);"><path d="M12 2L2 22l10-6 10 6L12 2z" /><path d="M12 2v14" /></svg>`,
            deity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; padding:8px; color:#ffd700;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18" stroke-width="2.5" /></svg>`,
            upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="width:100%; height:100%; padding:9px; color:var(--tx3);"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>`
        };

        container.innerHTML = avatars.map(av => {
            const isLocked = lvl < av.req;
            const isActive = (State.data.settings.avatar || 'default') === av.id;

            let innerContent = '';
            if (av.type === 'svg') {
                innerContent = vectors[av.icon] || '';
            } else if (av.type === 'img') {
                innerContent = `<img src="${av.src}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="${av.n}">`;
            } else if (av.type === 'custom') {
                const customUrl = State.data.settings?.customAvatarDataUrl;
                if (customUrl) {
                    innerContent = `<img src="${customUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" alt="${av.n}">`;
                } else {
                    innerContent = vectors.upload;
                }
            }

            return `
            <button class="avatar-btn ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                    onclick="${isLocked ? `Toast.show('Requires Level ${av.req} 🔒')` : `Settings.setAvatar('${av.id}')`}"
                    title="${av.n} ${isLocked ? `(Requires Level ${av.req})` : ''}">
                ${innerContent}
            </button>
            `;
        }).join('');

        // Render "Change custom photo..." link for users at level 3+
        let changeBtn = document.getElementById('changeAvatarUploadLink');
        if (lvl >= 3) {
            if (!changeBtn) {
                changeBtn = document.createElement('div');
                changeBtn.id = 'changeAvatarUploadLink';
                changeBtn.style.cssText = 'font-size: 0.72rem; color: var(--ac); margin-top: 8px; cursor: pointer; font-weight: 600; text-align: left; width: 100%; display: inline-block; transition: opacity 0.2s;';
                changeBtn.innerHTML = `<span>📸 Upload / snap custom photo...</span>`;
                changeBtn.onclick = () => document.getElementById('avatarFileInput').click();
                container.parentNode.appendChild(changeBtn);
            }
        } else if (changeBtn) {
            changeBtn.remove();
        }

        this.applyAvatarDisplay();
    },

    setAvatar(avatarId) {
        if (avatarId === 'custom') {
            const currentImg = State.data.settings?.customAvatarDataUrl;
            if (!currentImg) {
                document.getElementById('avatarFileInput').click();
                return;
            }
        }
        State.data.settings.avatar = avatarId;
        Storage.save();
        this.renderAvatars();
        Sound.toggle();
        Toast.show(`Identity updated 🔮`);
    },

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            Toast.show('Please upload a valid image file 🖼️');
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const size = 120;
                canvas.width = size;
                canvas.height = size;

                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

                if (!State.data.settings) State.data.settings = {};
                State.data.settings.customAvatarDataUrl = compressedDataUrl;
                State.data.settings.avatar = 'custom';
                Storage.save();

                this.renderAvatars();
                Sound.success();
                Toast.show('Custom photo saved! 📸');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    applyAvatarDisplay() {
        const active = State.data?.settings?.avatar || 'default';
        const img = document.getElementById('userAvatar');
        if (!img) return;

        const fallback = img.parentNode.querySelector('.avatar-fallback-txt');

        if (active === 'seed') {
            img.src = 'zen_focus_avatar.png';
            img.style.display = 'block';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 2px solid var(--bd);';
            if (fallback) fallback.style.display = 'none';
        } else if (active === 'custom' && State.data.settings?.customAvatarDataUrl) {
            img.src = State.data.settings.customAvatarDataUrl;
            img.style.display = 'block';
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 2px solid var(--bd);';
            if (fallback) fallback.style.display = 'none';
        } else {
            img.style.display = 'none';
            let fb = fallback;
            if (!fb) {
                fb = document.createElement('div');
                fb.className = 'avatar-fallback-txt';
                img.parentNode.appendChild(fb);
            }
            fb.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--bg3); border-radius: 50%; user-select: none; transition: background 0.3s; border: 2px solid var(--bd);';
            fb.style.display = 'flex';

            const vectors = {
                default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--tx2); width:100%; height:100%; padding:5px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>`,
                lotus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ac); width:100%; height:100%; padding:5px;"><path d="M12 2C8 6 8 13 12 22C16 13 16 6 12 2Z" /><path d="M12 8C5 11 5 16 12 22C19 16 19 11 12 8Z" /><path d="M12 13C2 15 2 18 12 22C22 18 22 15 12 13Z" /></svg>`,
                voyager: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--ac); width:100%; height:100%; padding:5px;"><path d="M12 2L2 22l10-6 10 6L12 2z" /><path d="M12 2v14" /></svg>`,
                deity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:#ffd700; width:100%; height:100%; padding:5px;"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" /><path d="M3 20h18" stroke-width="2.5" /></svg>`,
                custom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--tx3); width:100%; height:100%; padding:5px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>`
            };
            fb.innerHTML = vectors[active] || vectors.default;
        }

        const lvl = State.data?.level || 1;
        const wrap = img.closest('.avatar-wrapper');
        if (wrap) {
            wrap.classList.toggle('level-8-plus', lvl >= 8);
        }
    },

    renderSoundPalette() {
        const lvl = State.data?.level || 1;
        const container = document.getElementById('paletteButtonsContainer');
        if (!container) return;

        const isLocked = lvl < 3;
        const current = State.data.settings.soundPalette || 'zen';

        container.innerHTML = `
            <button class="palette-btn ${current === 'zen' ? 'active' : ''}" 
                    onclick="Settings.setSoundPalette('zen')">Zen</button>
            <button class="palette-btn ${current === 'retro' ? 'active' : ''} ${isLocked ? 'locked' : ''}" 
                    onclick="${isLocked ? `Toast.show('Requires Level 3 🔒')` : `Settings.setSoundPalette('retro')`}">Retro</button>
        `;
    },

    setSoundPalette(palette) {
        State.data.settings.soundPalette = palette;
        Storage.save();
        this.renderSoundPalette();
        Sound.toggle();
        Toast.show(`Sound Vibe: ${palette === 'retro' ? 'Retro Synth 🕹️' : 'Zen Chimes 🪷'}`);
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
        const lvl = State.data?.level || 1;
        if (lvl < 5) {
            Toast.show('Custom palette is locked until Level 5 🔒');
            return;
        }
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
   MODALS (with Escape key support)
───────────────────────────────────────────────────────── */
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', e => {
        if (e.target === modal) {
            modal.classList.remove('on');
            Sound.close();
        }
    });
});

// Close any open modal on Escape
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.on').forEach(modal => {
            modal.classList.remove('on');
            Sound.close();
        });
    }
});

/* ─────────────────────────────────────────────────────────
   COMMAND GLASS (QUICK ADD) — Fixed
───────────────────────────────────────────────────────── */
const CommandGlass = {
    open() {
        const glass = document.getElementById('cmdGlass');
        const input = document.getElementById('cmdInput');
        
        glass.classList.add('show');
        document.getElementById('cmdIcon').innerHTML = Icons.zap(12) || Icons.spark(12);
        
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

        if (text.toLowerCase().startsWith('dump ')) {
            const dumpText = text.substring(5).trim();
            if (dumpText) {
                State.data.dumps.unshift({
                    id: Utils.generateId('dump'),
                    text: dumpText,
                    ts: Date.now()
                });
                Storage.save();
                Dump.render();
                Nav.updateBadges();
                Toast.show('Brain dump saved');
            }
        } else {
            State.data.tasks.unshift({
                id: Utils.generateId('task'),
                text: text,
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
            Storage.save();
            Tasks.render();
            Home.render();
            Nav.updateBadges();
            Toast.show('Task added to Today');
        }

        this.close();
        Sound.success();
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const glass = document.getElementById('cmdGlass');
        if (glass.classList.contains('show')) {
            CommandGlass.close();
        } else {
            CommandGlass.open();
        }
    }

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
   CANVAS PARTICLES DUST (zero-standby visual flow engine)
───────────────────────────────────────────────────────── */
const Particles = {
    canvas: null,
    ctx: null,
    list: [],
    animating: false,
    animFrameId: null,

    init() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('click', (e) => this.handleClick(e));
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    getAccentColor() {
        const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#f5c842';
        return ac;
    },

    spawn(x, y, count = 12, sizeMultiplier = 1.0) {
        if (!this.canvas) return;
        const color = this.getAccentColor();

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 + Math.random() * 2.0) * sizeMultiplier;
            
            this.list.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - (0.5 + Math.random() * 0.8),
                size: (1.5 + Math.random() * 2.5) * sizeMultiplier,
                alpha: 1.0,
                decay: 0.015 + Math.random() * 0.02,
                color: color
            });
        }

        this.startLoop();
    },

    spawnExplosion(x, y, count = 30) {
        this.spawn(x, y, count, 2.2);
    },

    handleClick(e) {
        if (e.target.closest('.ambient-slider') || e.target.closest('.modal-sheet') || e.target.closest('.xp-bar-container') || e.target.closest('.google-btn') || e.target.closest('.form-input')) {
            return;
        }
        this.spawn(e.clientX, e.clientY, 8);
    },

    startLoop() {
        if (this.animating) return;
        this.animating = true;
        this.loop();
    },

    stopLoop() {
        this.animating = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    loop() {
        if (!this.animating) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.list.length - 1; i >= 0; i--) {
            const p = this.list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.shadowBlur = 6;
            this.ctx.shadowColor = p.color;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();

            if (p.alpha <= 0) {
                this.list.splice(i, 1);
            }
        }

        if (this.list.length === 0) {
            this.stopLoop();
        } else {
            this.animFrameId = requestAnimationFrame(() => this.loop());
        }
    }
};

/* ─────────────────────────────────────────────────────────
   APP INIT
───────────────────────────────────────────────────────── */
const App = {
    init() {
        if (!State.data) {
            State.data = Storage.load();
        }

        Theme.apply();
        Clock.start();

        Pomo.init();
        Pomo.requestNotificationPermission();
        Home.render();
        Tasks.render();
        Dump.render();
        Report.render();
        Settings.render();
        Level.update();
        Nav.updateBadges();
        
        Particles.init();

        Utils.loadDailyQuote();

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
            .then(reg => {
                console.log('SW registered', reg);

                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }

                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                    });
                });

                let hasRefreshed = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    if (hasRefreshed) return;
                    hasRefreshed = true;
                    window.location.reload();
                });

                setInterval(() => reg.update(), 60 * 1000);
            })
            .catch(err => console.log('SW failed', err));
    }
});
