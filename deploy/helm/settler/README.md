# Settler Helm Chart (self-hosted)

This chart deploys `web`, `api`, and `workhorse` with an explicit migration job.

## Prerequisites

- Kubernetes 1.29+
- PostgreSQL reachable from cluster
- Container images for api/web/workhorse

## Install

```bash
helm upgrade --install settler deploy/helm/settler \
  --set secrets.DATABASE_URL="postgres://..." \
  --set secrets.NEXTAUTH_SECRET="..." \
  --set secrets.SUPABASE_URL="..." \
  --set secrets.SUPABASE_SERVICE_ROLE_KEY="..." \
  --set secrets.INVESTOR_API_KEY="..." \
  --set secrets.INVESTOR_BEARER_TOKEN="..."
```

## Smoke checks

```bash
kubectl get pods -l app=settler-settler
kubectl logs job/settler-settler-migrate
kubectl port-forward svc/settler-settler-api 4000:4000
curl -f http://localhost:4000/health
```

## Rollback

```bash
helm rollback settler <REVISION>
```

## Upgrade path

1. Build and push versioned images.
2. `helm upgrade` with new tags.
3. Confirm migration job success before traffic cutover.
4. Run smoke checks above.

## Support boundary

- Customer-managed: Kubernetes, Postgres backup/restore, ingress, TLS, image registry.
- Settler-assisted: chart values contract, schema migration compatibility, runtime health triage.
