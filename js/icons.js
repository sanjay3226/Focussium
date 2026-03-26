/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v2 PRO — CUSTOM SVG ICONS
═══════════════════════════════════════════════════════════ */

const Icons = {
    logo(size = 48) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none">
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="var(--ac)"/>
                    <stop offset="100%" stop-color="var(--acl)"/>
                </linearGradient>
            </defs>
            <path d="M32 6L50 18V40C50 50 42 56 32 58C22 56 14 50 14 40V18L32 6Z" fill="url(#logoGrad)" opacity="0.18"/>
            <path d="M32 6L50 18V40C50 50 42 56 32 58C22 56 14 50 14 40V18L32 6Z" stroke="url(#logoGrad)" stroke-width="2.5"/>
            <path d="M24 28L30 34L42 22" stroke="url(#logoGrad)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    },

    google(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24">
            <path d="M22 12.2c0-.8-.07-1.57-.2-2.3H12v4.35h5.6a4.8 4.8 0 0 1-2.08 3.15v2.62h3.38c1.98-1.82 3.1-4.5 3.1-7.82z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.47-.98 7.3-2.65l-3.38-2.62c-.94.63-2.14 1-3.92 1-3 0-5.54-2.02-6.45-4.73H2.06v2.96A11 11 0 0 0 12 23z" fill="#34A853"/>
            <path d="M5.55 14c-.23-.68-.36-1.4-.36-2s.13-1.32.36-2V7.04H2.06A11 11 0 0 0 1 12c0 1.77.42 3.44 1.06 4.96L5.55 14z" fill="#FBBC05"/>
            <path d="M12 5.27c1.62 0 3.08.56 4.22 1.67l3.17-3.17C17.47 1.9 14.97 1 12 1A11 11 0 0 0 2.06 7.04L5.55 10C6.46 7.3 9 5.27 12 5.27z" fill="#EA4335"/>
        </svg>`;
    },

    home(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 10.5L12 4L20 10.5V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V10.5Z"/>
            <path d="M9 21V13H15V21"/>
        </svg>`;
    },

    tasks(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="5" cy="6" r="1.5"/>
            <circle cx="5" cy="12" r="1.5"/>
            <circle cx="5" cy="18" r="1.5"/>
            <path d="M9 6H19"/>
            <path d="M9 12H19"/>
            <path d="M9 18H19"/>
        </svg>`;
    },

    dump(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3C16.4 3 20 6.6 20 11C20 13.6 18.8 15.6 17 17V18.5C17 19.3 16.3 20 15.5 20H8.5C7.7 20 7 19.3 7 18.5V17C5.2 15.6 4 13.6 4 11C4 6.6 7.6 3 12 3Z"/>
            <path d="M9.5 22H14.5"/>
        </svg>`;
    },

    focus(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8"/>
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 2V5"/>
            <path d="M12 19V22"/>
            <path d="M2 12H5"/>
            <path d="M19 12H22"/>
        </svg>`;
    },

    report(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 20V10"/>
            <path d="M10 20V4"/>
            <path d="M16 20V13"/>
            <path d="M22 20V7"/>
        </svg>`;
    },

    settings(size = 18) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1V4M12 20V23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M1 12H4M20 12H23M4.22 19.78L6.34 17.66M17.66 6.34L19.78 4.22"/>
        </svg>`;
    },

    plus(size = 22) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round">
            <path d="M12 5V19"/>
            <path d="M5 12H19"/>
        </svg>`;
    },

    check(size = 12) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17L4 12"/>
        </svg>`;
    },

    trash(size = 14) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6H21"/>
            <path d="M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6"/>
            <path d="M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6"/>
            <path d="M10 11V17"/>
            <path d="M14 11V17"/>
        </svg>`;
    },

    edit(size = 14) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4C2.9 4 2 4.9 2 6V20C2 21.1 2.9 22 4 22H18C19.1 22 20 21.1 20 20V13"/>
            <path d="M18.5 2.5C19.3 1.7 20.7 1.7 21.5 2.5C22.3 3.3 22.3 4.7 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z"/>
        </svg>`;
    },

    calendar(size = 12) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2"/>
            <path d="M16 3V7"/>
            <path d="M8 3V7"/>
            <path d="M3 11H21"/>
        </svg>`;
    },

    clock(size = 12) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9"/>
            <path d="M12 7V12L15 14"/>
        </svg>`;
    },

    repeat(size = 10) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 2L21 6L17 10"/>
            <path d="M3 11V9A3 3 0 0 1 6 6H21"/>
            <path d="M7 22L3 18L7 14"/>
            <path d="M21 13V15A3 3 0 0 1 18 18H3"/>
        </svg>`;
    },

    sendUp(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5"/>
            <path d="M5 12L12 5L19 12"/>
        </svg>`;
    },

    play(size = 26) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.2C8 4.5 8.8 4.1 9.4 4.5L18.5 10.3C19.1 10.7 19.1 11.6 18.5 12L9.4 17.8C8.8 18.2 8 17.8 8 17.1V5.2Z"/>
        </svg>`;
    },

    pause(size = 26) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4.5" height="16" rx="1.5"/>
            <rect x="13.5" y="4" width="4.5" height="16" rx="1.5"/>
        </svg>`;
    },

    reset(size = 18) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 4V10H9"/>
            <path d="M4.5 15A8.5 8.5 0 1 0 6.5 6.2L3 10"/>
        </svg>`;
    },

    skip(size = 18) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 5L15 12L5 19V5Z" fill="currentColor"/>
            <path d="M19 5V19"/>
        </svg>`;
    },

    fullscreen(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3H21V9"/>
            <path d="M9 21H3V15"/>
            <path d="M21 3L14 10"/>
            <path d="M3 21L10 14"/>
        </svg>`;
    },

    close(size = 22) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M6 6L18 18"/>
            <path d="M18 6L6 18"/>
        </svg>`;
    },

    chevronLeft(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18L9 12L15 6"/>
        </svg>`;
    },

    chevronRight(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18L15 12L9 6"/>
        </svg>`;
    },

    arrowRight(size = 12) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12H19"/>
            <path d="M12 5L19 12L12 19"/>
        </svg>`;
    },

    spark(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
        </svg>`;
    },

    chart(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19V10"/>
            <path d="M10 19V5"/>
            <path d="M16 19V13"/>
            <path d="M22 19V8"/>
        </svg>`;
    },

    heat(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3C15 6 17 8.5 17 12A5 5 0 1 1 7 12C7 9.5 8.5 7.5 12 3Z"/>
            <path d="M12 11C13.5 12.5 14 13.2 14 14.5A2 2 0 1 1 10 14.5C10 13.6 10.4 12.8 12 11Z"/>
        </svg>`;
    },

    download(size = 18) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3V15"/>
            <path d="M7 10L12 15L17 10"/>
            <path d="M4 19H20"/>
        </svg>`;
    },

    user(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20C5.5 16.8 8.4 15 12 15C15.6 15 18.5 16.8 20 20"/>
        </svg>`;
    },

    palette(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3C7 3 3 6.6 3 11.2C3 14.9 5.7 17.6 9.4 17.6H11C12.1 17.6 13 18.5 13 19.6C13 20.7 13.9 21.6 15 21.6C18.9 21.6 21 17.8 21 13.8C21 7.9 17 3 12 3Z"/>
            <circle cx="7.5" cy="10" r="1" fill="currentColor"/>
            <circle cx="10.5" cy="7.5" r="1" fill="currentColor"/>
            <circle cx="14.5" cy="7.5" r="1" fill="currentColor"/>
            <circle cx="17" cy="11" r="1" fill="currentColor"/>
        </svg>`;
    },

    sound(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5L6 9H3V15H6L11 19V5Z"/>
            <path d="M15.5 9C16.8 10.3 16.8 13.7 15.5 15"/>
            <path d="M18.5 6C21.2 8.7 21.2 15.3 18.5 18"/>
        </svg>`;
    },

    brain(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 4C6.8 4 5 5.8 5 8C3.3 8.8 2.5 10.3 2.5 12C2.5 13.8 3.5 15.3 5 16C5 18.2 6.8 20 9 20H10"/>
            <path d="M15 4C17.2 4 19 5.8 19 8C20.7 8.8 21.5 10.3 21.5 12C21.5 13.8 20.5 15.3 19 16C19 18.2 17.2 20 15 20H14"/>
            <path d="M10 8C10 6.9 10.9 6 12 6C13.1 6 14 6.9 14 8V16C14 17.1 13.1 18 12 18C10.9 18 10 17.1 10 16V8Z"/>
        </svg>`;
    },

    fire(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C9 5 7 8 7 12C7 16 9 19 12 20C15 19 17 16 17 12C17 8 15 5 12 2ZM12 18C10 17 9 15 9 12C9 10 10 8 12 6C14 8 15 10 15 12C15 15 14 17 12 18Z"/>
        </svg>`;
    },

    shield(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3L19 6V11C19 16 16 19.7 12 21C8 19.7 5 16 5 11V6L12 3Z"/>
            <path d="M9 12L11 14L15 10"/>
        </svg>`;
    },

    target(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        </svg>`;
    },

    trendUp(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 17L9 11L13 15L21 7"/>
            <path d="M15 7H21V13"/>
        </svg>`;
    },

    trendDown(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7L9 13L13 9L21 17"/>
            <path d="M15 17H21V11"/>
        </svg>`;
    },

    trophy(size = 20) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9H4C3 9 2 8 2 7V6C2 5 3 4 4 4H6"/>
            <path d="M18 9H20C21 9 22 8 22 7V6C22 5 21 4 20 4H18"/>
            <path d="M6 4H18V9C18 13 15 16 12 16C9 16 6 13 6 9V4Z"/>
            <path d="M12 16V19"/>
            <path d="M8 22H16"/>
            <path d="M9 19H15"/>
        </svg>`;
    },

    star(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15.1 8.3L22 9.2L17 14.1L18.2 21L12 17.8L5.8 21L7 14.1L2 9.2L8.9 8.3L12 2Z"/>
        </svg>`;
    },

    zap(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4 14H11L10 22L20 10H13L13 2Z"/>
        </svg>`;
    },

    crown(size = 16) {
        return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 8L6 18H18L22 8L16 12L12 4L8 12L2 8Z"/>
        </svg>`;
    }
};

function injectIcons() {
    const iconMap = {
        'loadingLogo': () => Icons.logo(56),
        'loginLogo': () => Icons.logo(64),
        'googleIcon': () => Icons.google(20),

        'headerDumpBtn': () => Icons.dump(18),
        'headerSettingsBtn': () => Icons.settings(18),

        'pageIconHome': () => Icons.spark(24),
        'pageIconTasks': () => Icons.tasks(24),
        'pageIconDump': () => Icons.brain(24),
        'pageIconFocus': () => Icons.target(24),
        'pageIconReport': () => Icons.chart(24),

        'weekArrowIcon': () => Icons.arrowRight(12),

        'navIconHome': () => Icons.home(20),
        'navIconTasks': () => Icons.tasks(20),
        'navIconDump': () => Icons.dump(20),
        'navIconFocus': () => Icons.focus(20),
        'navIconReport': () => Icons.report(20),

        'fabIcon': () => Icons.plus(22),
        'dumpSendBtn': () => Icons.sendUp(16),

        'pomoResetBtn': () => Icons.reset(18),
        'pomoSkipBtn': () => Icons.skip(18),
        'pomoFullscreenIcon': () => Icons.fullscreen(16),

        'fsResetBtn': () => Icons.reset(18),
        'fsSkipBtn': () => Icons.skip(18),
        'fsCloseBtn': () => Icons.close(22),

        'weekPrevBtn': () => Icons.chevronLeft(16),
        'weekNextBtn': () => Icons.chevronRight(16),

        'reportHeatIcon': () => Icons.heat(16),
        'reportChartIcon0': () => Icons.tasks(16),
        'reportChartIcon1': () => Icons.fire(16),
        'aiInsightsIcon': () => Icons.spark(12),
        'downloadIcon': () => Icons.download(18),

        'formIconTitle': () => Icons.tasks(12),
        'formIconNotes': () => Icons.brain(12),
        'formIconDate': () => Icons.calendar(12),
        'formIconTime': () => Icons.clock(12),

        'settingsThemeIcon': () => Icons.user(16),
        'settingsAccentIcon': () => Icons.palette(16),
        'settingsSoundIcon': () => Icons.sound(16),

        'onboardEmoji0': () => Icons.logo(64),
        'onboardEmoji1': () => Icons.user(64),
        'onboardEmoji2': () => Icons.palette(64),
        'onboardEmoji3': () => Icons.spark(64),
        'onboardEmoji4': () => Icons.check(64)
    };

    Object.entries(iconMap).forEach(([id, iconFn]) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = iconFn();
    });
}
