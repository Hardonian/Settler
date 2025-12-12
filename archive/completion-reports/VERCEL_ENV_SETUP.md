# How to Add Environment Variables to Vercel

## Method 1: Vercel Dashboard (Easiest)

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Log in to your account

2. **Select Your Project**
   - Click on your Settler project

3. **Go to Settings**
   - Click **"Settings"** tab at the top

4. **Open Environment Variables**
   - Click **"Environment Variables"** in the left sidebar

5. **Add Resend API Key**
   - Click **"Add New"** button
   - Fill in:
     - **Key:** `RESEND_API_KEY`
     - **Value:** `re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp`
     - **Environment:** Select all (Production, Preview, Development)
   - Click **"Save"**

6. **Add Other Resend Variables**
   - Click **"Add New"** again
     - **Key:** `RESEND_FROM_EMAIL`
     - **Value:** `onboarding@resend.dev`
     - **Environment:** All
   - Click **"Save"**

   - Click **"Add New"** again
     - **Key:** `RESEND_FROM_NAME`
     - **Value:** `Settler`
     - **Environment:** All
   - Click **"Save"**

7. **Add Redis URL**
   - Click **"Add New"**
     - **Key:** `REDIS_URL`
     - **Value:** `rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379`
     - **Environment:** All
   - Click **"Save"**

8. **Redeploy (Optional but not required - Vercel will use new vars on next deploy)
   - Go to **"Deployments"** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**
   - Or just wait for next deployment

---

## Method 2: Vercel CLI (If You Have It)

### Install Vercel CLI (if not installed):
```bash
npm i -g vercel
```

### Login:
```bash
vercel login
```

### Add Environment Variables:
```bash
# Resend API Key
vercel env add RESEND_API_KEY production
# Paste: re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp
# Press Enter

vercel env add RESEND_FROM_EMAIL production
# Paste: onboarding@resend.dev
# Press Enter

vercel env add RESEND_FROM_NAME production
# Paste: Settler
# Press Enter

# Redis URL
vercel env add REDIS_URL production
# Paste: rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379
# Press Enter
```

### Pull Environment Variables (for local development):
```bash
vercel env pull .env.local
```

---

## Quick Copy-Paste List

Add these to Vercel Dashboard → Settings → Environment Variables:

```bash
RESEND_API_KEY=re_jD36Bjud_DcRF2FJuajKNrPVVTy8pQsYp
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=Settler
REDIS_URL=rediss://default:AVtkAAIncDJjZmUxNTlhNmMyMjI0YmNjYTk5YjY4YzI2YzEyZjUyN3AyMjMzOTY@pretty-buck-23396.upstash.io:6379
```

---

## Verify Variables Are Set

After adding, you can verify:

1. **In Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - You should see all variables listed

2. **In Your Code:**
   - Variables will be available as `process.env.RESEND_API_KEY`, etc.
   - They're automatically injected at build/runtime

3. **Test Email Sending:**
   - Deploy your app
   - Trigger a sign-up or password reset
   - Check Resend dashboard → Logs to see if email was sent

---

## Important Notes

- ✅ Variables are encrypted and secure in Vercel
- ✅ They're available at runtime (not in git)
- ✅ You can set different values for Production, Preview, Development
- ⚠️ After adding variables, you may need to redeploy for them to take effect
- ⚠️ Never commit these values to git!

---

## Troubleshooting

**Variable not working?**
- Check spelling (case-sensitive)
- Make sure environment is selected (Production/Preview/Development)
- Redeploy after adding variables
- Check Vercel build logs for errors

**Can't see variables?**
- Make sure you're logged in to correct Vercel account
- Check you're in the correct project
- Refresh the page
