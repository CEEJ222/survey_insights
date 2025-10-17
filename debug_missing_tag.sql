-- Check if accuracy-precision tag was created
SELECT 
  t.id,
  t.name,
  t.normalized_name,
  t.category,
  t.usage_count,
  t.created_at
FROM tags t
WHERE t.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND (t.name ILIKE '%accuracy%' OR t.normalized_name ILIKE '%accuracy%')
ORDER BY t.created_at DESC;

-- Check all tags created recently
SELECT 
  t.id,
  t.name,
  t.normalized_name,
  t.category,
  t.usage_count,
  t.created_at
FROM tags t
WHERE t.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
  AND t.created_at > '2025-10-16 22:00:00'
ORDER BY t.created_at DESC;

-- Check tag_usages for the survey response
SELECT 
  tu.id,
  tu.source_id,
  tu.source_type,
  tu.sentiment_score,
  tu.used_at,
  t.name as tag_name,
  t.normalized_name,
  t.category
FROM tag_usages tu
JOIN tags t ON tu.tag_id = t.id
WHERE tu.source_id = '34d6e8aa-a2bc-4513-8eea-c194b8f5ded9'
ORDER BY tu.used_at DESC;
