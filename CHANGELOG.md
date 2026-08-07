# Changelog: nairaintel

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
