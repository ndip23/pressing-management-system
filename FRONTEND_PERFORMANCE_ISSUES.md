# Frontend Performance Findings (Possible Causes)

These are code‑level findings that can contribute to slow initial load or sluggish navigation in the `client/` app.

## 1) Multiple blocking network calls during startup
- **Where:** `client/src/contexts/AuthContext.js`, `client/src/contexts/SettingsContext.js`, `client/src/contexts/NotificationContext.js`, `client/src/contexts/LocalizationContext.js`
- **What:** On app mount, Auth tries `/auth/me`, Settings fetches `/settings`, Notifications fetches `/admin-notifications` and starts polling, Localization fetches `/currency/geolocate` and `/currency/rates`.
- **Impact:** Startup is gated by chained/parallel API calls; slow or cold backend makes the UI appear stuck on the spinner.

## 2) Auth provider blocks first render until user check completes
- **Where:** `client/src/contexts/AuthContext.js`
- **What:** While `loading` is true, the provider returns a full‑screen spinner instead of rendering the app.
- **Impact:** Any latency in `/auth/me` (or token validation) blocks the entire UI, even for public pages.

## 3) Eager i18n bundle of all languages
- **Where:** `client/src/i18n.js`
- **What:** All translation JSON files are imported and bundled up front (EN/FR/ES/HI/FIL).
- **Impact:** Larger initial JS bundle and more parse/compile time before first render.

## 4) Third‑party script injection on every route change
- **Where:** `client/src/components/PixelTracker.js`
- **What:** Facebook Pixel script is injected when `window.fbq` is absent and pageview is tracked on every location change.
- **Impact:** Extra network request and JS execution, especially noticeable on slower connections; can delay main thread on navigation.

## 5) Animation libraries initialized globally
- **Where:** `client/src/App.js`, `client/src/pages/Public/FeaturesPage.js`, `client/src/pages/Public/ContactPage.js`
- **What:** AOS initialized for the entire app; framer‑motion used in public pages.
- **Impact:** Extra JS/CSS payload and runtime work on initial load, even for pages that don’t need animations.

## 6) React StrictMode doubles effects in dev
- **Where:** `client/src/index.js`
- **What:** StrictMode intentionally double‑invokes certain lifecycle effects in development.
- **Impact:** Dev builds can feel much slower than production, especially with multiple `useEffect` network calls.
