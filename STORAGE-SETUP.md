# Storage Bucket Setup - REQUIRED

Your app uploads documents to a Supabase storage bucket called **"documents"**. This bucket must exist with the correct permissions.

## Step 1: Check if bucket exists

Go to: https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/storage/buckets

**Do you see a bucket named "documents"?**

- **YES** → Skip to Step 3 (check policies)
- **NO** → Continue to Step 2

---

## Step 2: Create the storage bucket

1. Click "Create a new bucket"
2. **Name**: `documents`
3. **Public bucket**: ❌ NO (leave unchecked - use private with signed URLs)
4. **File size limit**: Leave default or set to 10MB
5. Click "Create bucket"

---

## Step 3: Set storage policies

Click on the "documents" bucket → Click "Policies" tab → Click "New policy"

### Policy 1: Allow authenticated users to upload

```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

### Policy 2: Allow authenticated users to read their org's documents

```sql
CREATE POLICY "Users can read documents in their organization"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

### Policy 3: Allow authenticated users to update/delete

```sql
CREATE POLICY "Users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

CREATE POLICY "Users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

---

## Quick Alternative: Ultra-permissive (for testing)

If the above is too complex, use this ONE policy for ALL operations:

Go to: https://supabase.com/dashboard/project/svfjstczpuvnclvsmhks/storage/policies

Click on "documents" bucket → Policies → New policy → Use this SQL:

```sql
CREATE POLICY "allow_all_authenticated_storage"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');
```

This allows any authenticated user to upload, read, update, or delete files in the "documents" bucket.

---

## Verification

After setting up, you should see:
- ✅ A bucket named "documents"
- ✅ At least one policy allowing authenticated users to INSERT/SELECT

---

**Next**: Run the `COMPLETE-FIX.sql` script, then test document generation.
