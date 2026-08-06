# Changelog: nairaintel

All notable changes to NairaIntel will be documented in this file.

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

### Changed
- Improved category labels and default selection in Create Post modal
- Better empty state and filter UI in Community page

### Fixed
- Separated `showAddInvestmentModal` and `showCreatePostModal` states (removed dirty modal reuse)
- Removed unsafe type casting (`setEditingInvestment as any`)
- Cleaned up modal open/close handlers

## [2026-05-10] - Initial Planning & Setup

### Added
- `PREMIUM_UI_SPEC.md`: Comprehensive design specification for the premium UI overhaul.
- `CHANGELOG.md`: Tracking file for UI changes.

### Planned
- **Design Tokens**: Implementing new CSS variables in `index.css`.
- **Navigation**: Floating glassmorphic navbar.
- **Components**: Upgrading `PortfolioSummary` and `MarketIntelligence` with majestic aesthetics.
