# UX Guidelines

This document defines the design system, spacing, typography, layout, motion, and interaction guidelines for the Settler frontend.

## Table of Contents

1. [Spacing Scale](#spacing-scale)
2. [Typography Hierarchy](#typography-hierarchy)
3. [Layout Grid Rules](#layout-grid-rules)
4. [Motion & Interaction Guidelines](#motion--interaction-guidelines)
5. [Component Patterns](#component-patterns)
6. [Accessibility Standards](#accessibility-standards)

---

## Spacing Scale

### Base Unit

- **Base unit**: 4px (0.25rem)
- All spacing values are multiples of 4px for visual consistency

### Spacing Scale

| Token        | Value   | Pixels | Usage                                      |
| ------------ | ------- | ------ | ------------------------------------------ |
| `spacing.0`  | 0       | 0px    | No spacing                                 |
| `spacing.1`  | 0.25rem | 4px    | Tight spacing (icon padding)               |
| `spacing.2`  | 0.5rem  | 8px    | Compact spacing (label-input gap)          |
| `spacing.3`  | 0.75rem | 12px   | List item gaps                             |
| `spacing.4`  | 1rem    | 16px   | Standard padding, mobile container padding |
| `spacing.6`  | 1.5rem  | 24px   | Form field gaps, card padding (sm)         |
| `spacing.8`  | 2rem    | 32px   | Section gaps, card padding (md)            |
| `spacing.12` | 3rem    | 48px   | Standard section padding                   |
| `spacing.16` | 4rem    | 64px   | Spacious section padding                   |
| `spacing.20` | 5rem    | 80px   | Hero section padding                       |
| `spacing.24` | 6rem    | 96px   | Extra spacious sections                    |

### Vertical Spacing Between Sections

| Size  | Value         | Usage                                  |
| ----- | ------------- | -------------------------------------- |
| `xs`  | 1.5rem (24px) | Tight spacing between related sections |
| `sm`  | 2rem (32px)   | Compact sections                       |
| `md`  | 3rem (48px)   | **Standard sections** (default)        |
| `lg`  | 4rem (64px)   | Spacious sections                      |
| `xl`  | 5rem (80px)   | Hero sections                          |
| `2xl` | 6rem (96px)   | Extra spacious hero sections           |

### Horizontal Spacing (Container Padding)

| Size | Value         | Usage           |
| ---- | ------------- | --------------- |
| `xs` | 1rem (16px)   | Mobile padding  |
| `sm` | 1.5rem (24px) | Tablet padding  |
| `md` | 2rem (32px)   | Desktop padding |
| `lg` | 3rem (48px)   | Wide desktop    |
| `xl` | 4rem (64px)   | Extra wide      |

### Component-Specific Spacing

#### Cards

- **Small**: `p-4` (16px)
- **Medium**: `p-6` (24px) - **Default**
- **Large**: `p-8` (32px)

#### Forms

- **Field gap**: `1.5rem` (24px) between form fields
- **Label gap**: `0.5rem` (8px) between label and input
- **Group gap**: `2rem` (32px) between form groups

#### Lists

- **Item gap**: `0.75rem` (12px) between list items
- **Section gap**: `1.5rem` (24px) between list sections

#### Navigation

- **Item gap**: `1.5rem` (24px) between nav items
- **Section gap**: `2rem` (32px) between nav sections

### Rules

1. **Consistency**: Always use spacing tokens, never arbitrary values
2. **Vertical Rhythm**: Maintain consistent vertical spacing between sections
3. **Avoid Cramped Layouts**: Use minimum `spacing.4` (16px) for padding
4. **Mobile First**: Start with mobile spacing, scale up for larger screens

---

## Typography Hierarchy

### Font Family

- **Primary**: Inter (via Next.js Google Fonts)
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Font Scale

| Level     | Size                         | Line Height               | Weight                | Usage                      |
| --------- | ---------------------------- | ------------------------- | --------------------- | -------------------------- |
| **H1**    | `text-4xl` (2.25rem / 36px)  | `leading-tight` (1.25)    | `font-bold` (700)     | Page titles, hero headings |
| **H2**    | `text-3xl` (1.875rem / 30px) | `leading-tight` (1.25)    | `font-bold` (700)     | Section headings           |
| **H3**    | `text-2xl` (1.5rem / 24px)   | `leading-tight` (1.25)    | `font-semibold` (600) | Subsection headings        |
| **H4**    | `text-xl` (1.25rem / 20px)   | `leading-tight` (1.25)    | `font-semibold` (600) | Card titles                |
| **H5**    | `text-lg` (1.125rem / 18px)  | `leading-tight` (1.25)    | `font-semibold` (600) | Small headings             |
| **H6**    | `text-base` (1rem / 16px)    | `leading-tight` (1.25)    | `font-semibold` (600) | Smallest headings          |
| **Body**  | `text-base` (1rem / 16px)    | `leading-relaxed` (1.625) | `font-normal` (400)   | Default body text          |
| **Small** | `text-sm` (0.875rem / 14px)  | `leading-relaxed` (1.625) | `font-normal` (400)   | Secondary text, captions   |
| **XS**    | `text-xs` (0.75rem / 12px)   | `leading-normal` (1.5)    | `font-normal` (400)   | Labels, metadata           |

### Font Weights

| Weight          | Value | Usage                               |
| --------------- | ----- | ----------------------------------- |
| `font-thin`     | 100   | Rarely used                         |
| `font-light`    | 300   | Rarely used                         |
| `font-normal`   | 400   | **Body text** (default)             |
| `font-medium`   | 500   | Buttons, emphasis                   |
| `font-semibold` | 600   | **Headings H3-H6**                  |
| `font-bold`     | 700   | **Headings H1-H2**, strong emphasis |

### Text Colors (Semantic)

| Token                    | Usage                               |
| ------------------------ | ----------------------------------- |
| `text-foreground`        | Primary text color                  |
| `text-muted-foreground`  | Secondary text, descriptions        |
| `text-accent-foreground` | Accent text, links                  |
| `text-destructive`       | Error messages, destructive actions |
| `text-primary-600`       | Primary brand color text            |

### Readability Rules

1. **Line Length**:
   - Paragraphs: **60-80 characters** (max-width: `65ch`)
   - Avoid ultra-wide text blocks on desktop

2. **Line Height**:
   - Headings: `leading-tight` (1.25)
   - Body text: `leading-relaxed` (1.625)
   - Small text: `leading-normal` (1.5)

3. **Letter Spacing**:
   - Headings: `tracking-tight` for better readability
   - Body: Default (no tracking adjustment)

4. **Text Alignment**:
   - Left-align for body text (default)
   - Center-align only for hero sections or CTAs
   - Right-align rarely (only for specific UI patterns)

---

## Layout Grid Rules

### Container Max Widths

| Size  | Value  | Usage                                  |
| ----- | ------ | -------------------------------------- |
| `sm`  | 640px  | Small containers                       |
| `md`  | 768px  | Medium containers                      |
| `lg`  | 1024px | Large containers                       |
| `xl`  | 1280px | Extra large containers                 |
| `2xl` | 1400px | **Default max-width** for main content |

### Grid System

- **Base**: 12-column grid (when using CSS Grid)
- **Gap**: `1.5rem` (24px) default, `2rem` (32px) for spacious layouts
- **Responsive**: Mobile-first, breakpoints align with Tailwind defaults

### Content Width Constraints

- **Readable content**: `max-w-[65ch]` (~65 characters)
- **Wide content**: `max-w-4xl` (896px)
- **Full width**: `max-w-7xl` (1280px) - **Default for sections**

### Section Constraints

- **Minimum height**: 400px for full sections
- **Maximum width**: 1400px for sections
- **Padding**: Use `px-4 sm:px-6 lg:px-8` for responsive container padding

### Rules

1. **Snap to Grid**: Align elements to 4px grid
2. **Consistent Margins**: Use spacing scale for margins
3. **Responsive**: Mobile-first approach, scale up for larger screens
4. **Avoid Off-by-1px**: Use consistent spacing values

---

## Motion & Interaction Guidelines

### Transition Durations

| Duration  | Value | Usage                                         |
| --------- | ----- | --------------------------------------------- |
| `fast`    | 100ms | Button interactions, hover states             |
| `default` | 200ms | **Standard transitions** (colors, transforms) |
| `slow`    | 300ms | Modal animations, overlays                    |
| `slower`  | 500ms | Page transitions                              |

### Easing Functions

| Easing        | Value                          | Usage                       |
| ------------- | ------------------------------ | --------------------------- |
| `ease-out`    | `cubic-bezier(0, 0, 0.2, 1)`   | **Default** for UI elements |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Page transitions            |
| `linear`      | `linear`                       | Rarely used                 |

### Transition Presets

#### Colors (background, text, border)

```css
transition:
  color,
  background-color,
  border-color 200ms ease-out;
```

#### Transform (scale, translate, rotate)

```css
transition: transform 200ms ease-out;
```

#### Opacity

```css
transition: opacity 100ms ease-out;
```

#### Button Interactions

```css
transition:
  background-color,
  color,
  transform,
  box-shadow 100ms ease-out;
```

#### Modal/Overlay

```css
transition:
  opacity,
  transform 300ms ease-out;
```

### Interaction States

All interactive elements must have consistent states:

#### Normal State

- Default appearance
- No special styling

#### Hover State

- Subtle color change
- Optional: slight scale (`scale-[1.02]`) or shadow increase
- Duration: 100-200ms

#### Focus State

- Visible focus ring: `ring-2 ring-ring ring-offset-2`
- Outline offset for accessibility
- **Critical**: Always visible for keyboard navigation

#### Active State

- Slight scale down: `scale-[0.98]`
- Darker background color
- Duration: 100ms

#### Disabled State

- Reduced opacity: `opacity-50`
- Cursor: `cursor-not-allowed`
- Pointer events: `pointer-events-none`

#### Loading State

- Show spinner or loading indicator
- Disable interaction
- Maintain visual feedback

### Motion Accessibility

1. **Respect `prefers-reduced-motion`**:
   - Use `motion-reduce:transition-none` for transitions
   - Use `motion-safe:animate-*` for animations
   - Always provide fallback for reduced motion users

2. **Avoid Excessive Motion**:
   - Keep animations subtle (100-200ms)
   - Avoid parallax or auto-scrolling
   - No motion for essential UI elements

3. **Consistent Timing**:
   - Use same easing curves across UI
   - Standardize durations for similar interactions

---

## Component Patterns

### Buttons

#### Variants

- `default`: Primary action (blue gradient)
- `destructive`: Destructive action (red)
- `outline`: Secondary action (outlined)
- `secondary`: Tertiary action (muted background)
- `ghost`: Minimal action (no background)
- `link`: Link-style button

#### Sizes

- `sm`: `h-9 px-3 text-sm`
- `default`: `h-10 px-4` - **Default**
- `lg`: `h-11 px-8 text-base`
- `icon`: `h-10 w-10`

#### States

- All states follow interaction guidelines above
- Loading state shows spinner
- Disabled state prevents interaction

### Forms

#### Input Spacing

- Label to input: `0.5rem` (8px)
- Input to error: `0.25rem` (4px)
- Field to field: `1.5rem` (24px)
- Group to group: `2rem` (32px)

#### Input States

- Normal: Default border color
- Hover: Slightly darker border
- Focus: Ring with offset
- Error: Red border, red ring
- Disabled: Muted background, reduced opacity

### Cards

#### Padding

- Small: `p-4` (16px)
- Medium: `p-6` (24px) - **Default**
- Large: `p-8` (32px)

#### Spacing Between Cards

- Grid gap: `1.5rem` (24px) default
- List gap: `1rem` (16px) for compact lists

### Empty States

#### Structure

1. Icon (optional, 48-64px)
2. Headline (H3 or H4)
3. Description (body text, max-width: `max-w-md`)
4. CTA button (optional)

#### Spacing

- Container padding: `py-12` (48px vertical)
- Icon to headline: `mb-4` (16px)
- Headline to description: `mb-2` (8px)
- Description to CTA: `mb-6` (24px)

### Error States

#### Structure

1. Error icon (AlertCircle, 48-64px)
2. Error title (H3)
3. Error message (body text, sanitized)
4. Actions (Retry, Contact Support)

#### Spacing

- Same as empty states
- Actions: `gap-3` (12px) between buttons

---

## Accessibility Standards

### Semantic HTML

1. **Use correct heading hierarchy** (h1 → h2 → h3, no skipping)
2. **Use `<button>` for buttons**, `<a>` for links
3. **Use proper form elements** (`<input>`, `<label>`, `<fieldset>`)
4. **Use ARIA only when necessary** (don't overuse)

### Keyboard Navigation

1. **All interactive elements must be focusable**
2. **Logical tab order** (top to bottom, left to right)
3. **Visible focus indicators** (ring-2 with offset)
4. **Skip-to-content link** (`.skip-to-main`)
5. **Modal focus trapping** (focus stays within modal)

### Screen Reader Support

1. **Descriptive labels** for all form inputs
2. **ARIA labels** for icon-only buttons
3. **ARIA live regions** for dynamic content (errors, loading)
4. **Alt text** for all images
5. **ARIA expanded/controls** for accordions, menus

### Color Contrast

- **WCAG AA**: Minimum 4.5:1 for normal text, 3:1 for large text
- **WCAG AAA**: Minimum 7:1 for normal text, 4.5:1 for large text
- **Target**: Meet or exceed WCAG 2.2 AA standards

### Motion

- **Respect `prefers-reduced-motion`**
- **No essential information in motion**
- **Subtle animations only** (100-200ms)

---

## Implementation Notes

### Tailwind Classes

Use Tailwind utility classes aligned with these guidelines:

```tsx
// Spacing
className = "p-6 space-y-6";

// Typography
className = "text-2xl font-bold leading-tight";

// Motion
className = "transition-colors duration-200 ease-out motion-reduce:transition-none";

// Focus
className =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
```

### Component Utilities

Use utilities from `/lib/style/motion.ts` and `/lib/style/spacing.ts`:

```tsx
import { motionClasses, motionDuration } from "@/lib/style/motion";
import { spacingClasses, verticalSpacing } from "@/lib/style/spacing";
```

---

## Checklist

When creating or updating components, ensure:

- [ ] Spacing uses tokens from spacing scale
- [ ] Typography follows hierarchy
- [ ] Transitions are 100-200ms with ease-out
- [ ] All interaction states are implemented
- [ ] Focus states are visible
- [ ] Reduced motion is respected
- [ ] Semantic HTML is used
- [ ] ARIA labels are added where needed
- [ ] Color contrast meets WCAG AA
- [ ] Text width is constrained for readability (60-80 chars)

---

**Last Updated**: Phase 8 - UX Polish
**Version**: 1.0.0
