# Focussium Repository Analysis (April 19, 2026)

## 1) Executive summary

Focussium is a polished single-page productivity Progressive Web App (PWA) with strong UX scope (tasks, brain dump, focus timer, reporting, onboarding, and theming), backed by local-first persistence and optional Firebase sync. The product direction is strong, but the codebase is currently concentrated in a few large files, which raises long-term maintenance and testing risk.

**Overall score: 7.5 / 10**
- **Product/UX completeness:** 8.8
- **Offline/PWA readiness:** 8.0
- **Code maintainability:** 5.9
- **Security hardening posture:** 6.5

## 2) Repository structure snapshot

- `index.html` (738 lines): contains nearly the full app shell and most UI surface markup.
- `css/styles.css` (4404 lines): comprehensive style system for all screens/components.
- `js/app.js` (2525 lines): main app logic, state management, feature modules, bootstrapping.
- `js/firebase-config.js` (18 lines): Firebase initialization and Firestore persistence enablement.
- `sw.js` (50 lines): service worker lifecycle + asset caching strategy.

The current architecture is a classic “single-bundle SPA” with in-file module objects (`State`, `Storage`, `Tasks`, `Pomo`, `Report`, etc.).

## 3) Strengths

1. **Feature depth in a lightweight deployment model**
   - The app covers daily planning, focus execution, and retrospective reporting in one cohesive UX flow.

2. **Clear domain separation inside one file**
   - Even though `js/app.js` is large, major capabilities are segmented into named module objects (`Auth`, `Tasks`, `Dump`, `Pomo`, `Report`, `Settings`, `App`), which keeps mental mapping tractable.

3. **Practical local-first behavior**
   - Data is loaded from `localStorage` and merged with defaults, then optionally synced to Firestore with debounced remote saves.

4. **Reasonable PWA baseline**
   - Versioned cache keys, pre-cache asset manifest, stale cache cleanup on activate, and offline fallback for navigation are all present.

## 4) Key risks and improvement opportunities

### P0 — Maintainability bottleneck from file concentration

- `js/app.js` and `css/styles.css` dominate implementation footprint.
- Any cross-cutting change (new task metadata, report logic, settings migration) likely touches several distant sections in one file.

**Recommendation:** split by concern without changing framework:
- `state/`, `features/tasks/`, `features/pomo/`, `features/report/`, `ui/`, `platform/storage/`.

### P0 — Inline event handlers limit hardening

- `index.html` uses many inline `onclick` handlers across core flows.
- This pattern complicates adoption of a strict CSP that excludes `unsafe-inline`.

**Recommendation:** migrate progressively to delegated listeners and explicit event wiring during `App.init()`.

### P1 — Service worker caching tradeoffs

- Non-navigation requests are cache-first (`cache -> network`), which is great for resilience but can retain stale assets when cache versioning is missed.

**Recommendation:** keep current navigation strategy, but consider stale-while-revalidate for static assets and add release checklist enforcement for `APP_VERSION` updates.

### P1 — Limited runtime observability

- Several catch paths intentionally swallow or minimize error context.

**Recommendation:** standardize an internal `logError(context, error)` utility and optionally add remote error capture behind user opt-in.

### P2 — Auth/config operational sensitivity

- Firebase client config is correctly public client-side, but effective security depends on Firestore/Auth rules quality.

**Recommendation:** add a short `SECURITY.md` documenting expected Firebase rules posture and deployment checks.

## 5) Suggested phased roadmap

### Phase 1 (low risk, 1–2 days)
- Add linting + formatting automation (ESLint/Prettier).
- Introduce minimal architecture docs (`docs/architecture.md`, state shape, module boundaries).
- Add smoke checks for core happy paths.

### Phase 2 (medium effort, 3–7 days)
- Extract `Storage`, `Tasks`, `Pomo`, `Report` into separate files while preserving behavior.
- Add schema versioning for persisted state and migration guards.

### Phase 3 (hardening, ongoing)
- Replace inline handlers with programmatic listeners.
- Introduce report-only CSP, then enforceable CSP.
- Improve cache update ergonomics and release process consistency.

## 6) Evidence used

- Repository/file footprint and architecture concentration:
  - `js/app.js`
  - `css/styles.css`
  - `index.html`
- PWA cache/version logic and fetch strategy:
  - `sw.js`
- Firebase initialization and persistence behavior:
  - `js/firebase-config.js`
