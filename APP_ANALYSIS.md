# Focussium — App Analysis & Architecture Reference

> **Version:** 2026.05.29 · **Analysis depth:** Full codebase review

---

## Executive Summary

Focussium is a **production-quality single-page PWA** delivering five interconnected productivity flows in a sub-100KB no-framework JavaScript codebase. The app demonstrates strong UX discipline (glassmorphism, custom audio synthesis, SVG animation), practical offline-first architecture, and a clean module-pattern code structure that remains tractable without a framework.

| Dimension | Score | Notes |
|---|---|---|
| **Product / UX completeness** | 9.2 / 10 | Five full features, rich animations, zero placeholder states |
| **Offline / PWA readiness** | 9.0 / 10 | Versioned SW cache, stale-while-revalidate, app shortcuts |
| **Code maintainability** | 6.5 / 10 | Large single files; module-object pattern is clean but non-modular |
| **Performance** | 8.5 / 10 | No framework overhead; Web Audio API, SVG, CSS animations are efficient |
| **Security posture** | 7.0 / 10 | Firebase config is standard-safe; Firestore rules should be reviewed |
| **Accessibility** | 7.5 / 10 | ARIA labels present; keyboard nav partially implemented |

---

## Repository Snapshot

```
Focussium/
  index.html           ~900 lines   App shell, all page markup, inline nav
  css/styles.css      ~6500 lines   Full design system, all components
  js/app.js           ~3900 lines   All feature logic (State, Tasks, Pomo, Report…)
  js/sounds.js          ~520 lines  Web Audio API synthesiser engine
  js/icons.js           ~380 lines  Inline SVG icon library
  js/firebase-config.js  ~20 lines  Firebase init + Firestore persistence
  sw.js                  ~80 lines  Service worker (versioned cache + SWR)
  manifest.json          ~50 lines  PWA manifest (shortcuts, icons, screenshots)
```

---

## Module Architecture

### State Shape

```js
State = {
  data: {
    tasks: { [listId]: { name, items: [{ id, text, done, order }] } },
    dump:  [{ id, text, ts, tags }],
    log:   { [YYYY-MM-DD]: { tasks, focus, mood, vibe } },
    xp:    { total, level, streak },
    settings: {
      theme, accent, sound, soundPalette,
      sessions, focusMin, shortMin, longMin,
      ambientSound, ambientVol, taskOrder
    }
  },
  pomo: { running, mode, secondsLeft, count, interval },
  weekOffset: 0,
  monthOffset: 0,
  reportMode: 'week'
}
```

### Module Dependency Map

```
App.init()
  ├── Auth        → Firebase Auth listener → loads/creates user doc
  │     └── State / Storage
  ├── Nav         → page routing, transitions
  ├── Tasks       → CRUD, drag-and-drop, list management
  ├── Dump        → brain dump, auto-tagging, clearing
  ├── Pomo        → timer state machine, ambient audio dispatch
  │     └── Sound (sounds.js) → Web Audio API
  ├── Report      → weekly/monthly analytics, SVG chart render, PDF export
  ├── Level       → XP calc, level-up modal, confetti
  ├── Settings    → theme/accent switching, session config
  └── CommandGlass → quick-add modal (Ctrl+K)
```

---

## Audio Engine

`js/sounds.js` implements a **full FM synthesis engine** using the Web Audio API with zero external dependencies:

| Sound | Technique |
|---|---|
| `rain` | Brown noise buffer + lowpass BiquadFilter + LFO (0.12 Hz) on cutoff |
| `waves` | Brown noise + lowpass + slow stereo panner oscillator (0.06 Hz) |
| `binaural` | Two sine oscillators (160 Hz / 165 Hz) → 5 Hz binaural beat → L/R panners |
| `brown` | Raw brown noise buffer + heavy lowpass (250 Hz) |
| UI sounds | FM synthesis (`synth()`) with configurable freq, modFreq, modAmt, pitchSweep |

**Volume chain:** `ambientVolumeNode.gain = slider_value/100 × 0.35`

---

## Chart System

`Report.drawChart()` renders **SVG line charts** directly into the DOM:

- **Path algorithm:** Cubic bezier with 0.4 tension (smooth, not sharp)
- **Elements:** Area gradient fill, glowing line path, dot points with labels, avg dashed line, grid
- **Animation:** `lineDrawIn` stroke-dashoffset keyframe draw-on, `scaleIn` for dots, `barRise` for bars
- **Filters:** `feGaussianBlur` glow on line path and dot highlights
- **Responsive:** `viewBox="0 0 400 160"` with `preserveAspectRatio="xMidYMid meet"` — scales cleanly

---

## PWA Architecture

```
Install → Cache: index.html, styles.css, app.js, sounds.js, icons.js, firebase-config.js, icons

Fetch strategy:
  navigate requests  → Network-first → fallback to cached index.html
  same-origin assets → Cache-first → background revalidation (stale-while-revalidate)
  cross-origin       → Pass-through (Firebase, Google Fonts CDN)
```

Cache version: `focussium-2026.05.29.1` — must be bumped on each deploy.

---

## Design System Reference

### Colour Tokens

| Token | Role |
|---|---|
| `--bg0 → --bg4` | Background depth (darkest to lightest surface) |
| `--tx1 → --tx3` | Text (primary → muted → subtle) |
| `--ac` | Accent colour (changes with palette selection) |
| `--acr` | Accent as `R,G,B` triplet for `rgba()` |
| `--acg` | Accent glow (used in box-shadow, filter) |
| `--acgr` | Accent gradient (linear-gradient) |
| `--acs` | Accent soft (low-opacity tint for backgrounds) |
| `--bd` | Border default |
| `--bds` | Border subtle |
| `--ok` / `--err` | Success / error semantic colours |

### Available Accent Palettes

`royal` (indigo) · `ocean` (teal) · `ember` (orange) · `sakura` (pink) · `sage` (green) · `aurora` (violet) · `gold` (amber) · `mono` (neutral)

### Z-Index Stack

| Layer | Z-index |
|---|---|
| Base pages | 1 |
| Navigation (bottom-nav) | 100 |
| FAB button | 200 |
| Modals | 500 |
| Toast notifications | 600 |
| Login screen | 8000 |
| Fullscreen pomo | 9999 |
| Loading screen | 9999 |

---

## Known Issues & Improvement Areas

### 🔴 P0 — Maintainability
- `app.js` (~3900 lines) and `styles.css` (~6500 lines) are single-file giants
- **Recommendation:** Split by feature into `js/features/tasks.js`, `js/features/pomo.js`, etc.

### 🟡 P1 — Inline Handlers
- `index.html` uses inline `onclick` attributes throughout
- Blocks strict CSP (`unsafe-inline` required)
- **Recommendation:** Move to delegated `addEventListener` in `App.init()`

### 🟡 P1 — Schema Versioning
- No migration guard for `localStorage` state shape changes
- A schema version bump can silently corrupt existing user data
- **Recommendation:** Add `state.schemaVersion` + migration function

### 🟢 P2 — Error Observability
- Many `catch` blocks silently swallow errors
- **Recommendation:** Centralise with `logError(context, err)` utility

### 🟢 P2 — Accessibility
- Tab navigation between pages needs keyboard trap handling in modals
- Focus management on route transitions is absent
- **Recommendation:** Add `focus-trap` on modal open, restore on close

---

## Performance Profile

| Metric | Estimate |
|---|---|
| First Contentful Paint | ~0.8s (cached) / ~1.5s (cold) |
| JS parse time | ~35ms (no framework overhead) |
| CSS size (gzipped) | ~28KB |
| JS total size (gzipped) | ~55KB |
| Web Audio latency | ~5-10ms (native AudioContext) |
| localStorage ops | Debounced 500ms after any state change |

---

## Deployment Checklist

```
☐ Bump APP_VERSION in sw.js (format: YYYY.MM.DD.N)
☐ Verify manifest.json icon paths resolve (192, 512)
☐ Test offline mode: disable network, reload, check full functionality
☐ Test PWA install prompt on Chrome Android & iOS Safari
☐ Verify Firebase Firestore rules restrict to auth.uid
☐ Check safe-area-inset padding on iPhone notch devices
☐ Run Lighthouse PWA audit (target: 95+)
```

---

*Generated: May 2026 · Maintained by [@sanjay3226](https://github.com/sanjay3226)*
