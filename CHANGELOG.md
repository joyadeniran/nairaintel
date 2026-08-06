# Changelog: nairaintel

## [2026-08-06] - Professional UI overhaul

### Fixed (critical)
- Broken color classes: `naira-green` → `brand-green` in CommunityOverview and ForumPostDetail (colors were not rendering)
- Dark mode missing in CommunityOverview (cards, borders, text all lacked dark variants)
- Dark mode missing on error/dismiss banner in Dashboard
- Auth modal used Chrome icon instead of official Google logo

### Added
- Mobile bottom navigation bar (Portfolio/Market/Community/Learn) — previously mobile users were stuck on one page
- Footer with branding and disclaimer
- Safe-area bottom padding for iOS notch devices
- Responsive refinements to top nav bar (smaller touch targets on mobile, rounded corners)

### Changed
- Top nav sticky at top-0 on mobile (was top-6, leaving a gap)
- "Logout" label → "Sign out" for clarity
- Auth modal Google button text → "Continue with Google"

## [2026-08-06] - Vercel deploy + remaining hardening

### Added
- `vercel.json` + `api/index.ts` serverless API entry
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
