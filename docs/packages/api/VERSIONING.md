# API Versioning Strategy

## Versioning Scheme

Settler uses **URL-based versioning** with optional header-based version selection:

- **URL**: `/api/v1/...`, `/api/v2/...`
- **Header**: `Settler-Version: v1` or `API-Version: v1`

### Current Versions

- **v1**: Current stable version (default)
- **v2**: Future version (not yet available)

## Version Selection

### Priority Order

1. **URL Path**: `/api/v1/jobs` → v1
2. **Header**: `Settler-Version: v2` → v2
3. **Default**: v1 if no version specified

### Examples

```bash
# URL-based
GET /api/v1/jobs

# Header-based
GET /api/jobs
Headers: Settler-Version: v1

# Default (no version specified)
GET /api/jobs → defaults to v1
```

## Breaking Changes

### What Constitutes a Breaking Change?

1. **Removing endpoints**: `/api/v1/endpoint` removed
2. **Changing request/response format**: Field removed, type changed
3. **Changing authentication**: Auth method changed
4. **Changing behavior**: Same input produces different output
5. **Removing fields**: Response field removed

### What is NOT a Breaking Change?

1. **Adding endpoints**: New endpoints don't break existing code
2. **Adding fields**: New optional fields are backward compatible
3. **Adding enum values**: New enum values don't break existing code
4. **Fixing bugs**: Bug fixes that restore intended behavior
5. **Performance improvements**: Faster responses are compatible

## Deprecation Process

### Timeline

1. **Announcement**: 6 months before deprecation
2. **Deprecation Headers**: Added to deprecated endpoints
3. **Documentation**: Migration guide published
4. **Sunset Date**: End-of-life date set
5. **Removal**: Endpoint removed in next major version

### Deprecation Headers

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: 2026-12-31T00:00:00Z
Link: </docs/migrations/v1-to-v2>; rel="deprecation"
Settler-Version: v1
```

### Example: Deprecating an Endpoint

```typescript
// v1 endpoint (deprecated)
app.get('/api/v1/old-endpoint',
  deprecateEndpoint('2026-12-31T00:00:00Z', '/docs/migrations/v1-to-v2'),
  (req, res) => {
    res.json({ message: 'Use /api/v2/new-endpoint instead' });
  }
);
```

## Version Lifecycle

### v1 (Current)

- **Status**: Stable, actively maintained
- **Deprecation**: Not yet deprecated
- **Support**: Full support
- **Breaking Changes**: None planned

### v2 (Future)

- **Status**: In development
- **Release Date**: TBD
- **Migration Guide**: Will be published before release
- **Breaking Changes**: Documented in migration guide

## Migration Strategy

### For API Consumers

1. **Monitor Deprecation Headers**: Check `Deprecation` and `Sunset` headers
2. **Review Migration Guides**: Read migration documentation
3. **Test New Version**: Test v2 in staging before production
4. **Plan Migration**: Schedule migration before sunset date
5. **Update Code**: Update API calls to new version
6. **Verify**: Test thoroughly before sunset date

### Migration Guide Template

See [MIGRATIONS.md](./MIGRATIONS.md) for v1 → v2 migration guide.

## Version Communication

### Customer Notifications

1. **Email**: Sent to all API key owners
2. **Dashboard**: Banner notification in dashboard
3. **Documentation**: Updated migration guides
4. **Changelog**: Version changelog published

### Notification Template

```
Subject: API v1 Deprecation Notice

Dear Settler Customer,

We're announcing the deprecation of API v1 endpoints:

- Endpoint: GET /api/v1/old-endpoint
- Deprecation Date: 2026-06-30
- Sunset Date: 2026-12-31
- Replacement: GET /api/v2/new-endpoint

Migration Guide: https://docs.settler.io/migrations/v1-to-v2

Please migrate before the sunset date to avoid service interruption.

Best regards,
Settler Team
```

## Versioning Best Practices

### For API Developers

1. **Plan Breaking Changes**: Design v2 with breaking changes in mind
2. **Document Changes**: Clearly document all breaking changes
3. **Provide Migration Path**: Offer clear migration path
4. **Maintain Backward Compatibility**: Don't break v1 while developing v2
5. **Test Thoroughly**: Test both versions before release

### For API Consumers

1. **Pin Versions**: Use specific version in URLs or headers
2. **Monitor Deprecations**: Check deprecation headers regularly
3. **Plan Migrations**: Don't wait until sunset date
4. **Test Early**: Test new versions in staging first
5. **Update Documentation**: Keep your integration docs updated

## Version History

### v1.0.0 (2025-01-01)

- Initial API release
- Core reconciliation features
- Webhook support
- Multi-tenancy support

### v2.0.0 (TBD)

- Enhanced reconciliation algorithms
- GraphQL API option
- Advanced analytics
- See [MIGRATIONS.md](./MIGRATIONS.md) for full changelog

## Support Policy

- **Current Version**: Full support, bug fixes, security patches
- **Previous Major Version**: Security patches only (6 months)
- **Deprecated Versions**: No support after sunset date

## Questions?

- **Documentation**: https://docs.settler.io
- **Support**: support@settler.io
- **Migration Help**: migrations@settler.io
