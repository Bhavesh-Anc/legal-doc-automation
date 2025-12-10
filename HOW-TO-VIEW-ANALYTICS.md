# How to View Your Analytics Data - Complete Guide

## 🎯 Goal
See exactly how many people visit your website, which pages they view, and what they click.

---

## Option 1: PostHog (Recommended - BEST for Product Analytics)

**Why PostHog:**
✅ Free forever (1M events/month)
✅ See real-time visitors
✅ Track conversions (visits → signups → documents)
✅ No coding required (we already integrated it)
✅ Privacy-friendly (GDPR compliant)

### Step 1: Sign Up for PostHog (3 minutes)

1. Go to **https://posthog.com**
2. Click **"Get started - free"**
3. Sign up with:
   - **GitHub** (fastest - 1 click)
   - Or email/password
4. Verify your email (check inbox)

### Step 2: Create Your Project (2 minutes)

After signup, you'll see "Create your first project":

1. **Project name:** Legal Doc Automation
2. **What are you building?** Web app
3. **Team size:** Just me (or select appropriate)
4. Click **"Create project"**

### Step 3: Get Your API Key (1 minute)

You'll see a setup screen with your API key:

1. Look for **"Project API Key"**
2. Copy the key (starts with `phc_`)
   - Example: `phc_AbCd1234EfGh5678IjKl9012MnOp3456`
3. **Save this somewhere safe** (you'll need it in next step)

**If you closed the screen:**
1. Click **Settings** (bottom left)
2. Click **Project**
3. Find **"Project API Key"**
4. Copy it

### Step 4: Add API Key to Vercel (3 minutes)

Now add the key to your live website:

1. Go to **https://vercel.com/dashboard**
2. Click your **legal-doc-automation** project
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)
5. Click **Add New**
6. Fill in:
   - **Name:** `NEXT_PUBLIC_POSTHOG_KEY`
   - **Value:** Paste your PostHog key (`phc_...`)
   - **Environment:** Check ALL three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
7. Click **Save**

### Step 5: Add PostHog Host (30 seconds)

Add one more variable:

1. Still in Vercel → Environment Variables
2. Click **Add New** again
3. Fill in:
   - **Name:** `NEXT_PUBLIC_POSTHOG_HOST`
   - **Value:** `https://app.posthog.com`
   - **Environment:** Check all three again
4. Click **Save**

### Step 6: Redeploy Your Site (2 minutes)

Vercel needs to rebuild your site with the new variables:

1. Go to **Deployments** tab (top)
2. Find your latest deployment (top of list)
3. Click the **⋮** (three dots) menu on the right
4. Click **Redeploy**
5. In the popup:
   - ✅ Check "Use existing Build Cache"
   - Click **Redeploy**
6. Wait 1-2 minutes for deployment to finish
7. You'll see ✅ when it's done

### Step 7: Test That It's Working (2 minutes)

1. Visit your live site: **https://legal-doc-automation.vercel.app**
2. Click around a few pages
3. Go back to **PostHog dashboard** (https://app.posthog.com)
4. Click **Activity** in the left sidebar
5. **You should see events appearing!** 🎉

Events you'll see:
- `$pageview` - Someone visited a page
- `Landing Page Viewed` - Someone visited homepage
- `CTA Clicked` - Someone clicked a button
- `$autocapture` - Automatic click tracking

**If you don't see events:**
- Wait 1-2 minutes (small delay is normal)
- Make sure you visited your LIVE site (not localhost)
- Check that Vercel deployment finished (green checkmark)
- Try clearing your browser cache and visiting again

---

## 📊 How to View Your Analytics

### View 1: Real-Time Activity (See Visitors RIGHT NOW)

1. Go to **https://app.posthog.com**
2. Click **Activity** (left sidebar)
3. You'll see:
   - **Live events** as they happen
   - **Who's on your site** right now
   - **What they're clicking**
   - **Which pages they visit**

**This is like watching your website in real-time!**

### View 2: Unique Visitors Chart (Daily/Weekly/Monthly)

**Create Your First Insight:**

1. Click **Insights** (left sidebar)
2. Click **New insight** (top right)
3. In the query builder:
   - Event: Select `$pageview`
   - Aggregation: Select **Unique users**
   - Group by: Select **Day**
4. Click **Save** (top right)
5. Name it: "Daily Unique Visitors"
6. ✅ Done!

**Now you can see:**
- How many unique visitors each day
- Trends over time
- Growth week-over-week

### View 3: Most Visited Pages

**Create Page Views Insight:**

1. Click **Insights** → **New insight**
2. Query builder:
   - Event: `$pageview`
   - Aggregation: **Total count**
   - Break down by: Click "Add breakdown" → Select `Current URL`
3. Click **Save**
4. Name: "Most Popular Pages"

**Shows you:**
- Which pages get the most traffic
- Is /start getting visitors?
- Are people finding your forms?

### View 4: Conversion Funnel (Visitors → Signups → Documents)

**Track your conversion rate:**

1. Click **Insights** → **New insight**
2. Select **Funnel** (top tabs)
3. Add steps:
   - **Step 1:** Event = `Landing Page Viewed`
   - **Step 2:** Event = `Signup Completed`
   - **Step 3:** Event = `Document Generated`
4. Click **Save**
5. Name: "User Conversion Funnel"

**Shows you:**
- How many visitors convert to signups
- How many signups generate documents
- Where people drop off

### View 5: Traffic Sources (Where do visitors come from?)

1. Click **Insights** → **New insight**
2. Query builder:
   - Event: `$pageview`
   - Aggregation: **Unique users**
   - Break down by: `$referring_domain`
3. Click **Save**
4. Name: "Traffic Sources"

**Shows you:**
- Reddit traffic (reddit.com)
- Google traffic (google.com)
- Direct traffic (none)
- Which sources convert best

---

## 📈 Create Your Main Dashboard

**Combine all insights in one view:**

1. Click **Dashboards** (left sidebar)
2. Click **New dashboard**
3. Name: "Product Metrics"
4. Click **Add insight**
5. Select the insights you created:
   - Daily Unique Visitors
   - Most Popular Pages
   - User Conversion Funnel
   - Traffic Sources
6. Arrange them by dragging
7. Click **Save**

**Now you have a beautiful dashboard showing:**
- Total visitors
- Growth over time
- Most popular pages
- Conversion rates
- Where traffic comes from

**Bookmark this dashboard!** Check it daily to see your growth.

---

## Option 2: Vercel Analytics (Simpler, Less Features)

If you want something simpler (but less powerful):

### Enable Vercel Analytics:

1. Go to **https://vercel.com/dashboard**
2. Click your project
3. Click **Analytics** tab (top)
4. Click **Enable Web Analytics**
5. That's it!

**What you get:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Geographic data

**What you DON'T get:**
- ❌ Event tracking (button clicks, signups)
- ❌ Conversion funnels
- ❌ User paths
- ❌ Real-time activity

**Cost:** Free for basic, $10/month for more data

---

## Option 3: Google Analytics 4 (Most Popular)

If you prefer Google Analytics:

### Setup (10 minutes):

1. Go to **https://analytics.google.com**
2. Create account
3. Create property: "Legal Doc Automation"
4. Get your **Measurement ID** (starts with `G-`)
5. Add to Vercel environment variables:
   - Name: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - Value: Your G- ID
6. Add tracking code to `app/layout.tsx` (I can help with this if needed)

**Pros:**
✅ Most popular analytics tool
✅ Familiar to everyone
✅ Deep data analysis

**Cons:**
❌ Complex setup
❌ Slower (not real-time)
❌ Privacy concerns (some users block it)

---

## 🎯 Which Analytics Should You Use?

**My Recommendation: Start with PostHog**

**Reason:**
- ✅ Easiest to set up (we already integrated it)
- ✅ Best for product analytics (tracks everything you need)
- ✅ Real-time data (see visitors NOW)
- ✅ Free forever (1M events = ~50,000 visitors/month)
- ✅ Privacy-friendly (GDPR compliant)

**Later, you can add:**
- Vercel Analytics (for simple page view counts)
- Google Analytics (if investors/partners want it)

Most startups use PostHog → it's the best for your use case.

---

## 🔍 Common Questions

### Q: I set up PostHog but don't see any data?

**Check:**
1. Did you visit your LIVE site (legal-doc-automation.vercel.app)?
   - Localhost won't show (analytics disabled in development)
2. Did Vercel redeploy finish? (Should see green checkmark)
3. Wait 1-2 minutes (small delay is normal)
4. Clear browser cache and visit again
5. Check PostHog Activity tab (not Insights tab)

### Q: How do I know if it's working?

**Test:**
1. Visit https://legal-doc-automation.vercel.app
2. Open PostHog → Activity tab
3. Within 30 seconds, you should see events appear
4. Look for `$pageview` or `Landing Page Viewed`

### Q: Can I see who the visitors are?

**Yes and no:**
- ✅ You can see: Number of users, what they click, which pages they visit
- ❌ You can't see: Names, emails (unless they log in)

After someone logs in:
- You can identify them by email
- See their full journey
- Track their document generations

### Q: How much does PostHog cost?

**Free tier:**
- 1 million events/month (plenty for first 6+ months)
- All features included
- Unlimited team members

**You'll need to pay when:**
- You exceed 1M events/month (~50,000 visitors/month)
- This won't happen for at least 3-6 months

### Q: Is this legal/GDPR compliant?

**Yes!**
- PostHog is GDPR compliant by default
- No cookies required (uses localStorage)
- Users can opt out
- Data stored securely

You should still:
- Add a Privacy Policy to your site
- Mention analytics in your Terms of Service

---

## ✅ Quick Setup Checklist

**Do this RIGHT NOW (10 minutes total):**

- [ ] Sign up for PostHog (https://posthog.com)
- [ ] Create project "Legal Doc Automation"
- [ ] Copy your API key (starts with `phc_`)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Add `NEXT_PUBLIC_POSTHOG_KEY` = your key
- [ ] Add `NEXT_PUBLIC_POSTHOG_HOST` = https://app.posthog.com
- [ ] Redeploy your site (Deployments → Redeploy)
- [ ] Wait 2 minutes for deployment
- [ ] Visit your live site
- [ ] Check PostHog Activity tab
- [ ] See events! 🎉

**Then create dashboards:**

- [ ] Create "Daily Unique Visitors" insight
- [ ] Create "Most Popular Pages" insight
- [ ] Create "User Conversion Funnel" insight
- [ ] Create "Traffic Sources" insight
- [ ] Add all to dashboard
- [ ] Bookmark dashboard

**Total time: 15 minutes**

---

## 📱 PostHog Mobile App

**Track on the go:**

1. Download PostHog app:
   - iOS: https://apps.apple.com/app/posthog/id1625266206
   - Android: https://play.android.com/store/apps/details?id=com.posthog

2. Login with your account

3. **See real-time visitors on your phone!**

Great for checking stats while you're out.

---

## 🚀 Next Steps

**After setup:**

1. **Post on Reddit** (use the posts from REDDIT-POSTS-READY.md)
2. **Watch analytics in real-time** as traffic comes in
3. **Track which posts drive the most traffic**
4. **Optimize based on data**:
   - Which pages do people visit?
   - Where do they drop off?
   - Which traffic sources convert best?

**Analytics = Growth**

You can't improve what you don't measure. Now you can measure everything! 📊

---

## 🆘 Need Help?

**If you get stuck:**

1. **Check PostHog docs:** https://posthog.com/docs
2. **PostHog support:** Very responsive in-app chat
3. **Ask me:** I can help troubleshoot

**Most common issue:** Forgot to redeploy Vercel after adding environment variables. Just redeploy and wait 2 minutes!

---

**Ready to see your analytics? Follow the steps above and you'll be tracking visitors in 10 minutes!** 🎉
