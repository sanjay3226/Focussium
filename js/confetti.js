/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — CONFETTI MODULE
   SVG-based confetti particle engine
═══════════════════════════════════════════════════════════ */

const SvgConfetti = {
    layer: null,
    shapes: {
        star5:    '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="currentColor"/>',
        diamond:  '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>',
        ring:     '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="3"/>',
        lightning:'<polygon points="13,2 7,13 12,13 11,22 17,11 12,11" fill="currentColor"/>',
        cross:    '<path d="M10,2 L14,2 L14,10 L22,10 L22,14 L14,14 L14,22 L10,22 L10,14 L2,14 L2,10 L10,10 Z" fill="currentColor"/>',
        crescent: '<path d="M21,12.79A9,9,0,1,1,11.21,3,7,7,0,0,0,21,12.79Z" fill="currentColor"/>',
        triangle: '<polygon points="12,3 22,21 2,21" fill="currentColor"/>',
        spark:    '<path d="M12,2 L13.5,10.5 L22,12 L13.5,13.5 L12,22 L10.5,13.5 L2,12 L10.5,10.5 Z" fill="currentColor"/>'
    },
    colors: ['#00E5FF','#7B2DFF','#FF5757','#FFD700','#3DD9B8','#FF4D8D','#FFFFFF','#A78BFA','#F97316','#22D3EE'],

    start() {
        let layer = document.getElementById('svgConfettiLayer');
        if (!layer) {
            layer = document.createElement('div');
            layer.id = 'svgConfettiLayer';
            layer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;overflow:hidden;';
            document.body.appendChild(layer);
        }
        layer.innerHTML = '';
        this.layer = layer;
        const shapeKeys = Object.keys(this.shapes);
        for (let i = 0; i < 90; i++) setTimeout(() => this._spawn(shapeKeys), i * 20);
        setTimeout(() => { if (this.layer) this.layer.innerHTML = ''; }, 5500);
    },

    _spawn(shapeKeys) {
        if (!this.layer) return;
        const shape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        const size  = 10 + Math.random() * 22;
        const startX = Math.random() * window.innerWidth;
        const driftX = (Math.random() - 0.5) * 320;
        const dur    = 2200 + Math.random() * 1800;
        const rotEnd = (Math.random() - 0.5) * 900;
        const op     = 0.75 + Math.random() * 0.25;
        const h      = window.innerHeight;

        const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        el.setAttribute('viewBox', '0 0 24 24');
        el.setAttribute('width', size);
        el.setAttribute('height', size);
        el.style.cssText = `position:absolute;left:${startX}px;top:-40px;color:${color};opacity:${op};will-change:transform,opacity;filter:drop-shadow(0 0 5px ${color}99);`;
        el.innerHTML = this.shapes[shape];
        this.layer.appendChild(el);

        const anim = el.animate([
            { transform: 'translateY(0px) translateX(0px) rotate(0deg) scale(1)', opacity: op },
            { transform: `translateY(${h*0.45}px) translateX(${driftX*0.5}px) rotate(${rotEnd*0.5}deg) scale(0.85)`, opacity: op*0.9, offset: 0.55 },
            { transform: `translateY(${h+60}px) translateX(${driftX}px) rotate(${rotEnd}deg) scale(0.2)`, opacity: 0 }
        ], { duration: dur, easing: 'cubic-bezier(0.22,0.61,0.36,1)', fill: 'forwards' });
        anim.onfinish = () => el.remove();
    }
};
