/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — COMMAND GLASS (Ctrl+K Quick Add)
   Focus-trapped modal for instant task/dump capture
═══════════════════════════════════════════════════════════ */

const CommandGlass = {
    open() {
        const glass = document.getElementById('cmdGlass');
        const input = document.getElementById('cmdInput');
        if (!glass || !input) return;

        glass.classList.add('show');
        const iconEl = document.getElementById('cmdIcon');
        if (iconEl && Icons.zap) iconEl.innerHTML = Icons.zap(12);

        setTimeout(() => input.focus(), 50);
        Sound.click();
    },

    close() {
        const glass = document.getElementById('cmdGlass');
        const input = document.getElementById('cmdInput');
        glass?.classList.remove('show');
        if (input) input.value = '';
        Sound.close();
    },

    submit() {
        const input = document.getElementById('cmdInput');
        const text  = input?.value.trim();
        if (!text) return;

        if (text.toLowerCase().startsWith('dump ')) {
            /* ── Brain dump shortcut: "dump <text>" ── */
            const dumpText = text.substring(5).trim();
            if (dumpText) {
                State.data.dumps.unshift({
                    id: Utils.generateId('dump'),
                    text: dumpText,
                    ts:   Date.now()
                });
                Storage.save();
                Dump.render();
                Nav.updateBadges();
                Toast.show('Brain dump saved 🧠');
            }
        } else if (text.toLowerCase().startsWith('focus')) {
            /* ── Jump to focus page ── */
            Nav.go('focus');
            Toast.show('Focus mode activated ⏱️');
        } else if (text.toLowerCase() === 'report') {
            Nav.go('report');
            Toast.show('Weekly Report 📊');
        } else if (text.toLowerCase() === 'habits') {
            Nav.go('habits');
            Toast.show('Habits tracker 🛡️');
        } else {
            /* ── Default: quick task ── */
            State.data.tasks.unshift({
                id:           Utils.generateId('task'),
                repeatGroupId: Utils.generateId('rg'),
                text:         text,
                notes:        '',
                date:         Utils.today(),
                time:         '',
                priority:     'none',
                list:         State.data.lists?.[0] || 'My Tasks',
                completed:    false,
                completedAt:  null,
                createdAt:    Date.now(),
                subtasks:     [],
                repeat:       'none'
            });
            Storage.save();
            Tasks.render();
            Home.render();
            Nav.updateBadges();
            Toast.show('Task added ⚡');
        }

        this.close();
        Sound.success();
    },

    /* Focus trap — Tab cycles only inside the glass */
    handleTab(e) {
        const glass   = document.getElementById('cmdGlass');
        if (!glass?.classList.contains('show')) return;

        const focusable = glass.querySelectorAll(
            'button, input, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
            if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
    }
};

/* ─── COMMAND GLASS KEYBOARD SHORTCUTS ─── */
document.addEventListener('keydown', (e) => {
    /* Ctrl+K or Cmd+K — open */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const glass = document.getElementById('cmdGlass');
        if (glass?.classList.contains('show')) CommandGlass.close();
        else CommandGlass.open();
        return;
    }

    /* Escape — global priority handler */
    if (e.key === 'Escape') {
        /* Priority 1: fullscreen pomo */
        const fsPomo = document.getElementById('fullscreenPomo');
        if (fsPomo?.classList.contains('on')) { Pomo.exitFullscreen(); return; }

        /* Priority 2: command glass */
        const glass = document.getElementById('cmdGlass');
        if (glass?.classList.contains('show')) { CommandGlass.close(); return; }

        /* Priority 3: any open modal */
        document.querySelectorAll('.modal.on').forEach(m => {
            m.classList.remove('on');
            Sound.close();
        });
        return;
    }

    /* Tab focus trap */
    if (e.key === 'Tab') CommandGlass.handleTab(e);
});

/* ─── COMMAND GLASS INPUT: Enter to submit ─── */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const glass = document.getElementById('cmdGlass');
        if (glass?.classList.contains('show')) {
            e.preventDefault();
            CommandGlass.submit();
        }
    }
});

/* ─── MODAL BACKDROP CLICK (global) ─── */
document.addEventListener('click', (e) => {
    if (e.target.classList?.contains('modal') && e.target.classList?.contains('on')) {
        e.target.classList.remove('on');
        Sound.close();
    }
});
