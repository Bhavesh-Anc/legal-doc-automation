-- ============================================
-- SIMPLE DIAGNOSTIC - SAFER VERSION
-- ============================================

SELECT '========== 1. CHECK pdf_url COLUMN ==========' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
  AND column_name = 'pdf_url';

SELECT '========== 2. ALL COLUMNS IN generated_documents ==========' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
ORDER BY ordinal_position;

SELECT '========== 3. YOUR USER PROFILE ==========' as step;
SELECT
  up.id,
  up.email,
  up.organization_id,
  up.role,
  o.name as org_name
FROM auth.users au
JOIN user_profiles up ON up.id = au.id
LEFT JOIN organizations o ON o.id = up.organization_id
ORDER BY au.created_at DESC
LIMIT 1;

SELECT '========== 4. RLS POLICIES ON generated_documents ==========' as step;
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'generated_documents';

SELECT '========== 5. STORAGE BUCKETS ==========' as step;
SELECT id, name, public
FROM storage.buckets;

SELECT '========== 6. TRY INSERTING A TEST DOCUMENT ==========' as step;
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  -- Get latest user and org
  SELECT au.id, up.organization_id
  INTO v_user_id, v_org_id
  FROM auth.users au
  JOIN user_profiles up ON up.id = au.id
  ORDER BY au.created_at DESC
  LIMIT 1;

  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Org ID: %', v_org_id;

  -- Try insert
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
    'TEST - DELETE ME',
    '{"test": "data"}'::jsonb,
    'test/doc.docx',
    'test/doc.pdf',
    1000,
    'generated'
  ) RETURNING id INTO v_doc_id;

  RAISE NOTICE '✅ SUCCESS! Document ID: %', v_doc_id;

  -- Delete test doc
  DELETE FROM generated_documents WHERE id = v_doc_id;
  RAISE NOTICE '✅ Cleaned up';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ FAILED!';
  RAISE NOTICE 'ERROR: %', SQLERRM;
  RAISE NOTICE 'CODE: %', SQLSTATE;
END $$;

SELECT '========== DONE ==========' as step;
