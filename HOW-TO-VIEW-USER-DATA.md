# How to View User Data & Form Submissions

## 🎯 What You Can See

Your platform stores several types of data:
1. **Generated documents** - Documents users create
2. **Form data** - Information users entered
3. **User profiles** - Account information
4. **Organizations** - Company/user accounts

---

## 📊 Option 1: View in Supabase Dashboard (Easiest)

### Step 1: Access Your Database

1. Go to **https://supabase.com/dashboard**
2. Sign in to your account
3. Click on your project: **svfjstczpuvnclvsmhks**
4. Click **Table Editor** (left sidebar - looks like a table icon)

### Step 2: View Generated Documents

1. In the Table Editor, select **`generated_documents`** table
2. You'll see all documents users have created

**Columns you'll see:**
- `id` - Document ID
- `user_id` - Who created it
- `organization_id` - Their organization
- `template_type` - Which form (custody-agreement, divorce-petition, etc.)
- `case_data` - The form data they entered (click to expand JSON)
- `generated_content` - The final document text
- `status` - draft, completed, or archived
- `created_at` - When it was created
- `updated_at` - Last modified

**To view a document:**
1. Click on any row
2. Click **Expand** (⬜ icon) to see full details
3. Click on `case_data` to see all the form fields they filled out
4. Click on `generated_content` to see the full document text

### Step 3: View User Profiles

1. Select **`user_profiles`** table
2. You'll see all registered users

**Columns:**
- `id` - User ID
- `email` - User's email
- `full_name` - User's name
- `organization_id` - Their organization
- `role` - owner, admin, or member
- `created_at` - When they signed up

### Step 4: View Organizations

1. Select **`organizations`** table
2. You'll see all organizations (accounts)

**Columns:**
- `id` - Organization ID
- `name` - Organization name
- `subscription_tier` - trial, basic, or pro
- `subscription_status` - active, cancelled, or expired
- `trial_ends_at` - When trial expires
- `created_at` - When created

---

## 📈 Option 2: View Analytics in PostHog

Once you set up PostHog (from HOW-TO-VIEW-ANALYTICS.md):

### What You Can Track:

**Form Starts:**
- How many users started each form
- Which forms are most popular
- Where users drop off

**Form Completions:**
- How many users completed the form
- Completion rate by template
- Time to complete

**Document Generations:**
- How many documents generated
- Success rate
- Generation time

### Create Form Analytics:

1. Go to **https://app.posthog.com**
2. Click **Insights** → **New insight**
3. Create these insights:

**Insight 1: Most Popular Templates**
- Event: `Template Selected`
- Break down by: `template_name`
- Shows which forms users choose most

**Insight 2: Form Completion Rate**
- Create funnel:
  - Step 1: `Form Started`
  - Step 2: `Form Completed`
- Shows how many users finish forms

**Insight 3: Document Generations per Day**
- Event: `Document Generated`
- Group by: Day
- Shows daily usage

---

## 🔍 Option 3: Build an Admin Dashboard

If you want a custom view, I can help you build an admin dashboard. Here's what it would show:

### Features:
- ✅ List of all documents
- ✅ Search by user email or template
- ✅ View document details
- ✅ Download documents
- ✅ See user activity
- ✅ Usage statistics

Would you like me to build this? It would be a new page at `/admin/documents` that only you can access.

---

## 📋 Option 4: Export Data

### Export from Supabase:

1. Go to **Table Editor**
2. Select **`generated_documents`** table
3. Click **Download CSV** (top right)
4. Opens in Excel/Google Sheets

### What You Get:
- All document data
- User information
- Timestamps
- Form data (in JSON format)

You can then:
- Analyze in Excel
- Create reports
- Track trends
- Calculate metrics

---

## 🎯 Quick Access Guide

### To See Total Document Count:

**Method 1: Supabase SQL Editor**
1. Go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Paste:
```sql
SELECT COUNT(*) as total_documents
FROM generated_documents;
```
4. Click **Run**
5. Shows total documents generated

**Method 2: By Template Type**
```sql
SELECT
  template_type,
  COUNT(*) as count
FROM generated_documents
GROUP BY template_type
ORDER BY count DESC;
```

Shows:
```
custody-agreement: 45 documents
divorce-petition: 32 documents
child-support: 28 documents
property-settlement: 15 documents
spousal-support: 12 documents
```

### To See Recent Documents:

```sql
SELECT
  id,
  template_type,
  created_at,
  status
FROM generated_documents
ORDER BY created_at DESC
LIMIT 20;
```

Shows the last 20 documents created.

### To See Active Users:

```sql
SELECT
  u.email,
  u.full_name,
  COUNT(d.id) as documents_created,
  MAX(d.created_at) as last_activity
FROM user_profiles u
LEFT JOIN generated_documents d ON u.id = d.user_id
GROUP BY u.id, u.email, u.full_name
ORDER BY last_activity DESC;
```

Shows:
- User email
- How many documents they've created
- When they last used the platform

---

## 💡 What to Track

### Key Metrics to Monitor:

**Daily:**
- Total documents generated today
- New signups
- Active users

**Weekly:**
- Most popular templates
- Completion rates
- User retention (do they come back?)

**Monthly:**
- Total users
- Total documents
- Growth rate
- Most used features

---

## 🔔 Set Up Notifications

Want to be notified when users create documents?

### Option 1: Email Notifications via Supabase

Create a database trigger:

```sql
-- Create function to send notification
CREATE OR REPLACE FUNCTION notify_new_document()
RETURNS TRIGGER AS $$
BEGIN
  -- Log to console (you can see in Supabase logs)
  RAISE NOTICE 'New document created: % by user %', NEW.template_type, NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_document_created
  AFTER INSERT ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_document();
```

### Option 2: PostHog Alerts

1. Go to PostHog
2. Create insight: "Documents Generated Today"
3. Click **Set Alert**
4. Alert when: Count > 10 (or any threshold)
5. Send to: Your email

---

## 📊 Sample Queries You'll Use Often

### 1. Count Documents by Status
```sql
SELECT
  status,
  COUNT(*) as count
FROM generated_documents
GROUP BY status;
```

Result:
```
completed: 87
draft: 12
archived: 5
```

### 2. Users Who Generated Most Documents
```sql
SELECT
  u.email,
  u.full_name,
  COUNT(d.id) as document_count
FROM user_profiles u
JOIN generated_documents d ON u.id = d.user_id
GROUP BY u.id, u.email, u.full_name
ORDER BY document_count DESC
LIMIT 10;
```

Shows your top 10 power users.

### 3. Documents Created This Week
```sql
SELECT COUNT(*) as this_week
FROM generated_documents
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### 4. Average Documents per User
```sql
SELECT
  ROUND(COUNT(d.id)::numeric / COUNT(DISTINCT d.user_id), 2) as avg_docs_per_user
FROM generated_documents d;
```

### 5. Conversion Rate (Signups → Document Generation)
```sql
SELECT
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT gd.user_id) as users_who_generated,
  ROUND(
    (COUNT(DISTINCT gd.user_id)::numeric / COUNT(DISTINCT up.id)) * 100,
    2
  ) as conversion_rate_percent
FROM user_profiles up
LEFT JOIN generated_documents gd ON up.id = gd.user_id;
```

Shows what % of signups actually generate documents.

---

## 🎨 Build Custom Admin Dashboard (Optional)

If you want a nice UI to view this data, I can build an admin dashboard with:

**Features:**
- 📊 Dashboard with key metrics
- 📋 List of all documents (searchable, filterable)
- 👤 User management
- 📈 Charts and graphs
- 📥 Export to CSV
- 🔍 Search by email, template, date range
- 📄 View full document content

**Would you like me to build this?**

It would be a new route: `/admin/dashboard` with authentication so only you can access it.

---

## 🚀 Quick Checklist: View Your First Document

**Do this now:**

1. [ ] Go to https://supabase.com/dashboard
2. [ ] Click your project
3. [ ] Click **Table Editor**
4. [ ] Select **`generated_documents`** table
5. [ ] See all documents users created! 🎉

If the table is empty, that means no users have generated documents yet. Once they do, you'll see them here instantly.

---

## 📱 Supabase Mobile App

Track on the go:

1. Download **Supabase** app (iOS/Android)
2. Sign in
3. Select your project
4. View tables from your phone
5. Get push notifications (if set up)

---

## 🔐 Privacy & Security

**Important notes:**

- ✅ Only you (project owner) can view this data
- ✅ Data is encrypted at rest
- ✅ Use Row Level Security (RLS) to protect user data
- ✅ Don't share screenshots of user data publicly
- ✅ Follow GDPR/privacy laws

**Users can't see each other's documents** - RLS policies ensure users only see their own data.

---

## 💬 Add User Feedback Form (Bonus)

Want to collect user feedback? I can add:

### Feedback System:

**After document generation, show:**
- "How was your experience?" (1-5 stars)
- "Any suggestions?" (text box)
- "Would you recommend us?" (Yes/No)

**Store in new table:**
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  document_id UUID REFERENCES generated_documents(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**View feedback in Supabase:**
- Same process: Table Editor → `feedback` table

Want me to add this?

---

## ✅ Summary

**Where to view user data:**

1. **Supabase Dashboard** ← START HERE
   - Table Editor → `generated_documents`
   - See all forms users submitted
   - Export to CSV

2. **PostHog Analytics**
   - Form starts/completions
   - User behavior
   - Conversion rates

3. **SQL Queries**
   - Custom reports
   - Advanced analytics
   - Calculate metrics

4. **Custom Admin Dashboard** (optional)
   - I can build this for you
   - Pretty UI with charts

---

**Next Steps:**

1. Go to Supabase now and explore the `generated_documents` table
2. Set up PostHog (from HOW-TO-VIEW-ANALYTICS.md) to track form behavior
3. Let me know if you want a custom admin dashboard built!

**Questions?** Ask me and I'll help you find the data you need! 📊
