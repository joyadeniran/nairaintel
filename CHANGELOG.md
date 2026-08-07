# Changelog: nairaintel

## [2026-08-07] - Asset Picker Selection Fix

### Fixed — search text saved instead of selected company
- Reproduced: typing `M`, clicking **AXA Mansard** still stored symbol `M`.
- Root cause: selection lived only in React state and could race with input
  blur / outside-click / form submit, so submit sometimes used the free-text
  query instead of the chosen ticker.
- `AddInvestmentModal` now keeps the chosen company in a **ref** (source of
  truth). Submit for equities **requires** a confirmed pick — typing alone is
  rejected with a clear error.
- Result rows use `onMouseDown` + `preventDefault` so selection commits before
  blur/outside-click handlers run.
- Editing an existing stock treats the current holding as already selected.

## [2026-08-07] - Ticker Speed, Diagnostics Endpoints

### Fixed — ticker tape was unreadably fast
- Duration was a fixed 90s for one full loop, so scroll speed scaled with the
  number of listed companies. At ~150 companies that is ~333 px/s.
- `TickerTape` now measures the rendered track and derives the duration from its
  width at a constant **40 px/s**, so reading speed is the same whether 10 or 200
  companies are listed (~750s for a full loop at 150 companies). Re-measures on
  window resize.
- Hover-to-pause was already implemented and compiles correctly
  (`group-hover:[animation-play-state:paused]` on the wrapper); it was just hard
  to perceive at the old speed.

### Added — configuration diagnostics
- `GET /api/health` (public) now reports which integrations are *configured*,
  plus a `missing` array naming each absent variable and what breaks without it.
  Booleans only — no key material, cached values, or upstream logs, so it stays
  safe to expose unauthenticated.
- `GET /api/market-status` (authenticated) extended to cover **both** upstreams.
  It now returns market-data and AI configuration side by side, each with a live
  probe and real error detail. Probes run concurrently; `?probe=0` returns
  configuration only, at no upstream cost.
- `aiStatus()` / `probeAi()` added to the AI service, reporting which backend is
  live and why — including an explicit warning when falling back to the Firebase
  client SDK, which authenticates as a browser client and usually fails on
  serverless.
- `marketDataStatus()` reintroduced in a safe form (booleans and counts only),
  having been removed as dead code in the previous sweep.

### Notes on API call volume
- NGX upstream is hit **at most once per 10 minutes per warm serverless
  instance** (`CACHE_TTL_MS`), not per request and not daily.
- The ticker tape polls `/api/tickers` every 5 minutes, so roughly half of those
  polls are served from cache at zero upstream cost.
- Ticker search filters the cached bulk list first and typically makes **no**
  upstream call; it only queries upstream when the cache cannot answer.
- Each serverless cold start resets the in-memory cache and costs one call.

## [2026-08-07] - NGX Ticker Tape, Ticker Search & Backlog Cleanup

### Added — NGX ticker tape
- Continuously scrolling quote strip across the top of the dashboard, showing
  every NGX company the market API returns with price and % change.
- New `GET /api/tickers`, backed by `getAllQuotes()`. It reuses the existing
  10-minute bulk cache, so rendering the tape costs no extra upstream calls.
- The list is rendered twice and the track translated exactly -50%, so the loop
  is seamless for any number of quotes. Pauses on hover; honours
  `prefers-reduced-motion`.
- Client refreshes every 5 minutes (mostly cache hits) and the strip hides
  entirely when no quotes are available.

### Added — Ticker search in the add-asset flow
- New `GET /api/companies/search?q=`, backed by `searchCompanies()`. Filters the
  cached bulk list first and only calls upstream when the cache cannot answer.
- Results ranked: exact ticker → ticker prefix → ticker substring → name.
- `AddInvestmentModal` rebuilt around it. Picking a result auto-fills the
  **security name** and prefills **entry price** with the live market price
  (with a "use market price" affordance if you edit it). Quantity stays manual —
  only the holder knows it. Net effect: 5 fields down to 2.
- Equity vs T-Bill is now a two-card selector; T-Bills keep manual name/reference
  fields since they are not NGX-listed.
- Live total-cost preview, inline validation, and real error messages replacing
  the previous `alert()` path.

### Fixed — "NGX market data temporarily unavailable" in the sidebar
- Root cause: `/api/news` fabricated a fake news item whenever AI generation
  failed, so a synthetic headline rendered inside the Market Intel carousel as
  though it were real market intelligence. It now returns an empty feed and the
  existing honest empty state shows instead.
- Underlying cause of the failure: `ai.ts` initialised the **client** Firebase
  SDK with `VITE_FIREBASE_*` vars inside the serverless function, which
  authenticates as a browser client and generally fails there.
- Added a real server-side path: when `GEMINI_API_KEY` is set, news is generated
  via `@google/genai`. The Firebase AI path is kept as a documented fallback.
  Response-text extraction normalises both SDK shapes.
- `.env.example` and `DEPLOY.md` now state that `GEMINI_API_KEY` is server-only
  and what breaks without it.

### Fixed — the five items reported in the previous sweep
- Removed unreachable `api/index.ts` (`vercel.json` rewrites all `/api/*` to
  `api/[...path]`), and dropped its now-dead entry from `vercel.json` functions.
- Removed the no-op middleware in `api/[...path].ts`.
- Removed dead exports `marketDataStatus()` and `safeParseLikes()`.
- `AddInvestmentModal` no longer submits empty fields — superseded by the
  validated rewrite above.
- Moved `better-sqlite3` to `devDependencies`; `db.ts` skips it on serverless, so
  it no longer compiles as a native module on every Vercel build.

### Also
- Removed `@google/genai` as an unused dependency, then reintroduced it
  deliberately as the server-side AI backend described above.
- `signedNum()` added alongside `num()` in `marketData.ts`: prices must be > 0,
  but deltas are legitimately negative or zero and were being discarded.

## [2026-08-07] - Audit Sweep 2: Client, Config & Build

### Fixed — Dark mode toggle was non-functional (P1)
- Tailwind v4 defaults the `dark:` variant to `prefers-color-scheme`; no
  `@custom-variant dark` was ever declared, so the toggle's `.dark` class drove
  none of the `dark:` utilities. Verified against the compiled CSS: all 43
  `dark:` rules sat inside `@media (prefers-color-scheme: dark)`, zero under a
  `.dark` selector. Clicking the toggle only flipped five CSS variables on
  `body`, leaving every card, border, and label in the OS theme.
- Added `@custom-variant dark (&:where(.dark, .dark *))` — 55 utilities now
  class-driven, zero media-gated.
- Theme choice now persists to `localStorage` and is applied before first paint
  by a boot script in `index.html` (stored choice wins, else OS preference), so
  there is no theme flash and no reset on reload.
- Removed the now-redundant `@media (prefers-color-scheme: dark)` variable block
  so the class is the single source of truth.

### Fixed — Type checking was largely vacuous (P1)
- `@types/react` / `@types/react-dom` were never installed, so `React.FC`,
  `React.ReactNode`, and every React event type across 20+ components silently
  resolved to `any` (tsconfig sets no `strict`, so implicit-any passed).
- Installed both as devDependencies. `npm run lint` now type-checks the React
  app for real.
- `npm run lint` was red on master (`Navigation.tsx` used the `React` namespace
  without importing it, introduced in 585ac2c). Now green, exit 0.
- Adding real types surfaced one latent contract bug: `MarketNews` omitted
  `source_url`, which the server emits (`ai.ts:52`, `news.ts:85`) and the UI
  consumes (`NewsPage.tsx:88`). Added to the interface.

### Fixed — Crash and blank-page risk (P2)
- `InvestmentList` dereferenced `i.symbol` / `i.name` directly when filtering and
  when rendering the ticker badge; a Firestore doc missing either field threw
  `TypeError: Cannot read properties of undefined` and, with no error boundary,
  blanked the whole page. Reproduced, then fixed by coercion — matching the
  defensive `String(inv.symbol || '')` already used elsewhere in the same file.
- Added `ErrorBoundary` around the app so a render throw degrades to a
  recoverable screen with Try again / Reload instead of a white page.

### Fixed — Latent secret exposure (P2)
- `vite.config.ts` injected `GEMINI_API_KEY` into the client bundle via `define`,
  and `DEPLOY.md` instructs setting that variable in production. Verified with a
  canary build: the key does **not** leak today because no client code
  references it, but a single `process.env.GEMINI_API_KEY` reference in client
  code bakes it into the public JS bundle (canary confirmed present). Removed the
  `define` and documented why secrets must never go there.

### Known issues — reported, not changed
- `api/index.ts` is unreachable: `vercel.json` rewrites all `/api/*` to
  `api/[...path]`. It still deploys as a second function.
- `api/[...path].ts` contains a no-op middleware that only calls `next()`.
- `marketDataStatus()` and `safeParseLikes()` now have zero callers.
- `AddInvestmentModal` inputs lack `required` (unlike `CreatePostModal`), so an
  empty submit round-trips to the server for a generic banner error.
- `better-sqlite3` sits in `dependencies` though `db.ts` skips it on serverless;
  it is compiled on every Vercel build.

## [2026-08-07] - Full-Stack Code Audit & Hardening

### Security
- `/api/market-status` now requires authentication (was publicly accessible, exposing API key prefix, internal logs, cache state)
- Removed API key prefix, internal logs, and cache details from `marketDataStatus()` response
- Stripped Firestore error `detail` fields from all forum API error responses (prevents internal leak)

### Race Conditions (Firestore)
- Forum like toggle: replaced read-modify-write with atomic `FieldValue.arrayUnion`/`arrayRemove` (concurrent likes could lose data)
- Comment count increment: replaced read-then-write with `FieldValue.increment(1)` (concurrent comments could lose count)
- Comment count decrement: replaced read-then-write with `FieldValue.increment(-1)`

### Memory Leaks
- Rate limit bucket Map now cleaned up every 5 minutes via interval (was unbounded growth under sustained traffic)

### Unhandled Exceptions
- All async Express route handlers wrapped in `asyncHandler()` (Express 4 does not catch async rejections — would crash the process or hang the request)
- `/api/market-snapshot` wrapped in try/catch (was bare `await` with no error handling)
- `navigator.share()` call wrapped in try/catch (user cancel throws `AbortError`)
- Investment delete, post create/delete now wrapped in try/catch with user-visible error state (was fire-and-forget)

### Edge Cases
- Portfolio: `entry_price` validation changed from `< 0` to `<= 0` (zero-price investments make no sense)
- Learning content: seeding now only triggers when collection is empty (`snapshot.empty`), not when `< 8` (prevented duplicate content accumulation after deletions)

### Cleanup
- Removed unused `db` (SQLite) import from forum routes (only Firestore is used)

## [2026-08-07] - 10x Professional UI Overhaul

### Design System
- Gradient mesh backgrounds for hero sections and auth pages
- Custom shimmer loading animations replacing plain pulse
- Stat counter entrance animations with staggered delays
- Styled scrollbars (thin, translucent) across light and dark modes
- Brand-aware text selection highlighting
- Refined button active state (scale 0.98 with 200ms duration)
- Consistent border-radius system: 3xl for cards, xl for inputs/buttons, lg for small elements

### Portfolio (complete redesign)
- Hero balance card with layered gradient mesh, glassmorphic stat tiles, and animated P&L badge
- Asset allocation split into dedicated side-by-side cards with gradient progress bars
- Investment table with live-price pulse indicator (green dot animation)
- Responsive table: hides Entry/Market and Qty columns on small screens
- New empty state with rotated icon treatment and actionable copy
- Fixed Income section with icon headers and cleaner card layout

### Authentication (complete redesign)
- Full-screen gradient mesh background instead of dark overlay
- Password visibility toggle (eye/eye-off)
- Loading spinner on submit button with disabled state
- Cleaner Firebase error message formatting (strips Firebase prefixes)
- Official Google SVG logo replacing Chrome icon
- Disclaimer text below card

### Market Intelligence (redesigned)
- Sidebar cards use consistent border/bg system (no more premium-card in sidebar)
- Shimmer loading skeletons matching card layout
- Horizontal slide transition for news carousel (was vertical)
- Smaller, tighter pagination dots
- Streamlined footer with separated archive link and nav buttons

### News Page (redesigned)
- "AI-Powered" pill badge header
- Staggered card entrance animations (0.08s delay per card)
- Shimmer loading skeletons matching final card structure
- Consistent hover states: green border accent, shadow lift
- Lighter visual weight: softer sentiment badges, rounded-3xl cards
- Dedicated empty state with rotated icon

### Learning Hub (redesigned)
- SVG-based circular progress indicator (was CSS border hack)
- "Curated Guides" pill badge header
- Staggered card entrance animations
- Shimmer loading skeletons
- Subtler hover: scale 1.05 (was 1.1) for image zoom
- Empty state for zero lessons
- Cleaner detail view with smaller hero, tighter spacing

### Community / Forum (redesigned)
- Category filter pills: smaller, lighter, outlined style
- Search and filter on same row with proper responsive stacking
- Post cards: softer shadows (sm default, xl on hover), consistent rounded-3xl
- Post detail: tighter spacing, rounded-2xl comment cards, subtle bg
- Shimmer skeletons for loading state
- Consistent empty state treatment

### Navigation & Layout
- Mobile bottom nav bar with icons (was completely missing)
- Dashboard background: dark mode uses #0a0f1a (was pure black)
- Main content uses tighter mobile padding (px-4 vs px-6)
- Sidebar Learning card uses consistent card style (not premium-card)
- Footer with branding and legal disclaimer
- Safe-area bottom padding for iOS devices

### Bug Fixes
- `naira-green` color classes → `brand-green` (was undefined, causing invisible text/borders)
- Dark mode variants added to CommunityOverview, error banners, forum detail
- Top nav respects safe area on mobile (sticky top-0)
- "Logout" → "Sign out" for clarity

## [2026-08-06] - Vercel deploy + remaining hardening

### Added
- `vercel.json` + serverless API entry
- `DEPLOY.md` — step-by-step Vercel env + deploy guide
- SQLite disabled automatically on Vercel (Firestore-only in production)

### Fixed
- Safer AI news JSON parsing; removed AI-based price generation
- `@vercel/node` types for the API function

## [2026-08-06] - Security P0/P1 + Real Market Data

### Security (critical)
- Removed committed `nairaintel.db`
- Firebase ID token middleware; no client `user_id` trust
- Rate limits, body size limit, safer health endpoint

### Market data
- NGN Market API as primary price source
- `NGNMARKET_API_KEY` documented

## [2026-08-06] - Product Specification
- `SPEC.md` added

## [2026-08-06] - Portfolio, Market Intel & Forum polish
- Portfolio P&L/allocation, forum categories, modal cleanup
