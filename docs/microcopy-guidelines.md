# Microcopy Guidelines

This document defines the tone, voice, style, and writing standards for all user-facing text in the Settler product.

## Table of Contents

1. [Tone & Voice Framework](#tone--voice-framework)
2. [Writing Rules](#writing-rules)
3. [Component-Specific Guidelines](#component-specific-guidelines)
4. [Before/After Examples](#beforeafter-examples)
5. [Terminology Consistency](#terminology-consistency)

---

## Tone & Voice Framework

### Tone

**Friendly, Professional, Concise**

- **Friendly**: Approachable and human, not robotic or cold
- **Professional**: Competent and trustworthy, not casual or unprofessional
- **Concise**: Direct and to the point, no unnecessary words

### Voice

**Active, Empowering, Non-Patronizing**

- **Active**: Use active voice ("Create project" not "Project will be created")
- **Empowering**: Give users control and clear next steps
- **Non-Patronizing**: Treat users as capable, avoid condescension

### Style

**Direct, Positive, Non-Verbose**

- **Direct**: Say what you mean, avoid ambiguity
- **Positive**: Frame positively when possible ("Save changes" not "Don't lose changes")
- **Non-Verbose**: Use fewer words, avoid filler phrases

### Language

**Free of Jargon Unless Necessary**

- Use plain language when possible
- Define technical terms on first use
- Avoid internal terminology users wouldn't understand

---

## Writing Rules

### 1. Clarity Over Cleverness

❌ **Avoid**: "Oops! Something went sideways"
✅ **Use**: "Something went wrong. Please try again."

### 2. Action-Oriented CTAs

❌ **Avoid**: "Click here", "You can try", "This might take a moment"
✅ **Use**: "Create Project", "Save Changes", "View Dashboard"

### 3. Specific Instructions

❌ **Avoid**: "An error occurred"
✅ **Use**: "Failed to save changes. Please check your connection and try again."

### 4. Positive Framing

❌ **Avoid**: "Don't forget to save"
✅ **Use**: "Remember to save your changes"

### 5. Consistent Grammar

- **Title Case**: For navigation items, section headings
- **Sentence Case**: For buttons, form labels, descriptions
- **No mixing** unless consistent across the product

### 6. Avoid Vague Phrases

❌ **Avoid**:

- "Click here"
- "You can try"
- "This might take a moment"
- "Something went wrong" (without context)

✅ **Use**:

- "Create Project" (specific action)
- "Try Again" (clear action)
- "Processing... This usually takes 2-3 seconds" (specific timing)
- "Failed to load data. Please check your connection." (specific error)

### 7. User-Centric Language

❌ **Avoid**: "The system will process your request"
✅ **Use**: "Processing your request..."

### 8. Error Messages

- **Clear cause**: What went wrong (without exposing internals)
- **Actionable**: What the user can do next
- **Helpful**: Link to support or documentation if relevant

---

## Component-Specific Guidelines

### Buttons & CTAs

#### Primary Actions

- Use action verbs: "Create", "Save", "Submit", "Continue"
- Be specific: "Create Project" not "Create"
- Use present tense: "Save Changes" not "Saving Changes"

**Examples**:

- ✅ "Create Project"
- ✅ "Save Changes"
- ✅ "View Dashboard"
- ✅ "Start Free Trial"
- ❌ "Click to Create"
- ❌ "Create New Project" (if context is clear)

#### Secondary Actions

- Use descriptive verbs: "Cancel", "Back", "Skip"
- Be clear about consequences: "Discard Changes" not "Cancel"

**Examples**:

- ✅ "Cancel"
- ✅ "Discard Changes"
- ✅ "Back to Dashboard"
- ❌ "Go Back" (if context is clear)

#### Destructive Actions

- Be explicit: "Delete Project" not "Delete"
- Confirm consequences: "Delete Project and All Data"

**Examples**:

- ✅ "Delete Project"
- ✅ "Remove Integration"
- ❌ "Delete" (too vague)

### Form Labels & Placeholders

#### Labels

- Use sentence case: "Email address" not "Email Address"
- Be descriptive: "Project name" not "Name"
- Indicate required fields: "Email address \*" or use `required` attribute

**Examples**:

- ✅ "Email address"
- ✅ "Project name"
- ✅ "API key"
- ❌ "Email" (if context isn't clear)
- ❌ "Enter your email" (too verbose for label)

#### Placeholders

- Show example format: "you@example.com"
- Be helpful: "Enter project name" not "Name"
- Don't replace labels: Placeholders are hints, not labels

**Examples**:

- ✅ "you@example.com"
- ✅ "my-awesome-project"
- ✅ "Enter API key"
- ❌ "Email" (too vague)
- ❌ "Click here to enter email" (too verbose)

#### Error Messages

- Be specific: "Please enter a valid email address"
- Be actionable: "Password must be at least 8 characters"
- Avoid blame: "Invalid email" not "You entered an invalid email"

**Examples**:

- ✅ "Please enter a valid email address"
- ✅ "Password must be at least 8 characters"
- ✅ "This field is required"
- ❌ "Invalid input"
- ❌ "Error"

### Empty States

#### Structure

1. **Headline**: What's missing (H3 or H4)
2. **Description**: Why it's empty and what to do (body text)
3. **CTA**: Clear next step (button)

**Examples**:

**No Projects**:

- Headline: "No projects yet"
- Description: "Create your first project to start reconciling transactions"
- CTA: "Create Project"

**No Results**:

- Headline: "No results found"
- Description: "Try adjusting your filters or search terms"
- CTA: "Clear Filters"

**No Data**:

- Headline: "No data available"
- Description: "Data will appear here once transactions are processed"
- CTA: (none, or "View Documentation")

### Error States

#### Structure

1. **Title**: What went wrong (H3)
2. **Message**: Specific error (sanitized, user-friendly)
3. **Actions**: Retry, Contact Support

**Examples**:

**Network Error**:

- Title: "Connection Error"
- Message: "Unable to connect to the server. Please check your internet connection and try again."
- Actions: "Try Again", "Contact Support"

**Not Found**:

- Title: "Page Not Found"
- Message: "The page you're looking for doesn't exist or has been moved."
- Actions: "Go Home", "Back"

**Server Error**:

- Title: "Server Error"
- Message: "Something went wrong on our end. We've been notified and are working on a fix."
- Actions: "Try Again", "Contact Support"

### Loading States

- Be specific: "Loading projects..." not "Loading..."
- Show progress when possible: "Processing 3 of 10 transactions..."
- Set expectations: "This may take a few moments"

**Examples**:

- ✅ "Loading projects..."
- ✅ "Saving changes..."
- ✅ "Processing transaction..."
- ✅ "Syncing data... This may take a few moments"
- ❌ "Loading..."
- ❌ "Please wait"

### Success Messages

- Be specific: "Project created successfully" not "Success"
- Be brief: "Changes saved" not "Your changes have been successfully saved"
- Use positive language: "Project created" not "Project was created"

**Examples**:

- ✅ "Project created successfully"
- ✅ "Changes saved"
- ✅ "Integration connected"
- ❌ "Success"
- ❌ "Done"

### Tooltips

- Be concise: One sentence, max 80 characters
- Be helpful: Explain what the action does
- Use sentence case

**Examples**:

- ✅ "Delete this project permanently"
- ✅ "Refresh the current view"
- ✅ "Export data as CSV"
- ❌ "Click to delete"
- ❌ "Delete"

### Modals

#### Titles

- Use title case: "Delete Project"
- Be specific: "Delete Project" not "Confirm"

#### Descriptions

- Explain consequences: "This will permanently delete the project and all associated data."
- Be clear: "This action cannot be undone."

#### Actions

- Primary: Destructive action ("Delete Project")
- Secondary: Cancel ("Cancel")

**Examples**:

**Delete Confirmation**:

- Title: "Delete Project"
- Description: "This will permanently delete 'My Project' and all associated data. This action cannot be undone."
- Primary: "Delete Project"
- Secondary: "Cancel"

---

## Before/After Examples

### Example 1: Button CTA

❌ **Before**: "Click here to get started"
✅ **After**: "Get Started"

### Example 2: Form Error

❌ **Before**: "Error"
✅ **After**: "Please enter a valid email address"

### Example 3: Empty State

❌ **Before**:

- Headline: "Nothing here"
- Description: "You can try creating something"
- CTA: "Click here"

✅ **After**:

- Headline: "No projects yet"
- Description: "Create your first project to start reconciling transactions"
- CTA: "Create Project"

### Example 4: Loading State

❌ **Before**: "Loading... This might take a moment"
✅ **After**: "Loading projects... This usually takes 2-3 seconds"

### Example 5: Error Message

❌ **Before**: "Something went wrong"
✅ **After**: "Failed to save changes. Please check your connection and try again."

### Example 6: Success Message

❌ **Before**: "Success!"
✅ **After**: "Project created successfully"

---

## Terminology Consistency

### Standard Terms

Use these terms consistently across the product:

| Term               | Usage                                | Don't Use                   |
| ------------------ | ------------------------------------ | --------------------------- |
| **Project**        | User's reconciliation project        | Job, Task, Workflow         |
| **Integration**    | Connected platform (Stripe, Shopify) | Connector, Adapter, Service |
| **Transaction**    | Financial transaction record         | Payment, Record, Item       |
| **Reconciliation** | Matching process                     | Matching, Sync, Comparison  |
| **Dashboard**      | Main overview page                   | Home, Overview              |
| **Settings**       | Configuration page                   | Preferences, Config         |
| **API Key**        | Authentication key                   | Token, Secret, Credential   |

### Action Verbs

| Action      | Usage                                  |
| ----------- | -------------------------------------- |
| **Create**  | For new items (projects, integrations) |
| **Add**     | For adding items to collections        |
| **Save**    | For saving changes                     |
| **Delete**  | For removing items                     |
| **Remove**  | For removing from collections          |
| **Update**  | For modifying existing items           |
| **View**    | For viewing details                    |
| **Edit**    | For editing items                      |
| **Cancel**  | For canceling actions                  |
| **Confirm** | For confirming actions                 |
| **Retry**   | For retrying failed actions            |
| **Refresh** | For refreshing data                    |

### Status Terms

| Status         | Usage                      |
| -------------- | -------------------------- |
| **Active**     | Currently running/enabled  |
| **Inactive**   | Currently stopped/disabled |
| **Pending**    | Waiting to start           |
| **Processing** | Currently running          |
| **Completed**  | Finished successfully      |
| **Failed**     | Finished with error        |
| **Cancelled**  | User cancelled             |

---

## Checklist

When writing microcopy, ensure:

- [ ] Uses active voice
- [ ] Is specific and actionable
- [ ] Avoids vague phrases
- [ ] Uses consistent terminology
- [ ] Is concise (no unnecessary words)
- [ ] Frames positively when possible
- [ ] Provides clear next steps
- [ ] Uses consistent grammar (title case vs sentence case)
- [ ] Avoids jargon unless necessary
- [ ] Is user-centric (not system-centric)

---

## Implementation

### Using i18n System

All user-facing strings should be externalized to `/lib/i18n/locales/en.json`:

```json
{
  "buttons": {
    "create": "Create",
    "saveChanges": "Save Changes",
    "viewDashboard": "View Dashboard"
  },
  "forms": {
    "required": "This field is required",
    "invalidEmail": "Please enter a valid email address"
  },
  "emptyStates": {
    "noProjects": "No projects yet",
    "noProjectsDescription": "Create your first project to start reconciling transactions"
  }
}
```

### Component Usage

```tsx
import { useTranslation } from "@/lib/i18n";

function MyComponent() {
  const { t } = useTranslation();

  return <Button>{t("buttons.create")}</Button>;
}
```

---

**Last Updated**: Phase 8 - UX Polish
**Version**: 1.0.0
