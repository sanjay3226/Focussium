/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — CONFIG, ACCENTS & RANKS
   Single source of truth for all app constants
═══════════════════════════════════════════════════════════ */

const APP_VERSION = '3.0.0';
const SCHEMA_VERSION = 3;
const CACHE_NAME = `focussium-${new Date().toISOString().split('T')[0]}.v300`;

/* ─────────────────────────────────────────────────────────
   CONFIGURATION
───────────────────────────────────────────────────────── */
const CONFIG = {
    CLOCK_INTERVAL: 1000,
    SAVE_DEBOUNCE: 1200,
    TOAST_DURATION: 2600,
    UNDO_DURATION: 4000,
    TASK_ANIMATION_STAGGER: 0.04,
    // XP System: 25min session = 50 XP, task = 5 XP, habits day = 25 XP
    XP_PER_FOCUS_MINUTE: 2,
    XP_PER_TASK: 5,
    XP_PER_HABIT_DAY: 25, // NEW v3.0: Bonus for completing all daily habits
    // XP_DIVISOR: Level N at 800*(N-1)^2 total XP
    // Level 2: ~16 sessions | Level 5: ~256 | Level 10: ~1296
    XP_LEVEL_DIVISOR: 800,
    RANKS: {
        1:  { title: 'Focus Initiate' },
        2:  { title: 'The Consistent' },
        3:  { title: 'Habit Forger' },
        4:  { title: 'Deep Diver' },
        5:  { title: 'Flow State' },
        6:  { title: 'Time Sculptor' },
        7:  { title: 'Mind Architect' },
        8:  { title: 'Discipline Monk' },
        9:  { title: 'Zen Operator' },
        10: { title: 'The Unbreakable' },
        12: { title: 'Chronos Wielder' },
        15: { title: 'Chronos Bound' },
        20: { title: 'Infinite Focus' }
    }
};

/* ─────────────────────────────────────────────────────────
   ACCENT PALETTE DEFINITIONS
───────────────────────────────────────────────────────── */
const ACCENTS = [
    { id: 'royal',    c: '#f5c842', n: 'Premium Gold' },
    { id: 'neon',     c: '#00e5ff', n: 'Cyber Neon' },
    { id: 'matcha',   c: '#9be36d', n: 'Fresh Matcha' },
    { id: 'sunset',   c: '#ff5757', n: 'Aura Sunset' },
    { id: 'lavender', c: '#9d6eff', n: 'Pure Lavender' },
    { id: 'sky',      c: '#38b6ff', n: 'Vibrant Sky' },
    { id: 'rose',     c: '#ff4d8d', n: 'Pink Rose' },
    { id: 'mint',     c: '#3dd9b8', n: 'Crystal Mint' },
    { id: 'void',     c: '#8c9ab0', n: 'Deep Void' }
];

/* ─────────────────────────────────────────────────────────
   DEFAULT DAILY HABITS (v3.0 NEW)
───────────────────────────────────────────────────────── */
const DEFAULT_HABITS = [
    { id: 'workout',  label: 'Workout',       icon: '🏋️', enabled: true },
    { id: 'water',    label: '3.5L Water',    icon: '💧', enabled: true },
    { id: 'sleep',    label: '8h Sleep',      icon: '😴', enabled: true },
    { id: 'noscreen', label: 'No Screens 1h', icon: '📵', enabled: false },
    { id: 'study',    label: 'Deep Study',    icon: '📚', enabled: true },
    { id: 'journal',  label: 'Journal',       icon: '📓', enabled: false }
];
