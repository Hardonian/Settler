# Design Token System — Settler

This document describes the canonical design token system for the Settler application.

## Architecture

```
design-system/
├── tokens.json          # Legacy token definitions (still referenced)
├── css-tokens.css       # Canonical CSS custom properties (SINGLE SOURCE OF TRUTH)
└── TOKEN_SYSTEM.md      # This documentation
```

## Token Hierarchy

### 1. Raw Color Values (`css-tokens.css`)

These are the primitive color values. **Never change these without updating all references.**

```css
--color-primary-600: #0284c7;
--color-electric-cyan: #06b6d4;
--color-neutral-gray-200: #e5e7eb;
```

### 2. Semantic Tokens (`css-tokens.css`)

These map raw values to semantic purposes. **Preferred for component styling.**

```css
--primary: var(--color-primary-600);
--primary-hover: var(--color-primary-700);
--text: var(--color-neutral-gray-900);
--border: var(--color-neutral-gray-200);
```

### 3. Tailwind Theme (`tailwind.config.js`)

Maps Tailwind utilities to semantic tokens.

```js
colors: {
  primary: {
    600: 'var(--color-primary-600)',
  }
}
```

## Required Token Set

### Color Tokens

| Token             | Value                               | Purpose                 |
| ----------------- | ----------------------------------- | ----------------------- |
| `--bg`            | `#ffffff`                           | Page background         |
| `--surface`       | `#ffffff`                           | Card/surface background |
| `--surface-muted` | `#f9fafb`                           | Subtle backgrounds      |
| `--text`          | `#111827`                           | Primary text            |
| `--text-muted`    | `#6b7280`                           | Secondary text          |
| `--primary`       | `#0284c7`                           | Primary interactive     |
| `--primary-hover` | `#0369a1`                           | Interactive hover state |
| `--border`        | `#e5e7eb`                           | Default borders         |
| `--focus-ring`    | `0 0 0 3px rgba(14, 165, 233, 0.4)` | Focus indicator         |

### Typography Tokens

| Token         | Value                          |
| ------------- | ------------------------------ |
| `--font-sans` | "Inter", system-ui, sans-serif |
| `--font-mono` | "JetBrains Mono", monospace    |
| `--text-xs`   | 0.75rem                        |
| `--text-sm`   | 0.875rem                       |
| `--text-base` | 1rem                           |
| `--text-lg`   | 1.125rem                       |
| `--text-xl`   | 1.25rem                        |

### Spacing Tokens

| Token       | Value   |
| ----------- | ------- |
| `--space-1` | 0.25rem |
| `--space-2` | 0.5rem  |
| `--space-3` | 0.75rem |
| `--space-4` | 1rem    |
| `--space-6` | 1.5rem  |
| `--space-8` | 2rem    |

### Radius Tokens

| Token         | Value    |
| ------------- | -------- |
| `--radius-sm` | 0.125rem |
| `--radius-md` | 0.375rem |
| `--radius-lg` | 0.5rem   |

### Shadow Tokens

| Token         | Value                       |
| ------------- | --------------------------- |
| `--shadow-sm` | 0 1px 2px rgba(0,0,0,0.05)  |
| `--shadow-md` | 0 4px 6px rgba(0,0,0,0.1)   |
| `--shadow-lg` | 0 10px 15px rgba(0,0,0,0.1) |

## Usage Guidelines

### DO

- Use semantic tokens for component styling
- Reference tokens in Tailwind config
- Update `css-tokens.css` when adding new values

### DON'T

- Use raw hex values in components
- Duplicate token definitions across files
- Add ad-hoc colors without updating the token system

## Extending the System

To add a new color:

1. Add to `css-tokens.css`:

```css
--color-new-feature-500: #your-hex-value;
```

2. Add semantic mapping:

```css
--new-feature: var(--color-new-feature-500);
```

3. Use in components:

```css
background-color: var(--new-feature);
```

## Accessibility

All tokens meet WCAG AA contrast requirements:

- `--text` on `--bg`: 15:1 contrast ratio
- `--text-muted` on `--bg`: 7:1 contrast ratio
- `--primary` on light backgrounds: 4.5:1 minimum
- `--focus-ring`: Uses `--color-primary-500` at 0.4 opacity

## Dark Mode

Dark mode tokens are defined in the `.dark` class within `css-tokens.css`. The system uses CSS custom property inheritance to swap values automatically.

## File References

| File                               | Purpose                     |
| ---------------------------------- | --------------------------- |
| `design-system/css-tokens.css`     | Canonical token definitions |
| `packages/web/tailwind.config.js`  | Tailwind theme mapping      |
| `packages/web/src/app/globals.css` | Global styles & utilities   |
