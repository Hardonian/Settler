# Site Partition Contract

## Modes

- `SITE_MODE=oss` serves OSS marketing/docs content.
- `SITE_MODE=enterprise` serves enterprise marketing surface.

## Claims Governance

- OSS mode must not contain enterprise-only claims (SLA/SSO/VPC) outside explicit comparison/docs pages.
- Enterprise mode must label unshipped claims as **Roadmap**, **Preview**, or **Stub**.

## Shared Content

- Shared copy/components must live in shared modules and be imported; no copy-paste duplication between OSS and enterprise pages.

## SEO Rules

- Canonical/OG/sitemap/robots host derives from `SITE_MODE`.
- OSS sitemap excludes enterprise-only URLs.
- Enterprise sitemap excludes OSS-only URLs.

## Cross-links

- OSS may link to `/enterprise` CTA only.
- Enterprise may link to `/open-source` and `/docs` for product context.
