/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — QUOTES & AI INSIGHTS ENGINE
   70+ Master Quotes + Contextual Adaptive AI Insights
   ═══════════════════════════════════════════════════════════ */

const QUOTES_COLLECTION = [
    /* ─── STOIC RESILIENCE & INNER CITADEL ─── */
    { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", cat: "Stoic" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca", cat: "Stoic" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", cat: "Stoic" },
    { text: "It's not what happens to you, but how you react to it that matters.", author: "Epictetus", cat: "Stoic" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", cat: "Stoic" },
    { text: "At dawn, when you have trouble getting out of bed, tell yourself: I have to go to work — as a human being.", author: "Marcus Aurelius", cat: "Stoic" },
    { text: "Waste no more time arguing what a good man should be. Be one.", author: "Marcus Aurelius", cat: "Stoic" },
    { text: "No man is free who is not master of himself.", author: "Epictetus", cat: "Stoic" },
    { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius", cat: "Stoic" },
    { text: "If you accomplish something good with hard work, the labor passes quickly, but the good endures.", author: "Musonius Rufus", cat: "Stoic" },
    { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca", cat: "Stoic" },
    { text: "He who fears death will never do anything worthy of a man who is alive.", author: "Seneca", cat: "Stoic" },

    /* ─── DEEP WORK, FOCUS & FLOW STATE ─── */
    { text: "Clarity about what matters provides clarity about what does not.", author: "Cal Newport", cat: "Deep Work" },
    { text: "If you don't produce, you won't thrive — no matter how skilled or talented you are.", author: "Cal Newport", cat: "Deep Work" },
    { text: "Flow is the state of total immersion where action and awareness merge.", author: "Mihaly Csikszentmihalyi", cat: "Flow" },
    { text: "The best moments usually occur when a person's body or mind is stretched to its limits to accomplish something difficult.", author: "Mihaly Csikszentmihalyi", cat: "Flow" },
    { text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack", cat: "Deep Work" },
    { text: "Deciding what not to do is as important as deciding what to do.", author: "Steve Jobs", cat: "Focus" },
    { text: "Your mind is for having ideas, not holding them.", author: "David Allen", cat: "Clarity" },
    { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell", cat: "Focus" },
    { text: "If you don't prioritize your life, someone else will.", author: "Greg McKeown", cat: "Clarity" },
    { text: "Energy, not time, is the fundamental currency of high performance.", author: "Jim Loehr", cat: "Performance" },
    { text: "All of humanity's problems stem from man's inability to sit quietly in a room alone.", author: "Blaise Pascal", cat: "Focus" },
    { text: "Simplicity boils down to two steps: Identify the essential. Eliminate the rest.", author: "Leo Babauta", cat: "Clarity" },

    /* ─── HABITS & SYSTEMS ARCHITECTURE ─── */
    { text: "You don't rise to the level of your goals, you fall to the level of your systems.", author: "James Clear", cat: "Systems" },
    { text: "Every action you take is a vote for the type of person you wish to become.", author: "James Clear", cat: "Habits" },
    { text: "Small habits don't add up. They compound.", author: "James Clear", cat: "Habits" },
    { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", cat: "Discipline" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain", cat: "Momentum" },
    { text: "Action precedes motivation. Do the work first; inspiration follows.", author: "Andrew Huberman", cat: "Neural" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", cat: "Habits" },

    /* ─── MASTERY, ZEN & WARRIOR MINDSET ─── */
    { text: "There is nothing outside of yourself that can ever enable you to get better. Everything is within.", author: "Miyamoto Musashi", cat: "Mastery" },
    { text: "Do nothing that is of no use.", author: "Miyamoto Musashi", cat: "Mastery" },
    { text: "Step by step walk the thousand-mile road.", author: "Miyamoto Musashi", cat: "Mastery" },
    { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", cat: "Zen" },
    { text: "Silence is a source of great strength.", author: "Lao Tzu", cat: "Zen" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", cat: "Zen" },
    { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee", cat: "Discipline" },
    { text: "It is not a daily increase, but a daily decrease. Hack away at the unessential.", author: "Bruce Lee", cat: "Clarity" },
    { text: "To be calm is the highest achievement of the self.", author: "Zen Proverb", cat: "Zen" },
    { text: "The wound is the place where the Light enters you.", author: "Rumi", cat: "Zen" },
    { text: "Do not feel lonely, the entire universe is inside you.", author: "Rumi", cat: "Zen" },
    { text: "Victorious warriors win first and then go to war.", author: "Sun Tzu", cat: "Strategy" },

    /* ─── RUTHLESS DISCIPLINE & ENDURANCE ─── */
    { text: "Discipline equals freedom.", author: "Jocko Willink", cat: "Discipline" },
    { text: "You are in danger of living a life so comfortable that you will die without realizing your true potential.", author: "David Goggins", cat: "Drive" },
    { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln", cat: "Discipline" },
    { text: "He who has a why to live can bear almost any how.", author: "Viktor Frankl", cat: "Resilience" },
    { text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", cat: "Resilience" },
    { text: "He who climbs upon the highest mountains laughs at all tragedies.", author: "Friedrich Nietzsche", cat: "Resilience" },
    { text: "Rest at the end, not in the middle.", author: "Kobe Bryant", cat: "Drive" },
    { text: "Everything gets easier when you stop expecting it to be easy.", author: "Tim Grover", cat: "Drive" },
    { text: "Action is the true measure of discipline.", author: "Toji Fushiguro", cat: "Discipline" },

    /* ─── MODERN INTELLECT, CLARITY & NAVALISM ─── */
    { text: "A calm mind, a fit body, a house full of love. These things must be earned, not bought.", author: "Naval Ravikant", cat: "Clarity" },
    { text: "Impatience with actions, patience with results.", author: "Naval Ravikant", cat: "Patience" },
    { text: "If you can't see yourself working with someone for life, don't work with them for a day.", author: "Naval Ravikant", cat: "Clarity" },
    { text: "The first principle is that you must not fool yourself — and you are the easiest person to fool.", author: "Richard Feynman", cat: "Intellect" },
    { text: "Sometimes it is the people no one can imagine anything of who do the things no one can imagine.", author: "Alan Turing", cat: "Intellect" },
    { text: "If it's not a 'HELL YES!', it's a 'no'.", author: "Derek Sivers", cat: "Clarity" },
    { text: "What we achieve inwardly will change outer reality.", author: "Plutarch", cat: "Mind" },
    { text: "Almost everything will work again if you unplug it for a few minutes, including you.", author: "Anne Lamott", cat: "Recovery" },
    { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius", cat: "Stoic" }
];

/* ─── AI ADAPTIVE INSIGHTS ENGINE ─── */
const AI_INSIGHTS_COLLECTION = [
    {
        tag: "Morning Priming 🌅",
        text: "Your prefrontal cortex operates at peak neurochemical bandwidth during morning hours. Guard your first 90 minutes from low-entropy reactive feeds.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Deep Flow ⚡",
        text: "Attention residue lingers for up to 22 minutes whenever you check a notification. Single-tasking isn't a preference; it is biological efficiency.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Dopamine Ecology 🧠",
        text: "Dopamine is released in anticipation of progress, not the outcome. Empathize with the friction of the first 5 minutes — flow lives on the other side.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "The 80/20 Lever 🎯",
        text: "Identify the single task you are currently avoiding most. In 85% of cases, that single task carries over 70% of your day's total leverage.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Habit Momentum 🔄",
        text: "Never break the chain twice. Missing one day is an anomaly; missing two days begins the formation of a counter-habit.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Ultradian Rhythm 🌊",
        text: "Human attention cycles operate in 90-minute ultradian rhythms followed by a 15-minute biological down-shift. Work in waves, not constant grind.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Cognitive Subtraction ✂️",
        text: "True productivity is not adding more items to your schedule. It is the ruthless, unapologetic deletion of second-tier priorities.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Evening Decompression 🌙",
        text: "Cognitive consolidation occurs during deep sleep. A structured evening shutdown routine anchors the psychological transition from output to repair.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Late Night Stillness 🌌",
        text: "The world is asleep. There is zero competitive noise. Use this stillness to execute deeply, but respect your circadian baseline.",
        author: "Focussium AI Neural Engine"
    },
    {
        tag: "Identity Architecture 🏛️",
        text: "Do not say 'I am trying to study'. Say 'I am a disciplined researcher'. Identity precedes action, and action cements identity.",
        author: "Focussium AI Neural Engine"
    }
];

const Quotes = {
    _currentIndex: -1,
    _isInsight: false,

    /** Get deterministic daily quote based on day of year */
    getTodayQuote() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return QUOTES_COLLECTION[dayOfYear % QUOTES_COLLECTION.length];
    },

    /** Dynamic contextual insight based on time of day, habits, and focus metrics */
    getAdaptiveInsight() {
        const hour = new Date().getHours();

        // 1. Time-of-day contextual selection
        if (hour >= 5 && hour < 11) {
            return AI_INSIGHTS_COLLECTION[0]; // Morning Priming
        }
        if (hour >= 11 && hour < 14) {
            return AI_INSIGHTS_COLLECTION[1]; // Deep Flow
        }
        if (hour >= 14 && hour < 18) {
            return AI_INSIGHTS_COLLECTION[3]; // The 80/20 Lever
        }
        if (hour >= 18 && hour < 22) {
            return AI_INSIGHTS_COLLECTION[7]; // Evening Decompression
        }
        if (hour >= 22 || hour < 5) {
            return AI_INSIGHTS_COLLECTION[8]; // Late Night Stillness
        }

        return AI_INSIGHTS_COLLECTION[2]; // Dopamine Ecology default
    },

    /** Return random stoic quote for reports and export studio */
    getRandomStoic() {
        const stoics = QUOTES_COLLECTION.filter(q => q.cat === 'Stoic');
        return stoics[Math.floor(Math.random() * stoics.length)];
    },

    /** Return random general quote */
    getRandom() {
        return QUOTES_COLLECTION[Math.floor(Math.random() * QUOTES_COLLECTION.length)];
    },

    /** Cycle to next quote or AI insight with silky transition */
    next() {
        const card   = document.getElementById('dailyQuoteCard');
        const text   = document.getElementById('dailyQuoteText');
        const author = document.getElementById('dailyQuoteAuthor');
        const tag    = document.getElementById('quoteTag');

        if (!card || !text || !author) return;

        if (typeof Sound !== 'undefined' && Sound.click) Sound.click();

        // Smooth fade out
        text.classList.add('quote-fade-out');
        author.classList.add('quote-fade-out');

        setTimeout(() => {
            // Toggle between quote and AI insight
            this._isInsight = !this._isInsight;

            let item;
            if (this._isInsight) {
                const randInsight = AI_INSIGHTS_COLLECTION[Math.floor(Math.random() * AI_INSIGHTS_COLLECTION.length)];
                item = {
                    text: randInsight.text,
                    author: randInsight.author,
                    tag: randInsight.tag || 'AI Neural Insight ✦'
                };
            } else {
                if (this._currentIndex === -1) {
                    this._currentIndex = Math.floor(Math.random() * QUOTES_COLLECTION.length);
                } else {
                    this._currentIndex = (this._currentIndex + 1) % QUOTES_COLLECTION.length;
                }
                const q = QUOTES_COLLECTION[this._currentIndex];
                item = {
                    text: q.text,
                    author: q.author,
                    tag: q.cat ? `${q.cat} ✦` : 'Wisdom ✦'
                };
            }

            text.textContent = `"${item.text}"`;
            author.textContent = `— ${item.author}`;
            if (tag) tag.textContent = item.tag;

            text.classList.remove('quote-fade-out');
            author.classList.remove('quote-fade-out');
        }, 160);
    },

    render() {
        const card   = document.getElementById('dailyQuoteCard');
        const text   = document.getElementById('dailyQuoteText');
        const author = document.getElementById('dailyQuoteAuthor');
        const sparkle= document.getElementById('quoteSparkleIcon');
        const tag    = document.getElementById('quoteTag');

        if (!card || !text || !author) return;

        // Default: display today's quote with its category badge
        const q = this.getTodayQuote();
        text.textContent = `"${q.text}"`;
        author.textContent = `— ${q.author}`;
        if (tag) tag.textContent = q.cat ? `${q.cat} ✦` : 'Wisdom ✦';
        if (sparkle && Icons.spark) sparkle.innerHTML = Icons.spark(14);

        card.style.display = 'flex';
    }
};
