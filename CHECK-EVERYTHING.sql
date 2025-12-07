-- Run each query ONE AT A TIME and show me the results

-- QUERY 1: Check if pdf_url column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'generated_documents'
  AND column_name = 'pdf_url';
-- If this returns NO ROWS, the column doesn't exist!

-- QUERY 2: Check your profile
SELECT
  up.id as user_id,
  up.email,
  up.organization_id,
  o.name as org_name
FROM auth.users au
JOIN user_profiles up ON up.id = au.id
LEFT JOIN organizations o ON o.id = up.organization_id
ORDER BY au.created_at DESC
LIMIT 1;
-- Shows your user info

-- QUERY 3: Check RLS policies
SELECT policyname
FROM pg_policies
WHERE tablename = 'generated_documents';
-- Shows what policies exist

-- QUERY 4: Try to insert (MOST IMPORTANT)
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_doc_id UUID;
BEGIN
  SELECT au.id, up.organization_id
  INTO v_user_id, v_org_id
  FROM auth.users au
  JOIN user_profiles up ON up.id = au.id
  ORDER BY au.created_at DESC
  LIMIT 1;

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
    'TEST',
    '{"test": "data"}'::jsonb,
    'test.docx',
    'test.pdf',
    1000,
    'generated'
  ) RETURNING id INTO v_doc_id;

  RAISE NOTICE 'SUCCESS! ID: %', v_doc_id;

  DELETE FROM generated_documents WHERE id = v_doc_id;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'INSERT FAILED: % (Code: %)', SQLERRM, SQLSTATE;
END $$;
