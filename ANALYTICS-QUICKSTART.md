# Analytics Quick Start - Track Your Website Visitors

## ✅ What's Already Done

Your website now has **PostHog analytics** fully integrated! Here's what's tracking:

### Automatic Tracking:
- ✅ **Page views** - Every page visit
- ✅ **Button clicks** - All CTA and navigation clicks
- ✅ **Landing page views** - When someone visits your homepage
- ✅ **Dashboard views** - When logged-in users access their dashboard

### Ready to Track (Just Add API Key):
- Form starts and completions
- Document generations
- User signups and logins
- Document downloads
- Template selections

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Free PostHog Account
1. Go to **https://posthog.com**
2. Click **"Get started - free"**
3. Sign up (use GitHub for fastest signup)
4. Create project named: "Legal Doc Automation"

### Step 2: Get Your API Key
1. After signup, you'll see **"Project API Key"**
2. Copy the key (starts with `phc_`)
3. Or find it later: **Settings → Project → Project API Key**

### Step 3: Add API Key to Your Project
1. Open `.env.local` file in your project
2. Find this line:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=your-posthog-api-key-here
   ```
3. Replace `your-posthog-api-key-here` with your actual key:
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_abc123...
   ```
4. Save the file

### Step 4: Restart Your Development Server
```bash
# Stop the server (Ctrl+C in terminal)
npm run dev
```

### Step 5: Test It!
1. Open **http://localhost:3000** in your browser
2. Click around your website
3. Go back to PostHog dashboard
4. Click **"Activity"** in left sidebar
5. **You should see events coming in!** 🎉

---

## 📊 What You'll See in PostHog

### Live Events in "Activity" Tab:
- `Landing Page Viewed` - Someone visited homepage
- `CTA Clicked` - Someone clicked a button
- `Dashboard Viewed` - User accessed dashboard
- `$pageview` - General page view
- `$autocapture` - Button/link clicks

### Create Your First Dashboard:

1. **Click "Insights"** in PostHog
2. **Click "New insight"**
3. **Select "Trends"**
4. **Choose event:** `$pageview`
5. **Group by:** Day
6. **Save it:** "Daily Visitors"

Now you can see how many people visit your website each day!

---

## 🔍 Key Metrics to Watch

### Week 1:
- **Unique visitors per day** - How many people visit
- **Page views** - Total pages viewed
- **Most visited pages** - What are people looking at?

### Week 2-4:
- **Conversion rate** - Visitors → Signups
- **Most popular templates** - Which forms do people use?
- **Return visitors** - How many people come back?

### Month 2+:
- **Documents generated per user**
- **Average session duration**
- **Traffic sources** - Where do visitors come from?

---

## 📱 How to View Analytics Anytime

### On Your Computer:
1. Go to **https://app.posthog.com**
2. Login to your account
3. See all your metrics and charts

### Create Insights:
- **"Insights"** → Create custom charts
- **"Dashboards"** → Combine multiple charts
- **"Activity"** → See live events as they happen

---

## 🎯 Common Questions

**Q: Is PostHog free?**
A: Yes! Free tier includes 1 million events/month (more than enough to start). No credit card required.

**Q: Do I need to add tracking code to every page?**
A: No! It's already integrated. Just add your API key and everything works automatically.

**Q: Can I see who visits my site?**
A: Yes! PostHog shows:
- Number of unique visitors
- Which pages they visit
- What they click
- How long they stay
- Where they come from

**Q: Is it GDPR compliant?**
A: Yes! PostHog is fully GDPR compliant. You can add a cookie consent banner later if needed.

**Q: What if I don't add an API key?**
A: The website will work fine, but you won't see any visitor data. Analytics won't track anything until you add the key.

---

## 🛠 Files Created

Here's what was added to your project:

1. **`lib/analytics.ts`** - Analytics utility functions
2. **`components/providers/AnalyticsProvider.tsx`** - Auto-tracks page views
3. **`components/analytics/DashboardTracker.tsx`** - Tracks dashboard visits
4. **`.env.local`** - Added PostHog configuration (you need to add your key)
5. **`ANALYTICS-SETUP.md`** - Detailed setup guide
6. **`ANALYTICS-QUICKSTART.md`** - This file!

---

## ✨ Next Steps

### Immediate (Do Now):
1. ✅ Sign up for PostHog (5 min)
2. ✅ Add API key to `.env.local`
3. ✅ Restart dev server
4. ✅ Visit your website and check PostHog Activity tab

### This Week:
1. Create your first dashboard in PostHog
2. Set up a daily visitor chart
3. Share PostHog access with team members (Settings → Organization → Members)

### This Month:
1. Track conversion funnels (Visit → Signup → Document)
2. Identify top-performing pages
3. Monitor user retention
4. Track which templates are most popular

---

## 💡 Pro Tips

1. **Bookmark PostHog dashboard** - Check it daily to see growth
2. **Set up email reports** - Get weekly analytics via email (PostHog Settings)
3. **Use real data** - Deploy to production ASAP to get real visitor data
4. **Create weekly goals** - Track progress toward visitor/signup targets

---

## 🆘 Need Help?

- **Detailed Guide**: See `ANALYTICS-SETUP.md` for advanced setup
- **PostHog Docs**: https://posthog.com/docs
- **PostHog Tutorials**: https://posthog.com/tutorials
- **PostHog Support**: Very responsive in-app chat

---

## ✅ Summary

**What you have:**
- Professional analytics tracking
- Automatic page view and click tracking
- Real-time visitor monitoring
- Free forever (up to 1M events/month)

**What you need to do:**
1. Sign up for PostHog (free)
2. Add API key to `.env.local`
3. Restart server
4. Watch the visitors roll in! 📈

**Time to complete:** 5-10 minutes

---

**You're now tracking every visitor, every click, and every conversion. Time to see your growth in real-time!**
