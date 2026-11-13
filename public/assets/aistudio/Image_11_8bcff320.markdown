---
name: Focused Momentum
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#684000'
  on-tertiary: '#ffffff'
  tertiary-container: '#885500'
  on-tertiary-container: '#ffd4a4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.03em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
  metric-num:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system is tailored for an intentional, motivating mobile experience balancing academic rigor with daily task management. The interface serves ambitious students, certification candidates, and goal-driven professionals who require both structural clarity and emotional encouragement.

### Personality & Tone
- **Calm Clarity:** De-cluttered, organized, and deliberate. The interface lowers cognitive friction and mitigates academic anxiety.
- **Dynamic Momentum:** Micro-celebrations, crisp visual feedback, and directional cues that convert overwhelming study schedules into manageable daily wins.
- **Architectural Utility:** Dense yet airy layouts inspired by modern executive planners and precise productivity tools.

### Design Movement
Modern Soft-Minimalism infused with tactile depth. Surfaces prioritize clean white container units sitting on subtle, cool-tinted off-white foundations. Visual hierarchy is established through high-contrast typography, crisp containment lines, and high-saturation status markers rather than heavy decorative ornaments.

## Colors

The color palette centers on a disciplined neutral canvas elevated by high-potency functional accents.

### Color Hierarchy & Roles
- **Canvas Base (`#F8F9FA` to `#F1F4F9`):** Subtly tinted, cool-neutral backdrops that eliminate harsh white glare while providing depth against raised cards.
- **Primary Energy (`#4F46E5`, `#4338CA`):** Deep electric indigo reserved for primary call-to-actions, active navigation highlights, active timer states, and core brand milestones.
- **Readiness & Success (`#10B981`, `#059669`):** Vibrant emerald green applied exclusively to completed tasks, target readiness percentages, streak retention counters, and mastered topics.
- **Priority & Attention (`#F59E0B`, `#F97316`):** Amber and soft coral reserved for high-priority study blocks, impending exam alerts, and "Needs Focus" diagnostic callouts.
- **Structural Neutral (`#E5E7EB`):** Border hairline tone that provides explicit architectural containment for modular cards.
- **Text Tiers:** Slate 900 (`#0F172A`) for primary hierarchy, Slate 600 (`#475569`) for metadata and secondary labels, and Slate 400 (`#94A3B8`) for placeholders and inactive rules.

## Typography

Typography balances geometric character and absolute utility. 

- **Display & Headlines (Plus Jakarta Sans):** Offers warmth and modern geometric personality. Used in tracking summaries, module titles, and milestone screens. Tight negative tracking keeps larger sizes cohesive.
- **Body & Labels (Inter):** Highly legible at small scales across mobile device viewports. Inter handles task descriptions, schedule timelines, and metadata with zero distortion.
- **Tabular Figures:** For exam countdown clocks, progress percentages, and Pomodoro timers, enable tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal layout shift during increments.

## Layout & Spacing

The layout is built for high-utility mobile ergonomics, emphasizing thumb-zone accessibility and vertical rhythm.

### Grid & Canvas Structure
- **Mobile Fluid Frame:** Dynamic single-column fluid layout with an edge margin of `1rem` (16px), expanding to `1.25rem` (20px) on wider mobile screens.
- **Content Hierarchy & Rhythm:** Core views use stacked card modules separated by `0.75rem` (12px) or `1rem` (16px). High-density sub-items inside cards maintain an internal gap of `0.5rem` (8px).
- **Responsive Adaptations:** 
  - Mobile (<600px): Pure single-column flow with persistent sticky bottom navigation and floating quick-add utility.
  - Tablet (600px–1024px): 2-column dashboard layout (Daily Action stream on the left, Exam Readiness/Analytics panel on the right) with a standard `1.5rem` margin.

## Elevation & Depth

Visual hierarchy uses a refined pairing of surface color elevation, crisp hair-line containment, and diffuse ambient shadows to maintain clean separation without visual noise.

### Layering System
- **Layer 0 (Canvas Base):** Filled with `#F8F9FA` or `#F1F4F9`. Flat, static backdrop.
- **Layer 1 (Card & Content Blocks):** Solid `#FFFFFF` surface bounded by a continuous 1px outline in `#E5E7EB`. Supported by a soft, diffuse ambient shadow: `0 2px 4px -1px rgba(15, 23, 42, 0.04), 0 4px 6px -1px rgba(15, 23, 42, 0.02)`.
- **Layer 2 (Floating Action & Dropdowns):** Solid `#FFFFFF` or Primary Indigo `#4F46E5`. Shadow profile: `0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`.
- **Layer 3 (Modals & Bottom Drawers):** Elevated surface overlay with `0 20px 25px -5px rgba(15, 23, 42, 0.12)`. Supported by a 30% alpha scrim (`rgba(15, 23, 42, 0.40)`) with a 4px backdrop blur.

## Shapes

The design system embraces a friendly, modern rounded profile that feels approachable yet structured.

- **Primary Cards & Containers:** Radiused at `1rem` (16px, `rounded-lg`). Ensures white cards float organically on the tinted canvas.
- **Interactive Buttons & Form Fields:** Radiused at `0.75rem` (12px) to match finger interaction zones naturally.
- **Pills, Badges & Segment Controls:** Full circular pill styling (`rounded-full` / `9999px`) to distinguish categorical tags, priority indicators, and status badges from square content cards.
- **Progress Trackers:** Radial progress circles and linear meters utilize rounded caps (`stroke-linecap: round`) to echo the soft visual language.

## Components

### Buttons & Quick Actions
- **Primary Button:** `#4F46E5` background, text `#FFFFFF`, font weight `600`, minimum tap height of `48px`. Active state transitions to `#4338CA`.
- **Secondary / Ghost:** Transparent or `#F1F4F9` background with `#4F46E5` text and 1px border (`#E5E7EB`).
- **Floating Action Button (FAB):** 56x56px circular button carrying primary indigo with an energetic icon in pure white, anchored to the bottom-right corner thumb reach.

### Cards & Group Containers
- **Standard Card:** Background `#FFFFFF`, 1px solid `#E5E7EB` border, `16px` padding, `16px` corner radius. 
- **Exam / Milestone Card:** Houses a header row with an exam countdown pill, an SVG progress ring (72% complete in emerald green), and a segregated bottom drawer highlighting "Needs Focus" items.

### Status Pills & Badges
- **Success / Completed:** Background `#ECFDF5`, text `#059669`, border `#A7F3D0`.
- **Warning / Needs Focus:** Background `#FFFBEB`, text `#D97706`, border `#FDE68A`.
- **High Priority Alert:** Background `#FEF2F2`, text `#DC2626`, border `#FECACA`.
- **Subject / Topic Tags:** Background `#EEF2FF`, text `#4F46E5`, border `#E0E7FF`. All badges use uppercase or sentence case in `label-sm` with tight horizontal padding (`8px`) and height `22px`.

### Task Checkboxes & Completion Actions
- **Circular Checkboxes:** 22px diameter circles. Unchecked: 1.5px border `#CBD5E1`. Checked: filled `#10B981` background containing a white checkmark icon, accompanied by smooth strikethrough animation across the adjacent task label.

### Progress Rings & Visual Meters
- **Metric Rings:** Thin-stroke SVG circles (stroke width: 6px–8px). Incomplete track uses `#E2E8F0`, and completed fill uses `#10B981` or `#4F46E5` with rounded terminals.
- **Linear Goal Trackers:** 8px height, filled with primary or secondary color, sitting inside a track of `#F1F4F9` with full corner smoothing.

### Input Fields
- **Search & Task Input:** 48px height, `#FFFFFF` fill, 1px `#E5E7EB` border. Transitions on focus to a 1.5px `#4F46E5` border with an ambient outer glow (`0 0 0 3px rgba(79, 70, 229, 0.1)`). Placeholder text in `#94A3B8`.