# Changelog: nairaintel

All notable changes to NairaIntel will be documented in this file.

## [2026-08-06] - Portfolio, Market Intel & Polish

### Portfolio Experience
- Redesigned summary cards with real cost basis, unrealized P&L and total return %
- Added asset allocation view (Equities vs Fixed Income) with progress bars
- Per-holding P&L and return % in the holdings table
- Clearer Entry vs Market price display
- Better empty state when no assets exist

### Market Intelligence
- Cleaner navigation and safer index handling
- Improved visual hierarchy and labels ("Investor Impact", Alpha badge)
- Better empty and loading states

### Technical / UX Polish
- Separated investment and post modal states (earlier)
- Expanded investment-focused forum categories (earlier)
- Improved holdings table UX and empty states

## [2026-08-06] - Forum Categories Expansion & Modal Cleanup

### Added
- Expanded investment-focused forum categories:
  - Stock Analysis
  - Investment Strategies
  - Fixed Income
  - Market Rumours
  - Personal Finance
  - Beginner Questions
  - Portfolio Reviews
- Consistent category list shared between CreatePostModal and ForumPage filters

### Fixed
- Separated `showAddInvestmentModal` and `showCreatePostModal` states
- Removed unsafe type casting

## [2026-05-10] - Initial Planning & Setup

### Added
- `PREMIUM_UI_SPEC.md`: Comprehensive design specification for the premium UI overhaul.
- `CHANGELOG.md`: Tracking file for UI changes.
