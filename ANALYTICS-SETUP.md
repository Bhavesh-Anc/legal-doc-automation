# Analytics Setup Guide

## Overview

Your platform now has **PostHog analytics** integrated to track:
- **Visitor counts** - How many people visit your website
- **Page views** - Which pages users visit
- **Form interactions** - Which forms users start and complete
- **Document generations** - When users generate documents
- **Conversion tracking** - Signups, logins, downloads
- **User behavior** - Clicks, navigation patterns

## Quick Start

### 1. Sign Up for PostHog (Free)

1. Go to **https://posthog.com**
2. Click **"Get started - free"**
3. Create an account (GitHub login recommended)
4. Create a new project:
   - Name: "Legal Doc Automation"
   - Select "Web" as platform

### 2. Get Your API Key

After creating your project:

1. Go to **Settings** (bottom left)
2. Click **Project**
3. Under **"Project API Key"**, copy your key
   - It looks like: `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 3. Add to Environment Variables

Open `.env.local` and update:

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_actual_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Note**: If you're using PostHog Cloud (US), use `https://app.posthog.com`. If you're using PostHog Cloud (EU), use `https://eu.posthog.com`.

### 4. Restart Development Server

```bash
npm run dev
```

### 5. Verify It's Working

1. Open your website: **http://localhost:3000**
2. Go to PostHog dashboard
3. Click **"Activity"** in the left sidebar
4. You should see events coming in:
   - `Landing Page Viewed`
   - `$pageview`
   - `CTA Clicked`

**🎉 That's it! Analytics are now tracking.**

---

## What's Being Tracked

### Automatic Tracking (No Code Needed)
PostHog automatically tracks:
- ✅ **Page views** - Every page user visits
- ✅ **Clicks** - All button and link clicks
- ✅ **Form submissions** - When forms are submitted
- ✅ **Session duration** - How long users stay

### Custom Events (Already Implemented)
We've added custom tracking for:

#### Landing Page
- `Landing Page Viewed` - When someone visits homepage
- `CTA Clicked` - Which buttons users click (with location data)

#### Dashboard
- `Dashboard Viewed` - When user accesses dashboard

#### Forms (Ready to Add)
- `Form Started` - When user begins filling a form
- `Form Completed` - When user submits a form
- `Form Abandoned` - When user leaves partially filled form

#### Authentication
- `Signup Started` - When signup form opened
- `Signup Completed` - When user creates account
- `Login Started` - When login form opened
- `Login Completed` - When user logs in
- `Logout Completed` - When user logs out

#### Documents
- `Document Generated` - When AI generates a document
- `Document Downloaded` - When user downloads (PDF/DOCX)
- `Document Shared` - When user shares a document
- `Document Edited` - When user edits a document

---

## Viewing Your Analytics

### Real-Time Activity
1. Go to PostHog dashboard
2. Click **"Activity"** tab
3. See live events as they happen

### Insights Dashboard
1. Click **"Insights"**
2. Create charts:
   - **Unique visitors per day**
   - **Signups per week**
   - **Most popular templates**
   - **Conversion funnel: Visit → Signup → Document**

### Common Metrics to Track

#### Week 1 Focus:
- **Unique visitors** - How many people visit
- **Page views** - Total pages viewed
- **Form starts** - How many users begin forms
- **Signups** - New account creations
- **Conversion rate** - Visitors → Signups

#### Month 1 Focus:
- **Documents generated** - Total documents created
- **Documents per user** - Average usage
- **Template popularity** - Which forms are most used
- **Return rate** - % users who come back

---

## Creating Your First Dashboard

### Step 1: Create Insight for Unique Visitors

1. Go to **"Insights"** → Click **"New insight"**
2. Select event: `$pageview`
3. Select "Unique users"
4. Group by: Day
5. Save as: "Daily Unique Visitors"

### Step 2: Create Signup Funnel

1. Click **"New insight"** → Select **"Funnel"**
2. Add steps:
   - Step 1: `Landing Page Viewed`
   - Step 2: `Form Started`
   - Step 3: `Signup Completed`
   - Step 4: `Document Generated`
3. Save as: "Conversion Funnel"

This shows you where users drop off.

### Step 3: Create Template Popularity Chart

1. Click **"New insight"** → Select **"Trends"**
2. Select event: `Template Selected`
3. Break down by: `template_name`
4. Group by: Week
5. Save as: "Most Popular Templates"

### Step 4: Create Dashboard

1. Click **"Dashboards"** → **"New dashboard"**
2. Name: "Product Metrics"
3. Add your saved insights
4. Arrange and resize

**Your dashboard is now live!**

---

## Advanced: Adding More Tracking

### Example: Track Template Selection

In your template selection page:

```typescript
import { analytics } from '@/lib/analytics'

function handleTemplateClick(templateId: string, templateName: string) {
  analytics.templateSelected(templateId, templateName)
  // ... rest of your code
}
```

### Example: Track Form Progress

```typescript
import { analytics } from '@/lib/analytics'

// When form loads
useEffect(() => {
  analytics.formStarted('divorce-petition', 'Divorce Petition')
}, [])

// When form submits
function handleSubmit(data) {
  const completionTime = Date.now() - startTime
  analytics.formCompleted('divorce-petition', 'Divorce Petition', completionTime / 1000)
  // ... rest of your code
}
```

### Example: Track Document Download

```typescript
import { analytics } from '@/lib/analytics'

function handleDownload(documentId: string, format: 'pdf' | 'docx') {
  analytics.documentDownloaded(documentId, format)
  // ... trigger download
}
```

---

## Available Analytics Functions

All available in `lib/analytics.ts`:

```typescript
import { analytics } from '@/lib/analytics'

// Landing page
analytics.landingPageViewed()
analytics.ctaClicked('Button Text', 'location')

// Forms
analytics.formStarted(templateId, templateName)
analytics.formCompleted(templateId, templateName, completionTimeSeconds)
analytics.formAbandoned(templateId, progressPercentage)

// Auth
analytics.signupStarted()
analytics.signupCompleted('password' | 'magic_link')
analytics.loginCompleted('password' | 'magic_link')
analytics.logoutCompleted()

// Documents
analytics.documentGenerated(templateId, templateName, generationTimeSeconds)
analytics.documentDownloaded(documentId, 'pdf' | 'docx')
analytics.documentShared(documentId)
analytics.documentEdited(documentId)

// Dashboard
analytics.dashboardViewed()
analytics.templateSelected(templateId, templateName)

// Conversions
analytics.trialStarted()
analytics.upgradeViewed()
analytics.upgradeCompleted(plan, amount)

// Engagement
analytics.helpArticleViewed(articleTitle)
analytics.feedbackSubmitted(rating, feedbackText)
analytics.exitIntentShown()
analytics.exitIntentClosed()
```

---

## Tracking Users

### Identify User (After Login)

This associates events with a specific user:

```typescript
import { identifyUser } from '@/lib/analytics'

// After user logs in
identifyUser(user.id, {
  email: user.email,
  name: user.full_name,
  organization: user.organization_id,
  subscription_tier: user.organizations.subscription_tier,
})
```

### Reset User (After Logout)

```typescript
import { resetUser } from '@/lib/analytics'

// After user logs out
resetUser()
```

---

## Privacy & GDPR Compliance

PostHog is GDPR-compliant out of the box. But you should:

1. **Add Privacy Policy** to your website
2. **Add Cookie Consent** banner (optional but recommended)
3. **Allow Users to Opt Out** (PostHog provides this automatically)

### Disable Analytics in Development

Already configured! Analytics only run in production:

```typescript
// lib/analytics.ts
loaded: (posthog) => {
  if (process.env.NODE_ENV === 'development') {
    posthog.opt_out_capturing() // Disabled in dev
  }
}
```

To test in development, comment out this section.

---

## Troubleshooting

### Not Seeing Events?

1. **Check API key is set**:
   ```bash
   echo $NEXT_PUBLIC_POSTHOG_KEY
   ```
   Should show your key starting with `phc_`

2. **Check browser console**:
   - Open DevTools → Console
   - Look for PostHog initialization message
   - Check for errors

3. **Check PostHog status**:
   - Go to PostHog dashboard
   - Click your name → Settings → Project
   - Verify project is active

4. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

5. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

### Events Not Showing in Dashboard?

- Wait 1-2 minutes (small delay is normal)
- Check **Activity** tab for real-time events
- Verify event names match exactly (case-sensitive)

### Still Not Working?

1. Check PostHog docs: https://posthog.com/docs
2. Check PostHog status: https://status.posthog.com
3. Contact PostHog support (very responsive)

---

## Recommended Dashboards

### Dashboard 1: Acquisition Metrics
- Unique visitors (daily)
- Traffic sources (referrers)
- Landing page views
- CTA click rate

### Dashboard 2: Engagement Metrics
- Form starts
- Form completion rate
- Template popularity
- Average session duration

### Dashboard 3: Conversion Metrics
- Signups (daily)
- Conversion funnel (Visit → Form → Signup)
- Documents generated per user
- Document downloads

### Dashboard 4: Retention Metrics
- Day 1, 7, 30 retention
- Returning users %
- Documents per returning user
- Active users (daily/weekly/monthly)

---

## Cost & Limits

### PostHog Free Tier:
- ✅ **1 million events/month** - More than enough to start
- ✅ **Unlimited users**
- ✅ **Unlimited projects**
- ✅ **1 year data retention**
- ✅ **All features** (dashboards, funnels, retention, etc.)

### When to Upgrade:
- If you exceed 1M events/month (unlikely in first 6 months)
- If you need >1 year data retention
- If you want advanced features (experimentation, feature flags)

**For most startups, free tier is sufficient for the first year.**

---

## Next Steps

1. ✅ Sign up for PostHog
2. ✅ Add API key to `.env.local`
3. ✅ Restart dev server
4. ✅ Verify events in PostHog Activity tab
5. ✅ Create your first dashboard
6. 📊 Start tracking and improving!

---

## Questions?

- PostHog Docs: https://posthog.com/docs
- PostHog Community: https://posthog.com/questions
- Video tutorials: https://posthog.com/tutorials

**You now have professional-grade analytics tracking every visitor and conversion!**
