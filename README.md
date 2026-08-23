# 🧘 Focussium 3.0 — Deep Focus Productivity Sanctuary

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-00CFEB?style=for-the-badge&logo=pwa&logoColor=black)](https://sanjay3226.github.io/Focussium/)
[![License](https://img.shields.io/badge/License-MIT-E8B923?style=for-the-badge)](LICENSE)
[![WCAG 2.1](https://img.shields.io/badge/WCAG_2.1-AA_Compliant-8DD85A?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)
[![Offline First](https://img.shields.io/badge/Offline-First-FF6B35?style=for-the-badge)](https://sanjay3226.github.io/Focussium/)

> **Live Application**: [sanjay3226.github.io/Focussium](https://sanjay3226.github.io/Focussium/)

---

## ⚡ What is Focussium 3.0?

**Focussium 3.0** is an offline-first, high-contrast progressive web application (PWA) designed for deep work, habit formation, and mindful productivity. Built from the ground up for minds that work differently.

---

## ✨ Features

- ⏱️ **Focus Timer & Atmosphere**: Adaptive Pomodoro engine with custom work/break intervals, ambient soundscapes (rain, waves, binaural, deep hum), and fullscreen zen focus mode.
- 📋 **Intuitive Task Engine**: Priority badges, subtasks, custom lists, and automated recurring tasks (daily, weekly, custom intervals).
- 🌱 **Daily Habits Tracker**: Visual 7-day habit streaks, progress KPI bars, and instant XP reward loops (+25 XP).
- 🧠 **Brain Dump & Energy Vibe**: Frictionless thought capture with one-click conversion to tasks, paired with daily energy logging.
- 📊 **Weekly & Monthly Vibe Analytics**: Interactive productivity heatmaps, focus momentum graphs, day-by-day drill-downs, and exportable PDF summaries.
- 🎨 **Adaptive Dual-Theme Engine**: 9 curated aesthetic presets (Neon, Royal, Matcha, Ember, Solar, Aurora, Steel, Blush, Sage) + custom hex picker with automated WCAG 2.1 luminance contrast calculation (`--ac-text`).
- ⚡ **Command Glass (Ctrl+K)**: Focus-trapped quick action modal for immediate keyboard-driven task & dump capture.
- 🔒 **Offline-First & Cloud Sync**: Seamless local-first storage with optional Firebase cloud sync across devices.

---

## 🏗️ Architecture

Focussium 3.0 is built on a clean, decoupled modular architecture without bloated framework dependencies:

```
├── index.html          # Semantic HTML5 shell with central data-action event bus
├── sw.js               # Service Worker with allSettled cache installer & auto-update
├── manifest.json       # PWA manifest with homescreen quick actions
├── DEV-LOG.md          # Internal developer log and git reference
│
├── css/                # Scoped design tokens & modular styling
│   ├── tokens.css      # Core tokens, color palettes & --ac-text contrast rules
│   ├── reset.css       # Keyboard focus-visible & typography resets
│   ├── animations.css  # Hardware-accelerated keyframe transitions
│   ├── layout.css      # App shell, responsive header, nav & FAB
│   ├── components.css  # Cards, toggles, badges, inputs & tabs
│   ├── pages.css       # Page-specific views (Home, Tasks, Dump, Habits, Report)
│   ├── modals.css      # Bottom sheets, settings, command glass & onboarding
│   ├── timer.css       # Pomodoro ring geometry, ambient row & fullscreen mode
│   └── charts.css      # SVG line charts, monthly calendar & activity heatmaps
│
└── js/                 # 28 isolated ES6 feature modules
    ├── config.js       # App configuration, ranks & accent definitions
    ├── state.js        # Reactive state container with schema migration
    ├── utils.js        # ID generators, date formatting & error logging
    ├── storage.js      # LocalStorage engine with import/export routines
    ├── theme.js        # Dual-theme switcher & WCAG luminance engine
    ├── toast.js        # Accessible alert notification manager
    ├── auth.js         # Firebase Auth integration
    ├── router.js       # SPA navigation & hash-based routing
    ├── clock.js        # Real-time precision clock
    ├── confetti.js     # Lightweight SVG celebration engine
    ├── quotes.js       # Curated daily mindfulness quotes
    ├── level.js        # XP progression & rank gamification
    ├── tasks.js        # Task CRUD, filters & repeat scheduler
    ├── dump.js         # Thought capture & mood logger
    ├── pomo.js         # Pomodoro state machine & audio synthesis
    ├── habits.js       # Daily habit tracker & streak calculation
    ├── home.js         # Main dashboard view orchestrator
    ├── report.js       # Vibe score engine & chart renderer
    ├── account.js      # User profile & performance statistics
    ├── settings.js     # User preferences & custom color picker
    ├── onboard.js      # First-time user welcome flow
    ├── command-glass.js# Ctrl+K modal with focus trap
    ├── icons.js        # Embedded SVG icon registry
    ├── sounds.js       # Web Audio API sound effects
    ├── firebase-config.js
    ├── threebg_dark.js # Dark mode cosmic background
    ├── threebg_light.js# Light mode clean background
    └── app.js          # Lightweight application bootloader
```

---

## 🚀 Getting Started

### Run Locally

Since Focussium is pure web technology (HTML5, Vanilla CSS, Vanilla JS), you can serve it with any local server:

```bash
# Using Python
python -m http.server 8000

# Using Node (npx)
npx serve .
```

Open `http://localhost:8000` in your browser.

---

## 📱 PWA Installation

1. Open [https://sanjay3226.github.io/Focussium/](https://sanjay3226.github.io/Focussium/) in Chrome, Edge, or Safari.
2. Click **Install** or tap **Share > Add to Home Screen**.
3. Enjoy standalone offline access with zero latency.

---

## 📄 License

MIT © [Sanjay](https://github.com/sanjay3226)
