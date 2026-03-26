/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v2 PRO — SOUND ENGINE
═══════════════════════════════════════════════════════════ */

const Sound = (() => {
    let ctx = null;

    function getContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    function tone(freq, dur, vol = 0.08, type = 'sine', delay = 0) {
        const c = getContext();
        const now = c.currentTime + delay;
        const osc = c.createOscillator();
        const gain = c.createGain();

        osc.connect(gain);
        gain.connect(c.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

        osc.start(now);
        osc.stop(now + dur);
    }

    function play(fn) {
        if (State.data?.settings?.sound !== false) fn();
    }

    return {
        click() {
            play(() => tone(880, 0.05, 0.05));
        },

        nav() {
            play(() => {
                tone(660, 0.06, 0.04, 'triangle', 0);
                tone(880, 0.06, 0.04, 'triangle', 0.04);
            });
        },

        success() {
            play(() => {
                tone(523, 0.15, 0.06, 'sine', 0);
                tone(659, 0.15, 0.06, 'sine', 0.05);
                tone(784, 0.2, 0.06, 'sine', 0.1);
                tone(1047, 0.25, 0.07, 'triangle', 0.15);
            });
        },

        delete() {
            play(() => {
                tone(420, 0.08, 0.05, 'triangle', 0);
                tone(320, 0.1, 0.04, 'triangle', 0.05);
            });
        },

        open() {
            play(() => {
                tone(360, 0.08, 0.04, 'triangle', 0);
                tone(520, 0.08, 0.04, 'triangle', 0.05);
            });
        },

        close() {
            play(() => {
                tone(520, 0.08, 0.04, 'triangle', 0);
                tone(360, 0.08, 0.04, 'triangle', 0.05);
            });
        },

        toggle() {
            play(() => {
                tone(440, 0.08, 0.05, 'triangle', 0);
                tone(660, 0.08, 0.05, 'triangle', 0.04);
            });
        },

        timerStart() {
            play(() => {
                tone(440, 0.18, 0.06, 'triangle', 0);
                tone(660, 0.18, 0.06, 'triangle', 0.07);
                tone(880, 0.2, 0.06, 'triangle', 0.14);
            });
        },

        timerDone() {
            play(() => {
                [880, 1047, 1320].forEach((f, i) => {
                    tone(f, 0.18, 0.07, 'sine', i * 0.08);
                    tone(f, 0.15, 0.05, 'triangle', 0.35 + i * 0.08);
                });
            });
        },

        breakStart() {
            play(() => {
                tone(392, 0.2, 0.05, 'triangle', 0);
                tone(494, 0.2, 0.05, 'triangle', 0.1);
                tone(587, 0.22, 0.05, 'triangle', 0.2);
            });
        },

        achievement() {
            play(() => {
                [523, 659, 784, 1047, 1319].forEach((f, i) => {
                    tone(f, 0.2, 0.08, 'sine', i * 0.08);
                });
            });
        }
    };
})();
