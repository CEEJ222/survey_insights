-- Check for duplicate tags in the system
-- This will help identify any tags that might be duplicates or similar

-- 1. Check for exact duplicate normalized names
SELECT 
  normalized_name,
  COUNT(*) as duplicate_count,
  STRING_AGG(name, ', ') as tag_names,
  STRING_AGG(id::text, ', ') as tag_ids
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND is_active = true
GROUP BY normalized_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 2. Check for similar tags (potential duplicates with slight variations)
SELECT 
  t1.name as tag1_name,
  t1.normalized_name as tag1_normalized,
  t1.usage_count as tag1_usage,
  t2.name as tag2_name,
  t2.normalized_name as tag2_normalized,
  t2.usage_count as tag2_usage
FROM tags t1
JOIN tags t2 ON t1.company_id = t2.company_id 
  AND t1.id < t2.id  -- Avoid duplicate pairs
  AND t1.is_active = true 
  AND t2.is_active = true
WHERE t1.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND (
    -- Similar words (one contains the other)
    t1.normalized_name LIKE '%' || t2.normalized_name || '%'
    OR t2.normalized_name LIKE '%' || t1.normalized_name || '%'
    -- Or very similar (one character difference)
    OR LENGTH(t1.normalized_name) = LENGTH(t2.normalized_name)
    AND (
      -- Check for single character differences
      (LENGTH(t1.normalized_name) - LENGTH(REPLACE(t1.normalized_name, t2.normalized_name, ''))) >= LENGTH(t2.normalized_name) - 1
      OR (LENGTH(t2.normalized_name) - LENGTH(REPLACE(t2.normalized_name, t1.normalized_name, ''))) >= LENGTH(t1.normalized_name) - 1
    )
  )
ORDER BY t1.usage_count + t2.usage_count DESC;

-- 3. Show all current tags with their usage counts
SELECT 
  name,
  normalized_name,
  category,
  usage_count,
  avg_sentiment,
  created_at
FROM tags 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND is_active = true
ORDER BY usage_count DESC, normalized_name;

-- 4. Check for tags that might be plurals/singulars of each other
SELECT 
  t1.name as tag1_name,
  t1.normalized_name as tag1_normalized,
  t1.usage_count as tag1_usage,
  t2.name as tag2_name,
  t2.normalized_name as tag2_normalized,
  t2.usage_count as tag2_usage
FROM tags t1
JOIN tags t2 ON t1.company_id = t2.company_id 
  AND t1.id < t2.id
  AND t1.is_active = true 
  AND t2.is_active = true
WHERE t1.company_id = '550e8400-e29b-41d4-a716-446655440002'
  AND (
    -- One is singular, other is plural
    (t1.normalized_name || 's' = t2.normalized_name)
    OR (t2.normalized_name || 's' = t1.normalized_name)
    OR (t1.normalized_name || 'es' = t2.normalized_name)
    OR (t2.normalized_name || 'es' = t1.normalized_name)
    -- Common plural/singular variations
    OR (REPLACE(t1.normalized_name, 'ies', 'y') = t2.normalized_name)
    OR (REPLACE(t2.normalized_name, 'ies', 'y') = t1.normalized_name)
  )
ORDER BY t1.usage_count + t2.usage_count DESC;
