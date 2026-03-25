# Design System Specification: High-Performance Tablet POS

## 1. Overview & Creative North Star

### The Creative North Star: "The Tactile Curator"
The design system for this high-performance POS is built on the philosophy of **"The Tactile Curator."** In a fast-paced retail environment, a POS should not feel like a spreadsheet; it should feel like a premium, physical station. We move away from the "industrial" look of traditional software by using **Soft Minimalism**—prioritizing breathing room, organic shapes, and a sophisticated interplay of depth that mimics physical objects on a clean workspace.

By utilizing intentional asymmetry and a "No-Line" architectural philosophy, we create a UI that feels editorial rather than clerical. The system focuses on high-speed cognitive processing by using bold typographic scales and tonal shifts to guide the eye, ensuring that the most critical information (the "Total") is never more than a glance away.

---

## 2. Colors

### Palette Strategy
The palette is rooted in neutral `surface` tones to mitigate eye fatigue during long shifts, punctuated by high-energy brand accents.

*   **Primary Accent (The Pulse):** `primary (#904d00)` and `primary_container (#ff8c00)`. These represent movement—adding items, finalizing payments, and primary CTAs.
*   **Secondary Accent (The Precision):** `secondary (#006b5f)`. Used for secondary status indicators or success states.
*   **Surface Neutrals:** A sophisticated range from `surface_container_lowest (#ffffff)` to `surface_dim (#d9dadb)`.

### The "No-Line" Rule
**Explicit Instruction:** Use of 1px solid borders for sectioning is strictly prohibited. 
Structural boundaries must be defined solely through:
1.  **Background Color Shifts:** A `surface_container_lowest` card placed atop a `surface_container_low` background.
2.  **Tonal Nesting:** Highlighting a section by shifting its background hue rather than drawing a stroke around it.

### Signature Textures & Gradients
Main CTAs (e.g., "Pay Now") should utilize a subtle linear gradient from `primary` to `primary_container`. This adds a "visual soul" and tactile depth that flat colors cannot achieve, making the button feel like a physical, pressable light source.

---

## 3. Typography

The system utilizes a dual-font strategy to balance editorial authority with functional readability.

*   **Display & Headlines (Plus Jakarta Sans):** Used for large price points and totals. This geometric sans-serif provides a modern, high-end feel.
    *   *Totals (Display-MD/LG):* Extra Bold weight to ensure the most important number is the most visible.
*   **Interface & Body (Manrope):** Chosen for its excellent legibility at small sizes and high x-height.
    *   *Product Names (Title-MD):* Medium weight to stand out against descriptions.
    *   *Functional Labels (Label-MD):* Used for secondary data like "Subtotal" or "Tax."

**Hierarchy Rule:** Typography scale should be used to dictate flow. A `3.5rem` display total next to a `0.875rem` label creates an "Editorial Contrast" that eliminates the need for redundant headers.

---

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Layering** rather than structural lines.
*   **Base Layer:** `surface` (#f8f9fa).
*   **Sectional Layer:** `surface_container_low` (#f3f4f5) for the Sidebar or Category area.
*   **Interaction Layer:** `surface_container_lowest` (#ffffff) for active product cards and input fields.

### Ambient Shadows
For "floating" components like Modals or Category Tabs, use **Ambient Shadows**:
*   **Blur:** 16px to 32px.
*   **Opacity:** 4%–6% of the `on_surface` color.
*   **Purpose:** The shadow should feel like a soft glow of light being blocked, not a dark smudge.

### The "Ghost Border" Fallback
If accessibility requirements demand a container edge, use a **Ghost Border**: `outline_variant` (#ddc1ae) at **15% opacity**. It should be felt, not seen.

### Glassmorphism
Floating elements, such as the "Active Category" indicator or "Fixed Search Bar," should use `surface_container_lowest` with a **20px Backdrop Blur**. This allows the product grid to bleed through subtly, softening the UI’s edges.

---

## 5. Components

### Sticky Header (72-80px)
*   **Background:** `surface_container_lowest` with a 20% opacity and Backdrop Blur.
*   **Search Input:** No border; use `surface_container_high` with `full` (9999px) rounded corners.

### Product Grid & Cards
*   **Aspect Ratio:** 4:5.
*   **Styling:** Use `lg` (1rem) corner radius. Product images should occupy the top 65% of the card.
*   **Separation:** No dividers. Use `spacing-4` (1rem) gaps between cards to let the background act as the separator.

### Order Summary (Sidebar)
*   **Width:** 30–35% of the 2560px width.
*   **Architecture:** Use a `surface_container_low` background to visually "recede" while the main grid "advances."
*   **Total Bar:** Fixed at bottom, using `surface_container_highest` for maximum prominence.

### Buttons & Touch Targets
*   **Primary Payment Button:** Height min 56px. Corner radius `full`. Background: Gradient of `primary` to `primary_container`.
*   **Category Tabs:** Pill-shaped (`full` radius). Active state: `primary` background with `on_primary` text. Inactive state: `surface_container_high`.

---

## 6. Do's and Don'ts

### Do
*   **DO** use white space as a functional tool. If a screen feels cluttered, increase spacing rather than adding lines.
*   **DO** use `surface_container_highest` for "active" states in lists to create a sense of being "pushed in."
*   **DO** ensure all touch targets (min 56px) are reachable with a thumb while holding the 11-inch tablet.

### Don't
*   **DON'T** use pure black (#000000) for text. Always use `on_surface` (#191c1d) to maintain the "Soft Minimalist" aesthetic.
*   **DON'T** use 1px dividers to separate order items. Use `spacing-2` (0.5rem) of vertical space or a subtle `surface_container_lowest` background on alternating rows.
*   **DON'T** use "Standard" shadows. If the shadow looks like a line, increase the blur value.

---

## 7. Tokens Reference

| Category | Token | Value | Application |
| :--- | :--- | :--- | :--- |
| **Radius** | `lg` | 1rem (16px) | Product Cards, Sidebar Panels |
| **Radius** | `full` | 9999px | Buttons, Search Bar, Chips |
| **Spacing** | `4` | 1rem | Standard Gutters & Margins |
| **Spacing** | `12` | 3rem | Section Breathing Room |
| **Color** | `primary` | #904d00 | Brand Action / Main CTA |
| **Color** | `surface` | #f8f9fa | Main App Background |