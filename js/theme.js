/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — THEME MODULE
   Theme + accent application engine
═══════════════════════════════════════════════════════════ */

const Theme = {
    hexToRGB(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
    },

    lightenHex(hex, amount = 40) {
        const { r, g, b } = this.hexToRGB(hex);
        const lr = Math.min(255, r + amount);
        const lg = Math.min(255, g + amount);
        const lb = Math.min(255, b + amount);
        return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
    },

    darkenHex(hex, amount = 30) {
        const { r, g, b } = this.hexToRGB(hex);
        const dr = Math.max(0, r - amount);
        const dg = Math.max(0, g - amount);
        const db = Math.max(0, b - amount);
        return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    },

    shiftHue(hex, shift = 30) {
        const { r, g, b } = this.hexToRGB(hex);
        let h, s, l;
        const rr = r / 255, gg = g / 255, bb = b / 255;
        const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
        l = (max + min) / 2;
        if (max === min) { h = s = 0; } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
            else if (max === gg) h = ((bb - rr) / d + 2) / 6;
            else h = ((rr - gg) / d + 4) / 6;
        }
        h = ((h * 360 + shift) % 360) / 360;
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1; if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        let nr, ng, nb;
        if (s === 0) { nr = ng = nb = l; } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            nr = hue2rgb(p, q, h + 1/3);
            ng = hue2rgb(p, q, h);
            nb = hue2rgb(p, q, h - 1/3);
        }
        return `#${Math.round(nr*255).toString(16).padStart(2,'0')}${Math.round(ng*255).toString(16).padStart(2,'0')}${Math.round(nb*255).toString(16).padStart(2,'0')}`;
    },

    /* ── Relative luminance (WCAG 2.1 formula) ── */
    luminance(r, g, b) {
        const [rs, gs, bs] = [r, g, b].map(c => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    },

    /* ── Contrast ratio between two luminances ── */
    contrastRatio(lum1, lum2) {
        const lighter = Math.max(lum1, lum2);
        const darker  = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    },

    /* ── Auto text colour on accent (black or white for WCAG AA) ── */
    accentTextColor(r, g, b) {
        const lum = this.luminance(r, g, b);
        const onWhite = this.contrastRatio(lum, 1);
        const onBlack = this.contrastRatio(lum, 0);
        return onBlack >= onWhite ? '#000000' : '#FFFFFF';
    },

    /* ── Dark-shift for bright colours on light theme ── */
    ensureReadableOnLight(r, g, b) {
        const lum = this.luminance(r, g, b);
        // If contrast on white < 4.5:1 (WCAG AA), darken the colour
        if (this.contrastRatio(lum, 1) < 4.5) {
            // Shift to HSL, drop lightness to ~35%
            return this._toHSLDark(r, g, b, 35);
        }
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    },

    _toHSLDark(r, g, b, targetL) {
        // Convert to HSL, clamp L, return hex
        const rr = r/255, gg = g/255, bb = b/255;
        const max = Math.max(rr,gg,bb), min = Math.min(rr,gg,bb);
        let h, s, l = (max+min)/2;
        if (max === min) { h = s = 0; }
        else {
            const d = max-min;
            s = l > 0.5 ? d/(2-max-min) : d/(max+min);
            if (max === rr) h = ((gg-bb)/d + (gg<bb?6:0))/6;
            else if (max === gg) h = ((bb-rr)/d+2)/6;
            else h = ((rr-gg)/d+4)/6;
        }
        l = targetL / 100;
        // HSL back to RGB
        const hue2rgb = (p,q,t) => {
            if (t<0) t+=1; if (t>1) t-=1;
            if (t<1/6) return p+(q-p)*6*t;
            if (t<1/2) return q;
            if (t<2/3) return p+(q-p)*(2/3-t)*6;
            return p;
        };
        let nr,ng,nb;
        if (s===0) { nr=ng=nb=l; }
        else {
            const q = l<0.5 ? l*(1+s) : l+s-l*s;
            const p = 2*l-q;
            nr = hue2rgb(p,q,h+1/3);
            ng = hue2rgb(p,q,h);
            nb = hue2rgb(p,q,h-1/3);
        }
        const toHex = n => Math.round(n*255).toString(16).padStart(2,'0');
        return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
    },

    applyCustomAccent(hex) {
        hex = hex.replace('#', '');
        if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return;

        const root    = document.documentElement;
        const theme   = root.getAttribute('data-theme') || 'dark';
        let color     = `#${hex}`;
        let { r, g, b } = this.hexToRGB(color);

        // On light theme: auto-darken bright/low-contrast colours
        if (theme === 'light') {
            const readableColor = this.ensureReadableOnLight(r, g, b);
            if (readableColor !== color) {
                color   = readableColor;
                ({ r, g, b } = this.hexToRGB(color));
            }
        }

        const lighter  = this.lightenHex(color, 40);
        const darker   = this.darkenHex(color, 30);
        const gradEnd  = this.shiftHue(color, 30);
        const acText   = this.accentTextColor(r, g, b);

        root.style.setProperty('--ac',      color);
        root.style.setProperty('--acr',     `${r}, ${g}, ${b}`);
        root.style.setProperty('--acl',     lighter);
        root.style.setProperty('--acd',     darker);
        root.style.setProperty('--acg',     `rgba(${r}, ${g}, ${b}, .2)`);
        root.style.setProperty('--acgr',    `linear-gradient(135deg, ${color}, ${gradEnd})`);
        root.style.setProperty('--acs',     `rgba(${r}, ${g}, ${b}, .12)`);
        root.style.setProperty('--ac-text', acText);
    },

    clearCustomAccent() {
        const root = document.documentElement;
        // --ac-text MUST also be cleared so preset accents use their own CSS-defined value
        ['--ac', '--acr', '--acl', '--acd', '--acg', '--acgr', '--acs', '--ac-text'].forEach(p => {
            root.style.removeProperty(p);
        });
    },

    apply() {
        let theme = State.data?.settings?.theme || 'dark';
        if (theme === 'system') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', theme);

        if (State.data?.settings?.accent === 'custom' && State.data?.settings?.customHex) {
            // Use data-accent="custom" — no CSS rules target this value,
            // so the inline CSS vars set by applyCustomAccent() always win.
            // Previously used "royal" which caused light-theme royal overrides
            // to stomp inline custom colour vars. Fixed.
            document.documentElement.setAttribute('data-accent', 'custom');
            this.applyCustomAccent(State.data.settings.customHex);
        } else {
            this.clearCustomAccent();
            document.documentElement.setAttribute('data-accent', State.data?.settings?.accent || 'neon');
        }

        // Dynamic Three.js Background Swapping
        const bgContainer = document.getElementById('threeJsBg');
        if (bgContainer) {
            bgContainer.innerHTML = '';
            if (theme === 'light' && typeof window.initThreeBgLight === 'function') {
                window.initThreeBgLight();
            } else if (typeof window.initThreeBg === 'function') {
                window.initThreeBg();
            }
        }
    }
};

// System preference change listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (State.data?.settings?.theme === 'system') Theme.apply();
});
