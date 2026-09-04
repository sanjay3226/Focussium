/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.2 — FOCUS GAMES MODULE
   Mental recharge mini-games: Breathing, Challenge Cards,
   Reaction Reflex, and Zen Sand Garden
   ═══════════════════════════════════════════════════════════ */

const Games = {
    currentGame: null,

    gamesList: [
        {
            id: 'breathe',
            name: 'Box Breathing',
            desc: '4-4-6-2 rhythmic cycle to reset focus and calm your mind.',
            sparks: '+5 Sparks / cycle',
            icon: 'lungs',
            badge: 'Calm'
        },
        {
            id: 'challenges',
            name: 'Focus Micro-Cards',
            desc: 'Mindful reflections and intention prompts for break time.',
            sparks: '+3 Sparks / card',
            icon: 'cards',
            badge: 'Clarity'
        },
        {
            id: 'reflex',
            name: 'Reaction Reflex',
            desc: '10-round target reaction test to sharpen mental speed.',
            sparks: 'Up to +15 Sparks',
            icon: 'target',
            badge: 'Speed'
        },
        {
            id: 'zen',
            name: 'Zen Sand Garden',
            desc: 'Draw soothing raked patterns on responsive sand canvas.',
            sparks: '+2 Sparks / min',
            icon: 'garden',
            badge: 'Relax'
        }
    ],

    getZenStatus(sparks) {
        if (sparks >= 150) return 'Zen Master';
        if (sparks >= 75)  return 'Deep Zen';
        if (sparks >= 25)  return 'Mindful Flow';
        return 'Centered';
    },

    awardSparks(amount, reason = 'Focus Game') {
        if (!amount || amount <= 0) return;
        if (!State.data.games) State.data.games = {};
        State.data.games.sparks = (State.data.games.sparks || 0) + amount;
        State.data.games.todaySparks = (State.data.games.todaySparks || 0) + amount;
        State.data.games.totalPlayed = (State.data.games.totalPlayed || 0) + 1;
        Storage.save();
        this.render();
        if (window.Toast) Toast.show(`+${amount} Mindful Sparks from ${reason}!`);
        if (window.Sound) Sound.success();
    },

    render() {
        const libraryContainer = document.getElementById('gamesLibrary');
        if (!libraryContainer) return;

        const gamesData = State.data.games || {};
        const totalSparks = gamesData.sparks || 0;
        const zenStatus = this.getZenStatus(totalSparks);
        const gamesPlayed = gamesData.totalPlayed || 0;
        const bestReaction = gamesData.bestReflex ? `${gamesData.bestReflex}ms` : '—';
        const zenMinutes = gamesData.zenMinutes || 0;

        libraryContainer.innerHTML = `
            <div class="games-intro">
                <div class="games-hero-card">
                    <div class="games-hero-info">
                        <div class="games-zen-status-chip">${zenStatus}</div>
                        <h3>Focus Recharge Lounge</h3>
                        <p>Sharpen reflexes, find stillness, or reset your breathing during Pomodoro breaks.</p>
                    </div>
                    <div class="games-hero-badge">
                        <span class="games-hero-xp-val">${totalSparks}</span>
                        <span class="games-hero-xp-lbl">Sparks</span>
                    </div>
                </div>

                <div class="games-library-grid">
                    ${this.gamesList.map(g => `
                        <div class="game-card" data-action="launch-game" data-game="${g.id}">
                            <div class="game-card-top">
                                <div class="game-card-icon">
                                    ${Icons[g.icon] ? Icons[g.icon](22) : Icons.gamepad(22)}
                                </div>
                                <span class="game-card-xp">${g.sparks}</span>
                            </div>
                            <div class="game-card-title">${g.name}</div>
                            <div class="game-card-desc">${g.desc}</div>
                            <button class="game-card-btn" data-action="launch-game" data-game="${g.id}">
                                <span>Play</span>
                                ${Icons.arrowRight ? Icons.arrowRight(12) : '→'}
                            </button>
                        </div>
                    `).join('')}
                </div>

                <div class="games-stats-summary">
                    <div class="games-stats-header">
                        ${Icons.trophy ? Icons.trophy(16) : ''}
                        <span>Your Mindful Records</span>
                    </div>
                    <div class="games-stats-row">
                        <div class="games-stat-box">
                            <div class="games-stat-val">${gamesPlayed}</div>
                            <div class="games-stat-lbl">Sessions</div>
                        </div>
                        <div class="games-stat-box">
                            <div class="games-stat-val">${bestReaction}</div>
                            <div class="games-stat-lbl">Best Reflex</div>
                        </div>
                        <div class="games-stat-box">
                            <div class="games-stat-val">${zenMinutes}m</div>
                            <div class="games-stat-lbl">Zen Time</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    recordPlay() {
        if (!State.data.games) State.data.games = {};
        State.data.games.totalPlayed = (State.data.games.totalPlayed || 0) + 1;
        Storage.save();
    },

    launchGame(gameId) {
        const game = this.gamesList.find(g => g.id === gameId);
        if (!game) return;

        this.currentGame = gameId;
        this.recordPlay();

        const arena = document.getElementById('gameArena');
        const arenaTitle = document.getElementById('arenaGameTitle');
        const arenaIcon = document.getElementById('arenaGameIcon');
        const arenaBody = document.getElementById('arenaBody');

        if (!arena || !arenaBody) return;

        if (arenaTitle) arenaTitle.textContent = game.name;
        if (arenaIcon && Icons[game.icon]) arenaIcon.innerHTML = Icons[game.icon](20);

        arena.classList.add('active');

        if (gameId === 'breathe') this.breathe.init(arenaBody);
        else if (gameId === 'challenges') this.challenges.init(arenaBody);
        else if (gameId === 'reflex') this.reflex.init(arenaBody);
        else if (gameId === 'zen') this.zen.init(arenaBody);
    },

    exitGame() {
        if (this.currentGame) {
            if (this.currentGame === 'breathe') this.breathe.destroy();
            else if (this.currentGame === 'challenges') this.challenges.destroy();
            else if (this.currentGame === 'reflex') this.reflex.destroy();
            else if (this.currentGame === 'zen') this.zen.destroy();
            this.currentGame = null;
        }

        const arena = document.getElementById('gameArena');
        if (arena) arena.classList.remove('active');

        this.render();
        if (window.Level) Level.update();
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 1: BOX BREATHING
       ═══════════════════════════════════════════════════════════ */
    breathe: {
        timerId: null,
        animFrameId: null,
        phase: 'idle', // 'inhale', 'hold1', 'exhale', 'hold2'
        phaseTime: 0,
        cyclesCompleted: 0,
        active: false,
        phases: [
            { name: 'Inhale', duration: 4, scale: 1.3 },
            { name: 'Hold', duration: 4, scale: 1.3 },
            { name: 'Exhale', duration: 6, scale: 1.0 },
            { name: 'Rest', duration: 2, scale: 1.0 }
        ],
        phaseIdx: 0,

        init(container) {
            this.cyclesCompleted = 0;
            this.phase = 'idle';
            this.active = false;

            container.innerHTML = `
                <div class="breathe-container">
                    <div class="breathe-ring-wrap">
                        <div class="breathe-outer-glow" id="breatheGlow"></div>
                        <svg class="breathe-circle-svg" viewBox="0 0 240 240">
                            <circle class="breathe-bg-track" cx="120" cy="120" r="105"/>
                            <circle class="breathe-progress-bar" id="breatheProg" cx="120" cy="120" r="105"/>
                        </svg>
                        <div class="breathe-inner-ball" id="breatheBall">
                            <span class="breathe-phase-title" id="breathePhase">Ready</span>
                            <span class="breathe-phase-timer" id="breatheTimer">16s</span>
                        </div>
                    </div>

                    <div class="breathe-stats">
                        <div class="breathe-stat-chip">
                            Cycles: <span id="breatheCycleCount">0</span>
                        </div>
                        <div class="breathe-stat-chip">
                            Reward: +5 XP / cycle
                        </div>
                    </div>

                    <div class="breathe-controls">
                        <button class="breathe-btn primary" data-action="breathe-toggle" id="breatheBtn">Start Breathing</button>
                    </div>
                </div>
            `;
        },

        toggle() {
            if (this.active) {
                this.pause();
            } else {
                this.start();
            }
        },

        start() {
            this.active = true;
            this.phaseIdx = 0;
            const btn = document.getElementById('breatheBtn');
            if (btn) btn.textContent = 'Pause';
            this.runPhase();
        },

        pause() {
            this.active = false;
            clearTimeout(this.timerId);
            cancelAnimationFrame(this.animFrameId);
            const btn = document.getElementById('breatheBtn');
            if (btn) btn.textContent = 'Resume';
            const phaseEl = document.getElementById('breathePhase');
            if (phaseEl) phaseEl.textContent = 'Paused';
        },

        runPhase() {
            if (!this.active) return;
            const p = this.phases[this.phaseIdx];
            const phaseEl = document.getElementById('breathePhase');
            const timerEl = document.getElementById('breatheTimer');
            const ballEl = document.getElementById('breatheBall');
            const glowEl = document.getElementById('breatheGlow');
            const progEl = document.getElementById('breatheProg');

            if (phaseEl) phaseEl.textContent = p.name;
            if (ballEl) ballEl.style.transform = `scale(${p.scale})`;
            if (glowEl) {
                glowEl.style.transform = `scale(${p.scale * 1.1})`;
                glowEl.style.opacity = p.scale > 1 ? '0.8' : '0.3';
            }

            if (window.Sound) Sound.click();

            const startTime = Date.now();
            const totalMs = p.duration * 1000;
            const circumference = 2 * Math.PI * 105; // ~659.7

            const tick = () => {
                if (!this.active) return;
                const elapsed = Date.now() - startTime;
                const remainingSec = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
                if (timerEl) timerEl.textContent = `${remainingSec}s`;

                const progress = Math.min(1, elapsed / totalMs);
                if (progEl) {
                    progEl.style.strokeDashoffset = String(circumference * (1 - progress));
                }

                if (elapsed < totalMs) {
                    this.animFrameId = requestAnimationFrame(tick);
                } else {
                    this.phaseIdx = (this.phaseIdx + 1) % this.phases.length;
                    if (this.phaseIdx === 0) {
                        this.cyclesCompleted++;
                        const cycleEl = document.getElementById('breatheCycleCount');
                        if (cycleEl) cycleEl.textContent = this.cyclesCompleted;
                        Games.awardSparks(5, 'Breathing Cycle');
                    }
                    this.runPhase();
                }
            };

            this.animFrameId = requestAnimationFrame(tick);
        },

        destroy() {
            this.active = false;
            clearTimeout(this.timerId);
            cancelAnimationFrame(this.animFrameId);
        }
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 2: FOCUS CHALLENGE CARDS
       ═══════════════════════════════════════════════════════════ */
    challenges: {
        cards: [
            "Name 3 things in this room you are genuinely grateful for right now.",
            "Write down your single #1 priority task for the next focus sprint.",
            "Take 3 slow, deep abdominal breaths. Feel your shoulders drop.",
            "Drink a full glass of water and stretch both arms overhead.",
            "What is one distraction you can completely eliminate today?",
            "Think of someone whose work or dedication inspires you. Why?",
            "What small win did you already achieve today that you didn't celebrate?",
            "Close your eyes for 20 seconds. Listen to the farthest sound you can detect.",
            "If today was 100% productive, what would be finished by tonight?",
            "Notice where in your body you feel tension. Gently roll your neck.",
            "Write a 1-sentence note of encouragement to your future self.",
            "What task have you been putting off? Can you do the first 2 minutes of it?",
            "Rate your current mental energy from 1 to 10. What would give you +1?",
            "Look out a window or gaze 20 feet away for 20 seconds to reset eye strain.",
            "Clear 3 unnecessary items or trash from your immediate workspace."
        ],
        streak: 0,
        currentIdx: 0,

        init(container) {
            this.streak = 0;
            this.currentIdx = Math.floor(Math.random() * this.cards.length);

            container.innerHTML = `
                <div class="challenge-wrap">
                    <div class="challenge-streak-bar">
                        ${Icons.fire ? Icons.fire(16) : '★'}
                        <span id="cardStreakLbl">Streak: 0 cards completed</span>
                    </div>

                    <div class="challenge-card-perspective">
                        <div class="challenge-card-inner" id="challengeCard">
                            <div class="challenge-card-front">
                                <span class="challenge-card-badge">Mindful Prompt</span>
                                <div class="challenge-card-text" id="challengeCardText">
                                    ${this.cards[this.currentIdx]}
                                </div>
                                <div class="challenge-card-footer">
                                    Take 30-60 seconds to do or reflect on this.
                                </div>
                            </div>
                            <div class="challenge-card-back">
                                <div class="challenge-card-badge">Completed!</div>
                                <div class="challenge-card-text" style="color: var(--ac)">
                                    +3 XP Earned! Focus restored.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="challenge-card-actions">
                        <button class="challenge-act-btn done" data-action="challenge-complete">
                            ${Icons.check ? Icons.check(16) : '✓'}
                            <span>Done (+3 XP)</span>
                        </button>
                        <button class="challenge-act-btn skip" data-action="challenge-skip">
                            <span>Next Prompt</span>
                            ${Icons.arrowRight ? Icons.arrowRight(12) : '→'}
                        </button>
                    </div>
                </div>
            `;
        },

        complete() {
            const cardInner = document.getElementById('challengeCard');
            if (cardInner) cardInner.classList.add('flipped');

            this.streak++;
            const streakLbl = document.getElementById('cardStreakLbl');
            if (streakLbl) streakLbl.textContent = `Streak: ${this.streak} card${this.streak > 1 ? 's' : ''} completed`;

            Games.awardSparks(3, 'Focus Challenge');

            setTimeout(() => {
                if (cardInner) cardInner.classList.remove('flipped');
                this.next();
            }, 1000);
        },

        next() {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * this.cards.length);
            } while (nextIdx === this.currentIdx && this.cards.length > 1);
            this.currentIdx = nextIdx;

            const textEl = document.getElementById('challengeCardText');
            if (textEl) {
                textEl.style.opacity = '0';
                setTimeout(() => {
                    textEl.textContent = this.cards[this.currentIdx];
                    textEl.style.opacity = '1';
                }, 150);
            }
        },

        destroy() {}
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 3: REACTION REFLEX
       ═══════════════════════════════════════════════════════════ */
    reflex: {
        round: 0,
        maxRounds: 10,
        scores: [],
        targetAppearTime: 0,
        timeoutId: null,
        gameState: 'ready', // 'ready', 'waiting', 'target', 'done'

        init(container) {
            this.round = 0;
            this.scores = [];
            this.gameState = 'ready';

            container.innerHTML = `
                <div class="reflex-wrap">
                    <div class="reflex-stats-row">
                        <div class="reflex-stat-box">
                            <div class="reflex-stat-val" id="reflexRound">0 / 10</div>
                            <div class="reflex-stat-lbl">Round</div>
                        </div>
                        <div class="reflex-stat-box">
                            <div class="reflex-stat-val" id="reflexLast">—</div>
                            <div class="reflex-stat-lbl">Last Tap</div>
                        </div>
                        <div class="reflex-stat-box">
                            <div class="reflex-stat-val" id="reflexAvg">—</div>
                            <div class="reflex-stat-lbl">Average</div>
                        </div>
                    </div>

                    <div class="reflex-board" id="reflexBoard" data-action="reflex-board-tap">
                        <div class="reflex-board-message" id="reflexMsg">
                            <p style="margin-bottom: 10px;">Tap anywhere to start the round.</p>
                            <span style="font-size: 0.72rem; color: var(--tx4);">Hit the glowing target as soon as it appears!</span>
                        </div>
                        <div class="reflex-target-dot" id="reflexDot" data-action="reflex-target-tap">
                            ${Icons.target ? Icons.target(24) : '●'}
                        </div>
                    </div>

                    <button class="breathe-btn primary" id="reflexActionBtn" data-action="reflex-start-round">
                        Start Round 1
                    </button>
                </div>
            `;
        },

        startRound() {
            if (this.round >= this.maxRounds) {
                this.finishGame();
                return;
            }

            this.gameState = 'waiting';
            const msg = document.getElementById('reflexMsg');
            const dot = document.getElementById('reflexDot');
            const btn = document.getElementById('reflexActionBtn');

            if (msg) msg.innerHTML = '<p>Wait for target...</p>';
            if (dot) dot.classList.remove('visible');
            if (btn) {
                btn.textContent = 'Waiting...';
                btn.disabled = true;
            }

            const delay = 1200 + Math.random() * 2400;
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => {
                this.showTarget();
            }, delay);
        },

        showTarget() {
            this.gameState = 'target';
            const board = document.getElementById('reflexBoard');
            const dot = document.getElementById('reflexDot');
            const msg = document.getElementById('reflexMsg');

            if (!board || !dot) return;

            if (msg) msg.innerHTML = '';

            const rect = board.getBoundingClientRect();
            const pad = 40;
            const x = pad + Math.random() * (rect.width - pad * 2);
            const y = pad + Math.random() * (rect.height - pad * 2);

            dot.style.left = `${x}px`;
            dot.style.top = `${y}px`;
            dot.classList.add('visible');

            this.targetAppearTime = performance.now();
        },

        handleTargetTap() {
            if (this.gameState !== 'target') return;
            const elapsed = Math.round(performance.now() - this.targetAppearTime);
            this.scores.push(elapsed);
            this.round++;

            const dot = document.getElementById('reflexDot');
            if (dot) dot.classList.remove('visible');

            if (window.Sound) Sound.click();

            // Update stats UI
            const roundEl = document.getElementById('reflexRound');
            const lastEl = document.getElementById('reflexLast');
            const avgEl = document.getElementById('reflexAvg');
            const msg = document.getElementById('reflexMsg');
            const btn = document.getElementById('reflexActionBtn');

            if (roundEl) roundEl.textContent = `${this.round} / ${this.maxRounds}`;
            if (lastEl) lastEl.textContent = `${elapsed}ms`;

            const avg = Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
            if (avgEl) avgEl.textContent = `${avg}ms`;

            if (this.round < this.maxRounds) {
                this.gameState = 'ready';
                if (msg) msg.innerHTML = `<p>${elapsed}ms!</p><span style="font-size:0.72rem; color:var(--ac);">Tap below for next round</span>`;
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = `Start Round ${this.round + 1}`;
                }
            } else {
                this.finishGame();
            }
        },

        finishGame() {
            this.gameState = 'done';
            const avg = Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
            const best = Math.min(...this.scores);

            if (!State.data.games) State.data.games = {};
            if (!State.data.games.bestReflex || best < State.data.games.bestReflex) {
                State.data.games.bestReflex = best;
                Storage.save();
            }

            let sparksReward = 5;
            if (avg < 300) sparksReward = 15;
            else if (avg < 450) sparksReward = 10;

            Games.awardSparks(sparksReward, 'Reaction Reflex');

            const msg = document.getElementById('reflexMsg');
            const btn = document.getElementById('reflexActionBtn');

            if (msg) {
                msg.innerHTML = `
                    <h3 style="color:var(--ac); margin-bottom:4px;">Trial Complete!</h3>
                    <p style="margin:2px 0;">Average: <strong>${avg}ms</strong> · Best: <strong>${best}ms</strong></p>
                    <span style="font-size:0.75rem; color:var(--tx2);">+${sparksReward} Sparks Earned!</span>
                `;
            }

            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Play Again';
                btn.dataset.action = 'reflex-play-again';
            }
        },

        destroy() {
            clearTimeout(this.timeoutId);
        }
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 4: ZEN SAND GARDEN
       ═══════════════════════════════════════════════════════════ */
    zen: {
        canvas: null,
        ctx: null,
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        startTime: null,
        minuteTimerId: null,
        minutesElapsed: 0,

        init(container) {
            this.minutesElapsed = 0;
            this.startTime = Date.now();

            container.innerHTML = `
                <div class="zen-wrap">
                    <div class="zen-timer-pill">
                        ${Icons.garden ? Icons.garden(16) : '♨'}
                        <span id="zenTimeLbl">Mindful Garden: 0 min (+2 XP/min)</span>
                    </div>

                    <div class="zen-canvas-wrap">
                        <canvas class="zen-canvas" id="zenCanvas"></canvas>
                    </div>

                    <div class="zen-toolbar">
                        <button class="zen-btn" data-action="zen-clear">
                            <span>Rake Fresh Sand</span>
                        </button>
                    </div>
                </div>
            `;

            const canvas = document.getElementById('zenCanvas');
            if (!canvas) return;

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width * window.devicePixelRatio || 340;
            canvas.height = rect.width * window.devicePixelRatio || 340;
            this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

            this.clearSand();
            this.attachEvents();

            // Track minutes for Sparks reward
            clearInterval(this.minuteTimerId);
            this.minuteTimerId = setInterval(() => {
                this.minutesElapsed++;
                const lbl = document.getElementById('zenTimeLbl');
                if (lbl) lbl.textContent = `Mindful Garden: ${this.minutesElapsed} min (+2 Sparks/min)`;

                if (!State.data.games) State.data.games = {};
                State.data.games.zenMinutes = (State.data.games.zenMinutes || 0) + 1;
                Storage.save();

                Games.awardSparks(2, 'Zen Garden');
            }, 60000);
        },

        clearSand() {
            if (!this.ctx || !this.canvas) return;
            const w = this.canvas.width;
            const h = this.canvas.height;

            // Fill sand color base
            this.ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg2').trim() || '#161616';
            this.ctx.fillRect(0, 0, w, h);

            // Subtle sand grain effect
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            for (let i = 0; i < 400; i++) {
                const rx = Math.random() * w;
                const ry = Math.random() * h;
                this.ctx.fillRect(rx, ry, 1.5, 1.5);
            }
        },

        attachEvents() {
            const canvas = this.canvas;
            if (!canvas) return;

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
            };

            const startDraw = (e) => {
                this.isDrawing = true;
                const pos = getPos(e);
                this.lastX = pos.x;
                this.lastY = pos.y;
                this.drawRake(pos.x, pos.y, pos.x, pos.y);
            };

            const moveDraw = (e) => {
                if (!this.isDrawing) return;
                e.preventDefault();
                const pos = getPos(e);
                this.drawRake(this.lastX, this.lastY, pos.x, pos.y);
                this.lastX = pos.x;
                this.lastY = pos.y;
            };

            const endDraw = () => {
                this.isDrawing = false;
            };

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', moveDraw);
            window.addEventListener('mouseup', endDraw);

            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', moveDraw, { passive: false });
            window.addEventListener('touchend', endDraw);
        },

        drawRake(x1, y1, x2, y2) {
            if (!this.ctx) return;
            const offsets = [-8, 0, 8];
            const ac = getComputedStyle(document.body).getPropertyValue('--ac').trim() || '#22c55e';

            offsets.forEach(offset => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = ac;
                this.ctx.globalAlpha = 0.38;
                this.ctx.lineWidth = 2.5;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';

                this.ctx.moveTo(x1 + offset, y1);
                this.ctx.lineTo(x2 + offset, y2);
                this.ctx.stroke();
            });

            this.ctx.globalAlpha = 1.0;
        },

        destroy() {
            clearInterval(this.minuteTimerId);
        }
    }
};

/* ─── GAMES EVENT DELEGATION ─── */
document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'launch-game') {
        const gameId = el.dataset.game;
        if (gameId) Games.launchGame(gameId);
    } else if (action === 'exit-game') {
        Games.exitGame();
    } else if (action === 'breathe-toggle') {
        Games.breathe.toggle();
    } else if (action === 'challenge-complete') {
        Games.challenges.complete();
    } else if (action === 'challenge-skip') {
        Games.challenges.next();
    } else if (action === 'reflex-start-round') {
        Games.reflex.startRound();
    } else if (action === 'reflex-target-tap') {
        Games.reflex.handleTargetTap();
    } else if (action === 'reflex-play-again') {
        Games.reflex.init(document.getElementById('arenaBody'));
    } else if (action === 'zen-clear') {
        Games.zen.clearSand();
        if (window.Sound) Sound.click();
    }
});
