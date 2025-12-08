# Database Migrations

Settler.dev uses Supabase migrations for database schema management.

## Running Migrations

### Local Development

```bash
npm run db:migrate:local
```

### Production

```bash
npm run db:migrate:prod
```

## Creating Migrations

```bash
npm run db:new
```

This creates a new migration file in `/supabase/migrations/`.

## Migration Guidelines

1. **Always use transactions:** Wrap migrations in `BEGIN;` and `COMMIT;`
2. **Add RLS policies:** All new tables must have RLS policies
3. **Add indexes:** Index foreign keys and frequently queried columns
4. **Update Prisma schema:** Keep Prisma schema in sync
5. **Test migrations:** Test both up and down migrations

## Rollback

To rollback a migration:

```bash
supabase migration down
```

## Migration Order

Migrations are executed in chronological order based on timestamp in filename:

```
20250120000000_initial.sql
20250120000001_add_feature.sql
20250120000002_update_schema.sql
```

---

**For migration questions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
