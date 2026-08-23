/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — TOAST MODULE
   Notification toasts with undo support
═══════════════════════════════════════════════════════════ */

const Toast = {
    timeout: null,
    undoTimeout: null,

    show(msg) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.innerHTML = msg;
        el.classList.remove('has-undo');
        el.classList.add('show');
        clearTimeout(this.timeout);
        clearTimeout(this.undoTimeout);
        this.timeout = setTimeout(() => el.classList.remove('show'), CONFIG.TOAST_DURATION);
    },

    showUndo(msg, undoFn) {
        const el = document.getElementById('toast');
        if (!el) return;
        el.innerHTML = `<span>${msg}</span><button class="toast-undo-btn" id="toastUndoBtn">Undo</button>`;
        el.classList.add('show', 'has-undo');
        clearTimeout(this.timeout);
        clearTimeout(this.undoTimeout);

        const btn = document.getElementById('toastUndoBtn');
        if (btn) {
            btn.onclick = () => {
                clearTimeout(this.undoTimeout);
                el.classList.remove('show', 'has-undo');
                undoFn();
            };
        }

        this.undoTimeout = setTimeout(() => {
            el.classList.remove('show', 'has-undo');
        }, CONFIG.UNDO_DURATION);
    }
};
