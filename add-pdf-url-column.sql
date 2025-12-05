-- Add PDF URL column to generated_documents table
-- Run this in Supabase SQL Editor

-- Add column if it doesn't exist
ALTER TABLE generated_documents
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment
COMMENT ON COLUMN generated_documents.pdf_url IS 'Storage path to generated PDF file';

-- Verify changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'generated_documents'
AND column_name = 'pdf_url';
