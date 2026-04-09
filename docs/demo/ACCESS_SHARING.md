# Demo Access — Sharing and Management

How to share the demo with a lead safely, and how to clean up afterward.

---

## Recommended pattern: shared read-only viewer account

Use a single `viewer@settler.dev` account with a read-only (Viewer) role.

**Why this approach:**

- Fastest to share — one credential, no invite flow required
- Viewer role cannot trigger runs, export data, or modify connectors
- Easy to rotate after each session (change password in Supabase dashboard)
- No per-lead setup overhead

**Trade-off:** All leads share the same session history. If simultaneous access matters,
use per-lead invites (see below).

---

## Step 1 — Create the demo user (one-time setup)

**Via Supabase dashboard:**

1. Go to your Supabase project → Authentication → Users
2. Click "Invite user"
3. Enter `viewer@settler.dev`
4. Set a strong password and save it in your team password manager
5. Confirm the account via the email link

**Via Supabase CLI (if preferred):**

```bash
supabase auth admin create-user \
  --email viewer@settler.dev \
  --password <your-password> \
  --email-confirm
```

**Assign to demo tenant:**
The `demo-enterprise-seed.ts` script writes the demo tenant record with the placeholder
user ID. If your auth system requires a real membership record, run:

```bash
# After creating the Supabase auth user, get their UUID from the dashboard
# then insert a membership manually or via your user management UI.
```

---

## Step 2 — Share access with a lead

Copy this block and fill in your values:

```
Here's the Settler demo account:

  URL:      https://[your-app-domain]/app
  Email:    viewer@settler.dev
  Password: [current shared password]

Start at: /app/runs
Best surfaces to explore:
  /app/runs           → Reconciliation history and match explorer
  /app/sources        → Connectors (note the degraded Shopify one)
  /app/audit          → Full audit trail

This is a seeded enterprise demo account with representative data.
Let me know if you want a walkthrough — happy to jump on a quick call.
```

---

## Step 3 — After the session

**Rotate the password** (takes 30 seconds):

1. Supabase dashboard → Authentication → Users → find `viewer@settler.dev`
2. Click "Reset password" or "Update user" → set a new password
3. Update your team password manager

**Reset the demo data** (optional, if the lead triggered any changes):

```bash
pnpm demo:reset
```

**Invalidate active sessions** (if you want to immediately lock out):

1. Supabase dashboard → Authentication → Users → `viewer@settler.dev`
2. Click "Sign out all sessions" or "Revoke all refresh tokens"

---

## Per-lead invite (alternative for high-value prospects)

If you want a more polished per-lead experience:

1. Log in as the admin account (`demo@settler.dev`)
2. Go to account settings → Members → Invite
3. Enter the lead's email with Viewer role
4. They receive a magic-link invite and set their own password

**Cleanup after:**

- Remove their membership from the Members panel
- Or leave it — Viewer role has no write access

---

## Access matrix

| Account         | Email                | Role   | Can trigger runs | Can export | Can modify connectors |
| --------------- | -------------------- | ------ | ---------------- | ---------- | --------------------- |
| Demo admin      | `demo@settler.dev`   | Admin  | Yes              | Yes        | Yes                   |
| Shared viewer   | `viewer@settler.dev` | Viewer | No               | No         | No                    |
| Per-lead invite | lead's email         | Viewer | No               | No         | No                    |

---

## What leads cannot do with Viewer access

- Trigger reconciliation runs
- Export data files
- Modify connectors or credentials
- Invite other users
- Access billing settings
- See real customer data (this is an isolated demo tenant)

---

## Cross-tenant safety

The demo tenant (`settler-demo`) is fully isolated. Viewer-role users scoped to this
tenant cannot see or access any other tenant's data. The database enforces this via
row-level security — it is not a UI-only boundary.

If you are running Settler in production alongside the demo tenant, there is zero risk
of cross-contamination from the demo account.
