/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — ROUTER MODULE (Nav)
   Page navigation with hash routing + badge system
═══════════════════════════════════════════════════════════ */

const Nav = {
    go(page) {
        State.currentPage = page;

        document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
        const pageEl = document.querySelector(`.page[data-page="${page}"]`);
        if (pageEl) {
            pageEl.classList.add('active');
            // v3.0: Focus management — move focus to page heading for accessibility
            const heading = pageEl.querySelector('h1, h2, [tabindex="-1"]');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: true });
            }
        }

        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });

        const fab = document.getElementById('fabButton');
        if (fab) fab.classList.toggle('show', page === 'tasks');

        Sound.nav();

        // Render appropriate page content
        if (page === 'home')   Home.render();
        if (page === 'tasks')  Tasks.render();
        if (page === 'dump')   Dump.render();
        if (page === 'report') Report.render();
        if (page === 'habits') Habits.render(); // v3.0 NEW

        this.updateBadges();

        // v3.0: Update URL hash for browser history support
        if (history.replaceState) {
            history.replaceState(null, '', `#${page}`);
        }
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
   HASH-BASED ROUTING (v3.0 NEW)
   Browser back/forward support
───────────────────────────────────────────────────────── */
window.addEventListener('popstate', () => {
    const hash = location.hash.replace('#', '') || 'home';
    const validPages = ['home', 'tasks', 'focus', 'dump', 'report', 'habits'];
    if (validPages.includes(hash)) {
        Nav.go(hash);
    }
});
