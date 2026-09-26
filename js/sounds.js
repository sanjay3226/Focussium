/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v3 PRO — PREMIUM SYNTHESIZED SOUND ENGINE
   FM Synthesis, Resonant Delay Lines & Gamified Retro Synth Mode
   ═══════════════════════════════════════════════════════════ */

const Sound = (() => {
    let ctx = null;
    let delayNode = null;
    let delayGain = null;

    /* ═══════════════════════════════════════════════════════════
       AUTHENTIC HIGH-FIDELITY STUDIO AMBIENT AUDIO ENGINE
       Studio recordings, seamless infinite loops, smooth crossfades
       ═══════════════════════════════════════════════════════════ */
    const ambientTracks = {
        rain: [
            { src: 'sounds/rain.mp3', weight: 1.0, audio: null }
        ],
        birds: [
            { src: 'sounds/birds.mp3', weight: 1.0, audio: null }
        ],
        exam: [
            { src: 'sounds/library.mp3', weight: 0.95, audio: null },
            { src: 'sounds/clock.mp3', weight: 0.28, audio: null }
        ],
        binaural: [
            { src: 'sounds/binaural.wav', weight: 0.85, audio: null }
        ],
        fire: [
            { src: 'sounds/fire.mp3', weight: 1.0, audio: null }
        ]
    };

    let activeAmbientType = 'none';
    let currentActiveElements = [];
    let fadeInterval = null;

    function getAudioElement(item) {
        if (!item.audio) {
            item.audio = new Audio(item.src);
            item.audio.loop = true;
            item.audio.preload = 'auto';
        }
        return item.audio;
    }

    function stopAllAmbient(fadeMs = 350) {
        if (fadeInterval) {
            clearInterval(fadeInterval);
            fadeInterval = null;
        }

        const elementsToFade = [...currentActiveElements];
        currentActiveElements = [];
        activeAmbientType = 'none';

        if (elementsToFade.length === 0) return;

        const steps = 14;
        const stepTime = fadeMs / steps;
        let step = 0;

        fadeInterval = setInterval(() => {
            step++;
            const factor = Math.max(0, 1 - (step / steps));
            elementsToFade.forEach(({ audio, targetVol }) => {
                try {
                    audio.volume = Math.max(0, targetVol * factor);
                } catch(e) {}
            });

            if (step >= steps) {
                clearInterval(fadeInterval);
                fadeInterval = null;
                elementsToFade.forEach(({ audio }) => {
                    try {
                        audio.pause();
                        audio.currentTime = 0;
                    } catch(e) {}
                });
            }
        }, stepTime);
    }

    /** Safe getter for AudioContext */
    function getContext() {
        if (!ctx) {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return ctx;
    }

    /** Setup feedback delay effect line for spatial zen depth */
    function setupDelay(c) {
        if (!delayNode) {
            delayNode = c.createDelay(1.0);
            delayGain = c.createGain();

            delayNode.delayTime.value = 0.18; // 180ms delay time
            delayGain.gain.value = 0.28;      // 28% feedback gain

            delayNode.connect(delayGain);
            delayGain.connect(delayNode);
            delayNode.connect(c.destination);
        }
    }

    /** Core Synthesizer function */
    function synth({
        freq,
        dur,
        vol = 0.08,
        type = 'sine',
        modFreq = 0,
        modAmt = 0,
        delay = 0,
        useDelay = false,
        decayType = 'expo',
        pitchSweep = 0
    }) {
        try {
            const c = getContext();
            
            // Resume AudioContext if suspended by browser autoplay policy
            if (c.state === 'suspended') {
                c.resume();
            }

            const now = c.currentTime + delay;
            const osc = c.createOscillator();
            const gain = c.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);

            if (pitchSweep > 0) {
                osc.frequency.exponentialRampToValueAtTime(pitchSweep, now + dur);
            }

            // Frequency Modulation (FM Synthesis) for realistic metallic/bell timbres
            if (modFreq > 0 && modAmt > 0) {
                const modulator = c.createOscillator();
                const modGain = c.createGain();

                modulator.type = 'sine';
                modulator.frequency.value = modFreq;
                modGain.gain.value = modAmt;

                modulator.connect(modGain);
                modGain.connect(osc.frequency);

                modulator.start(now);
                modulator.stop(now + dur);
            }

            osc.connect(gain);

            if (useDelay) {
                setupDelay(c);
                gain.connect(c.destination);
                gain.connect(delayNode);
            } else {
                gain.connect(c.destination);
            }

            gain.gain.setValueAtTime(vol, now);
            if (decayType === 'linear') {
                gain.gain.linearRampToValueAtTime(0.0, now + dur);
            } else {
                gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
            }

            osc.start(now);
            osc.stop(now + dur);
        } catch (e) {
            console.warn('Synth trigger failed:', e);
        }
    }

    /** Play hook with mute & palette selector check */
    function play(fn) {
        if (State.data?.settings?.sound !== false) {
            // Ensure audio context resumes on user gesture
            const c = getContext();
            if (c && c.state === 'suspended') {
                c.resume();
            }
            fn();
        }
    }

    /** Determine current sound palette ('zen' or 'retro') */
    function getPalette() {
        return State.data?.settings?.soundPalette || 'zen';
    }

    return {
        startAmbient(type, vol = 0.4) {
            try {
                const c = getContext();
                if (c && c.state === 'suspended') {
                    c.resume();
                }

                // Backward-compatibility aliases
                if (type === 'waves') type = 'birds';
                if (type === 'brown') type = 'exam';

                if (activeAmbientType === type && currentActiveElements.length > 0) {
                    this.setAmbientVolume(vol);
                    return;
                }

                stopAllAmbient(350);

                if (type === 'none' || !ambientTracks[type]) {
                    activeAmbientType = 'none';
                    return;
                }

                activeAmbientType = type;
                const trackItems = ambientTracks[type];
                const newElements = [];

                trackItems.forEach(item => {
                    const audio = getAudioElement(item);
                    const targetVol = Math.max(0, Math.min(1, vol * item.weight));
                    audio.volume = 0;

                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            console.warn('Ambient play notice:', err);
                        });
                    }

                    newElements.push({ audio, item, targetVol });
                });

                currentActiveElements = newElements;

                const steps = 16;
                const stepTime = 400 / steps;
                let step = 0;

                const inInterval = setInterval(() => {
                    step++;
                    const factor = Math.min(1, step / steps);
                    newElements.forEach(({ audio, targetVol }) => {
                        try {
                            audio.volume = Math.min(1, Math.max(0, targetVol * factor));
                        } catch(e) {}
                    });

                    if (step >= steps) {
                        clearInterval(inInterval);
                    }
                }, stepTime);

            } catch(e) {
                console.error("Ambient audio playback error: ", e);
            }
        },

        stopAmbient() {
            stopAllAmbient(400);
        },

        setAmbientVolume(vol) {
            try {
                currentActiveElements.forEach(({ audio, item }) => {
                    const targetVol = Math.max(0, Math.min(1, vol * item.weight));
                    audio.volume = targetVol;
                });
            } catch(e) {}
        },

        click() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 1100, pitchSweep: 300, dur: 0.05, vol: 0.12, type: 'triangle', decayType: 'linear' });
                } else {
                    synth({ freq: 520, pitchSweep: 180, dur: 0.04, vol: 0.25, type: 'sine', decayType: 'linear' });
                }
            });
        },

        nav() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 300, pitchSweep: 700, dur: 0.06, vol: 0.10, type: 'square', decayType: 'linear' });
                    synth({ freq: 500, pitchSweep: 1100, dur: 0.06, vol: 0.08, type: 'square', delay: 0.04, decayType: 'linear' });
                } else {
                    synth({ freq: 660, dur: 0.15, vol: 0.12, type: 'sine', modFreq: 1320, modAmt: 150 });
                    synth({ freq: 880, dur: 0.20, vol: 0.10, type: 'sine', modFreq: 1760, modAmt: 200, delay: 0.04 });
                }
            });
        },

        success() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 440, dur: 0.06, vol: 0.12, type: 'square' });
                    synth({ freq: 554, dur: 0.06, vol: 0.12, type: 'square', delay: 0.04 });
                    synth({ freq: 659, dur: 0.06, vol: 0.12, type: 'square', delay: 0.08 });
                    synth({ freq: 880, dur: 0.16, vol: 0.15, type: 'square', delay: 0.12 });
                } else {
                    const notes = [523, 587, 659, 784, 880];
                    notes.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 0.35 + i * 0.04,
                            vol: 0.15,
                            type: 'sine',
                            modFreq: f * 2,
                            modAmt: 120,
                            delay: i * 0.05,
                            useDelay: true
                        });
                    });
                }
            });
        },

        delete() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 780, pitchSweep: 80, dur: 0.14, vol: 0.14, type: 'sawtooth', decayType: 'linear' });
                } else {
                    synth({ freq: 380, pitchSweep: 140, dur: 0.14, vol: 0.20, type: 'sine', decayType: 'linear' });
                }
            });
        },

        open() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 400, pitchSweep: 800, dur: 0.10, vol: 0.12, type: 'triangle', decayType: 'linear' });
                } else {
                    synth({ freq: 300, pitchSweep: 480, dur: 0.16, vol: 0.18, type: 'sine', decayType: 'linear' });
                }
            });
        },

        close() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 800, pitchSweep: 400, dur: 0.10, vol: 0.12, type: 'triangle', decayType: 'linear' });
                } else {
                    synth({ freq: 480, pitchSweep: 300, dur: 0.16, vol: 0.18, type: 'sine', decayType: 'linear' });
                }
            });
        },

        toggle() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 600, pitchSweep: 850, dur: 0.05, vol: 0.12, type: 'square' });
                    synth({ freq: 850, pitchSweep: 600, dur: 0.05, vol: 0.12, type: 'square', delay: 0.04 });
                } else {
                    synth({ freq: 392, dur: 0.08, vol: 0.15, type: 'sine', modFreq: 784, modAmt: 80 });
                    synth({ freq: 587, dur: 0.12, vol: 0.12, type: 'sine', modFreq: 1174, modAmt: 100, delay: 0.03 });
                }
            });
        },

        timerStart() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 987, dur: 0.08, vol: 0.14, type: 'square' });
                    synth({ freq: 1318, dur: 0.22, vol: 0.18, type: 'square', delay: 0.06 });
                } else {
                    synth({ freq: 196, dur: 1.8, vol: 0.35, type: 'sine', useDelay: true });
                    synth({ freq: 294, dur: 1.4, vol: 0.20, type: 'sine', modFreq: 588, modAmt: 30, useDelay: true, delay: 0.03 });
                    synth({ freq: 392, dur: 1.1, vol: 0.12, type: 'triangle', useDelay: true, delay: 0.06 });
                }
            });
        },

        timerDone() {
            play(() => {
                if (getPalette() === 'retro') {
                    const retroNotes = [523, 659, 784, 1047, 1318, 1568];
                    retroNotes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.06, vol: 0.14, type: 'square', delay: i * 0.05 });
                    });
                    synth({ freq: 1047, dur: 0.4, vol: 0.18, type: 'square', delay: 0.3, useDelay: true });
                } else {
                    const harmonies = [523, 659, 784, 1047];
                    harmonies.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 1.2,
                            vol: 0.18,
                            type: 'sine',
                            modFreq: f * 3,
                            modAmt: 100,
                            delay: i * 0.08,
                            useDelay: true
                        });
                    });
                }
            });
        },

        breakStart() {
            play(() => {
                if (getPalette() === 'retro') {
                    synth({ freq: 784, pitchSweep: 392, dur: 0.22, vol: 0.14, type: 'triangle', decayType: 'linear' });
                } else {
                    synth({ freq: 220, dur: 1.5, vol: 0.25, type: 'sine', useDelay: true });
                    synth({ freq: 440, dur: 1.1, vol: 0.15, type: 'sine', modFreq: 880, modAmt: 40, useDelay: true, delay: 0.03 });
                }
            });
        },

        levelUp() {
            play(() => {
                if (getPalette() === 'retro') {
                    const notes = [261, 329, 392, 523, 659, 784, 1047, 1318];
                    notes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.05, vol: 0.14, type: 'square', delay: i * 0.04 });
                    });
                    [784, 1047, 1318, 1568].forEach((f, i) => {
                        synth({ freq: f, dur: 0.6, vol: 0.15, type: 'triangle', delay: 0.32 + i * 0.02, useDelay: true });
                    });
                } else {
                    const notes = [261, 329, 392, 523, 659];
                    notes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.4, vol: 0.20, type: 'sine', delay: i * 0.05 });
                    });
                    const chord = [784, 987, 1174, 1480];
                    chord.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 1.8,
                            vol: 0.18,
                            type: 'sine',
                            modFreq: f * 2,
                            modAmt: 250,
                            delay: 0.25 + i * 0.04,
                            useDelay: true
                        });
                    });
                }
            });
        }
    };
})();
