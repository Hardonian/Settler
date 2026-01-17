# Builder.io (Fusion Builder) Integration Guide

Complete guide for using Builder.io visual page builder with Settler frontend.

## 🎯 Overview

Builder.io enables non-technical team members to create and edit marketing pages visually, without touching code. This integration allows you to:

- Create landing pages visually in the Builder.io editor
- Use pre-registered Settler components (CTAs, testimonials, feature cards, etc.)
- Publish pages instantly without deployments
- A/B test different page variations
- Personalize content for different audiences

## 📋 Prerequisites

1. **Builder.io Account**: Sign up at https://builder.io
2. **API Key**: Get your Public API key from Builder.io dashboard
3. **Environment Variables**: Configure in `.env.local`

## 🚀 Setup Instructions

### Step 1: Get Your Builder.io API Key

1. Go to https://builder.io
2. Create an account or log in
3. Navigate to **Account Settings** → **Space Settings** → **API Keys**
4. Copy your **Public API Key**

### Step 2: Configure Environment Variables

Create a `.env.local` file in `packages/web/`:

```bash
# Builder.io Configuration
NEXT_PUBLIC_BUILDER_API_KEY=your-builder-api-key-here
BUILDER_API_KEY=your-builder-api-key-here
BUILDER_WEBHOOK_SECRET=your-webhook-secret-here
NEXT_PUBLIC_BUILDER_PREVIEW_URL=http://localhost:3000
```

**Important**:
- `NEXT_PUBLIC_BUILDER_API_KEY` - Used by client-side components
- `BUILDER_API_KEY` - Used by server-side components
- `BUILDER_WEBHOOK_SECRET` - Used to verify webhooks (optional but recommended)
- `NEXT_PUBLIC_BUILDER_PREVIEW_URL` - Dev server URL for live preview

### Step 3: Configure Builder.io Space

In your Builder.io dashboard:

1. Go to **Models** and create a new model called `page`
2. Set the preview URL to:
   - **Development**: `http://localhost:3000/builder/[page-path]`
   - **Production**: `https://settler.dev/builder/[page-path]`
3. Add custom fields:
   - `title` (string) - Page title for SEO
   - `description` (longText) - Meta description
   - `keywords` (string) - SEO keywords
   - `ogImage` (file) - Open Graph image

### Step 4: Set Up Webhooks (Optional but Recommended)

Configure webhooks for automatic page revalidation:

1. In Builder.io, go to **Account Settings** → **Webhooks**
2. Add a new webhook:
   - **URL**: `https://settler.dev/api/builder/revalidate`
   - **Events**: Select "Content Published"
   - **Secret**: Add a webhook secret and save it to `BUILDER_WEBHOOK_SECRET`

This ensures pages are automatically revalidated when you publish changes.

## 🎨 Available Components

The following Settler components are registered and available in Builder.io visual editor:

### Marketing Components

1. **Animated Code Block**
   - Displays syntax-highlighted code with fade-in animation
   - Inputs: code, language (typescript/javascript/python/json/bash), title

2. **Feature Card**
   - Animated card with icon, title, and description
   - Inputs: icon (Lucide icon name), title, description

3. **Conversion CTA**
   - Call-to-action section with variants
   - Inputs: variant (default/gradient/minimal), heading, subheading, primaryCTA, secondaryCTA

4. **Enhanced Conversion CTA**
   - Premium CTA with trust badges and urgency
   - Inputs: heading, subheading, showTrustBadges, showUrgency

5. **Trust Badges**
   - Display trust signals (SOC 2, GDPR, etc.)
   - Inputs: variant (default/minimal/detailed), badges

6. **Customer Testimonials**
   - Testimonial carousel with quotes and avatars
   - Inputs: testimonials array (quote, author, role, company, avatar)

7. **Integration Logos**
   - Display partner/integration logos
   - Inputs: title, logos array (name, logo, url)

8. **Button**
   - Basic button component
   - Inputs: text, variant (default/outline/ghost), href

## 📖 Usage Guide

### Creating a New Page

1. **In Builder.io Dashboard**:
   - Click "New" → "Page"
   - Set the URL path (e.g., `/builder/landing/product-launch`)
   - Drag and drop components from the left sidebar
   - Customize component properties in the right panel

2. **Using Settler Components**:
   - Find components under "Custom Components" section
   - Drag the component onto the canvas
   - Configure inputs in the properties panel
   - Preview in real-time

3. **Publishing**:
   - Click "Publish" when ready
   - Page will be live at `https://settler.dev/builder/[your-path]`
   - If webhooks are configured, it will auto-revalidate

### Local Development Workflow

1. **Start Dev Server**:
   ```bash
   cd packages/web
   npm run dev
   ```

2. **Open Builder.io Editor**:
   - Go to https://builder.io
   - Create or edit a page
   - Set preview URL to `http://localhost:3000/builder/[page-path]`

3. **Live Preview**:
   - Changes in Builder.io will update in real-time
   - You'll see your local components and styles

4. **Testing**:
   - Navigate to `http://localhost:3000/builder/[your-path]`
   - Verify the page renders correctly

### Production Deployment

Pages are automatically deployed when you:

1. Publish content in Builder.io
2. Webhook triggers revalidation (if configured)
3. OR wait for 60-second ISR revalidation period

No code deployment needed! 🎉

## 🔧 Configuration Files

### Core Files

- `src/lib/builder/config.ts` - Builder.io initialization and configuration
- `src/lib/builder/component-registry.ts` - Component registration
- `src/components/BuilderPage.tsx` - Page rendering component
- `src/app/builder/[...page]/page.tsx` - Catch-all route for Builder pages
- `src/app/api/builder/revalidate/route.ts` - Webhook handler

### Environment Variables

```bash
# Required
NEXT_PUBLIC_BUILDER_API_KEY=your-key    # Client-side API key
BUILDER_API_KEY=your-key                # Server-side API key

# Optional
BUILDER_WEBHOOK_SECRET=your-secret      # Webhook verification
NEXT_PUBLIC_BUILDER_PREVIEW_URL=url     # Dev preview URL
```

## 🎯 Best Practices

### 1. Page Organization

- Use `/builder/landing/` prefix for landing pages
- Use `/builder/campaigns/` for campaign-specific pages
- Use `/builder/experiments/` for A/B tests

### 2. SEO Optimization

Always fill in custom fields:
- **Title**: Concise, keyword-rich (50-60 characters)
- **Description**: Compelling summary (150-160 characters)
- **Keywords**: Relevant keywords (comma-separated)
- **OG Image**: 1200x630px image for social sharing

### 3. Performance

- Use lazy-loaded components for heavy content
- Optimize images before uploading
- Keep page complexity reasonable (< 100 components)

### 4. Version Control

- Use Builder.io's version history for rollbacks
- Test changes in preview before publishing
- Use targeting rules for gradual rollouts

## 🐛 Troubleshooting

### Page Not Loading

**Issue**: Page shows "Content Not Found"

**Solutions**:
1. Verify API key is correct in `.env.local`
2. Check page URL matches Builder.io model URL
3. Ensure page is published (not draft)
4. Check browser console for errors

### Components Not Appearing

**Issue**: Custom components don't show in Builder.io

**Solutions**:
1. Verify `component-registry.ts` is imported
2. Check component registration code
3. Clear Builder.io cache (refresh editor)
4. Verify component names match registration

### Preview Not Working

**Issue**: Live preview not updating

**Solutions**:
1. Verify `NEXT_PUBLIC_BUILDER_PREVIEW_URL` is correct
2. Ensure dev server is running
3. Check CORS settings in Builder.io
4. Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Webhook Not Triggering

**Issue**: Pages not revalidating on publish

**Solutions**:
1. Verify webhook URL is accessible
2. Check `BUILDER_WEBHOOK_SECRET` matches Builder.io
3. Review webhook logs in Builder.io dashboard
4. Test webhook with curl:
   ```bash
   curl -X POST https://settler.dev/api/builder/revalidate \
     -H "Content-Type: application/json" \
     -d '{"url": "/builder/test", "model": "page"}'
   ```

## 📚 Resources

- **Builder.io Docs**: https://www.builder.io/c/docs
- **Next.js Integration**: https://www.builder.io/c/docs/integrating-builder-pages
- **Component SDK**: https://www.builder.io/c/docs/custom-components-intro
- **API Reference**: https://www.builder.io/c/docs/api-reference

## 🎓 Training Videos

1. **Getting Started with Builder.io** (5 min)
   - Creating your first page
   - Using drag and drop editor

2. **Using Custom Components** (10 min)
   - Settler component library overview
   - Configuring component properties

3. **Publishing and SEO** (7 min)
   - Setting up SEO fields
   - Publishing workflow

4. **A/B Testing** (12 min)
   - Creating variations
   - Setting up targeting rules

## 🚀 Next Steps

1. **Create Your First Page**:
   - Try creating a simple landing page
   - Use pre-built Settler components

2. **Experiment with A/B Testing**:
   - Create page variations
   - Test different CTAs

3. **Personalize Content**:
   - Set up audience targeting
   - Customize by geography/device

4. **Monitor Performance**:
   - Track page views in Analytics
   - Monitor conversion rates

## 💡 Tips & Tricks

- **Keyboard Shortcuts**: Use Cmd/Ctrl+Z for undo, Cmd/Ctrl+C/V for copy/paste
- **Duplicate Pages**: Right-click page in list → "Duplicate"
- **Bulk Publishing**: Select multiple pages → "Publish All"
- **Content Scheduling**: Set publish dates for future launches
- **Preview on Devices**: Use device switcher in editor toolbar

## ⚠️ Important Notes

1. **API Key Security**: Never commit API keys to git
2. **Content Backup**: Builder.io has version history, but consider periodic exports
3. **Rate Limits**: Builder.io has API rate limits - batch operations if needed
4. **Cache Strategy**: Pages revalidate every 60 seconds (ISR)
5. **Custom Fonts**: Use Next.js font optimization for Builder pages

---

**Questions or Issues?**

- Technical Support: builder-support@settler.dev
- Documentation: https://docs.settler.dev/builder
- Slack Channel: #builder-support

Happy building! 🎨✨
