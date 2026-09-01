# Support

Thanks for using Settler.

## Getting Help

### Documentation

- **Start here:** [docs/START_HERE.md](docs/START_HERE.md) — the fastest path to understanding and running Settler
- **Quickstart:** [docs/QUICKSTART.md](docs/QUICKSTART.md) — install, run, and verify in 5 minutes
- **Docs index:** [docs/INDEX.md](docs/INDEX.md) — full documentation map
- **FAQ:** [docs/FAQ.md](docs/FAQ.md) — common questions and answers
- **Troubleshooting:** see below

### Issues and Bugs

Use the templates in [`.github/ISSUE_TEMPLATE`](.github/ISSUE_TEMPLATE):

- **Bug report** — something isn't working as expected
- **Feature request** — suggest a new capability
- **Documentation issue** — report a docs error or gap
- **Question** — ask a how-to question

### Discussions

If GitHub Discussions are enabled, use the Q&A category for how-to questions and the Ideas category for feature brainstorming.

### Security Issues

Security vulnerabilities must be reported privately. See [SECURITY.md](SECURITY.md) for the reporting process. Do not open public issues for security vulnerabilities.

## Troubleshooting

### Build fails after install

```bash
# Verify Node.js version (24+ required)
node --version

# Verify pnpm version (10.13.1+ required)
pnpm --version

# Clean install
rm -rf node_modules packages/*/node_modules
pnpm install

# Run the doctor script
pnpm doctor
```

### Database connection errors

```bash
# Verify your .env has the required variables
cat .env | grep DATABASE_URL
cat .env | grep SUPABASE

# Test connection
pnpm verify:schema
```

Common causes:

- Missing or malformed `DATABASE_URL` in `.env`
- Supabase project not running or URL incorrect
- Migrations not applied — run `pnpm exec tsx scripts/run-migrations-remote.ts`

### TypeScript errors in development

```bash
# Run typecheck to see all errors
pnpm --filter @settler/web exec tsc --noEmit

# Common fix: regenerate types after schema changes
pnpm verify:schema
```

### Tests fail locally

```bash
# Run the full test suite
pnpm test

# Run API tests specifically
pnpm test:ci:verify

# Check for environment issues
pnpm doctor
```

### Port already in use

```bash
# Default dev port is 3000. Kill existing process or use:
PORT=3001 pnpm --filter @settler/web dev
```

## Response Expectations

- **Bug reports:** Acknowledged within 72 hours. Critical bugs (data loss, security) are prioritized.
- **Feature requests:** Reviewed and labeled within 1 week. Implementation timeline depends on scope and priority.
- **Questions:** Best-effort response. Community help in Discussions is encouraged.
- **Security reports:** Acknowledged within 48 hours per [SECURITY.md](SECURITY.md).

## Getting Faster Help

Include in your issue:

1. What you were trying to do
2. What happened instead
3. Steps to reproduce
4. Output of `pnpm doctor` if relevant
5. Node.js version, pnpm version, and OS

## Launch Support Scope

When reporting launch issues, include outputs from:

- `pnpm run doctor`
- `pnpm run repo-integrity`
- `pnpm run verify`

This keeps support triage tied to verifiable repository state.
