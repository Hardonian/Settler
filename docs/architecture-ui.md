# Settler UI Architecture

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom component library in `src/components/ui/`
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Data Fetching**: Server Components + API Routes
- **Authentication**: Supabase Auth

## Layout Patterns

### Public Pages
- Use `Navigation` and `Footer` components
- Full-width layouts with max-width containers
- Gradient backgrounds (`bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50`)

### Console Pages
- Use `ConsoleLayout` with sidebar navigation
- Fixed sidebar (64px width) + main content area
- Consistent spacing and typography

### Dashboard Pages
- Similar to public pages but with user-specific data
- Cards for metrics and stats
- Tables for data listings

## Component Patterns

### Cards
- Use `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`
- Consistent padding and spacing
- Support dark mode

### Tables
- Use `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- Responsive with horizontal scroll on mobile
- Alternating row colors

### Forms
- Use `Input`, `Label`, `Button` components
- Consistent spacing and validation states
- Accessible form labels

### Dialogs/Modals
- Use `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`
- Backdrop blur and focus management
- Close on escape or backdrop click

## Navigation

### Main Navigation
- Fixed top navigation bar
- Links to: Docs, Cookbooks, Receipts API, Feature Flags, Console, Pricing, etc.
- Dark mode toggle
- Mobile hamburger menu

### Console Navigation
- Fixed left sidebar
- Sections: Overview, API Keys, Usage, Receipts, Feature Flags, Docs
- Active state highlighting
- Icon + label format

## Styling Conventions

### Colors
- Primary: `electric-cyan`, `electric-blue`, `electric-purple`, `electric-indigo`
- Backgrounds: `slate-50` to `slate-900` with dark mode variants
- Status colors: Green (success), Amber (warning), Red (error)

### Typography
- Headings: Bold, gradient text for hero sections
- Body: Regular weight, slate colors
- Code: Monospace, background highlight

### Spacing
- Consistent use of Tailwind spacing scale
- `space-y-8` for page sections
- `gap-4` or `gap-6` for grids

## Auth Patterns

### Server Components
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  redirect('/signup');
}
```

### API Routes
```typescript
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Data Fetching Patterns

### Server Components
- Direct database queries via Prisma or Supabase
- Async/await in server components
- Suspense boundaries for loading states

### Client Components
- Fetch from API routes (`/api/*`)
- useState + useEffect for data loading
- Loading and error states

## Responsive Design

- Mobile-first approach
- Breakpoints: `sm:`, `md:`, `lg:`
- Grid layouts that stack on mobile
- Tables scroll horizontally on small screens

## Dark Mode

- Uses Tailwind dark mode classes (`dark:`)
- Automatic theme detection from localStorage
- Consistent color schemes for light/dark

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Focus management in modals
- Skip to main content link
