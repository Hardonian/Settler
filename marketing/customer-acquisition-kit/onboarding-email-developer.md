# Welcome to Settler! 🎉

**Subject:** Welcome to Settler — Your reconciliation is ready in 5 minutes

---

Hi {{developer_name}},

Welcome to Settler! We're excited to have you on board. You're about to automate reconciliation across your platforms—and it's going to be way easier than you think.

## 🚀 Get Started in 5 Minutes

**Step 1: Install the SDK**
```bash
npm install @settler/sdk
```

**Step 2: Get your API key**
Your API key is ready: `{{api_key}}`
[View in Dashboard →](https://settler.io/dashboard/api-keys)

**Step 3: Create your first job**
```typescript
import Settler from "@settler/sdk";

const settler = new Settler({
  apiKey: "{{api_key}}",
});

const job = await settler.jobs.create({
  name: "My First Reconciliation",
  source: { adapter: "shopify", config: { /* ... */ } },
  target: { adapter: "stripe", config: { /* ... */ } },
  rules: { matching: [/* ... */] },
});
```

**That's it!** Your reconciliation is now running automatically.

## 📚 Next Steps

1. **Try the Playground**: [settler.io/playground](https://settler.io/playground) — Test integrations without code
2. **Read the Docs**: [docs.settler.io](https://docs.settler.io) — Complete API reference
3. **Join Discord**: [discord.gg/settler](https://discord.gg/settler) — Get help from our community
4. **Watch Tutorial**: [youtube.com/@settler](https://youtube.com/@settler) — 10-minute walkthrough

## 🎁 What You Get Free

- ✅ **1,000 reconciliations/month** — Great for testing
- ✅ **2 adapters** — Connect your most important platforms
- ✅ **7-day log retention** — See what happened
- ✅ **Community support** — We're here to help

## 💡 Pro Tips

**Start Simple**: Begin with one source and one target. You can add complexity later.

**Use Webhooks**: Set up webhook endpoints for real-time reconciliation as events happen.

**Check Reports Daily**: Review unmatched transactions weekly to catch issues early.

**Join Our Community**: Our Discord is full of developers sharing tips and tricks.

## 🆘 Need Help?

- **Quick Questions?** → [Discord](https://discord.gg/settler) (usually answered in minutes)
- **Integration Issues?** → [docs.settler.io/troubleshooting](https://docs.settler.io/troubleshooting)
- **Something Broken?** → Reply to this email or [support@settler.io](mailto:support@settler.io)

## 🎯 Common First Jobs

**E-commerce**: Shopify ↔ Stripe reconciliation
```typescript
// See example in docs: docs.settler.io/recipes/ecommerce
```

**SaaS**: Stripe ↔ QuickBooks sync
```typescript
// See example in docs: docs.settler.io/recipes/saas
```

**Multi-Platform**: Stripe + PayPal → QuickBooks
```typescript
// See example in docs: docs.settler.io/recipes/multi-platform
```

## 📊 What Happens Next?

1. **Today**: Set up your first reconciliation job
2. **This Week**: Review your first reports and tune matching rules
3. **This Month**: Scale to production and add more adapters

We'll send you a quick check-in email in 3 days to see how things are going. In the meantime, if you hit any snags, just reply to this email—we're here to help.

Happy reconciling! 🎉

**— The Settler Team**

P.S. Follow us on [Twitter](https://twitter.com/settler_io) for product updates, tips, and reconciliation war stories.

---

**Settler** | [settler.io](https://settler.io) | [Dashboard](https://settler.io/dashboard) | [Docs](https://docs.settler.io)

You're receiving this because you signed up for Settler. [Manage preferences](https://settler.io/settings/notifications) | [Unsubscribe](https://settler.io/unsubscribe?email={{email}})
