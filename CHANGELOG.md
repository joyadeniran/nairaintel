# Changelog: nairaintel

All notable changes to NairaIntel will be documented in this file.

## [2026-08-06] - Security P0/P1 + Real Market Data

### Security (critical)
- Removed committed `nairaintel.db` from the repository
- Gitignore all `*.db` / sqlite files
- Firebase ID token verification middleware (`requireAuth` / `optionalAuth`)
- Portfolio + forum **mutations** require verified token; identity never taken from client `user_id`
- Fixed `authDomain` typo in Firebase client config
- Frontend `apiFetch` attaches Bearer ID token
- Corrected portfolio API paths (`/api/portfolio` not `/api/investments`)
- Input validation + category allowlist on forum
- Rate limits on `/api/news` and `/api/live-prices`
- JSON body size limit (64kb)
- Safer health endpoint (no env leak)
- Stopped auto-seeding demo data into live user/forum paths

### Market data
- New `marketData` service: **NGN Market API** as primary price source
- Gemini reserved for qualitative news/sentiment only — not numeric prices
- No more random fallback prices (empty / last cache only)
- `NGNMARKET_API_KEY` documented in `.env.example`

## [2026-08-06] - Product Specification

### Added
- `SPEC.md` — product strategy, positioning, scope rules

## [2026-08-06] - Portfolio, Market Intel & Polish

### Portfolio Experience
- Real cost basis, unrealized P&L, allocation bars
- Per-holding P&L in holdings table

### Market Intelligence
- Cleaner presentation and navigation

## [2026-08-06] - Forum Categories Expansion & Modal Cleanup

### Added
- Investment-focused forum categories aligned across UI

### Fixed
- Separated investment vs post modal states
