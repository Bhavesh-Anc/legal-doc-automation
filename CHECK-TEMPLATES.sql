-- Check what templates exist and their IDs
SELECT id, name, category, state, is_active
FROM document_templates
WHERE is_active = true
ORDER BY name;
