/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — ONBOARDING MODULE
   Welcome flow — 5-step first-run experience
═══════════════════════════════════════════════════════════ */

const Onboard = {
    show() {
        document.getElementById('onboardScreen')?.classList.add('show');
        State.onboardStep = 0;
        this.render();
        this.renderColors();
    },

    renderColors() {
        const container = document.getElementById('onboardColors');
        if (!container) return;
        container.innerHTML = ACCENTS.map(a =>
            `<div class="onboard-color ${State.data.settings.accent === a.id ? 'active' : ''}"
                  data-accent="${a.id}"
                  style="background:${a.c}"
                  title="${a.n}"></div>`
        ).join('');

        // Use event delegation instead of inline onclick
        container.onclick = (e) => {
            const swatch = e.target.closest('.onboard-color');
            if (swatch) this.setAccent(swatch.dataset.accent);
        };
    },

    render() {
        document.querySelectorAll('.onboard-step').forEach((step, i) => {
            step.classList.toggle('active', i === State.onboardStep);
        });

        const dotsEl = document.getElementById('onboardDots');
        if (dotsEl) {
            dotsEl.innerHTML = Array.from({ length: 5 }, (_, i) =>
                `<div class="onboard-dot ${i === State.onboardStep ? 'active' : ''}"></div>`
            ).join('');
        }
    },

    next() {
        if (State.onboardStep === 1) {
            const nameInput = document.getElementById('onboardName');
            State.data.name = nameInput?.value.trim() || '';
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
        // Initialize habitConfig from defaults on first run
        if (!State.data.habitConfig?.length) {
            State.data.habitConfig = Utils.clone(DEFAULT_HABITS);
        }
        Storage.save();
        document.getElementById('onboardScreen')?.classList.remove('show');
        document.getElementById('app')?.classList.add('show');
        App.init();
        Sound.success();
    }
};
