-- Check Database Status - Run this in Supabase SQL Editor

-- 1. Check if generated_documents table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'generated_documents'
) as table_exists;

-- 2. Count total documents in generated_documents
SELECT COUNT(*) as total_documents
FROM generated_documents;

-- 3. Check if there are any documents at all (sample 5)
SELECT
  id,
  template_type,
  status,
  created_at,
  user_id
FROM generated_documents
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check user_profiles (do you have users?)
SELECT COUNT(*) as total_users
FROM user_profiles;

-- 5. Check organizations
SELECT COUNT(*) as total_organizations
FROM organizations;

-- 6. Check if documents table has different name
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%document%';

-- 7. List all tables in your database
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
