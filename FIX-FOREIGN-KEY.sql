-- Fix the foreign key relationship after changing template_id to TEXT

-- 1. Drop the old foreign key constraint (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'generated_documents_template_id_fkey'
    AND table_name = 'generated_documents'
  ) THEN
    ALTER TABLE generated_documents
    DROP CONSTRAINT generated_documents_template_id_fkey;
    RAISE NOTICE 'Dropped old foreign key constraint';
  END IF;
END $$;

-- 2. Recreate the foreign key with TEXT type
ALTER TABLE generated_documents
ADD CONSTRAINT generated_documents_template_id_fkey
FOREIGN KEY (template_id)
REFERENCES document_templates(id)
ON DELETE SET NULL;

-- 3. Verify it worked
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'generated_documents'
  AND kcu.column_name = 'template_id';
