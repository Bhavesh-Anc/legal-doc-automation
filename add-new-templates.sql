-- Add 3 new document templates to document_templates table

INSERT INTO document_templates (id, name, description, category, state, is_active) VALUES
  (
    'name-change',
    'Name Change After Divorce (FL-395)',
    'Restore your former/maiden name after divorce finalization. Simple process with no court hearing required.',
    'divorce',
    'California',
    true
  ),
  (
    'stipulation-support',
    'Stipulation for Child Support (FL-350)',
    'Both parents agree on child support amount. No court hearing needed - faster approval process.',
    'custody',
    'California',
    true
  ),
  (
    'request-for-order',
    'Request for Order (FL-300)',
    'Request court orders for custody changes, support modifications, or enforcement of existing orders.',
    'custody',
    'California',
    true
  )
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Verify templates were added
SELECT id, name, category, is_active FROM document_templates ORDER BY created_at DESC LIMIT 8;
