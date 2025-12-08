# Component Inventory

This document provides a comprehensive inventory of all components in the Settler front-end, their usage, props, and standardization status.

## Last Updated
Phase 2 Front-End Overhaul - Design System Implementation

## Core UI Components

### Button (`/src/components/ui/button.tsx`)
**Status:** ✅ Normalized  
**Usage:** Primary interactive element for user actions

**Props:**
- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'
- `fullWidth`: boolean
- `asChild`: boolean (for composition)

**Used in:**
- Navigation.tsx
- ConversionCTA.tsx
- NewsletterSignup.tsx
- All page components

**Standardization:**
- ✅ Consistent variants
- ✅ Standardized sizes
- ✅ Proper TypeScript types
- ✅ Accessibility defaults

---

### Input (`/src/components/ui/input.tsx`)
**Status:** ✅ Normalized  
**Usage:** Text input fields

**Props:**
- `size`: 'sm' | 'default' | 'lg'
- `error`: boolean
- `leftIcon`: React.ReactNode
- `rightIcon`: React.ReactNode

**Used in:**
- NewsletterSignup.tsx
- Forms across the application

**Standardization:**
- ✅ Consistent sizing
- ✅ Error state support
- ✅ Icon support
- ✅ Accessibility defaults

---

### Card (`/src/components/ui/card.tsx`)
**Status:** ✅ Normalized  
**Usage:** Container component for grouped content

**Props:**
- `elevation`: 'none' | 'sm' | 'default' | 'lg'
- `hover`: boolean

**Sub-components:**
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Used in:**
- ConversionCTA.tsx
- NewsletterSignup.tsx
- Dashboard components
- Feature cards

**Standardization:**
- ✅ Consistent elevation system
- ✅ Composable sub-components
- ✅ Proper semantic HTML

---

### Badge (`/src/components/ui/badge.tsx`)
**Status:** ✅ Normalized  
**Usage:** Status indicators, labels, tags

**Props:**
- `variant`: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
- `size`: 'sm' | 'default' | 'lg'

**Used in:**
- Status indicators
- Feature tags
- Version badges

**Standardization:**
- ✅ Consistent variants
- ✅ Standardized sizes
- ✅ Semantic colors

---

### Select (`/src/components/ui/select.tsx`)
**Status:** ✅ Normalized  
**Usage:** Dropdown selection inputs

**Props:**
- `onValueChange`: (value: string) => void

**Sub-components:**
- `SelectTrigger`
- `SelectValue`
- `SelectContent`
- `SelectItem`

**Used in:**
- Form components
- Filter components

**Standardization:**
- ✅ Consistent API
- ✅ Composable structure

---

### Table (`/src/components/ui/table.tsx`)
**Status:** ✅ New Component  
**Usage:** Data tables and lists

**Props:**
- `striped`: boolean
- `hover`: boolean
- `size`: 'sm' | 'default' | 'lg'

**Sub-components:**
- `TableHeader`
- `TableBody`
- `TableFooter`
- `TableHead`
- `TableRow`
- `TableCell`
- `TableCaption`

**Used in:**
- Data displays
- Transaction tables
- Dashboard tables

**Standardization:**
- ✅ Consistent structure
- ✅ Accessibility defaults

---

### Modal (`/src/components/ui/modal.tsx`)
**Status:** ✅ New Component  
**Usage:** Dialog modals and overlays

**Props:**
- `open`: boolean
- `onClose`: () => void
- `title`: string
- `description`: string
- `size`: 'sm' | 'default' | 'lg' | 'xl' | 'full'
- `showCloseButton`: boolean
- `closeOnBackdropClick`: boolean
- `closeOnEscape`: boolean

**Used in:**
- Confirmation dialogs
- Form modals
- Detail views

**Standardization:**
- ✅ Accessibility defaults
- ✅ Keyboard navigation
- ✅ Focus management

---

### Loading (`/src/components/ui/loading.tsx`)
**Status:** ✅ New Component  
**Usage:** Loading states and skeletons

**Props:**
- `size`: 'sm' | 'default' | 'lg'
- `text`: string
- `showSpinner`: boolean
- `fullScreen`: boolean

**Sub-components:**
- `Skeleton`

**Used in:**
- Data fetching states
- Form submission states
- Page loading states

**Standardization:**
- ✅ Consistent loading indicators
- ✅ Accessible loading states

---

### EmptyState (`/src/components/ui/empty-state.tsx`)
**Status:** ✅ New Component  
**Usage:** Empty state displays

**Props:**
- `icon`: React.ReactNode
- `iconVariant`: 'default' | 'search' | 'inbox' | 'alert'
- `title`: string
- `description`: string
- `action`: { label: string; onClick: () => void; variant?: ButtonProps['variant'] }
- `secondaryAction`: { label: string; onClick: () => void; variant?: ButtonProps['variant'] }

**Used in:**
- Empty lists
- No results states
- Error recovery

**Standardization:**
- ✅ Consistent empty states
- ✅ Action support

---

### ErrorBoundary (`/src/components/ui/error-boundary.tsx`)
**Status:** ✅ New Component  
**Usage:** Error boundary wrapper

**Props:**
- `children`: React.ReactNode
- `fallback`: React.ComponentType<ErrorFallbackProps>
- `onError`: (error: Error, errorInfo: React.ErrorInfo) => void

**Used in:**
- Page-level error handling
- Component error recovery

**Standardization:**
- ✅ Consistent error handling
- ✅ User-friendly error display

---

## Design System Components

### Container (`/src/design-system/components/Container.tsx`)
**Status:** ✅ New Component  
**Usage:** Page container with max-width and padding

**Props:**
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
- `padding`: 'none' | 'sm' | 'default' | 'lg'
- `center`: boolean

**Used in:**
- Page layouts
- Section containers

---

### Section (`/src/design-system/components/Section.tsx`)
**Status:** ✅ New Component  
**Usage:** Page sections with consistent spacing

**Props:**
- `padding`: 'none' | 'sm' | 'default' | 'lg' | 'xl'
- `background`: 'default' | 'muted' | 'accent' | 'transparent'
- `container`: boolean
- `containerProps`: ContainerProps
- `as`: 'section' | 'div' | 'article' | 'aside' | 'header' | 'footer' | 'main'

**Used in:**
- Page sections
- Content blocks

---

### Textarea (`/src/design-system/components/Textarea.tsx`)
**Status:** ✅ New Component  
**Usage:** Multi-line text input

**Props:**
- `size`: 'sm' | 'default' | 'lg'
- `error`: boolean

**Used in:**
- Form components
- Comment inputs

---

### Heading (`/src/design-system/components/Heading.tsx`)
**Status:** ✅ New Component  
**Usage:** Semantic headings with consistent styling

**Props:**
- `level`: 1 | 2 | 3 | 4 | 5 | 6
- `size`: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
- `weight`: 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold'
- `align`: 'left' | 'center' | 'right'

**Used in:**
- Page headings
- Section titles

---

## Specialized Components

### Navigation (`/src/components/Navigation.tsx`)
**Status:** ⚠️ Needs Refactoring  
**Usage:** Main site navigation

**Issues:**
- Ad-hoc styling (gradient classes)
- Should use design tokens
- Mobile menu could be extracted

**Recommendations:**
- Extract mobile menu to separate component
- Use design token colors instead of hardcoded gradients
- Normalize link styling

---

### ConversionCTA (`/src/components/ConversionCTA.tsx`)
**Status:** ⚠️ Needs Refactoring  
**Usage:** Call-to-action sections

**Issues:**
- Ad-hoc gradient styling
- Multiple variants with duplicated code
- Should use design tokens

**Recommendations:**
- Extract gradient variant to design tokens
- Consolidate variant logic
- Use normalized Button component

---

### NewsletterSignup (`/src/components/NewsletterSignup.tsx`)
**Status:** ✅ Refactored  
**Usage:** Newsletter subscription form

**Improvements:**
- ✅ Uses normalized Input component
- ✅ Uses design token colors
- Still uses gradient Card (acceptable for this use case)

---

## Component Statistics

- **Total Components:** 47 TSX files
- **Total Lines:** ~6,400 lines
- **Normalized Components:** 15+
- **Components Needing Refactoring:** ~10
- **New Components Created:** 8

## Standardization Status

### ✅ Fully Normalized
- Button
- Input
- Card
- Badge
- Select
- Label
- Checkbox
- Tabs
- Table
- Modal
- Loading
- EmptyState
- ErrorBoundary
- Container
- Section
- Textarea
- Heading

### ⚠️ Partially Normalized
- Navigation
- ConversionCTA
- NewsletterSignup (recently refactored)

### 📋 Pending Review
- AnimatedCodeBlock
- AnimatedCounter
- AnimatedFAQ
- AnimatedFeatureCard
- AnimatedHero
- AnimatedPageWrapper
- AnimatedPricingCard
- AnimatedSidebar
- AnimatedStatCard
- AuditTrail
- Dashboard
- ExceptionQueue
- FeatureComparison
- Footer
- OnboardingFlow
- Playground
- RulesEditor
- SecureMobileApp
- SEOHead
- SocialProof
- StatsSection
- StructuredData
- TrustBadges

## Usage Guidelines

1. **Always use normalized components** from `/src/components/ui` or `/src/design-system/components`
2. **Use design tokens** from `/src/design-system/tokens.ts` for colors, spacing, typography
3. **Follow component prop APIs** as documented above
4. **Ensure accessibility** - all interactive components have proper ARIA labels and keyboard navigation
5. **Use semantic HTML** - prefer semantic elements over divs where appropriate

## Migration Path

For components marked as "Needs Refactoring":
1. Replace ad-hoc styling with design tokens
2. Use normalized UI components
3. Extract repeated patterns into reusable components
4. Ensure TypeScript types are complete
5. Add accessibility attributes
6. Update this inventory
