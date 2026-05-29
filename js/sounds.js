/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM v3 PRO — PREMIUM SYNTHESIZED SOUND ENGINE
   FM Synthesis, Resonant Delay Lines & Gamified Retro Synth Mode
   ═══════════════════════════════════════════════════════════ */

const Sound = (() => {
    let ctx = null;
    let delayNode = null;
    let delayGain = null;

    let ambientSourceNode = null;
    let ambientVolumeNode = null;
    let ambientOscNodes = [];
    let ambientLfoNode = null;
    let activeAmbientType = 'none';

    function createBrownNoiseBuffer(c) {
        const bufferSize = 4 * c.sampleRate; // 4 second loop
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const output = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = output[i];
            output[i] *= 5.5; // Compensate for volume drop — louder base
        }
        return buffer;
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
                if (c.state === 'suspended') {
                    c.resume();
                }

                if (activeAmbientType === type && ambientVolumeNode) {
                    this.setAmbientVolume(vol);
                    return;
                }

                this.stopAmbient();
                activeAmbientType = type;
                if (type === 'none') return;

                ambientVolumeNode = c.createGain();
                ambientVolumeNode.gain.setValueAtTime(0.0001, c.currentTime);
                ambientVolumeNode.gain.exponentialRampToValueAtTime(vol * 0.35, c.currentTime + 1.5);
                ambientVolumeNode.connect(c.destination);

                if (type === 'rain') {
                    const noiseBuffer = createBrownNoiseBuffer(c);
                    ambientSourceNode = c.createBufferSource();
                    ambientSourceNode.buffer = noiseBuffer;
                    ambientSourceNode.loop = true;

                    const lowpass = c.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.setValueAtTime(700, c.currentTime);

                    ambientLfoNode = c.createOscillator();
                    ambientLfoNode.frequency.value = 0.12;
                    const lfoGain = c.createGain();
                    lfoGain.gain.value = 150;

                    ambientLfoNode.connect(lfoGain);
                    lfoGain.connect(lowpass.frequency);

                    ambientSourceNode.connect(lowpass);
                    lowpass.connect(ambientVolumeNode);

                    ambientLfoNode.start();
                    ambientSourceNode.start();
                } 
                else if (type === 'waves') {
                    const noiseBuffer = createBrownNoiseBuffer(c);
                    ambientSourceNode = c.createBufferSource();
                    ambientSourceNode.buffer = noiseBuffer;
                    ambientSourceNode.loop = true;

                    const lowpass = c.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.setValueAtTime(350, c.currentTime);

                    ambientLfoNode = c.createOscillator();
                    ambientLfoNode.frequency.value = 0.08;
                    const lfoGain = c.createGain();
                    lfoGain.gain.value = 120;

                    ambientLfoNode.connect(lfoGain);
                    lfoGain.connect(lowpass.frequency);

                    const panner = c.createStereoPanner ? c.createStereoPanner() : null;
                    const panOsc = c.createOscillator();
                    panOsc.frequency.value = 0.06;
                    
                    if (panner) {
                        panOsc.connect(panner.pan);
                        panOsc.start();
                        ambientOscNodes.push(panOsc);

                        ambientSourceNode.connect(lowpass);
                        lowpass.connect(panner);
                        panner.connect(ambientVolumeNode);
                    } else {
                        ambientSourceNode.connect(lowpass);
                        lowpass.connect(ambientVolumeNode);
                    }

                    ambientLfoNode.start();
                    ambientSourceNode.start();
                }
                else if (type === 'binaural') {
                    const oscL = c.createOscillator();
                    const oscR = c.createOscillator();
                    oscL.frequency.value = 160;
                    oscR.frequency.value = 165;

                    const pannerL = c.createStereoPanner ? c.createStereoPanner() : null;
                    const pannerR = c.createStereoPanner ? c.createStereoPanner() : null;

                    if (pannerL && pannerR) {
                        pannerL.pan.value = -0.8;
                        pannerR.pan.value = 0.8;

                        oscL.connect(pannerL);
                        pannerL.connect(ambientVolumeNode);

                        oscR.connect(pannerR);
                        pannerR.connect(ambientVolumeNode);
                    } else {
                        oscL.connect(ambientVolumeNode);
                        oscR.connect(ambientVolumeNode);
                    }

                    oscL.start();
                    oscR.start();
                    ambientOscNodes.push(oscL, oscR);
                }
                else if (type === 'brown') {
                    const noiseBuffer = createBrownNoiseBuffer(c);
                    ambientSourceNode = c.createBufferSource();
                    ambientSourceNode.buffer = noiseBuffer;
                    ambientSourceNode.loop = true;

                    const lowpass = c.createBiquadFilter();
                    lowpass.type = 'lowpass';
                    lowpass.frequency.value = 250;

                    ambientSourceNode.connect(lowpass);
                    lowpass.connect(ambientVolumeNode);

                    ambientSourceNode.start();
                }
            } catch(e) {
                console.error("Ambient audio synthesis error: ", e);
            }
        },

        stopAmbient() {
            try {
                const c = getContext();
                if (ambientVolumeNode) {
                    const currentVol = ambientVolumeNode.gain.value;
                    ambientVolumeNode.gain.setValueAtTime(currentVol, c.currentTime);
                    ambientVolumeNode.gain.linearRampToValueAtTime(0.0001, c.currentTime + 1.0);
                }

                const source = ambientSourceNode;
                const volume = ambientVolumeNode;
                const oscs = [...ambientOscNodes];
                const lfo = ambientLfoNode;

                setTimeout(() => {
                    try { if (source) source.stop(); } catch(e) {}
                    try { if (source) source.disconnect(); } catch(e) {}
                    try { if (lfo) lfo.stop(); } catch(e) {}
                    try { if (lfo) lfo.disconnect(); } catch(e) {}
                    oscs.forEach(osc => {
                        try { osc.stop(); } catch(e) {}
                        try { osc.disconnect(); } catch(e) {}
                    });
                    try { if (volume) volume.disconnect(); } catch(e) {}
                }, 1100);

                ambientSourceNode = null;
                ambientVolumeNode = null;
                ambientOscNodes = [];
                ambientLfoNode = null;
                activeAmbientType = 'none';
            } catch(e) {
                console.error("Ambient audio stop error: ", e);
            }
        },

        setAmbientVolume(vol) {
            try {
                const c = getContext();
                if (ambientVolumeNode) {
                    ambientVolumeNode.gain.setValueAtTime(ambientVolumeNode.gain.value, c.currentTime);
                    ambientVolumeNode.gain.linearRampToValueAtTime(vol * 0.35, c.currentTime + 0.1);
                }
            } catch(e) {}
        },

        click() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: sharp high-passed laser blip
                    synth({ freq: 1100, pitchSweep: 300, dur: 0.05, vol: 0.05, type: 'triangle', decayType: 'linear' });
                } else {
                    // Zen: organic fast woodblock pop
                    synth({ freq: 520, pitchSweep: 180, dur: 0.04, vol: 0.12, type: 'sine', decayType: 'linear' });
                }
            });
        },

        nav() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: Bouncy double sound
                    synth({ freq: 300, pitchSweep: 700, dur: 0.06, vol: 0.04, type: 'square', decayType: 'linear' });
                    synth({ freq: 500, pitchSweep: 1100, dur: 0.06, vol: 0.03, type: 'square', delay: 0.04, decayType: 'linear' });
                } else {
                    // Zen: Floating dual FM bell chimes
                    synth({ freq: 660, dur: 0.15, vol: 0.04, type: 'sine', modFreq: 1320, modAmt: 150 });
                    synth({ freq: 880, dur: 0.20, vol: 0.03, type: 'sine', modFreq: 1760, modAmt: 200, delay: 0.04 });
                }
            });
        },

        success() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: Arcade rapid arpeggio power-up
                    synth({ freq: 440, dur: 0.06, vol: 0.04, type: 'square' });
                    synth({ freq: 554, dur: 0.06, vol: 0.04, type: 'square', delay: 0.04 });
                    synth({ freq: 659, dur: 0.06, vol: 0.04, type: 'square', delay: 0.08 });
                    synth({ freq: 880, dur: 0.16, vol: 0.05, type: 'square', delay: 0.12 });
                } else {
                    // Zen: Floating ascending major-pentatonic chimes with spatial delay
                    const notes = [523, 587, 659, 784, 880];
                    notes.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 0.35 + i * 0.04,
                            vol: 0.045,
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
                    // Retro: laser shot down
                    synth({ freq: 780, pitchSweep: 80, dur: 0.14, vol: 0.06, type: 'sawtooth', decayType: 'linear' });
                } else {
                    // Zen: descending wooden drawer slide
                    synth({ freq: 380, pitchSweep: 140, dur: 0.14, vol: 0.08, type: 'sine', decayType: 'linear' });
                }
            });
        },

        open() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: rising tone
                    synth({ freq: 400, pitchSweep: 800, dur: 0.10, vol: 0.04, type: 'triangle', decayType: 'linear' });
                } else {
                    // Zen: smooth physical sliding glide up
                    synth({ freq: 300, pitchSweep: 480, dur: 0.16, vol: 0.06, type: 'sine', decayType: 'linear' });
                }
            });
        },

        close() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: falling tone
                    synth({ freq: 800, pitchSweep: 400, dur: 0.10, vol: 0.04, type: 'triangle', decayType: 'linear' });
                } else {
                    // Zen: smooth physical sliding glide down
                    synth({ freq: 480, pitchSweep: 300, dur: 0.16, vol: 0.06, type: 'sine', decayType: 'linear' });
                }
            });
        },

        toggle() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: quick bouncy chirps
                    synth({ freq: 600, pitchSweep: 850, dur: 0.05, vol: 0.04, type: 'square' });
                    synth({ freq: 850, pitchSweep: 600, dur: 0.05, vol: 0.04, type: 'square', delay: 0.04 });
                } else {
                    // Zen: clean soft dual chime
                    synth({ freq: 392, dur: 0.08, vol: 0.05, type: 'sine', modFreq: 784, modAmt: 80 });
                    synth({ freq: 587, dur: 0.12, vol: 0.04, type: 'sine', modFreq: 1174, modAmt: 100, delay: 0.03 });
                }
            });
        },

        timerStart() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: countdown coin chime
                    synth({ freq: 987, dur: 0.08, vol: 0.05, type: 'square' });
                    synth({ freq: 1318, dur: 0.22, vol: 0.06, type: 'square', delay: 0.06 });
                } else {
                    // Zen: Resonant Japanese singing bowl base drone & floating overtones
                    synth({ freq: 196, dur: 1.8, vol: 0.12, type: 'sine', useDelay: true });
                    synth({ freq: 294, dur: 1.4, vol: 0.06, type: 'sine', modFreq: 588, modAmt: 30, useDelay: true, delay: 0.03 });
                    synth({ freq: 392, dur: 1.1, vol: 0.03, type: 'triangle', useDelay: true, delay: 0.06 });
                }
            });
        },

        timerDone() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: Rapid arpeggiating victory fanfare
                    const retroNotes = [523, 659, 784, 1047, 1318, 1568];
                    retroNotes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.06, vol: 0.05, type: 'square', delay: i * 0.05 });
                    });
                    synth({ freq: 1047, dur: 0.4, vol: 0.06, type: 'square', delay: 0.3, useDelay: true });
                } else {
                    // Zen: Temple chime triple harmony chord
                    const harmonies = [523, 659, 784, 1047];
                    harmonies.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 1.2,
                            vol: 0.055,
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
                    // Retro: Calm retro whistle
                    synth({ freq: 784, pitchSweep: 392, dur: 0.22, vol: 0.05, type: 'triangle', decayType: 'linear' });
                } else {
                    // Zen: Medium singing bowl floating chord
                    synth({ freq: 220, dur: 1.5, vol: 0.10, type: 'sine', useDelay: true });
                    synth({ freq: 440, dur: 1.1, vol: 0.05, type: 'sine', modFreq: 880, modAmt: 40, useDelay: true, delay: 0.03 });
                }
            });
        },

        levelUp() {
            play(() => {
                if (getPalette() === 'retro') {
                    // Retro: Huge celebratory scale sweep and trill!
                    const notes = [261, 329, 392, 523, 659, 784, 1047, 1318];
                    notes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.05, vol: 0.05, type: 'square', delay: i * 0.04 });
                    });
                    // Bouncy chord
                    [784, 1047, 1318, 1568].forEach((f, i) => {
                        synth({ freq: f, dur: 0.6, vol: 0.04, type: 'triangle', delay: 0.32 + i * 0.02, useDelay: true });
                    });
                } else {
                    // Zen: Epic celestial pentatonic sweep running into a sparkling major-7th chime sweep
                    const notes = [261, 329, 392, 523, 659]; // C4, E4, G4, C5, E5 arpeggio
                    notes.forEach((f, i) => {
                        synth({ freq: f, dur: 0.4, vol: 0.06, type: 'sine', delay: i * 0.05 });
                    });
                    // Celestial major 7th chord (G5, B5, D6, F#6) spatial chimes
                    const chord = [784, 987, 1174, 1480];
                    chord.forEach((f, i) => {
                        synth({
                            freq: f,
                            dur: 1.8,
                            vol: 0.05,
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
