# OpenAI Integration for Autonomous Agents

The autonomous agents leverage OpenAI API for enhanced reasoning, content generation, and strategic insights.

## Overview

Agents use OpenAI API key (stored in GitHub secrets and Supabase secrets) to:

- Generate AI-enhanced strategic insights
- Create engaging content automatically
- Provide better user support explanations
- Synthesize complex user behavior patterns
- Generate financial analysis and recommendations

## Which Agents Use OpenAI?

### ✅ Strategic Governor Agent

- **Usage**: Enhances backlog prioritization with AI reasoning
- **Benefits**: Better strategic insights, more nuanced prioritization
- **Fallback**: Works without OpenAI using rule-based prioritization

### ✅ User Intent Synthesizer Agent

- **Usage**: Generates actionable recommendations from user behavior
- **Benefits**: More insightful product recommendations
- **Fallback**: Works without OpenAI using pattern-based insights

### ✅ Preemptive Support Agent

- **Usage**: Generates personalized explanations for user errors
- **Benefits**: More helpful, context-aware support messages
- **Fallback**: Works without OpenAI using template-based explanations

### ✅ Organic Growth Agent

- **Usage**: Generates engaging changelogs, case studies, and content
- **Benefits**: Higher quality, more engaging content
- **Fallback**: Works without OpenAI using template-based content

### ✅ Autonomous CFO Agent

- **Usage**: Provides strategic financial analysis and recommendations
- **Benefits**: More nuanced financial insights and recommendations
- **Fallback**: Works without OpenAI using rule-based analysis

### ❌ Architecture Sentinel Agent

- **Usage**: None (deterministic code analysis)
- **Reason**: Code quality checks are rule-based and don't need AI

### ❌ Release Gatekeeper Agent

- **Usage**: None (deterministic safety checks)
- **Reason**: Safety checks are rule-based and don't need AI

## Setup

### 1. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-`)

### 2. Set in Supabase Secrets

```bash
supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

### 3. Set in GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add new secret: `OPENAI_API_KEY`
4. Paste your API key

### 4. Set as Environment Variable (for local scripts)

```bash
export OPENAI_API_KEY=sk-your-key-here
```

## Cost Considerations

OpenAI API usage is minimal:

- **Strategic Governor**: ~1-2 API calls per week
- **User Intent Synthesizer**: ~5-10 API calls per day
- **Preemptive Support**: ~10-20 API calls per day (only for users with errors)
- **Organic Growth**: ~3-5 API calls per week
- **Autonomous CFO**: ~1-2 API calls per day

**Estimated monthly cost**: $5-15 (using gpt-4o-mini)

## Model Used

Default model: `gpt-4o-mini`

- Cost-effective
- Fast responses
- Good quality for agent tasks

To change model, edit `supabase/functions/_shared/openai.ts`:

```typescript
export async function callOpenAI(
  prompt: string,
  systemPrompt?: string,
  model: string = "gpt-4o" // Change here
): Promise<string> {
```

## Verification

Check if OpenAI is working:

```bash
# Run an agent and check logs
npx tsx scripts/run-agent.ts strategic_governor

# Check Supabase function logs for OpenAI calls
# Look for "AI enhancement" or "OpenAI API" in logs
```

## Troubleshooting

### Agents not using AI

1. **Check if API key is set:**

   ```bash
   supabase secrets list
   ```

2. **Check function logs:**
   - Look for "OPENAI_API_KEY not set" warnings
   - Check for API errors

3. **Verify API key is valid:**
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer sk-your-key-here"
   ```

### High API costs

1. Check usage in OpenAI dashboard
2. Review which agents are calling OpenAI most
3. Consider using `gpt-4o-mini` instead of `gpt-4o`
4. Add rate limiting if needed

### API errors

1. Check OpenAI status: https://status.openai.com
2. Verify API key hasn't expired
3. Check rate limits in OpenAI dashboard
4. Review error messages in function logs

## Best Practices

1. **Monitor Usage**: Check OpenAI dashboard regularly
2. **Set Budget Alerts**: Configure spending limits in OpenAI
3. **Use Appropriate Models**: `gpt-4o-mini` is sufficient for most agent tasks
4. **Handle Failures Gracefully**: All agents work without OpenAI as fallback
5. **Cache Results**: Consider caching AI responses for similar inputs

## Security

- ✅ API key stored in Supabase secrets (encrypted)
- ✅ API key stored in GitHub secrets (encrypted)
- ✅ Never logged or exposed in code
- ✅ Agents handle missing API key gracefully

## Disabling OpenAI

To disable OpenAI temporarily:

1. Remove from Supabase secrets:

   ```bash
   supabase secrets unset OPENAI_API_KEY
   ```

2. Or set empty value:
   ```bash
   supabase secrets set OPENAI_API_KEY=""
   ```

Agents will continue working with rule-based fallbacks.

---

**Note**: OpenAI integration is optional but highly recommended for best results. All agents work without it but provide enhanced capabilities with it.
