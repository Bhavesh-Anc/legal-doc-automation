-- CREATE/UPDATE document_templates TABLE
-- This will add missing columns to your existing table

-- Step 1: Add missing columns if they don't exist
ALTER TABLE document_templates
ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'California';

ALTER TABLE document_templates
ADD COLUMN IF NOT EXISTS form_fields JSONB DEFAULT '{}';

ALTER TABLE document_templates
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE document_templates
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'document_templates'
ORDER BY ordinal_position;

-- If the above shows all columns including jurisdiction and form_fields,
-- you can now run: insert-templates-fixed.sql
