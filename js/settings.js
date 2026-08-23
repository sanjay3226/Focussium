/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — SETTINGS MODULE
   All preferences — theme, accent, timer, sound, avatar
═══════════════════════════════════════════════════════════ */

const Settings = {
    open() {
        document.getElementById('settingsModal')?.classList.add('on');
        this.render();
        Sound.open();
    },

    close() {
        document.getElementById('settingsModal')?.classList.remove('on');
        Sound.close();
    },

    render() {
        const s = State.data.settings;

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === s.theme);
        });

        // Sound toggle
        document.getElementById('soundToggle')?.classList.toggle('on', s.sound);

        // Timer values
        [
            ['focusDurValue',  s.focusDur],
            ['breakDurValue',  s.breakDur],
            ['longDurValue',   s.longDur],
            ['sessionsValue',  s.sessions],
        ].forEach(([id, val]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        });

        this.renderAccents();
        this.renderAvatars();
        this.renderSoundPalette();
    },

    /* ─── ACCENTS ─── */
    renderAccents() {
        const container = document.getElementById('accentButtons');
        if (!container) return;

        container.innerHTML = ACCENTS.map(a => {
            const isActive = State.data.settings.accent === a.id;
            return `<div class="accent-btn ${isActive ? 'active' : ''}"
                 style="background:${a.c}"
                 data-action="set-accent" data-accent="${a.id}"
                 title="${a.n}"></div>`;
        }).join('');

        const picker   = document.getElementById('customColorPicker');
        const isCustom = State.data.settings.accent === 'custom';
        const swatch   = document.getElementById('customColorSwatch');
        const hexInput = document.getElementById('customHexInput');
        const nativeIn = document.getElementById('customColorNative');

        if (isCustom && State.data.settings.customHex) {
            if (swatch)   { swatch.style.background = `#${State.data.settings.customHex}`; swatch.classList.add('has-color'); }
            if (hexInput) hexInput.value = State.data.settings.customHex.toUpperCase();
            if (nativeIn) nativeIn.value = `#${State.data.settings.customHex}`;
            picker?.classList.add('active');
        } else {
            if (swatch)   { swatch.style.background = ''; swatch.classList.remove('has-color'); }
            if (hexInput) hexInput.value = '';
            picker?.classList.remove('active');
        }
    },

    setAccent(accent) {
        State.data.settings.accent    = accent;
        State.data.settings.customHex = '';
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
    },

    applyCustomColor() {
        const hexInput = document.getElementById('customHexInput');
        let hex = hexInput?.value.trim().replace('#', '') || '';
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
            Toast.show('Enter a valid 6-digit hex code');
            hexInput?.focus();
            return;
        }
        State.data.settings.accent    = 'custom';
        State.data.settings.customHex = hex;
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
        Toast.show('Custom accent applied ✨');
    },

    updateCustomSwatch() {
        const swatch   = document.getElementById('customColorSwatch');
        const hexInput = document.getElementById('customHexInput');
        if (!swatch || !hexInput) return;

        let hex = hexInput.value.trim().replace('#', '');
        if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            swatch.style.background = `#${hex}`;
            swatch.classList.add('has-color');
        } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
            const exp = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            swatch.style.background = `#${exp}`;
            swatch.classList.add('has-color');
        } else {
            swatch.style.background = '';
            swatch.classList.remove('has-color');
        }
    },

    /* ─── THEME ─── */
    setTheme(theme) {
        State.data.settings.theme = theme;
        Theme.apply();
        Storage.save();
        this.render();
        Sound.toggle();
    },

    /* ─── SOUND ─── */
    toggleSound() {
        State.data.settings.sound = !State.data.settings.sound;
        Storage.save();
        this.render();
        Sound.toggle();
    },

    /* ─── SOUND PALETTE ─── */
    renderSoundPalette() {
        const container = document.getElementById('paletteButtonsContainer');
        if (!container) return;
        const current = State.data.settings.soundPalette || 'zen';
        container.innerHTML = `
            <button class="palette-btn ${current === 'zen' ? 'active' : ''}" data-action="set-sound-palette" data-palette="zen">Zen</button>
            <button class="palette-btn ${current === 'retro' ? 'active' : ''}" data-action="set-sound-palette" data-palette="retro">Retro</button>`;
    },

    setSoundPalette(palette) {
        State.data.settings.soundPalette = palette;
        Storage.save();
        this.renderSoundPalette();
        Sound.toggle();
        Toast.show(`Sound Vibe: ${palette === 'retro' ? 'Retro Synth 🕹️' : 'Zen Chimes 🪷'}`);
    },

    /* ─── TIMER ADJUST ─── */
    adjust(key, delta) {
        const limits = { focusDur: [5,120], breakDur: [1,30], longDur: [5,60], sessions: [1,10] };
        const [min, max] = limits[key] || [1, 999];
        State.data.settings[key] = Math.max(min, Math.min(max, State.data.settings[key] + delta));
        Storage.save();
        this.render();
        if (!State.pomo.running) Pomo.init();
        Sound.click();
    },

    /* ─── AVATARS ─── */
    renderAvatars() {
        const container = document.getElementById('avatarButtons');
        if (!container) return;

        const userPhoto = State.user?.photoURL;
        const avatarList = [
            { id: 'default', n: 'Explorer',          icon: 'user' },
            ...(userPhoto ? [{ id: 'google', n: 'Google Profile', type: 'img', src: userPhoto }] : []),
            { id: 'seed',    n: 'Zen Focus Seed',    icon: 'seed' },
            { id: 'lotus',   n: 'Zen Lotus',         icon: 'lotus' },
            { id: 'voyager', n: 'Astro Voyager',     icon: 'voyager' },
            { id: 'deity',   n: 'Zen Deity',         icon: 'deity' },
            { id: 'custom',  n: 'Custom Photo',      type: 'custom' },
        ];

        container.innerHTML = avatarList.map(av => {
            const isActive = (State.data.settings.avatar || 'default') === av.id;
            let inner = '';
            if (av.type === 'img') {
                inner = `<img src="${av.src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="${av.n}">`;
            } else if (av.type === 'custom') {
                const cu = State.data.settings?.customAvatarDataUrl;
                inner = cu ? `<img src="${cu}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="custom">` : `📸`;
            } else {
                inner = `<span style="font-size:1.4rem;">${{seed:'🌱',lotus:'🪷',voyager:'🚀',deity:'⚡',user:'👤'}[av.icon] || '👤'}</span>`;
            }
            return `<button class="avatar-btn ${isActive ? 'active' : ''}"
                         data-action="set-avatar" data-avatar="${av.id}"
                         title="${av.n}">${inner}</button>`;
        }).join('');

        this.applyAvatarDisplay();
    },

    setAvatar(id) {
        if (id === 'custom' && !State.data.settings?.customAvatarDataUrl) {
            document.getElementById('avatarFileInput')?.click();
            return;
        }
        State.data.settings.avatar = id;
        Storage.save();
        this.renderAvatars();
        Sound.toggle();
        Toast.show('Avatar updated 🔮');
    },

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) { Toast.show('Upload a valid image'); return; }
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 120;
                const ctx = canvas.getContext('2d');
                const min = Math.min(img.width, img.height);
                ctx.drawImage(img, (img.width-min)/2, (img.height-min)/2, min, min, 0, 0, 120, 120);
                State.data.settings.customAvatarDataUrl = canvas.toDataURL('image/jpeg', 0.85);
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
        const active  = State.data?.settings?.avatar || 'default';
        const imgEl   = document.getElementById('userAvatar');
        const userPhoto = State.user?.photoURL;
        if (!imgEl) return;

        if (active === 'google' && userPhoto) {
            imgEl.src = userPhoto; imgEl.style.display = 'block';
        } else if (active === 'custom' && State.data.settings?.customAvatarDataUrl) {
            imgEl.src = State.data.settings.customAvatarDataUrl; imgEl.style.display = 'block';
        } else {
            imgEl.style.display = 'none';
        }
    },

    /* ─── CLEAR ALL DATA ─── */
    clearData() {
        if (!confirm('Delete all data? This cannot be undone.')) return;
        State.data = Utils.clone(State.defaults);
        State.data.onboarded = true;
        Storage.save();
        document.getElementById('settingsModal')?.classList.remove('on');
        App.init();
        Toast.show('All data cleared');
    }
};

/* ─── SETTINGS EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    const el = e.target.closest('[data-action]');

    if (action === 'set-accent')       Settings.setAccent(el.dataset.accent);
    if (action === 'set-avatar')       Settings.setAvatar(el.dataset.avatar);
    if (action === 'set-sound-palette') Settings.setSoundPalette(el.dataset.palette);
});

/* ─── COLOUR PICKER INPUT EVENTS (attached after DOM ready) ─── */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('customHexInput')?.addEventListener('input',   () => Settings.updateCustomSwatch());
    document.getElementById('customHexInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') Settings.applyCustomColor(); });
    document.getElementById('customColorNative')?.addEventListener('input', (e) => {
        const hex = e.target.value.replace('#', '');
        const hexInput = document.getElementById('customHexInput');
        if (hexInput) hexInput.value = hex.toUpperCase();
        Settings.updateCustomSwatch();
    });
    document.getElementById('customColorNative')?.addEventListener('change', (e) => {
        const hex = e.target.value.replace('#', '');
        const hexInput = document.getElementById('customHexInput');
        if (hexInput) hexInput.value = hex.toUpperCase();
        Settings.updateCustomSwatch();
        Settings.applyCustomColor();
    });
});
