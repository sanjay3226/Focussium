/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.3 — KINETIC SMOOTH SCROLLING ENGINE
   Liquid physics, momentum wheel interpolation & glassmorphic scrollbars
   ═══════════════════════════════════════════════════════════ */

const SmoothScroll = {
    activeContainer: null,
    targetY: 0,
    currentY: 0,
    isAnimating: false,
    scrollTimeout: null,

    init() {
        // Intercept wheel on scrollable views
        window.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        // Listen for scroll activity to display subtle glowing scrollbars
        document.addEventListener('scroll', (e) => {
            const target = e.target;
            if (target && target.classList && (target.classList.contains('page') || target.classList.contains('modal-body'))) {
                this.markScrolling(target);
            }
        }, true);

        // Ensure all pages have smooth behavior
        this.applyContainerOptimizations();
    },

    applyContainerOptimizations() {
        document.querySelectorAll('.page, .modal-body').forEach(el => {
            el.style.scrollBehavior = 'smooth';
            el.style.overscrollBehavior = 'contain';
        });
    },

    getActiveContainer() {
        const modal = document.querySelector('.modal-backdrop.show .modal-body');
        if (modal) return modal;
        return document.querySelector('.page.active');
    },

    onWheel(e) {
        // Allow standard behavior for browser pinch/zoom or horizontal gestures
        if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

        // Identify target scroll container
        let container = e.target.closest('.page.active, .modal-body, .dump-notes-wrap, .games-arena-body');
        if (!container) container = this.getActiveContainer();
        if (!container) return;

        // Skip if content does not overflow
        if (container.scrollHeight <= container.clientHeight + 2) return;

        // Normalize deltas across platforms & mice
        let delta = e.deltaY;
        if (e.deltaMode === 1) delta *= 28;      // line mode (Firefox)
        else if (e.deltaMode === 2) delta *= 260; // page mode

        const maxScroll = container.scrollHeight - container.clientHeight;
        const current = container.scrollTop;

        // Only preventDefault if we can actually scroll in that direction
        const canScrollDown = delta > 0 && current < maxScroll - 1;
        const canScrollUp   = delta < 0 && current > 1;

        if (!canScrollDown && !canScrollUp) return;

        e.preventDefault();

        // If target switched, sync positions
        if (this.activeContainer !== container) {
            this.activeContainer = container;
            this.currentY = container.scrollTop;
            this.targetY  = container.scrollTop;
        }

        // Accumulate target with smooth dampening
        const step = delta * 0.95;
        this.targetY = Math.max(0, Math.min(maxScroll, this.targetY + step));

        this.markScrolling(container);

        if (!this.isAnimating) {
            this.isAnimating = true;
            requestAnimationFrame(() => this.tick());
        }
    },

    tick() {
        if (!this.activeContainer) {
            this.isAnimating = false;
            return;
        }

        this.currentY = this.activeContainer.scrollTop;
        const diff = this.targetY - this.currentY;

        // Threshold check for completion
        if (Math.abs(diff) < 0.6) {
            this.activeContainer.scrollTop = this.targetY;
            this.isAnimating = false;
            return;
        }

        // Fluid cubic interpolation (responsive 0.16 spring constant)
        const next = this.currentY + diff * 0.16;
        this.activeContainer.scrollTop = next;

        requestAnimationFrame(() => this.tick());
    },

    markScrolling(el) {
        if (!el) return;
        el.classList.add('is-scrolling');
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(() => {
            el.classList.remove('is-scrolling');
        }, 850);
    },

    scrollToTop(container = null) {
        const c = container || this.getActiveContainer();
        if (c) {
            this.targetY = 0;
            c.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
};

// Auto-initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => SmoothScroll.init());
} else {
    SmoothScroll.init();
}
