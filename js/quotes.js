/* ═══════════════════════════════════════════════════════════
   FOCUSSIUM 3.0 — QUOTES MODULE
   Daily motivational quotes engine
═══════════════════════════════════════════════════════════ */

const QUOTES_COLLECTION = [
    { text: 'The wound is the place where the Light enters you.', author: 'Rumi' },
    { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
    { text: 'He who has a why to live can bear almost any how.', author: 'Viktor Frankl' },
    { text: 'Your mind is for having ideas, not holding them.', author: 'David Allen' },
    { text: 'Mastering others is strength. Mastering yourself is true power.', author: 'Lao Tzu' },
    { text: 'We suffer more often in imagination than in reality.', author: 'Seneca' },
    { text: 'There is nothing outside of yourself that can ever enable you to get better. Everything is within.', author: 'Miyamoto Musashi' },
    { text: 'A calm mind, a fit body, a house full of love. These things must be earned, not bought.', author: 'Naval Ravikant' },
    { text: 'Focus is a matter of deciding what things you\'re not going to do.', author: 'John Carmack' },
    { text: 'It is not that we have a short time to live, but that we waste a lot of it.', author: 'Seneca' },
    { text: 'Silence is a source of great strength.', author: 'Lao Tzu' },
    { text: 'It\'s not what happens to you, but how you react to it that matters.', author: 'Epictetus' },
    { text: 'Do not pray for an easy life, pray for the strength to endure a difficult one.', author: 'Bruce Lee' },
    { text: 'What we achieve inwardly will change outer reality.', author: 'Plutarch' },
    { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
    { text: 'Flow is the state of total immersion where action and awareness merge.', author: 'Mihaly Csikszentmihalyi' },
    { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
    { text: 'To be calm is the highest achievement of the self.', author: 'Zen Proverb' },
    { text: 'Concentrate all your thoughts upon the work in hand. The sun\'s rays do not burn until brought to a focus.', author: 'Alexander Graham Bell' },
    // v3.0 additions
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'You don\'t rise to the level of your goals, you fall to the level of your systems.', author: 'James Clear' },
    { text: 'Almost everything will work again if you unplug it for a few minutes, including you.', author: 'Anne Lamott' },
    { text: 'Energy, not time, is the fundamental currency of high performance.', author: 'Jim Loehr' }
];

const Quotes = {
    getTodayQuote() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        return QUOTES_COLLECTION[dayOfYear % QUOTES_COLLECTION.length];
    },

    render() {
        const card   = document.getElementById('dailyQuoteCard');
        const text   = document.getElementById('dailyQuoteText');
        const author = document.getElementById('dailyQuoteAuthor');
        const sparkle= document.getElementById('quoteSparkleIcon');

        if (!card || !text || !author) return;

        const q = this.getTodayQuote();
        text.textContent = `"${q.text}"`;
        author.textContent = `— ${q.author}`;
        if (sparkle && Icons.spark) sparkle.innerHTML = Icons.spark(14);
        card.style.display = 'flex';
    }
};
