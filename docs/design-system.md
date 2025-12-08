# Design System Documentation

Comprehensive guide to the Settler design system, including tokens, components, patterns, and usage guidelines.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Component Patterns](#component-patterns)
3. [Layout System](#layout-system)
4. [Typography](#typography)
5. [Spacing](#spacing)
6. [Colors](#colors)
7. [Responsive Rules](#responsive-rules)
8. [Accessibility](#accessibility)

## Design Tokens

All design tokens are centralized in `/src/design-system/tokens.ts` and exported through `/src/design-system/index.ts`.

### Color Palette

#### Primary Colors
```typescript
primary: {
  50: '#f0f9ff',
  100: '#e0f2fe',
  500: '#0ea5e9',
  600: '#0284c7',
  700: '#0369a1',
}
```

#### Electric Accents
```typescript
electric: {
  cyan: '#06b6d4',
  purple: '#a855f7',
  neon: '#00ff88',
  blue: '#3b82f6',
  indigo: '#6366f1',
}
```

#### Semantic Colors (CSS Variables)
- `--background`: Background color
- `--foreground`: Text color
- `--card`: Card background
- `--muted`: Muted background
- `--accent`: Accent color
- `--destructive`: Error/destructive actions
- `--border`: Border color
- `--input`: Input border color
- `--ring`: Focus ring color

### Spacing Scale

Based on 4px base unit:

```typescript
spacing: {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  24: '6rem',     // 96px
}
```

### Typography Scale

#### Font Sizes
```typescript
fontSize: {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
}
```

#### Font Weights
- `normal`: 400
- `medium`: 500
- `semibold`: 600
- `bold`: 700
- `extrabold`: 800

#### Font Families
- **Sans**: Inter (primary), system-ui fallback
- **Mono**: ui-monospace, SFMono-Regular, Menlo

### Border Radius

```typescript
borderRadius: {
  sm: '0.125rem',    // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',    // 6px
  lg: '0.5rem',      // 8px
  xl: '0.75rem',     // 12px
  '2xl': '1rem',     // 16px
  full: '9999px',
}
```

### Shadows

```typescript
shadows: {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
}
```

### Transitions

```typescript
transitions: {
  duration: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
  },
  timing: {
    DEFAULT: 'ease-in-out',
    in: 'ease-in',
    out: 'ease-out',
  },
}
```

### Breakpoints

```typescript
breakpoints: {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}
```

## Component Patterns

### Buttons

**Variants:**
- `default`: Primary action (blue background)
- `destructive`: Destructive action (red background)
- `outline`: Secondary action (outlined)
- `secondary`: Muted action (muted background)
- `ghost`: Tertiary action (transparent)
- `link`: Link-style button

**Sizes:**
- `sm`: Small (36px height)
- `default`: Default (40px height)
- `lg`: Large (44px height)
- `icon`: Icon-only (40x40px)

**Usage:**
```tsx
<Button variant="default" size="lg" fullWidth>
  Click me
</Button>
```

### Inputs

**Sizes:**
- `sm`: Small (36px height)
- `default`: Default (40px height)
- `lg`: Large (44px height)

**States:**
- Normal
- Error (with `error` prop)
- Disabled
- With icons (left/right)

**Usage:**
```tsx
<Input 
  type="email" 
  placeholder="Enter email"
  error={hasError}
  leftIcon={<Mail />}
/>
```

### Cards

**Elevation:**
- `none`: No shadow
- `sm`: Small shadow
- `default`: Medium shadow
- `lg`: Large shadow

**Usage:**
```tsx
<Card elevation="lg" hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

## Layout System

### Container

Standardized container component with max-width and responsive padding.

**Max Widths:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px (default)
- `2xl`: 1400px
- `full`: 100%

**Padding:**
- `none`: No padding
- `sm`: 1rem (16px)
- `default`: Responsive (16px mobile, 24px tablet, 32px desktop)
- `lg`: Responsive (24px mobile, 32px tablet, 48px desktop)

**Usage:**
```tsx
<Container maxWidth="xl" padding="default">
  Content
</Container>
```

### Section

Standardized section component with consistent spacing and optional container.

**Padding:**
- `none`: No padding
- `sm`: 32px mobile, 48px tablet
- `default`: 48px mobile, 64px tablet, 80px desktop
- `lg`: 64px mobile, 80px tablet, 96px desktop
- `xl`: 80px mobile, 96px tablet, 128px desktop

**Backgrounds:**
- `default`: Transparent
- `muted`: Muted background
- `accent`: Accent background
- `transparent`: Explicitly transparent

**Usage:**
```tsx
<Section padding="default" background="muted" container>
  <h2>Section Title</h2>
  <p>Section content</p>
</Section>
```

## Typography

### Headings

Use the `Heading` component for semantic headings:

```tsx
<Heading level={1} size="4xl" weight="bold" align="center">
  Main Title
</Heading>
```

### Text Utilities

Typography utilities are available in `/src/styles/typography.ts`:

```tsx
import { textSizes, fontWeights, textColors } from '@/styles/typography';

// Use in className
className={cn(textSizes.lg, fontWeights.semibold, textColors.muted)}
```

## Spacing

### Component Spacing

- **Buttons**: Use `gap-4` (16px) for button groups
- **Form Fields**: Use `gap-6` (24px) between form fields
- **Sections**: Use Section component padding props
- **Cards**: Use Card padding sub-components

### Layout Spacing

- **Page Padding**: Use Container component
- **Section Spacing**: Use Section component
- **Grid Gaps**: Use `gap-4`, `gap-6`, `gap-8` based on content density

## Colors

### Usage Guidelines

1. **Primary Actions**: Use `primary-600` for primary buttons and links
2. **Text**: Use `foreground` for primary text, `muted-foreground` for secondary
3. **Backgrounds**: Use `background` for page background, `card` for card backgrounds
4. **Borders**: Use `border` for standard borders
5. **Errors**: Use `destructive` for error states

### Dark Mode

All colors automatically adapt to dark mode via CSS variables. No manual dark mode classes needed for semantic colors.

## Responsive Rules

### Mobile-First Approach

All components and layouts use mobile-first responsive design:

1. **Base styles**: Mobile (default)
2. **sm**: Small tablets (640px+)
3. **md**: Tablets (768px+)
4. **lg**: Desktops (1024px+)
5. **xl**: Large desktops (1280px+)

### Breakpoint Usage

```tsx
// Mobile-first responsive classes
className="text-base md:text-lg lg:text-xl"

// Responsive padding
className="px-4 md:px-6 lg:px-8"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

## Accessibility

### Focus States

All interactive elements have visible focus states:
- Focus ring: 2px solid `ring` color
- Focus offset: 2px
- Border radius: 4px

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual order
- Escape key closes modals
- Enter/Space activates buttons

### ARIA Labels

- All icons have `aria-hidden="true"` or descriptive labels
- Form inputs have associated labels
- Buttons have descriptive `aria-label` when needed
- Modals have proper `aria-labelledby` and `aria-describedby`

### Semantic HTML

- Use semantic elements (`<nav>`, `<section>`, `<article>`, `<header>`, `<footer>`)
- Use proper heading hierarchy (h1 → h2 → h3)
- Use `<button>` for actions, `<a>` for navigation
- Use form elements (`<form>`, `<input>`, `<label>`) properly

### Reduced Motion

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Use normalized components** from the UI library
3. **Follow spacing scale** - use 4px increments
4. **Maintain consistency** - reuse patterns
5. **Test accessibility** - ensure keyboard navigation and screen reader support
6. **Responsive by default** - mobile-first approach
7. **Semantic HTML** - use proper elements
8. **Performance** - optimize images, lazy load when appropriate

## Migration Guide

When updating existing components:

1. Replace hardcoded colors with design tokens
2. Replace ad-hoc spacing with spacing scale
3. Use normalized components instead of custom implementations
4. Add proper TypeScript types
5. Ensure accessibility attributes
6. Test responsive behavior
7. Update component documentation
