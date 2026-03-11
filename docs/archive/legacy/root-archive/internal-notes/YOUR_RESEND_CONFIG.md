# Your Resend Email Configuration

## ✅ Ready to Use

Copy this into **Vercel Dashboard → Settings → Environment Variables**:

```bash
RESEND_API_KEY=re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Settler
```

**For Production (after domain verification):**
```bash
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

---

## What This Enables

- ✅ **Sign-up verification emails** - Email verification links
- ✅ **Password reset emails** - Password reset links
- ✅ **Welcome emails** - Post-signup welcome messages
- ✅ **Magic link emails** - Passwordless login
- ✅ **Notification emails** - Important user notifications

---

## Email Templates Available

The email service (`packages/api/src/lib/email.ts`) includes:

1. `sendVerificationEmail()` - Email verification
2. `sendPasswordResetEmail()` - Password reset
3. `sendWelcomeEmail()` - Welcome message
4. `sendMagicLinkEmail()` - Passwordless login
5. `sendNotificationEmail()` - Custom notifications

---

## Domain Verification (Production)

**For Development:**
- Use `onboarding@resend.dev` (no verification needed)
- Works immediately

**For Production:**
1. Go to [resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `settler.dev`)
3. Add DNS records (TXT, MX) as instructed
4. Wait for verification (can take up to 24 hours)
5. Update `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

---

## Testing

After setting the variable, test email sending:

```typescript
import { sendVerificationEmail } from '@/lib/email';

// Test email
await sendVerificationEmail(
  'test@example.com',
  'https://your-app.com/verify?token=abc123',
  'Test User'
);
```

Check Resend dashboard → **Logs** to see delivery status.

---

## Security ⚠️

**Never commit this to git!** Only store in Vercel environment variables.

The API key starts with `re_` - this is your Resend API key format.

---

## Free Tier Limits

- **100 emails/day**
- **3,000 emails/month**
- Perfect for testing and early production

Upgrade to paid plan ($20/month for 50K emails) when you scale.
