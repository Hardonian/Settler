# Settler.dev Marketplace

Community marketplace for templates, workflows, and plugins.

## Marketplace Structure

```
marketplace/
├── templates/
│   ├── mapping/          # Field mapping templates
│   ├── transform/        # Transformation recipes
│   ├── validation/      # Validation rules
│   └── recon/           # Reconciliation templates
├── workflows/           # Pre-built workflows
├── plugins/             # Third-party plugins
└── domain-packs/        # Industry-specific packs
```

## Submission Guidelines

### Template Submission

1. **Create manifest:**
   ```json
   {
     "name": "Stripe to QuickBooks Mapping",
     "version": "1.0.0",
     "description": "Maps Stripe payment data to QuickBooks format",
     "category": "mapping",
     "author": "your-username",
     "tags": ["stripe", "quickbooks", "finance"]
   }
   ```

2. **Submit via API:**
   ```bash
   curl -X POST https://api.settler.io/api/v1/marketplace/templates \
     -H "X-API-Key: sk_your_key" \
     -F "manifest=@manifest.json" \
     -F "template=@template.json"
   ```

### Workflow Submission

1. **Create workflow definition**
2. **Add documentation**
3. **Submit via API**

### Plugin Submission

1. **Create plugin manifest**
2. **Implement plugin interface**
3. **Add tests**
4. **Submit for review**

## Security & Sandbox Rules

- All templates validated before publication
- Plugins run in sandboxed environment
- Security scanning for all submissions
- Versioning required for all items

## Moderation

- All submissions reviewed before publication
- Community voting on quality
- Rating system (1-5 stars)
- Report mechanism for issues

---

**For detailed submission guidelines, see:** [SUBMISSION_GUIDELINES.md](./SUBMISSION_GUIDELINES.md)
