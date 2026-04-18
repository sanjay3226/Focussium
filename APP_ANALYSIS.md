# Focussium App Analysis (March 28, 2026)

## 1) High-level architecture

- **Single-page app** with one large orchestration file (`js/app.js`) handling state, storage, auth, rendering, navigation, reporting, and timers.
- **Client-only persistence** plus optional cloud sync:
  - Local persistence via `localStorage` key `focussium_v2_data`.
  - Firestore sync when authenticated.
- **PWA support** via `manifest.json` and `sw.js` with static asset pre-cache.
- **External dependencies loaded from CDN** (`jspdf`, Firebase compat SDKs).

## 2) What is strong today

1. **Escaping strategy is present in key user-content render paths.**
   - `Utils.escape()` is used before writing task, note, list, subtask, and dump text into HTML templates.
   - This materially reduces straightforward XSS risk for normal text fields.

2. **Clear state defaults + safe parse fallback.**
   - Storage layer merges parsed data with defaults and has parse-failure fallback, helping with corrupted local data recovery.

3. **Good baseline PWA behavior.**
   - Pre-cache and offline fetch fallback are simple and effective for static assets.

4. **Feature depth is strong for a single-file SPA.**
   - Tasks, repeat scheduling, dump-to-task conversion, pomodoro, reports, onboarding, and settings are all integrated.

## 3) Key risks / bottlenecks

### A. Security hardening gaps (highest priority)

1. **No CSP and inline event handlers across markup.**
   - `index.html` relies heavily on `onclick="..."` attributes.
   - This makes modern strict CSP rollout harder (`unsafe-inline` pressure).

2. **Firebase project config is fully public in client bundle.**
   - Public Firebase config itself is normal, but the app relies on backend security rules to prevent abuse.
   - If rules are permissive, the current front-end would allow broad read/write from copied client code.

3. **No Subresource Integrity (SRI) on CDN scripts.**
   - Third-party scripts are loaded directly via URL without integrity checks.

### B. Maintainability / scalability

1. **Monolithic app file (`js/app.js`).**
   - The single file is large and owns most app concerns.
   - This increases change risk and slows onboarding/testing.

2. **Heavy template-string rendering + full `innerHTML` replacement.**
   - Many views rebuild full sections; this is simple but can become expensive as data grows.

3. **Sparse error telemetry.**
   - Several catch blocks intentionally swallow detail or only `console.log`.
   - Harder to debug user-specific production failures.

### C. Data / product behavior concerns

1. **Local-first data key is versioned (`focussium_v2_data`) without explicit migrations.**
   - Large future schema changes may require migration logic.

2. **Cache strategy is cache-first for all requests in `fetch`.**
   - Good offline baseline, but can serve stale app code/content until cache version bump.

## 4) Prioritized improvement plan

### Phase 1 (security + reliability, 1–2 days)

- Add a **CSP roadmap**:
  - Start with `Content-Security-Policy-Report-Only`.
  - Migrate inline handlers to `addEventListener` so strict CSP is feasible.
- Validate/lock down **Firestore Security Rules** and Auth Rules.
- Add **SRI** for `jspdf` and pin/monitor third-party script versions.
- Improve catch blocks with structured error messages and (optional) remote logging.

### Phase 2 (architecture, 2–5 days)

- Split `js/app.js` into modules:
  - `state`, `storage`, `auth`, `tasks`, `dump`, `pomo`, `report`, `ui/core`.
- Introduce a small render utility layer to reduce repetitive `innerHTML` patterns.
- Add schema version + migration step during storage load.

### Phase 3 (quality/performance, ongoing)

- Add smoke tests for core flows:
  - auth bootstrap
  - create/edit/complete task
  - dump to task
  - pomodoro start/complete
  - report generation download
- Consider stale-while-revalidate behavior for selected requests.

## 5) Quick scorecard

- **UX / feature completeness:** 8.5/10
- **Security hardening:** 6/10 (good escaping, needs CSP/rules/SRI discipline)
- **Maintainability:** 5.5/10 (monolith pressure)
- **Offline/PWA readiness:** 7.5/10
- **Overall:** **7.0/10**

## 6) Concrete evidence references

- Rendering + escaping helpers and local storage: `js/app.js`
- Inline event-heavy DOM in markup + CDN scripts: `index.html`
- Firebase initialization + Firestore persistence setup: `js/firebase-config.js`
- Service worker cache strategy: `sw.js`
