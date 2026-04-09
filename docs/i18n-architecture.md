# Internationalization (i18n) Architecture

This document describes the internationalization system architecture for the Settler frontend.

## Table of Contents

1. [Overview](#overview)
2. [Folder Structure](#folder-structure)
3. [Translation Keys](#translation-keys)
4. [Component Usage Patterns](#component-usage-patterns)
5. [Adding New Translations](#adding-new-translations)
6. [Future Enhancements](#future-enhancements)

---

## Overview

The i18n system provides a lightweight, React-friendly solution for externalizing user-facing strings. It's designed to be:

- **Simple**: Easy to use in components
- **Type-safe**: TypeScript types for translation keys
- **Extensible**: Ready for future integration with next-intl or similar libraries
- **Performant**: Minimal runtime overhead

### Current Status

- ✅ English (en) - Complete
- 🔄 French (fr) - Placeholder (structure ready)
- ⏳ Spanish (es) - Placeholder
- ⏳ German (de) - Placeholder
- ⏳ Japanese (ja) - Placeholder
- ⏳ Chinese (zh) - Placeholder

---

## Folder Structure

```
packages/web/src/lib/i18n/
├── index.ts              # Core i18n functions and types
├── hooks.tsx             # React hooks (useTranslation, useLocale)
└── locales/
    ├── en.json           # English translations (complete)
    └── fr.json           # French translations (placeholder)
```

---

## Translation Keys

### Structure

Translation keys are organized hierarchically by feature area:

```json
{
  "common": { ... },           // Common UI elements
  "navigation": { ... },        // Navigation items
  "forms": { ... },             // Form labels and errors
  "errors": { ... },            // Error messages
  "emptyStates": { ... },       // Empty state messages
  "buttons": { ... },           // Button labels
  "loading": { ... },           // Loading states
  "success": { ... },           // Success messages
  "tooltips": { ... },          // Tooltip text
  "modals": { ... }             // Modal titles and descriptions
}
```

### Key Naming Convention

- Use camelCase: `saveChanges`, `invalidEmail`
- Be descriptive: `deleteProject` not `delete`
- Group by context: `forms.required`, `errors.network`

### Parameter Replacement

Use `{paramName}` for dynamic values:

```json
{
  "forms": {
    "minLength": "Must be at least {min} characters",
    "maxLength": "Must be no more than {max} characters"
  }
}
```

---

## Component Usage Patterns

### Basic Usage with Hook

```tsx
"use client";

import { useTranslation } from "@/lib/i18n/hooks";

function MyComponent() {
  const { t, locale } = useTranslation();

  return (
    <div>
      <h1>{t("navigation.home")}</h1>
      <Button>{t("buttons.create")}</Button>
      <p>{t("forms.minLength", { min: 8 })}</p>
    </div>
  );
}
```

### Using Translation Function Directly

```tsx
import { translate, defaultLocale } from "@/lib/i18n";

// Server component or non-React code
const text = translate("buttons.create", defaultLocale);
```

### With I18n Provider

Wrap your app with the I18nProvider (recommended for client components):

```tsx
"use client";

import { I18nProvider } from "@/lib/i18n/hooks";

export default function RootLayout({ children }) {
  return <I18nProvider>{children}</I18nProvider>;
}
```

### Common Patterns

#### Buttons

```tsx
const { t } = useTranslation();

<Button>{t('buttons.create')}</Button>
<Button>{t('buttons.saveChanges')}</Button>
<Button>{t('buttons.deleteProject')}</Button>
```

#### Form Labels & Errors

```tsx
const { t } = useTranslation();

<label>{t("forms.email")}</label>;
{
  error && <p>{t("forms.invalidEmail")}</p>;
}
<p>{t("forms.minLength", { min: 8 })}</p>;
```

#### Empty States

```tsx
const { t } = useTranslation();

<EmptyState
  title={t("emptyStates.noProjects")}
  description={t("emptyStates.noProjectsDescription")}
  action={{
    label: t("buttons.createProject"),
    onClick: handleCreate,
  }}
/>;
```

#### Error States

```tsx
const { t } = useTranslation();

<ErrorState title={t("errors.network")} onRetry={handleRetry} retryText={t("errors.tryAgain")} />;
```

---

## Adding New Translations

### Step 1: Add Key to Type Definition

Update `/lib/i18n/index.ts`:

```typescript
export interface TranslationKeys {
  // ... existing keys
  newSection: {
    newKey: string;
  };
}
```

### Step 2: Add Translation to en.json

Update `/lib/i18n/locales/en.json`:

```json
{
  "newSection": {
    "newKey": "New translation text"
  }
}
```

### Step 3: Use in Component

```tsx
const { t } = useTranslation();
<p>{t("newSection.newKey")}</p>;
```

### Step 4: Add to Other Locales (When Ready)

Update `/lib/i18n/locales/fr.json`:

```json
{
  "newSection": {
    "newKey": "Nouveau texte de traduction"
  }
}
```

---

## Translation Key Reference

### Common

- `common.loading` - "Loading..."
- `common.error` - "Error"
- `common.success` - "Success"
- `common.cancel` - "Cancel"
- `common.save` - "Save"
- `common.delete` - "Delete"
- `common.edit` - "Edit"
- `common.create` - "Create"
- `common.close` - "Close"

### Navigation

- `navigation.home` - "Home"
- `navigation.docs` - "Docs"
- `navigation.pricing` - "Pricing"
- `navigation.getStarted` - "Get Started"

### Forms

- `forms.required` - "This field is required"
- `forms.invalidEmail` - "Please enter a valid email address"
- `forms.minLength` - "Must be at least {min} characters"
- `forms.maxLength` - "Must be no more than {max} characters"

### Errors

- `errors.generic` - "Something went wrong. Please try again."
- `errors.network` - "Network error. Please check your connection and try again."
- `errors.notFound` - "The requested resource was not found."
- `errors.tryAgain` - "Try Again"
- `errors.contactSupport` - "Contact Support"

### Empty States

- `emptyStates.noData` - "No data available"
- `emptyStates.noResults` - "No results found"
- `emptyStates.noProjects` - "No projects yet"
- `emptyStates.noProjectsDescription` - "Create your first project to start reconciling transactions"

### Buttons

- `buttons.create` - "Create"
- `buttons.saveChanges` - "Save Changes"
- `buttons.createProject` - "Create Project"
- `buttons.deleteProject` - "Delete Project"
- `buttons.startFreeTrial` - "Start Free Trial"

---

## Future Enhancements

### Planned Features

1. **next-intl Integration**
   - Migrate to next-intl for Next.js App Router support
   - Server-side rendering with locale
   - Automatic locale detection

2. **RTL Support**
   - Right-to-left layout support for Arabic, Hebrew
   - Automatic `dir="rtl"` attribute
   - Mirror layout for RTL languages

3. **Pluralization**
   - Support for plural forms
   - Example: `{count} {count, plural, one {item} other {items}}`

4. **Date & Number Formatting**
   - Locale-aware date formatting
   - Locale-aware number formatting
   - Currency formatting

5. **Language Switcher Component**
   - `<LanguageSelector />` component
   - Dropdown with available languages
   - Persist selection in localStorage

6. **Translation Management**
   - Integration with translation management tools
   - Missing translation detection
   - Translation completion tracking

### Migration Path

When ready to migrate to next-intl:

1. Install next-intl: `npm install next-intl`
2. Update middleware for locale detection
3. Migrate translation files to next-intl format
4. Update component usage to use next-intl hooks
5. Add RTL support if needed

---

## Best Practices

### Do's

✅ **Externalize all user-facing strings**

```tsx
// Good
<Button>{t('buttons.create')}</Button>

// Bad
<Button>Create</Button>
```

✅ **Use descriptive key names**

```tsx
// Good
t("buttons.createProject");

// Bad
t("buttons.create");
```

✅ **Group related translations**

```tsx
// Good
t("forms.required");
t("forms.invalidEmail");

// Bad
t("required");
t("emailError");
```

✅ **Use parameters for dynamic values**

```tsx
// Good
t("forms.minLength", { min: 8 })
// Bad
`Must be at least ${min} characters`;
```

### Don'ts

❌ **Don't hardcode strings**

```tsx
// Bad
<Button>Create Project</Button>
```

❌ **Don't use generic keys**

```tsx
// Bad
t("text1");
t("message");
```

❌ **Don't mix languages**

```tsx
// Bad
t("buttons.create") + " Project";
```

---

## Testing

### Manual Testing

1. Change locale in browser/localStorage
2. Verify all strings are translated
3. Check parameter replacement works
4. Verify fallback to English works

### Automated Testing

```tsx
import { translate } from "@/lib/i18n";

test("translates key correctly", () => {
  expect(translate("buttons.create", "en")).toBe("Create");
});

test("replaces parameters", () => {
  expect(translate("forms.minLength", "en", { min: 8 })).toBe("Must be at least 8 characters");
});
```

---

## Troubleshooting

### Translation Not Found

If a translation key is missing, the system will:

1. Log a warning to console
2. Return the key as fallback
3. Fall back to English if locale not found

### Parameter Not Replaced

Ensure parameters match exactly:

```tsx
// Translation: "Must be at least {min} characters"
t("forms.minLength", { min: 8 }); // ✅ Works
t("forms.minLength", { minimum: 8 }); // ❌ Doesn't work
```

---

**Last Updated**: Phase 8 - UX Polish  
**Version**: 1.0.0
