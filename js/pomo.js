/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — POMODORO MODULE
   Timer engine with ambient sound, notifications, fullscreen
═══════════════════════════════════════════════════════════ */

const Pomo = {
    liveInsights: [
        'Settle in. The hardest part is starting.',
        'Mute the noise. Find your flow.',
        'Your future self will thank you for this block of time.',
        'Breathe. One task at a time.',
        'Deep work is a superpower. You\'re building it now.',
        'Distractions are cheap. Focus is expensive.',
        'You are exactly where you need to be.',
        'Let go of perfection. Just make progress.',
        'Momentum builds silently. Keep pushing.',
        'Protect this time. The world can wait.'
    ],
    currentInsightIndex: 0,
    insightInterval: null,

    init() {
        State.pomo.left  = State.data.settings.focusDur * 60;
        State.pomo.total = State.pomo.left;
        State.pomo.mode  = 'focus';
        this.updateDisplay();
        this.renderDots();
        this.updatePlayButton(false);
        this.cycleInsight(true);
        this.initAmbientUI();
    },

    initAmbientUI() {
        const icon = document.getElementById('ambientVolIcon');
        if (icon) icon.innerHTML = Icons.volume(12);

        if (!State.data.settings) State.data.settings = {};
        const sound = State.data.settings.ambientSound || 'none';
        const vol   = State.data.settings.ambientVol !== undefined ? State.data.settings.ambientVol : 40;

        document.querySelectorAll('.ambient-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === sound);
        });

        const slider = document.getElementById('ambientVolumeSlider');
        if (slider) {
            slider.value = vol;
            slider.style.setProperty('--val', vol + '%');
        }
    },

    setAmbient(type) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.ambientSound = type;
        Storage.save();

        document.querySelectorAll('.ambient-icon-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === type);
        });

        if (type !== 'none') {
            const vol = State.data.settings.ambientVol !== undefined ? State.data.settings.ambientVol : 40;
            Sound.startAmbient(type, vol / 100);
        } else {
            Sound.stopAmbient();
        }
        Sound.click();
    },

    setAmbientVolume(val) {
        if (!State.data.settings) State.data.settings = {};
        State.data.settings.ambientVol = parseInt(val);
        Storage.save();
        Sound.setAmbientVolume(parseInt(val) / 100);

        const slider = document.getElementById('ambientVolumeSlider');
        if (slider) slider.style.setProperty('--val', val + '%');
    },

    setMode(mode) {
        if (State.pomo.running) return;

        State.pomo.mode = mode;
        document.querySelectorAll('.pomo-mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });

        const durations = {
            focus: State.data.settings.focusDur,
            break: State.data.settings.breakDur,
            long:  State.data.settings.longDur
        };

        State.pomo.left  = durations[mode] * 60;
        State.pomo.total = State.pomo.left;
        this.updateDisplay();
        Sound.click();
        this.cycleInsight(true);
    },

    cycleInsight(force = false) {
        if (State.pomo.mode !== 'focus') {
            document.getElementById('pomoLiveInsight')?.classList.remove('show');
            return;
        }

        const el = document.getElementById('pomoLiveInsight');
        if (!el) return;

        if (force) {
            this.currentInsightIndex = Math.floor(Math.random() * this.liveInsights.length);
            el.textContent = `"${this.liveInsights[this.currentInsightIndex]}"`;
            setTimeout(() => el.classList.add('show'), 100);
            return;
        }

        el.classList.remove('show');
        setTimeout(() => {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * this.liveInsights.length);
            } while (nextIndex === this.currentInsightIndex && this.liveInsights.length > 1);

            this.currentInsightIndex = nextIndex;
            el.textContent = `"${this.liveInsights[this.currentInsightIndex]}"`;
            requestAnimationFrame(() => el.classList.add('show'));
        }, 600);
    },

    toggle() {
        if (State.pomo.running) {
            clearInterval(State.pomo.interval);
            State.pomo.running = false;
            this.updatePlayButton(false);
            this.updateRunningState(false);
            Sound.stopAmbient();
        } else {
            if (State.pomo.left <= 0) this.setMode(State.pomo.mode);

            State.pomo.running   = true;
            State.pomo.startTime = Date.now();
            State.pomo.startLeft = State.pomo.left;
            this.updatePlayButton(true);
            this.updateRunningState(true);
            Sound.timerStart();
            this.requestNotificationPermission();

            // Auto start ambient noise
            const sound = State.data.settings?.ambientSound || 'none';
            const vol   = State.data.settings?.ambientVol !== undefined ? State.data.settings.ambientVol : 40;
            Sound.startAmbient(sound, vol / 100);

            this.cycleInsight(true);

            State.pomo.interval = setInterval(() => {
                // Timestamp-based: immune to CPU throttle, tab sleep, system sleep
                const elapsed = Math.floor((Date.now() - State.pomo.startTime) / 1000);
                State.pomo.left = Math.max(0, State.pomo.startLeft - elapsed);
                this.updateDisplay();

                if (State.pomo.mode === 'focus' && State.pomo.left % 60 === 0 && State.pomo.left > 0) {
                    this.cycleInsight();
                }

                if (State.pomo.left <= 0) {
                    clearInterval(State.pomo.interval);
                    State.pomo.running = false;
                    this.updatePlayButton(false);
                    this.updateRunningState(false);
                    Sound.stopAmbient();
                    this.done();
                }
            }, 500);
        }
    },

    updatePlayButton(playing) {
        const html = playing ? Icons.pause(26) : Icons.play(26);
        const main = document.getElementById('pomoPlayBtn');
        const fs   = document.getElementById('fsPlayBtn');
        if (main) { main.innerHTML = html; main.classList.toggle('playing', playing); }
        if (fs)   { fs.innerHTML   = html; fs.classList.toggle('playing', playing); }
    },

    updateRunningState(running) {
        const timer = document.getElementById('pomoTimer');
        if (timer) timer.classList.toggle('running', running);
    },

    reset() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        this.setMode(State.pomo.mode);
        Sound.stopAmbient();
        Sound.click();
    },

    skip() {
        clearInterval(State.pomo.interval);
        State.pomo.running = false;
        this.updatePlayButton(false);
        this.updateRunningState(false);
        Sound.stopAmbient();
        this.done();
    },

    done() {
        Sound.timerDone();
        this.sendNotification();

        if (State.pomo.mode === 'focus') {
            State.pomo.count++;
            State.data.pomo.push({
                date: Utils.today(),
                dur:  State.data.settings.focusDur,
                ts:   Date.now()
            });
            State.data.totalFocusMinutes = (State.data.totalFocusMinutes || 0) + State.data.settings.focusDur;

            Storage.save();
            this.renderDots();
            Level.update();
            Toast.show('Focus session complete!');

            if (State.pomo.count >= State.data.settings.sessions) {
                State.pomo.count = 0;
                this.setMode('long');
            } else {
                this.setMode('break');
                Sound.breakStart();
            }
        } else {
            Toast.show('Focus session started');
            this.setMode('focus');
        }

        Home.render();
        if (State.currentPage === 'report') Report.render();
    },

    updateDisplay() {
        const mm   = String(Math.floor(State.pomo.left / 60)).padStart(2, '0');
        const ss   = String(State.pomo.left % 60).padStart(2, '0');
        const time = `${mm}:${ss}`;

        const pomoTime = document.getElementById('pomoTime');
        const fsTime   = document.getElementById('fsTime');
        if (pomoTime) pomoTime.textContent = time;
        if (fsTime)   fsTime.textContent   = time;

        const labels = { focus: 'Focus Time', break: 'Short Break', long: 'Long Break' };
        const modeLabel = document.getElementById('pomoModeLabel');
        const fsLabel   = document.getElementById('fsLabel');
        if (modeLabel) modeLabel.textContent = labels[State.pomo.mode];
        if (fsLabel)   fsLabel.textContent   = labels[State.pomo.mode];

        const ring = document.getElementById('pomoRingCircle');
        if (ring) {
            const r    = 130;
            const circ = 2 * Math.PI * r;
            ring.style.strokeDasharray  = circ;
            ring.style.strokeDashoffset = State.pomo.total > 0 ? circ * (State.pomo.left / State.pomo.total) : 0;
        }

        const fsBg = document.getElementById('fsBg');
        if (fsBg) fsBg.className = `fs-bg ${State.pomo.mode === 'focus' ? 'focus' : 'break'}`;
    },

    renderDots() {
        const container = document.getElementById('pomoSessionDots');
        if (!container) return;
        let html = '';
        for (let i = 0; i < State.data.settings.sessions; i++) {
            const isFilled  = i < State.pomo.count;
            const isCurrent = i === State.pomo.count && State.pomo.mode === 'focus';
            html += `<div class="session-dot ${isFilled ? 'done' : ''} ${isCurrent ? 'active' : ''}"></div>`;
        }
        container.innerHTML = html;
    },

    enterFullscreen() {
        document.getElementById('fullscreenPomo')?.classList.add('on');
        Sound.click();
    },

    exitFullscreen() {
        document.getElementById('fullscreenPomo')?.classList.remove('on');
        Sound.click();
    },

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    },

    sendNotification() {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const labels = {
                focus: 'Focus session complete!',
                break: 'Break is over!',
                long:  'Long break done!'
            };
            const body = State.pomo.mode === 'focus'
                ? `Great work! You completed ${State.data.settings.focusDur} minutes of deep focus.`
                : 'Time to get back to work!';
            new Notification(labels[State.pomo.mode] || 'Timer done!', {
                body,
                icon: 'icon-192.png',
                badge: 'icon-192.png',
                tag: 'focussium-pomo',
                silent: false
            });
        } catch (e) {
            handleError('Notification failed', e);
        }
    }
};
