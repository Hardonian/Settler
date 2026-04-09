# OpenAI API Key Setup

Quick guide to set up OpenAI API key for enhanced agent capabilities.

## Why OpenAI?

Agents use OpenAI for:

- **Better strategic insights** (Strategic Governor)
- **Smarter user behavior analysis** (User Intent Synthesizer)
- **Personalized support explanations** (Preemptive Support)
- **Engaging content generation** (Organic Growth)
- **Enhanced financial analysis** (Autonomous CFO)

**Note**: All agents work without OpenAI, but provide enhanced capabilities with it.

## Setup Steps

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### 2. Set in Supabase Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

Verify it's set:

```bash
supabase secrets list
```

### 3. Set in GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OPENAI_API_KEY`
5. Value: Your API key (starts with `sk-`)
6. Click **Add secret**

### 4. Set as Environment Variable (for local scripts)

```bash
export OPENAI_API_KEY=sk-your-key-here
```

Or add to your `.env` file:

```
OPENAI_API_KEY=sk-your-key-here
```

## Verify Setup

After deploying, check if OpenAI is working:

```bash
# Run an agent
npx tsx scripts/run-agent.ts strategic_governor

# Check logs for "AI enhancement" messages
# Or look for enhanced content in outputs
```

## Cost Estimate

Using `gpt-4o-mini`:

- **Monthly cost**: ~$5-15
- **Per agent run**: ~$0.01-0.05
- **Total calls/day**: ~20-30

Set a budget alert in OpenAI dashboard to monitor usage.

## Troubleshooting

### "OPENAI_API_KEY not set" warnings

1. Check Supabase secrets: `supabase secrets list`
2. Verify GitHub secrets are set correctly
3. Check environment variables: `echo $OPENAI_API_KEY`

### API errors

1. Verify key is valid: https://platform.openai.com/api-keys
2. Check OpenAI status: https://status.openai.com
3. Review error messages in function logs

### High costs

1. Check usage: https://platform.openai.com/usage
2. Set spending limits in OpenAI dashboard
3. Consider using `gpt-4o-mini` (default) instead of `gpt-4o`

## Disabling OpenAI

To disable temporarily:

```bash
supabase secrets unset OPENAI_API_KEY
```

Agents will continue working with rule-based fallbacks.

---

**Ready?** Set your key and redeploy: `npm run agents:deploy`
