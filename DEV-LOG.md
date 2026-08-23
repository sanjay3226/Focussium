# Focussium — Dev Log & Git Reference

> Quick reference for git workflow, version history, and deploy notes.

---

## 📦 Repository Info

| Key | Value |
|---|---|
| **Local path** | `F:\Life OS\Projects\Focussium\` |
| **Remote** | `https://github.com/sanjay3226/Focussium` |
| **Branch** | `main` |
| **Deploy** | GitHub Pages → `https://sanjay3226.github.io/Focussium/` |
| **PWA cache key** | `focussium-2026.08.23.v300` |

---

## 🚀 Version History

### v3.0.0 — 2026-08-23 — "Deep Focus Overhaul"
**Commit**: `feat: Focussium 3.0 — full modular rewrite + colour system`

**Breaking changes:**
- Monolithic `app.js` (~4200 lines) → 28 standalone JS modules
- Single `styles.css` (~8000 lines) → 9 scoped CSS files
- All `onclick=""` inline handlers removed → `data-action` event bus
- Particle canvas removed completely

**New features:**
- ✅ Habits Tracker — daily streak, 7-day dot history, XP reward
- ✅ Dual-theme colour system — all 9 accents work in light + dark
- ✅ Custom hex picker — WCAG 2.1 luminance check, auto-darken on light
- ✅ `--ac-text` on every accent — no invisible text on buttons ever
- ✅ 163+ `[data-theme="light"]` panel rules — full light mode coverage
- ✅ Command Glass (Ctrl+K) — quick task/dump shortcut with focus trap
- ✅ Service Worker v3 — `allSettled` install, network-first, auto-update
- ✅ PWA shortcuts — Focus, Add Task, Brain Dump in homescreen menu

**Files added/changed:**
```
js/           28 modules (was 1 monolith)
css/          9 files   (was 1 file)
index.html    Rebuilt   (zero inline JS)
sw.js         v3.0 cache manifest
manifest.json v3.0 PWA shortcuts
```

---

### v2.0.x — (previous) — "Zen Space"
Original monolithic release. Preserved in `F:\Focussium-main\Focussium-main\` as reference.

---

## 🔧 Git Cheatsheet

```bash
# Check status
git status

# Stage all
git add .

# Commit
git commit -m "type: short description"

# Push to GitHub
git push origin main

# Pull latest
git pull origin main

# View log
git log --oneline -10

# Diff staged changes
git diff --staged

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Commit types
| Prefix | Use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `style:` | CSS / visual only |
| `refactor:` | Code restructure, no feature change |
| `chore:` | Build, deps, config |
| `docs:` | README / markdown only |
| `perf:` | Performance improvement |

---

## 🚢 Deploy Flow

```bash
# 1. Make changes in F:\Life OS\Projects\Focussium\
# 2. Test locally (open index.html or use live-server)
# 3. Stage + commit
git add .
git commit -m "feat: describe what changed"

# 4. Push — GitHub Pages auto-deploys on push to main
git push origin main

# 5. Verify at:
#    https://sanjay3226.github.io/Focussium/
```

> **PWA cache note**: After deploy, users on old SW need to wait up to 60s
> for the new SW to detect the update. The `SKIP_WAITING` message fires
> automatically and reloads the page. No manual action needed.

---

## 🎨 Colour Accent Reference

| Accent | Dark hex | Light hex | `--ac-text` dark | `--ac-text` light |
|---|---|---|---|---|
| `royal`  | `#E8B923` | `#9A6A00` | black | white |
| `neon`   | `#00CFEB` | `#007A8C` | black | white |
| `matcha` | `#8DD85A` | `#4A8A1E` | black | white |
| `ember`  | `#FF6B35` | `#C73D00` | white | white |
| `solar`  | `#FFDE4D` | `#8A6800` | black | white |
| `aurora` | `#A78BFA` | `#5B3DB8` | white | white |
| `steel`  | `#5C8EFF` | `#2255CC` | white | white |
| `blush`  | `#FF6B9D` | `#B8005A` | white | white |
| `sage`   | `#52C4A0` | `#1A7A5A` | black | white |

---

## 📁 File Structure

```
F:\Life OS\Projects\Focussium\
├── index.html          ← main app shell (zero inline JS)
├── manifest.json       ← PWA manifest v3.0
├── sw.js               ← Service worker (network-first)
├── icon-192.png
├── icon-512.png
├── css/
│   ├── tokens.css      ← Design tokens + all 9 accents
│   ├── reset.css       ← CSS reset + typography
│   ├── animations.css  ← All keyframes
│   ├── layout.css      ← App shell, header, nav, FAB
│   ├── components.css  ← Shared components
│   ├── pages.css       ← Page-specific styles
│   ├── modals.css      ← Modals, login, onboarding
│   ├── timer.css       ← Pomodoro + fullscreen
│   └── charts.css      ← Heatmap, line charts, calendar
└── js/
    ├── config.js       ← CONFIG, ACCENTS, RANKS
    ├── state.js        ← State + schema + migration
    ├── utils.js        ← Utilities + error logger
    ├── storage.js      ← LocalStorage + export/import
    ├── theme.js        ← Theme engine + WCAG luminance
    ├── toast.js        ← Toast notifications
    ├── auth.js         ← Firebase auth
    ├── router.js       ← Nav + page routing
    ├── clock.js        ← Live clock
    ├── confetti.js     ← SVG confetti
    ├── quotes.js       ← Daily quotes
    ├── level.js        ← XP/Level engine
    ├── tasks.js        ← Tasks CRUD
    ├── dump.js         ← Brain dump
    ├── pomo.js         ← Pomodoro engine
    ├── habits.js       ← Habits tracker (v3.0 new)
    ├── home.js         ← Dashboard
    ├── report.js       ← Analytics + charts
    ├── account.js      ← Profile modal
    ├── settings.js     ← Settings
    ├── onboard.js      ← Onboarding flow
    ├── command-glass.js← Ctrl+K quick add
    ├── icons.js        ← SVG icon library
    ├── sounds.js       ← Sound effects
    ├── firebase-config.js
    ├── threebg_dark.js
    ├── threebg_light.js
    └── app.js          ← Boot orchestrator (~100 lines)
```

---

## 🐛 Known Issues / Future TODOs

- [ ] `habits.js` — Add ability to edit/delete habits from UI (currently add-only)
- [ ] `report.js` — Wire up habits heatmap in analytics view
- [ ] Drag-and-drop task reorder needs touch event polish on iOS
- [ ] Consider adding a Sync page for explicit cloud push/pull controls
- [ ] Light mode Three.js bg could use a softer particle density
