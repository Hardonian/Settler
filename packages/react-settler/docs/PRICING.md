# Pricing & Licensing

React.Settler offers a clear separation between open-source (free) and commercial features.

## License Tiers

### 🆓 OSS (Open Source) - Free Forever

**Perfect for:** Developers, startups, small projects, learning

**Includes:**
- ✅ Core protocol types (`@settler/protocol`)
- ✅ Basic React components (Dashboard, TransactionTable, ExceptionTable, MetricCard, RuleSet, MatchRule)
- ✅ Config compiler (compile to JSON)
- ✅ Basic validation (`useValidation` hook)
- ✅ Basic security (XSS protection, input sanitization)
- ✅ Mobile-responsive components
- ✅ Full accessibility (WCAG 2.1 AA)
- ✅ Testing utilities
- ✅ MIT License

**Use Cases:**
- Building reconciliation UIs for internal tools
- Learning and experimentation
- Small projects with basic needs
- Custom backend integration

### 💼 Commercial - $99/month

**Perfect for:** Growing businesses, production apps, marketplace integrations

**Includes everything in OSS, plus:**
- ✅ **MCP Server Integration** - AI assistant support
- ✅ **Shopify App Integration** - Polaris design system, App Bridge
- ✅ **Stripe Connect Integration** - Dashboard integration
- ✅ **Webhook Manager** - Real-time event system
- ✅ **Virtualized Tables** - Handle 10,000+ rows smoothly
- ✅ **Advanced Telemetry** - Performance monitoring, error tracking
- ✅ **Audit Logging** - Compliance-ready audit trails
- ✅ **Advanced Security** - Enhanced security features
- ✅ **Export Features** - CSV, JSON, XLSX export
- ✅ **Priority Support** - Email support with 48-hour response

**Use Cases:**
- E-commerce platforms integrating with Shopify/Stripe
- Marketplace apps needing webhook integration
- Production apps requiring performance optimization
- Apps needing compliance and audit logging

### 🏢 Enterprise - Custom Pricing

**Perfect for:** Large organizations, enterprise deployments

**Includes everything in Commercial, plus:**
- ✅ **SSO Integration** - Single sign-on support
- ✅ **RBAC** - Role-based access control
- ✅ **Custom Integrations** - Build custom platform adapters
- ✅ **Dedicated Instance** - Isolated infrastructure
- ✅ **SLA** - 99.9% uptime guarantee
- ✅ **Dedicated Support** - 24/7 support, dedicated account manager
- ✅ **White Label** - Remove Settler branding
- ✅ **Custom Themes** - Fully customizable UI

**Use Cases:**
- Enterprise deployments
- White-label solutions
- High-compliance requirements
- Custom integration needs

## Feature Comparison

| Feature | OSS | Commercial | Enterprise |
|---------|-----|------------|------------|
| Core Protocol | ✅ | ✅ | ✅ |
| Basic Components | ✅ | ✅ | ✅ |
| Config Compiler | ✅ | ✅ | ✅ |
| Validation | ✅ | ✅ | ✅ |
| Basic Security | ✅ | ✅ | ✅ |
| Mobile Support | ✅ | ✅ | ✅ |
| Accessibility | ✅ | ✅ | ✅ |
| MCP Integration | ❌ | ✅ | ✅ |
| Shopify Integration | ❌ | ✅ | ✅ |
| Stripe Integration | ❌ | ✅ | ✅ |
| Webhook Manager | ❌ | ✅ | ✅ |
| Virtualized Tables | ❌ | ✅ | ✅ |
| Telemetry | ❌ | ✅ | ✅ |
| Audit Logging | ❌ | ✅ | ✅ |
| SSO | ❌ | ❌ | ✅ |
| RBAC | ❌ | ❌ | ✅ |
| Custom Integrations | ❌ | ❌ | ✅ |
| White Label | ❌ | ❌ | ✅ |
| Dedicated Support | ❌ | ❌ | ✅ |

## Upgrade Path

### From OSS to Commercial

1. **Sign up** at https://settler.dev/signup
2. **Get license key** via email
3. **Set license** in your app:

```tsx
import { setLicense } from '@settler/react-settler';

setLicense({
  tier: 'commercial',
  features: new Set([
    'core',
    'basic-components',
    'mcp-integration',
    'shopify-integration',
    'stripe-integration',
    'webhook-manager',
    'virtualization',
    'telemetry',
    'audit-logging'
  ])
});
```

4. **Unlock features** - All commercial features now available!

### From Commercial to Enterprise

Contact sales@settler.dev for custom enterprise pricing and setup.

## Free Trial

Try Commercial features free for 14 days:

1. Sign up at https://settler.dev/signup
2. Start free trial (no credit card required)
3. Full Commercial access for 14 days
4. Convert to paid or continue with OSS

## FAQ

### Can I use OSS in production?

Yes! OSS tier is production-ready and includes all core features needed for basic reconciliation UIs.

### What happens if I don't upgrade?

You'll see upgrade prompts for commercial features, but OSS features continue working forever.

### Can I self-host Commercial features?

Enterprise tier includes self-hosting options. Contact sales for details.

### Do I need to upgrade for mobile support?

No! Mobile-responsive components are included in OSS tier.

### What about accessibility?

Full accessibility (WCAG 2.1 AA) is included in OSS tier.

## Business Model

- **OSS**: Drives adoption, developer mindshare, community growth
- **Commercial**: Monetizes advanced integrations and enterprise features
- **Enterprise**: Custom solutions for large organizations

This model ensures:
- ✅ Developers can start free and upgrade when needed
- ✅ Clear value proposition at each tier
- ✅ Sustainable business model
- ✅ Strong OSS community

## Contact

- **Sales**: sales@settler.dev
- **Support**: support@settler.dev
- **Pricing**: https://settler.dev/pricing
