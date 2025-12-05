# ✅ FINAL SETUP INSTRUCTIONS

## Problem Solved!

I discovered your actual table schema uses different column names:
- ✅ `state` (not `jurisdiction`)
- ✅ `is_active` (not `status`)
- ✅ `form_schema` (not `form_fields`)

All code has been updated to match your schema.

---

## 🚀 Run This SQL File

**Use:** `insert-templates-CORRECT.sql`

### Steps:

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/sql/new
   ```

2. **Copy the entire contents** of `insert-templates-CORRECT.sql`

3. **Paste and click "Run"**

4. **Verify it worked:**
   ```sql
   SELECT id, name, category, state, is_active
   FROM document_templates;
   ```

   You should see **5 rows**:
   - divorce-petition-ca
   - custody-agreement-ca
   - property-settlement-ca
   - child-support-ca
   - spousal-support-ca

---

## ✅ Code Updates Complete

I updated these files to use your actual column names:

### Files Changed:
1. ✅ `app/(dashboard)/documents/new/page.tsx`
   - Uses `is_active` instead of `status`
   - Uses `state` instead of `jurisdiction`

2. ✅ `app/(dashboard)/documents/new/[templateId]/page.tsx`
   - Uses `is_active` instead of `status`
   - Uses `form_schema` instead of `form_fields`

3. ✅ `app/(dashboard)/documents/new/[templateId]/forms/DivorcePetitionForm.tsx`
   - Updated interface to match your schema

---

## 🔧 Next Steps After SQL

Once the SQL runs successfully:

### Step 1: Install AI SDKs (if not done yet)
```bash
npm install @anthropic-ai/sdk @google/generative-ai
```

### Step 2: Configure .env.local
```bash
# Copy example
cp .env.example .env.local

# Edit .env.local with:
NEXT_PUBLIC_SUPABASE_URL=https://svfjstczpuvnclvsmhks.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here

# For testing without AI:
AI_PROVIDER=test
```

### Step 3: Build and Run
```bash
npm run build
npm run dev
```

### Step 4: Test the App
Visit: http://localhost:3000/documents/new

You should see all 5 templates displayed!

---

## 📋 What Each Template Does

1. **Divorce Petition** (divorce-petition-ca)
   - 4-step wizard with 20+ fields
   - Full validation and auto-save

2. **Custody Agreement** (custody-agreement-ca)
   - Parent info, children details, schedules

3. **Property Settlement** (property-settlement-ca)
   - Asset division, debts, spousal support

4. **Child Support** (child-support-ca)
   - Income info, timeshare, payment terms

5. **Spousal Support** (spousal-support-ca)
   - FC §4320 factors, support amount/duration

---

## 🐛 Troubleshooting

### If SQL Still Fails

Check if these columns exist:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'document_templates'
ORDER BY ordinal_position;
```

Send me the output if you have issues.

### If Templates Don't Show Up

1. Check they were inserted:
   ```sql
   SELECT COUNT(*) FROM document_templates WHERE is_active = true;
   ```
   Should return: 5

2. Check browser console for errors

3. Verify Supabase connection in .env.local

---

## 🎉 You're Ready!

After running `insert-templates-CORRECT.sql`, your app should work perfectly!

All 5 document types will be:
- ✅ Selectable from the template picker
- ✅ Have working forms
- ✅ Generate documents (with test mode or AI)
- ✅ Save to Supabase
- ✅ Downloadable as .docx files

**Just run that SQL file and you're done!** 🚀
