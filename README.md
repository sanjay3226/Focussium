<div align="center">

# ⚡ F O C U S S I U M
### The Aesthetic Deep Work & Mindful Discipline Sanctuary

[![Live Demo](https://img.shields.io/badge/LIVE_DEMO-focussium.app-00E5FF?style=for-the-badge&logo=google-chrome&logoColor=black)](https://sanjay3226.github.io/Focussium/)
[![PWA Ready](https://img.shields.io/badge/PWA-100%25_Offline-7928CA?style=for-the-badge&logo=pwa&logoColor=white)](https://sanjay3226.github.io/Focussium/)
[![License](https://img.shields.io/badge/License-MIT-F5A623?style=for-the-badge)](LICENSE)
[![WCAG 2.1](https://img.shields.io/badge/WCAG_2.1-AA_Compliant-00DF89?style=for-the-badge)](https://www.w3.org/WAI/WCAG21/quickref/)

**[Explore Live App](https://sanjay3226.github.io/Focussium/)** • **[Report Bug](https://github.com/sanjay3226/Focussium/issues)** • **[Request Feature](https://github.com/sanjay3226/Focussium/issues)**

<br/>

```
  ███████╗ ██████╗  ██████╗██╗   ██╗███████╗███████╗██╗██╗   ██╗███╗   ███╗
  ██╔════╝██╔═══██╗██╔════╝██║   ██║██╔════╝██╔════╝██║██║   ██║████╗ ████║
  █████╗  ██║   ██║██║     ██║   ██║███████╗███████╗██║██║   ██║██╔████╔██║
  ██╔══╝  ██║   ██║██║     ██║   ██║╚════██║╚════██║██║██║   ██║██║╚██╔╝██║
  ██║     ╚██████╔╝╚██████╗╚██████╔╝███████║███████║██║╚██████╔╝██║ ╚═╝ ██║
  ╚═╝      ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚══════╝╚═╝ ╚═════╝ ╚═╝     ╚═╝
```

*Crafted for developers, creators, and disciplined minds.*

---

</div>

## 🌟 Overview

**Focussium 3.0** is an elite, offline-first progressive web application (PWA) built with pure web standards (zero frameworks, zero bloat). It merges mindful task management, ambient sound synthesis, daily habit tracking, and productivity analytics into a unified luxury glassmorphic interface.

Whether you're executing deep 90-minute coding blocks, building daily habits, or doing a rapid brain dump, Focussium gives you the tools to conquer distraction.

---

## ✨ Core Pillars & Features

### ⏱️ 1. Adaptive Pomodoro & Ambient Studio
- **Precision Time Engine**: Customizable Focus, Short Break, and Long Break intervals.
- **Synthesized Ambient Soundscapes**: Real-time Brown Noise, Binaural Beats, Rain, Zen Resonance, and Deep Space hums generated purely via the **Web Audio API** (no bulky audio assets).
- **Fullscreen Zen Mode**: Minimalist, distraction-free timer viewport with ambient glow.

### 📋 2. High-Velocity Task Management
- **Smart Filtering & Lists**: Organize by Project Lists (`My Tasks`, `Work`, `Personal`) with instant filter pills (`All`, `Pending`, `Done`, `High Priority`).
- **Recurring Engine**: Automated task recurrence schedules (`Daily`, `Weekly`, `Custom`).
- **Task KPI Bar**: Real-time completion progress tracking with micro-animations.

### 🌱 3. Vector Habit Engine & Streaks
- **100% SVG Vector Badges**: Crisp icons for Workout, Hydration, Sleep, Study, Journaling, and Screen Breaks.
- **7-Day Rhythm Visualizer**: Interactive completion heatmaps with animated checkmark states.
- **Daily Gamification**: Instant XP rewards (+25 XP per habit) with streak multipliers.

### 🧠 4. Brain Dump & Mood Velocity
- **Frictionless Capture**: Quick-jot thoughts and convert them into structured tasks with a single tap.
- **Daily Energy Rating**: Log emotional/energy states to correlate focus sessions with mental stamina.

### 📊 5. Export Studio & Infographic Card (Hybrid 2 + 5)
- **Live Preview Modal**: Generates a publication-grade **Weekly Vibe Infographic Card** displaying your score, discipline tier (`⚡ S-TIER`), focus hours, and task highlights.
- **3-Way High-DPI Export**:
  - 📸 **Save as Image (PNG)**: 2.5x high-res visual card for personal records or social sharing.
  - 📄 **Download PDF**: Formatted, dark-themed A4 PDF document.
  - 📋 **Copy to Clipboard**: One-tap copy to OS clipboard for instant pasting.

### 🎨 6. Two-Font Hybrid Design System
- **`--font-serif` (`DM Serif Display`)**: Big clock digits, Pomodoro timers, and level burst badges.
- **`--font-sans` (`Inter`)**: High-legibility UI typography for tasks, metrics, charts, and buttons.
- **9 Curated Themes + Custom Hex**: Dynamic WCAG 2.1 AA luminance contrast calculations.

---

## 🏛️ System Architecture

Focussium is designed around a decoupled, modular architecture without external runtime dependencies:

```
Focussium/
├── index.html              # Semantic HTML5 shell with central data-action event bus
├── sw.js                   # Network-first Service Worker with auto-cache invalidation
├── manifest.json           # Standalone PWA manifest & home-screen shortcuts
│
├── css/                    # Modular Scoped Stylesheets
│   ├── tokens.css          # Design tokens (Two-Font hybrid, themes, WCAG contrast)
│   ├── reset.css           # Typography baseline & touch resets
│   ├── animations.css      # Hardware-accelerated GPU transitions
│   ├── layout.css          # Shell, clock typography, and header profile capsule
│   ├── components.css      # Glass cards, task tools bar, pills, and inputs
│   ├── pages.css           # Page-specific views (Home, Tasks, Habits, Dump, Report)
│   ├── modals.css          # Export Studio, Settings, Command Glass, Onboarding
│   ├── timer.css           # Pomodoro ring geometry, ambient audio controls
│   └── charts.css          # SVG analytics charts & activity heatmap grids
│
└── js/                     # Decoupled ES6 Feature Modules
    ├── config.js           # XP tiers, rank definitions, and accent tokens
    ├── state.js            # Reactive global state container with schema migration
    ├── utils.js            # Date formatters, math utilities, and safe error logger
    ├── storage.js          # LocalStorage persistence with import/export routines
    ├── theme.js            # Dual-theme switcher & WCAG luminance engine
    ├── toast.js            # Accessible micro-notification manager
    ├── auth.js             # Optional Firebase Authentication integration
    ├── router.js           # Single Page App (SPA) view router
    ├── clock.js            # Real-time clock and date engine
    ├── level.js            # Slow-burn XP progression & rank gamification
    ├── tasks.js            # Task CRUD, filters, and recurrence scheduler
    ├── dump.js             # Brain dump capture & energy vibe logging
    ├── pomo.js             # Pomodoro state machine & audio synthesis
    ├── habits.js           # SVG habit tracker & streak calculation
    ├── home.js             # Dashboard orchestrator & progress ring
    ├── report.js           # Vibe score engine & Export Studio renderer
    ├── account.js          # User profile, rank badges & data management
    ├── settings.js         # Preferences, sound toggles, and avatar fallback
    ├── onboard.js          # First-run welcome experience
    ├── command-glass.js    # Ctrl+K global keyboard shortcut bar
    ├── icons.js            # Embedded SVG vector icon dictionary
    └── sounds.js           # Synthesized Web Audio API sound generator
```

---

## ⚡ Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> | **Command Glass** | Open quick-add task & dump palette |
| <kbd>Space</kbd> | **Timer Toggle** | Start / Pause active Pomodoro session |
| <kbd>F</kbd> | **Fullscreen Focus** | Enter minimalist fullscreen zen mode |
| <kbd>Esc</kbd> | **Close Modal** | Dismiss any open modal or active sheet |

---

## 🎮 Gamification & Level Progression

Focussium uses a **slow-burn exponential XP formula** to ensure leveling up reflects authentic, long-term discipline:

$$\text{XP Required for Level } N = 800 \times (N - 1)^2$$

### XP Earning Rates:
- ⏱️ **Focus**: `+1 XP` per focus minute
- ✅ **Tasks**: `+10 XP` per completed task
- 🌱 **Habits**: `+25 XP` per completed habit day

### Rank Tiers:
| Level | Title | Badge |
| :---: | :--- | :---: |
| **1** | Focus Initiate | 🌱 |
| **3** | Novice Monk | 🪷 |
| **5** | Flow Voyager | 🚀 |
| **8** | Deep Work Sage | ⚡ |
| **12+**| Master of Discipline | 👑 |

---

## 🚀 Getting Started Locally

Because Focussium is pure web technology with zero compilation steps, you can run it locally with any lightweight static server:

```bash
# 1. Clone the repository
git clone https://github.com/sanjay3226/Focussium.git
cd Focussium

# 2. Start a local server (Pick one):
# Python
python -m http.server 8000

# Node.js
npx serve .

# 3. Open in browser
http://localhost:8000
```

---

## 🔒 Privacy & Local-First Pledge

- 🛡️ **100% Local-First**: All your tasks, habits, and focus logs are stored in your browser's `localStorage` by default.
- 🚫 **Zero Telemetry**: No trackers, no cookies, no analytics tracking your personal habits.
- 💾 **Full Data Ownership**: Export your complete database anytime in JSON, PDF, or high-res PNG.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<div align="center">
  <sub>Built with focus, discipline, and attention to detail.</sub>
</div>
