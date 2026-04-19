# Focussium App Analysis (April 19, 2026)

## 1) Executive summary

Focussium is a feature-rich, single-page productivity PWA with strong UX depth and solid local-first behavior, but it is currently carrying significant maintainability and security-hardening debt due to monolithic front-end architecture and inline-script patterns.

**Overall score: 7.2 / 10**
- **Feature completeness / UX:** 8.7
- **Offline readiness:** 7.8
- **Code maintainability:** 5.6
- **Security hardening:** 6.3

## 2) Architecture snapshot

- **App type:** Client-rendered SPA with multi-page feel via section toggling and in-file modules (`Nav`, `Tasks`, `Pomo`, `Report`, etc.) in a single script file.
- **Core code footprint:**
  - `js/app.js`: **2418 lines**
  - `css/styles.css`: **4270 lines**
  - `index.html`: **727 lines**
- **Persistence model:**
  - Local: `localStorage` (`focussium_v2_data`)
  - Remote: Firestore sync for authenticated users
- **PWA model:** Static pre-cache in service worker (`focussium-v5`) + fallback-to-network.

## 3) What is working well

1. **Strong product breadth in one deployable bundle**
   - Includes auth/onboarding, task management, recurring logic, brain dump capture, pomodoro timer, reporting, achievements/gamification, and settings personalization.

2. **Reasonable defensive data handling at load**
   - Storage load merges defaults and parsed content, lowering break risk from partially corrupt local state.

3. **Offline-first baseline is practical**
   - Core shell assets are pre-cached and old caches are cleaned on activate.

4. **Escaping helper is present and reusable**
   - `Utils.escape()` exists and appears intended for user-generated text rendering paths.

## 4) Key issues and risks (prioritized)

### P0 — Security hardening gap: inline handlers + CSP incompatibility

- The markup relies heavily on inline event handlers (e.g., `onclick="..."`) throughout major screens.
- This blocks strict CSP adoption without `unsafe-inline`, reducing protection against script injection classes of issues.

**Recommendation:** Incrementally migrate to delegated `addEventListener` bindings and ship `Content-Security-Policy-Report-Only` first.

### P0 — Single-file app orchestration risk (`js/app.js`)

- One large file controls state, domain logic, UI rendering, and side effects.
- Raises regression risk, slows onboarding, and complicates testability.

**Recommendation:** Extract modules in-place without framework migration:
- `state.js`, `storage.js`, `auth.js`, `tasks.js`, `dump.js`, `pomo.js`, `report.js`, `ui.js`.

### P1 — Supply-chain and script integrity concerns

- Third-party scripts are loaded via CDN, and no SRI pinning is in place.
- Firebase keys being present client-side is normal, but correctness depends on strict backend Security Rules.

**Recommendation:** Add SRI on CDN assets and formally audit Firestore/Auth rules.

### P1 — Cache strategy may serve stale code

- `fetch` handler is cache-first for all requests (`cache -> network`).
- This is simple, but risks stale shell behavior after deploys if cache bumps are missed.

**Recommendation:** Use stale-while-revalidate for app shell or network-first for HTML.

### P2 — Observability is minimal

- Error catches are often silent or low-context.
- Hard to diagnose real-world sync/auth/report failures.

**Recommendation:** Add lightweight structured logging (even console-grouped telemetry first) and optional remote error sink.

## 5) Delivery roadmap

### Phase 1 (1–2 days): hardening without UX change

- Introduce CSP in report-only mode.
- Add SRI + pinned CDN versions.
- Verify Firestore Security Rules for least privilege.
- Improve error surfaces in auth/sync/report paths.

### Phase 2 (2–5 days): modularization for velocity

- Split `js/app.js` by concern while preserving current UI.
- Isolate pure utilities for unit testing.
- Add schema version/migration path in storage loader.

### Phase 3 (ongoing): quality/performance

- Add end-to-end smoke checks for:
  - auth bootstrap
  - create/edit/complete task
  - dump->task conversion
  - pomodoro complete cycle
  - report generation
- Revisit service worker strategy for safer fresh deploy behavior.

## 6) Evidence references used in this analysis

- App scale and orchestration concentration: `js/app.js`, `css/styles.css`, `index.html`
- Firebase client setup and Firestore persistence enablement: `js/firebase-config.js`
- Cache behavior and cache-versioning approach: `sw.js`
