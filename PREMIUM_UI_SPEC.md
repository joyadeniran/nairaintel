# Premium UI Specification: NairaIntel

## Design Vision
The Premium UI aims to transform NairaIntel into a world-class financial intelligence platform. The design is characterized by **depth, translucency, and fluid motion**, evoking a sense of reliability and cutting-edge technology.

---

## Core Principles
1.  **Elevated Depth**: Use multi-layered shadows and backdrop blurs to create a spatial hierarchy.
2.  **Modern Minimalism**: Reduce visual clutter. Prioritize data with generous whitespace.
3.  **Clean Interaction**: Smooth, spring-based animations for all state changes.
4.  **Premium Precision**: Consistent border-radii (2xl/3xl), subtle borders, and high-quality typography.

---

## Visual Tokens

### 1. Color Palette
*   **Primary (Emerald Green)**: `#059669` (Emerald 600) -> `#10b981` (Emerald 500)
*   **Secondary (Gold Accent)**: `#f59e0b` (Amber 500)
*   **Backgrounds**:
    *   **Light**: `#F8FAFC` (Slate 50).
    *   **Dark**: `#020617` (Slate 950).
*   **Surface**: White with `80%` opacity and `16px` backdrop-blur for glassmorphism.
*   **Borders**: `Slate-200/50` or `White/20` for glass containers.

### 2. Typography
*   **Display/Headings**: `Outfit` (Geometric, friendly, modern).
*   **Body/Data**: `Inter` (High legibility, professional).
*   **Monospace**: `JetBrains Mono` (For numerical ticker data).

---

## Component Guidelines

### Navigation
*   **Status**: Floating Glass Navbar.
*   **Contrast**: High contrast for all tab states. Inactive tabs must be clearly legible.

### Dark Mode
*   **Implementation**: System-wide toggle with support for `dark` class.
*   **Palette**: Deep slates and obsidians with emerald accents.
