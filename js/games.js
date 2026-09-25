/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.2 — FOCUS GAMES MODULE (REVAMPED)
   5 mindful recharge mini-games:
   Box Breathing, Focus Micro-Cards, Reaction Reflex,
   Zen Sand Garden, Memory Sequence (NEW)
   ═══════════════════════════════════════════════════════════ */

const Games = {
    currentGame: null,

    gamesList: [
        {
            id: 'breathe',
            name: 'Box Breathing',
            desc: '4-4-6-2 rhythmic cycle to reset your nervous system and calm your mind.',
            sparks: '+5 Sparks / cycle',
            icon: 'lungs',
            badge: 'Calm',
            type: 'Wellness'
        },
        {
            id: 'challenges',
            name: 'Focus Micro-Cards',
            desc: 'Mindful reflections and intention prompts engineered for productive breaks.',
            sparks: '+3 Sparks / card',
            icon: 'cards',
            badge: 'Clarity',
            type: 'Mindset'
        },
        {
            id: 'reflex',
            name: 'Reaction Reflex',
            desc: '10-round target reaction test to sharpen mental speed and attention.',
            sparks: 'Up to +15 Sparks',
            icon: 'target',
            badge: 'Speed',
            type: 'Sharpness'
        },
        {
            id: 'zen',
            name: 'Zen Sand Garden',
            desc: 'Draw soothing raked patterns on a responsive sand canvas. Pure stillness.',
            sparks: '+2 Sparks / min',
            icon: 'garden',
            badge: 'Relax',
            type: 'Flow'
        },
        {
            id: 'memory',
            name: 'Memory Sequence',
            desc: 'Watch the glowing pattern and repeat it. Trains focus and working memory.',
            sparks: '+5 Sparks / round',
            icon: 'brain',
            badge: 'Memory',
            type: 'Cognition'
        }
    ],

    getZenStatus(sparks) {
        if (sparks >= 300) return `${Icons.zap(12)}<span>Flow Master</span>`;
        if (sparks >= 150) return `${Icons.meditate(12)}<span>Zen Master</span>`;
        if (sparks >= 75)  return `${Icons.spark(12)}<span>Deep Zen</span>`;
        if (sparks >= 25)  return `${Icons.seedling(12)}<span>Mindful Flow</span>`;
        return `${Icons.lotus(12)}<span>Centered</span>`;
    },

    awardSparks(amount, reason = 'Focus Game') {
        if (!amount || amount <= 0) return;
        if (!State.data.games) State.data.games = {};
        State.data.games.sparks     = (State.data.games.sparks     || 0) + amount;
        State.data.games.todaySparks= (State.data.games.todaySparks|| 0) + amount;
        State.data.games.totalPlayed= (State.data.games.totalPlayed|| 0) + 1;
        Storage.save();
        this.updateArenaSparks();
        if (window.Toast) Toast.show(`+${amount} Sparks from ${reason}!`);
        if (window.Sound) Sound.success();
    },

    updateArenaSparks() {
        const pill = document.getElementById('arenaSparksCount');
        if (pill) pill.textContent = (State.data.games?.sparks || 0) + ' Sparks';
    },

    render() {
        const libraryContainer = document.getElementById('gamesLibrary');
        if (!libraryContainer) return;

        const gamesData    = State.data.games || {};
        const totalSparks  = gamesData.sparks || 0;
        const zenStatus    = this.getZenStatus(totalSparks);
        const gamesPlayed  = gamesData.totalPlayed || 0;
        const bestReaction = gamesData.bestReflex ? `${gamesData.bestReflex}ms` : '—';
        const zenMinutes   = gamesData.zenMinutes || 0;
        const bestMemory   = gamesData.bestMemoryLevel || 0;

        libraryContainer.innerHTML = `
            <div class="games-intro">
                <div class="games-hero-card">
                    <div class="games-hero-info">
                        <div class="games-zen-status-chip">${zenStatus}</div>
                        <h3>Focus Recharge Lounge</h3>
                        <p>Sharpen reflexes, build memory, or find stillness during Pomodoro breaks.</p>
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
                                    ${Icons[g.icon] ? Icons[g.icon](22) : Icons.gamepad ? Icons.gamepad(22) : ''}
                                </div>
                                <div class="game-card-badge-row">
                                    <span class="game-card-xp">${g.sparks}</span>
                                    <span class="game-card-type-pill">${g.type}</span>
                                </div>
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
                        <div class="games-stat-box">
                            <div class="games-stat-val">${bestMemory > 0 ? 'Lv ' + bestMemory : '—'}</div>
                            <div class="games-stat-lbl">Memory Best</div>
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

        const arena     = document.getElementById('gameArena');
        const arenaTitle= document.getElementById('arenaGameTitle');
        const arenaIcon = document.getElementById('arenaGameIcon');
        const arenaBody = document.getElementById('arenaBody');

        if (!arena || !arenaBody) return;

        if (arenaTitle) arenaTitle.textContent = game.name;
        if (arenaIcon && Icons[game.icon]) arenaIcon.innerHTML = Icons[game.icon](20);
        this.updateArenaSparks();

        arena.classList.add('active');

        if      (gameId === 'breathe')    this.breathe.init(arenaBody);
        else if (gameId === 'challenges') this.challenges.init(arenaBody);
        else if (gameId === 'reflex')     this.reflex.init(arenaBody);
        else if (gameId === 'zen')        this.zen.init(arenaBody);
        else if (gameId === 'memory')     this.memory.init(arenaBody);
    },

    exitGame() {
        if (this.currentGame) {
            if (this.currentGame === 'breathe')    this.breathe.destroy();
            else if (this.currentGame === 'challenges') this.challenges.destroy();
            else if (this.currentGame === 'reflex')     this.reflex.destroy();
            else if (this.currentGame === 'zen')        this.zen.destroy();
            else if (this.currentGame === 'memory')     this.memory.destroy();
            this.currentGame = null;
        }
        const arena = document.getElementById('gameArena');
        if (arena) arena.classList.remove('active');
        this.render();
        if (window.Level) Level.update();
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 1: BOX BREATHING (ENHANCED)
       ═══════════════════════════════════════════════════════════ */
    breathe: {
        timerId:         null,
        animFrameId:     null,
        phase:           'idle',
        cyclesCompleted: 0,
        active:          false,
        phaseIdx:        0,
        phases: [
            { name: 'Inhale',  duration: 4, scale: 1.28, hint: 'breathe in slowly...' },
            { name: 'Hold',    duration: 4, scale: 1.28, hint: 'hold steady...' },
            { name: 'Exhale',  duration: 6, scale: 0.88, hint: 'release fully...' },
            { name: 'Rest',    duration: 2, scale: 0.88, hint: 'empty and still...' }
        ],

        init(container) {
            this.cyclesCompleted = 0;
            this.phase  = 'idle';
            this.active = false;

            container.innerHTML = `
                <div class="breathe-container">
                    <div class="breathe-ring-wrap">
                        <div class="breathe-outer-glow" id="breatheGlow"></div>
                        <svg class="breathe-circle-svg" viewBox="0 0 250 250">
                            <circle class="breathe-bg-track" cx="125" cy="125" r="110"/>
                            <circle class="breathe-progress-bar" id="breatheProg" cx="125" cy="125" r="110"/>
                        </svg>
                        <div class="breathe-inner-ball" id="breatheBall">
                            <span class="breathe-phase-title" id="breathePhase">Ready</span>
                            <span class="breathe-phase-timer" id="breatheTimer">16s total</span>
                        </div>
                    </div>
                    <div style="font-size:0.72rem; color:var(--tx4); margin-bottom:18px; min-height:18px; font-style:italic;" id="breatheHint">Press start to begin your calm session</div>

                    <div class="breathe-stats">
                        <div class="breathe-stat-chip">
                            Cycles: <strong id="breatheCycleCount">0</strong>
                        </div>
                        <div class="breathe-stat-chip">
                            Reward: <strong>+5 Sparks</strong> / cycle
                        </div>
                    </div>

                    <div class="breathe-controls">
                        <button class="breathe-btn primary" data-action="breathe-toggle" id="breatheBtn">
                            Start Breathing
                        </button>
                    </div>
                </div>
            `;
        },

        toggle() {
            if (this.active) this.pause();
            else             this.start();
        },

        start() {
            this.active   = true;
            this.phaseIdx = 0;
            const btn = document.getElementById('breatheBtn');
            if (btn) btn.textContent = 'Pause';
            this.runPhase();
        },

        pause() {
            this.active = false;
            clearTimeout(this.timerId);
            cancelAnimationFrame(this.animFrameId);
            const btn     = document.getElementById('breatheBtn');
            const phaseEl = document.getElementById('breathePhase');
            const hintEl  = document.getElementById('breatheHint');
            if (btn)     btn.textContent = 'Resume';
            if (phaseEl) phaseEl.textContent = 'Paused';
            if (hintEl)  hintEl.textContent  = 'Tap Resume to continue';
        },

        runPhase() {
            if (!this.active) return;
            const p = this.phases[this.phaseIdx];
            const phaseEl = document.getElementById('breathePhase');
            const timerEl = document.getElementById('breatheTimer');
            const ballEl  = document.getElementById('breatheBall');
            const glowEl  = document.getElementById('breatheGlow');
            const progEl  = document.getElementById('breatheProg');
            const hintEl  = document.getElementById('breatheHint');

            if (phaseEl) phaseEl.textContent = p.name;
            if (hintEl)  hintEl.textContent  = p.hint;
            if (ballEl) {
                ballEl.style.transform = `scale(${p.scale})`;
                ballEl.style.boxShadow = p.scale > 1
                    ? '0 0 50px rgba(var(--acr), 0.65), 0 0 100px rgba(var(--acr), 0.25)'
                    : '0 0 30px rgba(var(--acr), 0.35)';
            }
            if (glowEl) {
                glowEl.style.transform = `scale(${p.scale * 1.1})`;
                glowEl.style.opacity   = p.scale > 1 ? '0.85' : '0.25';
            }
            if (window.Sound) Sound.click();

            const startTime    = Date.now();
            const totalMs      = p.duration * 1000;
            const circumference= 2 * Math.PI * 110;

            const tick = () => {
                if (!this.active) return;
                const elapsed       = Date.now() - startTime;
                const remainingSec  = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
                if (timerEl) timerEl.textContent = `${remainingSec}s`;

                const progress = Math.min(1, elapsed / totalMs);
                if (progEl) progEl.style.strokeDashoffset = String(circumference * (1 - progress));

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
       GAME 2: FOCUS CHALLENGE CARDS (ENHANCED)
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
            "Clear 3 unnecessary items or trash from your immediate workspace.",
            "Name your biggest obstacle today. What is ONE action that would reduce it?",
            "Take a moment: are you pursuing depth or just appearing busy?",
            "Write the headline of the life you're building. Does today match it?",
            "What would your most disciplined self do in the next 30 minutes?"
        ],
        categories: [
            'Gratitude', 'Planning', 'Breathing', 'Body', 'Focus', 'Inspiration',
            'Reflection', 'Mindfulness', 'Vision', 'Body', 'Self-Talk', 'Action',
            'Energy', 'Eye Rest', 'Environment', 'Problem Solving', 'Depth', 'Vision', 'Discipline'
        ],
        streak:     0,
        currentIdx: 0,

        init(container) {
            this.streak     = 0;
            this.currentIdx = Math.floor(Math.random() * this.cards.length);
            this.renderCard(container);
        },

        renderCard(container) {
            const category = this.categories[this.currentIdx] || 'Mindful Prompt';
            container.innerHTML = `
                <div class="challenge-wrap">
                    <div class="challenge-streak-bar">
                        ${Icons.fire ? Icons.fire(16) : Icons.spark(16)}
                        <span id="cardStreakLbl">Streak: ${this.streak} card${this.streak !== 1 ? 's' : ''} completed</span>
                    </div>

                    <div class="challenge-card-perspective">
                        <div class="challenge-card-inner" id="challengeCard">
                            <div class="challenge-card-front">
                                <span class="challenge-card-badge">
                                    ${Icons.spark ? Icons.spark(12) : ''}
                                    ${category}
                                </span>
                                <div class="challenge-card-text" id="challengeCardText">
                                    ${this.cards[this.currentIdx]}
                                </div>
                                <div class="challenge-card-footer">
                                    Take 30–60 seconds to reflect or act on this.
                                </div>
                            </div>
                            <div class="challenge-card-back">
                                <div class="challenge-card-badge">${Icons.check ? Icons.check(12) : ''} <span>Completed!</span></div>
                                <div class="challenge-card-text" style="color: var(--ac); font-size: 1.25rem;">
                                    +3 Sparks
                                </div>
                                <div style="font-size:0.72rem; color:var(--tx3);">Focus restored. Next card loading...</div>
                            </div>
                        </div>
                    </div>

                    <div class="challenge-card-actions">
                        <button class="challenge-act-btn done" data-action="challenge-complete">
                            ${Icons.check ? Icons.check(16) : ''}
                            <span>Done (+3 XP)</span>
                        </button>
                        <button class="challenge-act-btn skip" data-action="challenge-skip">
                            <span>Next</span>
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
            Games.awardSparks(3, 'Focus Challenge');
            setTimeout(() => {
                if (cardInner) cardInner.classList.remove('flipped');
                this.next();
                const streakLbl = document.getElementById('cardStreakLbl');
                if (streakLbl) streakLbl.textContent = `Streak: ${this.streak} card${this.streak !== 1 ? 's' : ''} completed`;
            }, 1100);
        },

        next() {
            let nextIdx;
            do {
                nextIdx = Math.floor(Math.random() * this.cards.length);
            } while (nextIdx === this.currentIdx && this.cards.length > 1);
            this.currentIdx = nextIdx;
            const textEl    = document.getElementById('challengeCardText');
            const badgeEl   = document.querySelector('.challenge-card-badge');
            if (textEl) {
                textEl.style.opacity = '0';
                textEl.style.transform = 'translateY(8px)';
                setTimeout(() => {
                    textEl.textContent = this.cards[this.currentIdx];
                    if (badgeEl) badgeEl.childNodes[badgeEl.childNodes.length - 1].textContent = this.categories[this.currentIdx] || 'Mindful Prompt';
                    textEl.style.opacity   = '1';
                    textEl.style.transform = 'translateY(0)';
                }, 180);
            }
        },

        destroy() {}
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 3: REACTION REFLEX (ENHANCED)
       ═══════════════════════════════════════════════════════════ */
    reflex: {
        round:            0,
        maxRounds:        10,
        scores:           [],
        targetAppearTime: 0,
        timeoutId:        null,
        gameState:        'ready',

        init(container) {
            this.round     = 0;
            this.scores    = [];
            this.gameState = 'ready';

            container.innerHTML = `
                <div class="reflex-wrap">
                    <div class="reflex-stats-row">
                        <div class="reflex-stat-box" id="reflexRoundBox">
                            <div class="reflex-stat-val" id="reflexRound">0 / 10</div>
                            <div class="reflex-stat-lbl">Round</div>
                        </div>
                        <div class="reflex-stat-box" id="reflexLastBox">
                            <div class="reflex-stat-val" id="reflexLast">—</div>
                            <div class="reflex-stat-lbl">Last Tap</div>
                        </div>
                        <div class="reflex-stat-box" id="reflexAvgBox">
                            <div class="reflex-stat-val" id="reflexAvg">—</div>
                            <div class="reflex-stat-lbl">Average</div>
                        </div>
                    </div>

                    <div class="reflex-board ready" id="reflexBoard" data-action="reflex-board-tap">
                        <div class="reflex-board-message" id="reflexMsg">
                            <p>Tap anywhere to start</p>
                            <span class="reflex-sub">Hit the glowing target as fast as possible!</span>
                        </div>
                        <div class="reflex-target-dot" id="reflexDot" data-action="reflex-target-tap">
                            ${Icons.target ? Icons.target(24) : '●'}
                        </div>
                    </div>

                    <button class="breathe-btn primary" id="reflexActionBtn" data-action="reflex-start-round" style="margin-top:4px;">
                        Start Round 1
                    </button>
                </div>
            `;
        },

        startRound() {
            if (this.round >= this.maxRounds) { this.finishGame(); return; }

            this.gameState = 'waiting';
            const msg   = document.getElementById('reflexMsg');
            const dot   = document.getElementById('reflexDot');
            const btn   = document.getElementById('reflexActionBtn');
            const board = document.getElementById('reflexBoard');

            if (msg)   msg.innerHTML = '<p>Wait for it...</p>';
            if (dot)   dot.classList.remove('visible');
            if (btn)   { btn.textContent = 'Waiting...'; btn.disabled = true; }
            if (board) { board.classList.remove('ready'); board.classList.add('active'); }

            const delay = 1000 + Math.random() * 2600;
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(() => this.showTarget(), delay);
        },

        showTarget() {
            this.gameState = 'target';
            const board = document.getElementById('reflexBoard');
            const dot   = document.getElementById('reflexDot');
            const msg   = document.getElementById('reflexMsg');
            if (!board || !dot) return;
            if (msg) msg.innerHTML = '';

            const rect = board.getBoundingClientRect();
            const pad  = 45;
            const x    = pad + Math.random() * (rect.width  - pad * 2);
            const y    = pad + Math.random() * (rect.height - pad * 2);
            dot.style.left = `${x}px`;
            dot.style.top  = `${y}px`;
            dot.classList.add('visible');
            this.targetAppearTime = performance.now();
            if (window.Sound) Sound.click();
        },

        handleTargetTap() {
            if (this.gameState !== 'target') return;
            const elapsed = Math.round(performance.now() - this.targetAppearTime);
            this.scores.push(elapsed);
            this.round++;

            const dot   = document.getElementById('reflexDot');
            const board = document.getElementById('reflexBoard');
            if (dot)   dot.classList.remove('visible');
            if (board) {
                board.classList.add('hit-flash');
                setTimeout(() => board.classList.remove('hit-flash'), 300);
            }
            if (window.Sound) Sound.success();

            const roundEl = document.getElementById('reflexRound');
            const lastEl  = document.getElementById('reflexLast');
            const avgEl   = document.getElementById('reflexAvg');
            const msg     = document.getElementById('reflexMsg');
            const btn     = document.getElementById('reflexActionBtn');
            const lastBox = document.getElementById('reflexLastBox');

            if (roundEl) roundEl.textContent = `${this.round} / ${this.maxRounds}`;
            if (lastEl)  lastEl.textContent  = `${elapsed}ms`;
            if (lastBox) {
                lastBox.classList.add('highlight');
                setTimeout(() => lastBox.classList.remove('highlight'), 600);
            }

            const avg = Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
            if (avgEl) avgEl.textContent = `${avg}ms`;

            if (this.round < this.maxRounds) {
                this.gameState = 'ready';
                if (msg) msg.innerHTML = `<p style="color:var(--ac);font-size:1rem;font-weight:800;">${elapsed}ms!</p><span class="reflex-sub">Tap below for next round</span>`;
                if (btn) { btn.disabled = false; btn.textContent = `Round ${this.round + 1}`; }
            } else {
                this.finishGame();
            }
        },

        finishGame() {
            this.gameState = 'done';
            const avg  = Math.round(this.scores.reduce((a, b) => a + b, 0) / this.scores.length);
            const best = Math.min(...this.scores);
            const board= document.getElementById('reflexBoard');
            if (board) board.classList.remove('active');

            if (!State.data.games) State.data.games = {};
            if (!State.data.games.bestReflex || best < State.data.games.bestReflex) {
                State.data.games.bestReflex = best;
                Storage.save();
            }

            let sparksReward = 5;
            if (avg < 250)      sparksReward = 15;
            else if (avg < 350) sparksReward = 12;
            else if (avg < 450) sparksReward = 10;

            let rating = 'Good';
            let ratingIcon = Icons.check ? Icons.check(18) : '';
            if (avg < 250)      { rating = 'Lightning'; ratingIcon = Icons.zap ? Icons.zap(18) : ''; }
            else if (avg < 350) { rating = 'Fast';      ratingIcon = Icons.fire ? Icons.fire(18) : ''; }
            else if (avg < 450) { rating = 'Solid';     ratingIcon = Icons.check ? Icons.check(18) : ''; }

            Games.awardSparks(sparksReward, 'Reaction Reflex');

            const msg = document.getElementById('reflexMsg');
            const btn = document.getElementById('reflexActionBtn');

            if (msg) {
                msg.innerHTML = `
                    <h3 style="color:var(--ac);margin-bottom:6px;font-size:1.1rem;display:flex;align-items:center;justify-content:center;gap:6px;">${ratingIcon} <span>${rating} Reflexes!</span></h3>
                    <p style="margin:3px 0;font-weight:700;">Avg: ${avg}ms · Best: ${best}ms</p>
                    <span style="font-size:0.75rem;color:var(--ac);font-weight:800;">+${sparksReward} Sparks Earned!</span>
                `;
            }
            if (btn) {
                btn.disabled       = false;
                btn.textContent    = 'Play Again';
                btn.dataset.action = 'reflex-play-again';
            }
        },

        destroy() { clearTimeout(this.timeoutId); }
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 4: ZEN SAND GARDEN (ENHANCED)
       ═══════════════════════════════════════════════════════════ */
    zen: {
        canvas:        null,
        ctx:           null,
        isDrawing:     false,
        lastX:         0,
        lastY:         0,
        startTime:     null,
        minuteTimerId: null,
        minutesElapsed:0,
        brushSize:     3,

        init(container) {
            this.minutesElapsed = 0;
            this.startTime      = Date.now();
            this.brushSize      = 3;

            container.innerHTML = `
                <div class="zen-wrap">
                    <div class="zen-timer-pill">
                        ${Icons.garden ? Icons.garden(16) : Icons.lotus(16)}
                        <span id="zenTimeLbl">Mindful Garden: 0 min</span>
                        <span style="color:var(--ac);font-weight:800;margin-left:4px;display:inline-flex;align-items:center;gap:3px;">+2 ${Icons.spark ? Icons.spark(12) : ''}/min</span>
                    </div>

                    <div class="zen-canvas-wrap">
                        <canvas class="zen-canvas" id="zenCanvas"></canvas>
                    </div>

                    <div class="zen-toolbar">
                        <button class="zen-btn" data-action="zen-clear">
                            ${Icons.refresh ? Icons.refresh(14) : '↺'}
                            Rake Fresh Sand
                        </button>
                        <button class="zen-btn" id="zenBrushToggle" data-action="zen-brush">
                            Fine Rake
                        </button>
                    </div>
                </div>
            `;

            const canvas = document.getElementById('zenCanvas');
            if (!canvas) return;
            this.canvas = canvas;
            this.ctx    = canvas.getContext('2d');

            const rect  = canvas.parentElement.getBoundingClientRect();
            const dpr   = window.devicePixelRatio || 1;
            canvas.width  = rect.width  * dpr;
            canvas.height = rect.width  * dpr; // square
            this.ctx.scale(dpr, dpr);

            this.clearSand();
            this.attachEvents();

            clearInterval(this.minuteTimerId);
            this.minuteTimerId = setInterval(() => {
                this.minutesElapsed++;
                const lbl = document.getElementById('zenTimeLbl');
                if (lbl) lbl.textContent = `Mindful Garden: ${this.minutesElapsed} min`;
                if (!State.data.games) State.data.games = {};
                State.data.games.zenMinutes = (State.data.games.zenMinutes || 0) + 1;
                Storage.save();
                Games.awardSparks(2, 'Zen Garden');
            }, 60000);
        },

        clearSand() {
            if (!this.ctx || !this.canvas) return;
            const w = this.canvas.width  / (window.devicePixelRatio || 1);
            const h = this.canvas.height / (window.devicePixelRatio || 1);
            const style = getComputedStyle(document.documentElement);
            const bg2   = style.getPropertyValue('--bg2').trim() || '#161616';
            this.ctx.fillStyle = bg2;
            this.ctx.fillRect(0, 0, w, h);
            // Subtle sand grain texture
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
            for (let i = 0; i < 600; i++) {
                this.ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
            }
        },

        toggleBrush() {
            this.brushSize = this.brushSize === 3 ? 6 : 3;
            const btn = document.getElementById('zenBrushToggle');
            if (btn) btn.textContent = this.brushSize === 3 ? 'Fine Rake' : 'Wide Rake';
        },

        attachEvents() {
            const canvas = this.canvas;
            if (!canvas) return;

            const getPos = (e) => {
                const rect    = canvas.getBoundingClientRect();
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: clientX - rect.left, y: clientY - rect.top };
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

            const endDraw = () => { this.isDrawing = false; };

            canvas.addEventListener('mousedown',  startDraw);
            canvas.addEventListener('mousemove',  moveDraw);
            window.addEventListener('mouseup',    endDraw);
            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove',  moveDraw,  { passive: false });
            window.addEventListener('touchend',   endDraw);
        },

        drawRake(x1, y1, x2, y2) {
            if (!this.ctx) return;
            const spacing = this.brushSize === 3 ? 6 : 10;
            const tines   = this.brushSize === 3 ? 3 : 5;
            const ac = getComputedStyle(document.documentElement).getPropertyValue('--ac').trim() || '#22c55e';
            const offsets = Array.from({ length: tines }, (_, i) => (i - Math.floor(tines / 2)) * spacing);

            offsets.forEach(offset => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = ac;
                this.ctx.globalAlpha = 0.4;
                this.ctx.lineWidth   = 2;
                this.ctx.lineCap     = 'round';
                this.ctx.lineJoin    = 'round';
                this.ctx.moveTo(x1 + offset, y1);
                this.ctx.lineTo(x2 + offset, y2);
                this.ctx.stroke();
            });
            this.ctx.globalAlpha = 1.0;
        },

        destroy() { clearInterval(this.minuteTimerId); }
    },

    /* ═══════════════════════════════════════════════════════════
       GAME 5: MEMORY SEQUENCE (NEW!)
       Simon-style: watch the sequence, then repeat it.
       Trains working memory and focus.
       ═══════════════════════════════════════════════════════════ */
    memory: {
        sequence:       [],
        playerInput:    [],
        level:          0,
        maxLevel:       0,
        isWatching:     false,
        isInputting:    false,
        timerId:        null,
        icons:          ['ocean','fire','seedling','star','moon','gem','flower','target','zap'],

        init(container) {
            this.sequence    = [];
            this.playerInput = [];
            this.level       = 0;
            this.maxLevel    = 0;
            this.isWatching  = false;
            this.isInputting = false;

            container.innerHTML = `
                <div class="memory-wrap">
                    <div class="memory-status-row">
                        <div class="memory-stat-box">
                            <div class="memory-stat-val" id="memLevel">0</div>
                            <div class="memory-stat-lbl">Level</div>
                        </div>
                        <div class="memory-stat-box">
                            <div class="memory-stat-val" id="memBest">${State.data.games?.bestMemoryLevel || 0}</div>
                            <div class="memory-stat-lbl">Best</div>
                        </div>
                        <div class="memory-stat-box">
                            <div class="memory-stat-val" id="memProgress">—</div>
                            <div class="memory-stat-lbl">Progress</div>
                        </div>
                    </div>

                    <div class="memory-status-msg watching" id="memStatus">Press Start to begin!</div>

                    <div class="memory-grid" id="memGrid">
                        ${this.icons.slice(0, 9).map((ic, i) => `
                            <div class="memory-cell locked" data-cell="${i}" data-action="memory-tap" data-idx="${i}">
                                ${Icons.parse(ic, 24)}
                            </div>
                        `).join('')}
                    </div>

                    <button class="breathe-btn primary" id="memStartBtn" data-action="memory-start">
                        Start Game
                    </button>
                </div>
            `;
        },

        startGame() {
            this.sequence    = [];
            this.playerInput = [];
            this.level       = 0;
            this.nextLevel();
        },

        nextLevel() {
            this.level++;
            this.playerInput = [];
            this.isInputting = false;
            this.isWatching  = true;

            // Add one more cell to sequence
            this.sequence.push(Math.floor(Math.random() * 9));

            const levelEl = document.getElementById('memLevel');
            const progEl  = document.getElementById('memProgress');
            const status  = document.getElementById('memStatus');
            const btn     = document.getElementById('memStartBtn');

            if (levelEl) levelEl.textContent = this.level;
            if (progEl)  progEl.textContent  = `0/${this.sequence.length}`;
            if (status)  { status.textContent = 'Watch the sequence...'; status.className = 'memory-status-msg watching'; }
            if (btn)     { btn.disabled = true; btn.textContent = 'Watching...'; }

            this.lockCells(true);
            this.playSequence();
        },

        lockCells(locked) {
            document.querySelectorAll('.memory-cell').forEach(c => {
                if (locked) c.classList.add('locked');
                else        c.classList.remove('locked');
            });
        },

        playSequence() {
            let delay = 400;
            this.sequence.forEach((cellIdx, i) => {
                this.timerId = setTimeout(() => {
                    this.flashCell(cellIdx, 500);
                    if (i === this.sequence.length - 1) {
                        setTimeout(() => {
                            this.isWatching  = false;
                            this.isInputting = true;
                            this.lockCells(false);
                            const status = document.getElementById('memStatus');
                            if (status) { status.textContent = `Your turn! Tap the sequence (${this.sequence.length} steps)`; status.className = 'memory-status-msg'; }
                        }, 700);
                    }
                }, delay + i * 700);
            });
        },

        flashCell(idx, duration = 500) {
            const cell = document.querySelector(`[data-cell="${idx}"]`);
            if (!cell) return;
            cell.classList.add('lit');
            if (window.Sound) Sound.click();
            setTimeout(() => cell.classList.remove('lit'), duration);
        },

        handleTap(idx) {
            if (!this.isInputting) return;
            const expected = this.sequence[this.playerInput.length];
            this.playerInput.push(idx);

            const progEl = document.getElementById('memProgress');
            if (progEl) progEl.textContent = `${this.playerInput.length}/${this.sequence.length}`;

            if (idx === expected) {
                // Correct tap
                const cell = document.querySelector(`[data-cell="${idx}"]`);
                if (cell) {
                    cell.classList.add('correct');
                    setTimeout(() => cell.classList.remove('correct'), 400);
                }
                if (window.Sound) Sound.success();

                if (this.playerInput.length === this.sequence.length) {
                    // Completed the sequence
                    const status = document.getElementById('memStatus');
                    if (status) { status.innerHTML = `${Icons.check ? Icons.check(14) : ''} <span>Sequence correct!</span>`; status.className = 'memory-status-msg correct-msg'; }

                    Games.awardSparks(this.level, `Memory Level ${this.level}`);

                    // Save best
                    if (this.level > (State.data.games?.bestMemoryLevel || 0)) {
                        if (!State.data.games) State.data.games = {};
                        State.data.games.bestMemoryLevel = this.level;
                        const bestEl = document.getElementById('memBest');
                        if (bestEl) bestEl.textContent = this.level;
                        Storage.save();
                    }

                    this.isInputting = false;
                    this.lockCells(true);
                    setTimeout(() => this.nextLevel(), 900);
                }
            } else {
                // Wrong tap — game over
                const cell = document.querySelector(`[data-cell="${idx}"]`);
                if (cell) { cell.classList.add('wrong'); setTimeout(() => cell.classList.remove('wrong'), 600); }
                this.isInputting = false;
                this.lockCells(true);

                const finalLevel = this.level;
                const status     = document.getElementById('memStatus');
                const btn        = document.getElementById('memStartBtn');
                if (status) { status.textContent = `Oops! Reached Level ${finalLevel}. Play again!`; status.className = 'memory-status-msg wrong-msg'; }
                if (btn)    { btn.disabled = false; btn.textContent = 'Play Again'; btn.dataset.action = 'memory-start'; }
            }
        },

        destroy() {
            clearTimeout(this.timerId);
            this.isWatching  = false;
            this.isInputting = false;
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
    } else if (action === 'reflex-board-tap') {
        // Only trigger if not hitting dot (board background tap does nothing in target state)
        if (Games.reflex.gameState === 'ready') { /* handled by btn */ }
    } else if (action === 'zen-clear') {
        Games.zen.clearSand();
        if (window.Sound) Sound.click();
    } else if (action === 'zen-brush') {
        Games.zen.toggleBrush();
    } else if (action === 'memory-start') {
        Games.memory.startGame();
    } else if (action === 'memory-tap') {
        const idx = parseInt(el.dataset.idx, 10);
        if (!isNaN(idx)) Games.memory.handleTap(idx);
    }
});
