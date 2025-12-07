-- ============================================
-- COMPREHENSIVE DIAGNOSTIC
-- Run this and show me the COMPLETE output
-- ============================================

SELECT '========== 1. CHECK pdf_url COLUMN ==========' as step;
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'generated_documents'
  AND column_name = 'pdf_url';

-- If no rows returned, column doesn't exist!

SELECT '========== 2. CHECK ALL COLUMNS ==========' as step;
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'generated_documents'
ORDER BY ordinal_position;

SELECT '========== 3. CHECK YOUR PROFILE ==========' as step;
SELECT
  up.id as user_id,
  up.email,
  up.organization_id,
  up.role,
  o.id as org_id_from_join,
  o.name as org_name,
  o.subscription_tier,
  o.subscription_status
FROM auth.users au
LEFT JOIN user_profiles up ON up.id = au.id
LEFT JOIN organizations o ON o.id = up.organization_id
ORDER BY au.created_at DESC
LIMIT 3;

SELECT '========== 4. CHECK ORGANIZATIONS ==========' as step;
SELECT
  id,
  name,
  subscription_tier,
  subscription_status,
  documents_used
FROM organizations
ORDER BY created_at DESC
LIMIT 3;

SELECT '========== 5. CHECK RLS POLICIES ON generated_documents ==========' as step;
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'generated_documents';

SELECT '========== 6. CHECK FOREIGN KEY CONSTRAINTS ==========' as step;
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'generated_documents';

SELECT '========== 7. CHECK STORAGE BUCKET ==========' as step;
SELECT
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'documents';

-- If no rows, bucket doesn't exist!

SELECT '========== 8. CHECK STORAGE POLICIES ==========' as step;
SELECT
  policyname,
  bucket_id,
  roles
FROM storage.policies
WHERE bucket_id = 'documents';

SELECT '========== 9. TRY MANUAL INSERT (THIS WILL FAIL OR SUCCEED) ==========' as step;
-- This will show the EXACT error
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  -- Get your user
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;
  SELECT organization_id INTO v_org_id FROM user_profiles WHERE id = v_user_id;

  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Org ID: %', v_org_id;

  -- Try to insert
  INSERT INTO generated_documents (
    organization_id,
    user_id,
    template_id,
    title,
    form_data,
    file_url,
    pdf_url,
    file_size,
    status
  ) VALUES (
    v_org_id,
    v_user_id,
    'custody-agreement-ca',
    'DIAGNOSTIC TEST - DELETE ME',
    '{"test": "data"}'::jsonb,
    'test/path/doc.docx',
    'test/path/doc.pdf',
    1000,
    'generated'
  ) RETURNING id INTO v_doc_id;

  RAISE NOTICE '✅ SUCCESS! Inserted document ID: %', v_doc_id;

  -- Clean up
  DELETE FROM generated_documents WHERE id = v_doc_id;
  RAISE NOTICE '✅ Cleaned up test document';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ INSERT FAILED!';
  RAISE NOTICE 'Error: %', SQLERRM;
  RAISE NOTICE 'Detail: %', SQLSTATE;
END $$;

SELECT '========== DIAGNOSTIC COMPLETE ==========' as step;
