/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — STATE MODULE
   Global reactive state store with schema versioning
═══════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────
   STATE OBJECT
───────────────────────────────────────────────────────── */
const State = {
    defaults: {
        schemaVersion: 3,           // v3.0 NEW: schema versioning
        tasks: [],
        lists: ['My Tasks', 'Work', 'Personal'],
        dumps: [],
        pomo: [],
        moods: [],
        habits: {},                 // v3.0 NEW: { 'YYYY-MM-DD': ['workout', 'water', ...] }
        habitConfig: typeof DEFAULT_HABITS !== 'undefined' ? DEFAULT_HABITS : [], // v3.0 NEW: user's habit definitions
        currentList: 'All',
        streak: 0,
        lastVisit: null,
        name: '',
        onboarded: false,
        totalTasksCompleted: 0,
        totalFocusMinutes: 0,
        totalHabitDaysCompleted: 0, // v3.0 NEW: days where all habits done
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
            sessions: 4,
            ambientSound: 'none',
            ambientVol: 40,
            taskFilter: 'all'
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
    reportChartTab: 'tasks',

    pomo: {
        running: false,
        mode: 'focus',
        left: 0,
        total: 0,
        interval: null,
        count: 0,
        startTime: null,
        startLeft: 0
    }
};

/* ─────────────────────────────────────────────────────────
   SCHEMA MIGRATION ENGINE (v3.0 NEW)
   Migrates v2 data to v3 without data loss
───────────────────────────────────────────────────────── */
State.migrate = function(data) {
    if (!data) return Utils.clone(State.defaults);

    const version = data.schemaVersion || 1;

    // v1/v2 → v3 migrations
    if (version < 3) {
        // Ensure habits fields exist
        if (!data.habits) data.habits = {};
        if (!data.habitConfig || !data.habitConfig.length) {
            data.habitConfig = Utils.clone(DEFAULT_HABITS);
        }
        if (typeof data.totalHabitDaysCompleted === 'undefined') {
            data.totalHabitDaysCompleted = 0;
        }
        if (!data.moods) data.moods = [];

        // Ensure settings has all new v3 keys
        data.settings = {
            ...State.defaults.settings,
            ...(data.settings || {})
        };

        // Stamp new version
        data.schemaVersion = 3;

        console.log('[Focussium 3.0] Migrated data from schema v' + version + ' → v3');
    }

    return data;
};

/* ─────────────────────────────────────────────────────────
   STATE VALIDATORS
───────────────────────────────────────────────────────── */
State.validate = function(data) {
    if (!data || typeof data !== 'object') return Utils.clone(State.defaults);

    return {
        ...State.defaults,
        ...data,
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        lists: (Array.isArray(data.lists) && data.lists.length) ? data.lists : Utils.clone(State.defaults.lists),
        dumps: Array.isArray(data.dumps) ? data.dumps : [],
        pomo: Array.isArray(data.pomo) ? data.pomo : [],
        moods: Array.isArray(data.moods) ? data.moods : [],
        habits: (data.habits && typeof data.habits === 'object') ? data.habits : {},
        habitConfig: (Array.isArray(data.habitConfig) && data.habitConfig.length)
            ? data.habitConfig
            : Utils.clone(DEFAULT_HABITS),
        settings: { ...State.defaults.settings, ...(data.settings || {}) }
    };
};
