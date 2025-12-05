# 🚀 Deployment Guide - Go Live in 30 Minutes

**Goal**: Deploy your legal document automation platform to production

**Stack**:
- **Hosting**: Vercel (Free tier - perfect for Next.js)
- **Database**: Supabase (already set up)
- **Domain**: vercel.app subdomain (free) or custom domain

---

## ⚡ Quick Deployment (15-20 minutes)

### Step 1: Prepare Your Code (5 minutes)

**1.1 Commit Everything to Git**

```bash
# Check what's changed
git status

# Add all new files
git add .

# Commit with a message
git commit -m "Add 5 quick wins for conversion optimization

- Form-first flow (no signup required)
- Live document counter
- Powered By footer in documents
- Exit intent popup
- Feedback form after generation"

# Push to GitHub (or create repo if you haven't)
git push origin master
```

**If you don't have a GitHub repo yet:**

```bash
# Create a new repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/legal-doc-automation.git
git branch -M master
git push -u origin master
```

---

### Step 2: Deploy to Vercel (10 minutes)

**2.1 Sign Up / Login to Vercel**

1. Go to: https://vercel.com
2. Click "Sign Up" (use your GitHub account - easiest)
3. Authorize Vercel to access your GitHub repos

**2.2 Import Your Project**

1. Click "Add New..." → "Project"
2. Find "legal-doc-automation" in your repo list
3. Click "Import"

**2.3 Configure Project**

- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `./` (leave as default)
- **Build Command**: `npm run build` (auto-filled)
- **Output Directory**: `.next` (auto-filled)

**2.4 Add Environment Variables**

Click "Environment Variables" and add these:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://svfjstczpuvnclvsmhks.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI (if using)
OPENAI_API_KEY=your-openai-key-here

# Anthropic (if using)
ANTHROPIC_API_KEY=your-anthropic-key-here

# Resend (Email - set up after deployment)
RESEND_API_KEY=your-resend-key-here

# Stripe (set up after deployment)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx

# App URL (will update after deployment)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Where to get these:**

- **Supabase Keys**: https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/settings/api
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/settings/keys

**2.5 Deploy**

1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://legal-doc-automation-xxxx.vercel.app`

**2.6 Update App URL**

1. Copy your deployment URL
2. In Vercel → Settings → Environment Variables
3. Update `NEXT_PUBLIC_APP_URL` to your real URL
4. Redeploy (Deployments tab → ... → Redeploy)

---

### Step 3: Configure Supabase (5 minutes)

**3.1 Add Vercel URL to Supabase**

1. Go to: https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/auth/url-configuration
2. Add your Vercel URL to "Site URL": `https://your-app.vercel.app`
3. Add to "Redirect URLs":
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/*` (wildcard)

**3.2 Run Database Migrations**

Go to: https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/sql/new

Run this SQL:

```sql
-- Add feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  would_recommend BOOLEAN NOT NULL,
  suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS feedback_document_id_idx ON feedback(document_id);
CREATE INDEX IF NOT EXISTS feedback_user_id_idx ON feedback(user_id);
CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert own feedback"
ON feedback FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
USING (user_id = auth.uid());
```

---

### Step 4: Test Your Deployment (5 minutes)

**4.1 Visit Your Site**

Go to: `https://your-app.vercel.app`

**4.2 Test Key Features**

✅ Homepage loads with live counter
✅ Click "Generate Free Document" → goes to `/start`
✅ Select a template → goes to `/form/[templateId]`
✅ Fill out form (should auto-save to localStorage)
✅ Click "Preview & Generate" → signup modal appears
✅ Signup/Login works
✅ Document generates successfully
✅ Feedback modal appears after 3 seconds

**4.3 Test Exit Intent**

- Move mouse to top of browser (as if leaving)
- Popup should appear

---

## 🎯 Optional: Custom Domain (10 minutes)

**Why**: `legaldocautomation.com` looks more professional than `legal-doc-automation-xxxx.vercel.app`

### Option 1: Use Vercel Domain ($20/year)

1. Go to Vercel → Settings → Domains
2. Search for available domains
3. Purchase directly through Vercel

### Option 2: Use Your Own Domain

**If you already have a domain:**

1. Go to Vercel → Settings → Domains
2. Add your domain: `legaldocautomation.com`
3. Vercel will give you DNS records
4. Add these to your domain registrar (Namecheap, GoDaddy, etc.)
5. Wait 10-60 minutes for DNS propagation

**DNS Records (example)**:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## 🔐 Optional: Set Up Email Service (Resend)

**For sending welcome emails, document notifications, trial reminders**

**Cost**: FREE up to 3,000 emails/month

### Step 1: Create Resend Account (5 min)

1. Go to: https://resend.com
2. Sign up (FREE, no credit card)
3. Verify your email

### Step 2: Add Domain (or use Resend domain)

**Option A: Use Resend's Domain (Easiest)**
- Just use their test domain for now
- Emails will work but may go to spam

**Option B: Add Your Domain (Recommended)**
1. Domains → Add Domain
2. Add `legaldocautomation.com`
3. Add DNS records they provide
4. Verify

### Step 3: Create API Key

1. API Keys → Create API Key
2. Copy the key (starts with `re_`)
3. Add to Vercel environment variables:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Step 4: Redeploy

Redeploy on Vercel to use the new environment variable

---

## 💳 Optional: Set Up Stripe (For Future Payments)

**Note**: You mentioned delaying payments until traction. You can skip this for now!

**When you're ready:**

### Step 1: Create Stripe Account

1. Go to: https://dashboard.stripe.com/register
2. Sign up (stays in test mode until you activate)

### Step 2: Get API Keys

1. Developers → API keys
2. Copy:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

### Step 3: Create Products

1. Products → Add product
2. Create "Basic Plan" - $29/month recurring
3. Copy the Price ID (starts with `price_`)
4. Create "Pro Plan" - $99/month recurring
5. Copy the Price ID

### Step 4: Set Up Webhook

1. Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-app.vercel.app/api/stripe/webhook`
3. Events to send:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret (starts with `whsec_`)

### Step 5: Add to Vercel

Add these environment variables in Vercel:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_BASIC_PRICE_ID=price_xxxxx
STRIPE_PRO_PRICE_ID=price_xxxxx
```

Redeploy.

---

## ✅ Post-Deployment Checklist

### Immediately After Deployment:

- [ ] Test signup flow
- [ ] Test form-first flow (fill form without signup)
- [ ] Generate a test document
- [ ] Verify both DOCX and PDF download
- [ ] Check "Powered By" footer in documents
- [ ] Test feedback modal appears
- [ ] Test exit intent popup
- [ ] Verify live counter shows on homepage

### Within 24 Hours:

- [ ] Add Google Analytics (optional)
- [ ] Set up Sentry error tracking (optional)
- [ ] Create first user account
- [ ] Generate first real document
- [ ] Share with friends for feedback

### Within 1 Week:

- [ ] Monitor Vercel analytics
- [ ] Check for any errors in Vercel logs
- [ ] Review Supabase database (any signups?)
- [ ] Check feedback submissions
- [ ] Iterate based on early user feedback

---

## 🐛 Common Issues & Solutions

### Issue: "Environment variable not found"

**Solution**:
1. Check Vercel → Settings → Environment Variables
2. Make sure all required variables are set
3. Redeploy

### Issue: "Failed to connect to Supabase"

**Solution**:
1. Verify Supabase URL and anon key are correct
2. Check Supabase is active (not paused)
3. Verify Vercel URL is added to Supabase redirect URLs

### Issue: "Authentication not working"

**Solution**:
1. Check Supabase → Auth → URL Configuration
2. Verify Site URL matches your Vercel URL
3. Add `/auth/callback` to redirect URLs

### Issue: "Build failed on Vercel"

**Solution**:
1. Check build logs in Vercel
2. Common issues:
   - Missing environment variables (build-time errors)
   - TypeScript errors (run `npm run build` locally first)
   - Missing dependencies (run `npm install` locally)

### Issue: "Document generation failing"

**Solution**:
1. Check you have OpenAI or Anthropic API key set
2. Verify API key has credits
3. Check Vercel function logs for errors

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard

**What to monitor**:
- **Deployments**: See all deployments, redeploy if needed
- **Analytics**: Page views, visitors, top pages
- **Functions**: API routes, execution time, errors
- **Logs**: Real-time logs, search for errors

**Access**: https://vercel.com/dashboard

### Supabase Dashboard

**What to monitor**:
- **Auth**: User signups, sessions
- **Database**: Table row counts, queries
- **Storage**: Document storage usage
- **Logs**: Database queries, errors

**Access**: https://supabase.com/dashboard

---

## 🚀 You're Live!

Congratulations! Your legal document automation platform is now live at:

**`https://your-app.vercel.app`**

### Share Your Link:

- Reddit (r/Divorce, r/custody, local subreddits)
- Facebook groups (divorce support, single parents)
- Friends and family
- Social media

### Track Results:

- Signups
- Documents generated
- Feedback submissions
- Exit intent popup shows/clicks
- Form start → completion rate

---

## 🎯 Quick Commands Reference

```bash
# Deploy updates
git add .
git commit -m "Your update message"
git push origin master
# Vercel auto-deploys from GitHub!

# View logs
vercel logs [deployment-url]

# Redeploy manually
# Go to Vercel Dashboard → Deployments → ... → Redeploy

# Check build locally before deploying
npm run build

# Run production build locally
npm run build && npm start
```

---

## 🆘 Need Help?

**Vercel Docs**: https://vercel.com/docs
**Supabase Docs**: https://supabase.com/docs
**Next.js Docs**: https://nextjs.org/docs

**Common Questions**:
- How to view logs? → Vercel Dashboard → your-project → Logs
- How to redeploy? → Deployments → ... → Redeploy
- How to add env vars? → Settings → Environment Variables
- How to set up custom domain? → Settings → Domains

---

**That's it! You're live! 🎉**

**Next**: Follow the TRACTION-STRATEGY.md guide to get your first 100 users!
