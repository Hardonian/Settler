# Accessibility Guide

React.Settler is built with accessibility (a11y) in mind, following WCAG 2.1 AA standards.

## Keyboard Navigation

All interactive components support keyboard navigation:

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and selectable rows
- **Arrow Keys**: Navigate within tables and lists
- **Escape**: Close modals and dialogs

## Screen Reader Support

### ARIA Labels

All components include proper ARIA labels:

```tsx
<TransactionTable
  transactions={transactions}
  // Automatically includes:
  // - role="table"
  // - aria-label="Reconciliation transactions"
  // - aria-live regions for updates
/>
```

### Semantic HTML

Components use semantic HTML elements:

- `<table>` with proper `<thead>` and `<tbody>`
- `<time>` elements for dates
- `<button>` for interactive elements
- Proper heading hierarchy (`<h1>`, `<h2>`, etc.)

## Focus Management

### Visible Focus Indicators

All focusable elements have visible focus indicators:

```css
/* Automatic focus styles */
:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}
```

### Focus Trapping

Modals and dialogs trap focus:

```tsx
<ErrorBoundary>
  {/* Focus is trapped within the boundary */}
  <YourComponent />
</ErrorBoundary>
```

## Color Contrast

All text meets WCAG AA contrast requirements:

- Normal text: 4.5:1 contrast ratio
- Large text: 3:1 contrast ratio
- Interactive elements: Clear visual indicators

## Mobile Accessibility

### Touch Targets

All interactive elements meet minimum touch target size (44x44px):

```tsx
<button
  style={{
    minWidth: '44px',
    minHeight: '44px',
    touchAction: 'manipulation' // Prevents double-tap zoom
  }}
>
  Action
</button>
```

### Responsive Design

Components adapt to screen size:

- Mobile: Single column layout
- Tablet: 2-3 column layout
- Desktop: Full multi-column layout

## Testing Accessibility

### Automated Testing

```tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<TransactionTable transactions={transactions} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing Checklist

- [ ] All functionality works with keyboard only
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG AA
- [ ] Touch targets are large enough
- [ ] Text scales up to 200% without breaking layout

## Best Practices

1. **Always provide labels**: Use `aria-label` or associated labels
2. **Use semantic HTML**: Prefer native elements over divs
3. **Test with screen readers**: Test with NVDA, JAWS, or VoiceOver
4. **Keyboard navigation**: Ensure all features work with keyboard
5. **Focus management**: Manage focus in modals and dynamic content
6. **Color independence**: Don't rely on color alone to convey information
7. **Alt text**: Provide alt text for images and icons

## Component-Specific Accessibility

### TransactionTable

- `role="table"` with proper structure
- `aria-label` for table description
- `scope="col"` for column headers
- `role="status"` for empty states
- Keyboard navigation for rows

### ExceptionTable

- Severity indicators with `aria-label`
- Status badges with `role="status"`
- Action buttons with descriptive labels

### FilterBar

- Form controls with proper labels
- `aria-describedby` for help text
- Keyboard-accessible dropdowns

### SearchBar

- `aria-label` for search input
- `aria-live` for search results
- Clear button with `aria-label`

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
