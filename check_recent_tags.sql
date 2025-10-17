-- Check what tags were created for this survey response
SELECT 
  t.id,
  t.name,
  t.normalized_name,
  t.category,
  t.usage_count,
  t.avg_sentiment,
  t.created_at,
  t.last_used
FROM tags t
WHERE t.company_id = '7dd73527-565d-4098-9475-210bd58af35e'
ORDER BY t.created_at DESC
LIMIT 10;

-- Check tag_usages for the specific survey response
SELECT 
  tu.id,
  tu.source_id,
  tu.source_type,
  tu.sentiment_score,
  tu.used_at,
  t.name as tag_name,
  t.normalized_name
FROM tag_usages tu
JOIN tags t ON tu.tag_id = t.id
WHERE tu.source_id = '34d6e8aa-a2bc-4513-8eea-c194b8f5ded9'
ORDER BY tu.used_at DESC;
