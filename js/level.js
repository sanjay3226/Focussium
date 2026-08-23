/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — LEVEL MODULE
   XP/Level progression + celebration engine
═══════════════════════════════════════════════════════════ */

const Level = {
    getXP() {
        const totalFocus = State.data.totalFocusMinutes || 0;
        const totalTasks = State.data.totalTasksCompleted || 0;
        const totalHabitDays = State.data.totalHabitDaysCompleted || 0; // v3.0 NEW
        return (totalFocus * CONFIG.XP_PER_FOCUS_MINUTE)
             + (totalTasks * CONFIG.XP_PER_TASK)
             + (totalHabitDays * CONFIG.XP_PER_HABIT_DAY);
    },

    // SLOW BURN: Level N requires 800*(N-1)^2 total XP
    getCurrentLevel() {
        const xp = this.getXP();
        return Math.max(1, Math.floor(Math.sqrt(Math.max(xp, 0) / CONFIG.XP_LEVEL_DIVISOR)) + 1);
    },

    update() {
        const xp = this.getXP();
        const level = this.getCurrentLevel();

        const xpForCurrentLevel = CONFIG.XP_LEVEL_DIVISOR * Math.pow(level - 1, 2);
        const xpForNextLevel    = CONFIG.XP_LEVEL_DIVISOR * Math.pow(level, 2);
        const xpInCurrentLevel  = xp - xpForCurrentLevel;
        const xpNeededForNext   = xpForNextLevel - xpForCurrentLevel;
        const progressPercent   = Math.min(100, Math.max(0, (xpInCurrentLevel / xpNeededForNext) * 100));

        // Sync level and trigger celebration if increased
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
        if (wrapper) wrapper.classList.toggle('level-8-plus', level >= 8);

        const barContainer = document.querySelector('.xp-bar-container');
        if (barContainer) {
            barContainer.title = `Level ${level} | ${xp} XP | ${Math.ceil(xpNeededForNext - xpInCurrentLevel)} XP to Level ${level + 1}`;
        }

        const bar = document.getElementById('xpBarFill');
        if (bar) bar.style.width = `${progressPercent}%`;

        // Proactively update Settings display
        if (window.Settings && typeof Settings.renderAccents === 'function') {
            try {
                Settings.renderAccents();
                Settings.renderAvatars();
                Settings.renderSoundPalette();
            } catch (e) {}
        }
    },

    celebrate(newLvl) {
        Sound.levelUp();
        SvgConfetti.start();

        const rankKeys = Object.keys(CONFIG.RANKS).map(Number).sort((a, b) => a - b);
        let rankTitle = 'Focused Creator';
        for (const k of rankKeys) { if (newLvl >= k) rankTitle = CONFIG.RANKS[k].title; }

        const modal       = document.getElementById('levelUpModal');
        const badgeVal    = document.getElementById('levelUpBadgeVal');
        const titleText   = document.getElementById('levelUpTitleText');
        const subText     = document.getElementById('levelUpSubText');
        const unlockText  = document.getElementById('levelUpUnlockText');

        if (badgeVal) badgeVal.textContent = newLvl;
        if (titleText) titleText.textContent = rankTitle;
        if (subText) subText.textContent = `Level ${newLvl} reached.`;
        if (unlockText) { unlockText.textContent = ''; unlockText.style.display = 'none'; }
        if (modal) modal.classList.add('on');
    },

    claimVibe() {
        document.getElementById('levelUpModal')?.classList.remove('on');
        Sound.click();
    }
};
